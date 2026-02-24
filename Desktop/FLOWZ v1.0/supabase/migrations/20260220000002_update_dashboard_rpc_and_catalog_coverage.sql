-- ============================================================
-- Migration: update_dashboard_rpc_and_catalog_coverage
-- Date: 2026-02-20
-- Purpose:
--   1. Extend get_dashboard_stats with:
--      - store_last_synced_at (real value from stores.last_synced_at)
--      - ai_optimized_products (products with working_content IS NOT NULL)
--      - seo_avg_score_prev_month (from kpi_snapshots M-1)
--      - ai_optimized_prev_month (from kpi_snapshots M-1)
--   2. Create get_catalog_coverage for the CatalogCoverageCard KPI.
-- ============================================================

-- Need to DROP first since RETURNS signature changed
DROP FUNCTION IF EXISTS public.get_dashboard_stats(uuid);

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
    p_store_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
    -- Original fields (unchanged names for backward compat)
    total_products              bigint,
    total_categories            bigint,
    total_blog_posts            bigint,
    analyzed_products_count     bigint,
    seo_avg_score               numeric,
    last_sync_date              timestamp with time zone,
    products_with_errors        bigint,
    published_blog_posts        bigint,
    draft_blog_posts            bigint,
    -- New fields
    store_last_synced_at        timestamp with time zone,
    ai_optimized_products       bigint,
    seo_avg_score_prev_month    numeric,
    ai_optimized_prev_month     bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_tenant_id          uuid;
    v_prev_month_start   date;
    v_prev_month_end     date;
BEGIN
    v_tenant_id        := auth.uid();
    v_prev_month_start := date_trunc('month', now() - interval '1 month')::date;
    v_prev_month_end   := (date_trunc('month', now()) - interval '1 day')::date;

    RETURN QUERY
    SELECT
        -- total_products
        (SELECT count(*)
         FROM products p
         WHERE (p_store_id IS NULL OR p.store_id = p_store_id))::bigint,

        -- total_categories
        (SELECT count(*)
         FROM categories c
         WHERE (p_store_id IS NULL OR c.store_id = p_store_id))::bigint,

        -- total_blog_posts (blog_articles is the real table)
        (SELECT count(*)
         FROM blog_articles b
         WHERE (p_store_id IS NULL OR b.store_id = p_store_id)
           AND b.archived = false
           AND b.status != 'auto_draft')::bigint,

        -- analyzed_products_count
        (SELECT count(*)
         FROM product_seo_analysis psa
         JOIN products p ON p.id = psa.product_id
         WHERE (p_store_id IS NULL OR p.store_id = p_store_id))::bigint,

        -- seo_avg_score
        COALESCE(
            (SELECT AVG(psa.overall_score)
             FROM product_seo_analysis psa
             JOIN products p ON p.id = psa.product_id
             WHERE (p_store_id IS NULL OR p.store_id = p_store_id)),
            0
        ),

        -- last_sync_date (from sync_jobs — kept for backward compat)
        (SELECT sj.created_at
         FROM sync_jobs sj
         WHERE (p_store_id IS NULL OR sj.store_id = p_store_id)
         ORDER BY sj.created_at DESC
         LIMIT 1),

        -- products_with_errors
        (SELECT count(*)
         FROM products p
         WHERE (p_store_id IS NULL OR p.store_id = p_store_id)
           AND p.dirty_fields_content IS NOT NULL
           AND array_length(p.dirty_fields_content, 1) > 0)::bigint,

        -- published_blog_posts
        (SELECT count(*)
         FROM blog_articles b
         WHERE (p_store_id IS NULL OR b.store_id = p_store_id)
           AND b.archived = false
           AND b.status IN ('publish', 'published'))::bigint,

        -- draft_blog_posts
        (SELECT count(*)
         FROM blog_articles b
         WHERE (p_store_id IS NULL OR b.store_id = p_store_id)
           AND b.archived = false
           AND b.status = 'draft')::bigint,

        -- NEW: real store last sync timestamp from stores table
        (SELECT s.last_synced_at
         FROM stores s
         WHERE s.tenant_id = v_tenant_id
           AND (p_store_id IS NULL OR s.id = p_store_id)
         ORDER BY s.last_synced_at DESC NULLS LAST
         LIMIT 1),

        -- NEW: products with AI-generated content
        (SELECT count(*)
         FROM products p
         WHERE (p_store_id IS NULL OR p.store_id = p_store_id)
           AND p.working_content IS NOT NULL)::bigint,

        -- NEW: SEO score from previous month snapshot
        (SELECT ks.metric_value
         FROM kpi_snapshots ks
         WHERE ks.tenant_id = v_tenant_id
           AND ks.metric_name = 'seo_avg_score'
           AND (
               (p_store_id IS NULL AND ks.store_id IS NULL) OR
               (p_store_id IS NOT NULL AND ks.store_id = p_store_id)
           )
           AND ks.snapshot_date >= v_prev_month_start
           AND ks.snapshot_date <= v_prev_month_end
         ORDER BY ks.snapshot_date DESC
         LIMIT 1),

        -- NEW: AI optimized count from previous month snapshot
        (SELECT ks.metric_value
         FROM kpi_snapshots ks
         WHERE ks.tenant_id = v_tenant_id
           AND ks.metric_name = 'ai_optimized_products'
           AND (
               (p_store_id IS NULL AND ks.store_id IS NULL) OR
               (p_store_id IS NOT NULL AND ks.store_id = p_store_id)
           )
           AND ks.snapshot_date >= v_prev_month_start
           AND ks.snapshot_date <= v_prev_month_end
         ORDER BY ks.snapshot_date DESC
         LIMIT 1);
END;
$function$;


-- ── get_catalog_coverage ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_catalog_coverage(
    p_store_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
    total_products       bigint,
    ai_optimized_count   bigint,
    coverage_percent     numeric,
    generated_this_month bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_month_start  timestamptz;
    v_total        bigint;
    v_optimized    bigint;
BEGIN
    v_month_start := date_trunc('month', now());

    SELECT count(*) INTO v_total
    FROM products p
    WHERE (p_store_id IS NULL OR p.store_id = p_store_id);

    SELECT count(*) INTO v_optimized
    FROM products p
    WHERE (p_store_id IS NULL OR p.store_id = p_store_id)
      AND p.working_content IS NOT NULL;

    RETURN QUERY
    SELECT
        v_total,
        v_optimized,
        CASE
            WHEN v_total = 0 THEN 0::numeric
            ELSE ROUND((v_optimized::numeric / v_total::numeric) * 100, 1)
        END,
        (SELECT count(*)
         FROM products p
         WHERE (p_store_id IS NULL OR p.store_id = p_store_id)
           AND p.working_content IS NOT NULL
           AND p.working_content_updated_at >= v_month_start)::bigint;
END;
$function$;

-- Grants
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_catalog_coverage(uuid)  TO authenticated;
