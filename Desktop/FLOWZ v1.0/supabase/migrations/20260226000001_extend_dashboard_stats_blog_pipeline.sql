-- ============================================================
-- Migration: extend_dashboard_stats_blog_pipeline
-- Date: 2026-02-26
-- Purpose: Add review_blog_posts and scheduled_blog_posts
--          counts to get_dashboard_stats for ContentPipeline KPI
-- ============================================================

DROP FUNCTION IF EXISTS public.get_dashboard_stats(uuid);

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
    p_store_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
    total_products              bigint,
    total_categories            bigint,
    total_blog_posts            bigint,
    analyzed_products_count     bigint,
    seo_avg_score               numeric,
    last_sync_date              timestamp with time zone,
    products_with_errors        bigint,
    published_blog_posts        bigint,
    draft_blog_posts            bigint,
    review_blog_posts           bigint,
    scheduled_blog_posts        bigint,
    last_blog_created_at        timestamp with time zone,
    store_last_synced_at        timestamp with time zone,
    ai_optimized_products       bigint,
    seo_avg_score_prev_month    numeric,
    ai_optimized_prev_month     numeric
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

        -- total_blog_posts
        (SELECT count(*)
         FROM blog_articles b
         WHERE (p_store_id IS NULL OR b.store_id = p_store_id)
           AND b.archived = false
           AND b.status != 'auto_draft')::bigint,

        -- analyzed_products_count
        (SELECT count(*)
         FROM products p
         WHERE (p_store_id IS NULL OR p.store_id = p_store_id)
           AND p.seo_score IS NOT NULL)::bigint,

        -- seo_avg_score
        COALESCE(
            (SELECT AVG(p.seo_score)
             FROM products p
             WHERE (p_store_id IS NULL OR p.store_id = p_store_id)
               AND p.seo_score IS NOT NULL),
            0
        ),

        -- last_sync_date
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

        -- review_blog_posts (pending review)
        (SELECT count(*)
         FROM blog_articles b
         WHERE (p_store_id IS NULL OR b.store_id = p_store_id)
           AND b.archived = false
           AND b.status = 'pending')::bigint,

        -- scheduled_blog_posts (from scheduled_publications)
        (SELECT count(*)
         FROM scheduled_publications sp
         WHERE sp.tenant_id = v_tenant_id
           AND sp.status = 'pending')::bigint,

        -- last_blog_created_at (most recent blog article)
        (SELECT b.created_at
         FROM blog_articles b
         WHERE (p_store_id IS NULL OR b.store_id = p_store_id)
           AND b.archived = false
           AND b.status != 'auto_draft'
         ORDER BY b.created_at DESC
         LIMIT 1),

        -- store_last_synced_at
        (SELECT s.last_synced_at
         FROM stores s
         WHERE s.tenant_id = v_tenant_id
           AND (p_store_id IS NULL OR s.id = p_store_id)
         ORDER BY s.last_synced_at DESC NULLS LAST
         LIMIT 1),

        -- ai_optimized_products
        (SELECT count(*)
         FROM products p
         WHERE (p_store_id IS NULL OR p.store_id = p_store_id)
           AND p.working_content IS NOT NULL)::bigint,

        -- seo_avg_score_prev_month
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

        -- ai_optimized_prev_month
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

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(uuid) TO authenticated;
