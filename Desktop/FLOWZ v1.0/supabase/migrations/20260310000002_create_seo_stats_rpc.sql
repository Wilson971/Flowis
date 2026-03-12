-- ============================================================================
-- RPC: get_seo_stats — Server-side aggregation of SEO scores
-- Replaces client-side fetching of ALL products for averaging
-- ============================================================================

-- Drop existing functions to allow return type changes
DROP FUNCTION IF EXISTS public.get_seo_stats(uuid);
DROP FUNCTION IF EXISTS public.get_seo_global_score(uuid);

CREATE OR REPLACE FUNCTION public.get_seo_stats(p_store_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- Verify ownership
    IF NOT EXISTS (
        SELECT 1 FROM stores WHERE id = p_store_id AND tenant_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT jsonb_build_object(
        'total', COUNT(*),
        'analyzed', COUNT(*) FILTER (WHERE seo_score IS NOT NULL),
        'averageScore', COALESCE(ROUND(AVG(seo_score) FILTER (WHERE seo_score IS NOT NULL)), 0),
        'excellent', COUNT(*) FILTER (WHERE seo_score >= 90),
        'good', COUNT(*) FILTER (WHERE seo_score >= 70 AND seo_score < 90),
        'average', COUNT(*) FILTER (WHERE seo_score >= 50 AND seo_score < 70),
        'poor', COUNT(*) FILTER (WHERE seo_score >= 30 AND seo_score < 50),
        'critical', COUNT(*) FILTER (WHERE seo_score < 30)
    ) INTO v_result
    FROM products
    WHERE store_id = p_store_id;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_seo_stats(uuid) TO authenticated;

-- ============================================================================
-- RPC: get_seo_global_score — Server-side aggregation of SEO breakdown
-- Replaces client-side fetching of ALL products' seo_breakdown JSONB
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_seo_global_score(p_store_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_avg_score numeric;
    v_analyzed_count bigint;
    v_total_count bigint;
    v_critical_count bigint;
    v_warning_count bigint;
    v_good_count bigint;
    v_breakdown jsonb;
    v_pillars jsonb;
    v_prev_score numeric;
    v_change numeric;
BEGIN
    -- Verify ownership
    IF NOT EXISTS (
        SELECT 1 FROM stores WHERE id = p_store_id AND tenant_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Aggregate scores
    SELECT
        COALESCE(ROUND(AVG(seo_score)), 0),
        COUNT(*) FILTER (WHERE seo_score IS NOT NULL),
        COUNT(*),
        COUNT(*) FILTER (WHERE seo_score < 50),
        COUNT(*) FILTER (WHERE seo_score >= 50 AND seo_score < 70),
        COUNT(*) FILTER (WHERE seo_score >= 70)
    INTO v_avg_score, v_analyzed_count, v_total_count, v_critical_count, v_warning_count, v_good_count
    FROM products
    WHERE store_id = p_store_id AND seo_score IS NOT NULL;

    -- Aggregate 4-category breakdown from seo_breakdown JSONB
    SELECT jsonb_build_object(
        'titles', COALESCE(ROUND(AVG((seo_breakdown->>'titles')::numeric)), 0),
        'descriptions', COALESCE(ROUND(AVG((seo_breakdown->>'descriptions')::numeric)), 0),
        'images', COALESCE(ROUND(AVG((seo_breakdown->>'images')::numeric)), 0),
        'technical', COALESCE(ROUND(AVG((seo_breakdown->>'technical')::numeric)), 0)
    ) INTO v_breakdown
    FROM products
    WHERE store_id = p_store_id AND seo_breakdown IS NOT NULL;

    IF v_breakdown IS NULL THEN
        v_breakdown := '{"titles":0,"descriptions":0,"images":0,"technical":0}'::jsonb;
    END IF;

    -- Aggregate per-field f_* pillar averages + issue counts (score < 60)
    SELECT jsonb_build_object(
        'meta_title', jsonb_build_object(
            'avgScore', COALESCE(ROUND(AVG((seo_breakdown->>'f_meta_title')::numeric)), 0),
            'issueCount', COUNT(*) FILTER (WHERE (seo_breakdown->>'f_meta_title')::numeric < 60)
        ),
        'title_product', jsonb_build_object(
            'avgScore', COALESCE(ROUND(AVG((seo_breakdown->>'f_title')::numeric)), 0),
            'issueCount', COUNT(*) FILTER (WHERE (seo_breakdown->>'f_title')::numeric < 60)
        ),
        'meta_description', jsonb_build_object(
            'avgScore', COALESCE(ROUND(AVG((seo_breakdown->>'f_meta_description')::numeric)), 0),
            'issueCount', COUNT(*) FILTER (WHERE (seo_breakdown->>'f_meta_description')::numeric < 60)
        ),
        'description', jsonb_build_object(
            'avgScore', COALESCE(ROUND(AVG((seo_breakdown->>'f_description')::numeric)), 0),
            'issueCount', COUNT(*) FILTER (WHERE (seo_breakdown->>'f_description')::numeric < 60)
        ),
        'images', jsonb_build_object(
            'avgScore', COALESCE(ROUND(AVG((seo_breakdown->>'f_images')::numeric)), 0),
            'issueCount', COUNT(*) FILTER (WHERE (seo_breakdown->>'f_images')::numeric < 60)
        ),
        'slug', jsonb_build_object(
            'avgScore', COALESCE(ROUND(AVG((seo_breakdown->>'f_slug')::numeric)), 0),
            'issueCount', COUNT(*) FILTER (WHERE (seo_breakdown->>'f_slug')::numeric < 60)
        )
    ) INTO v_pillars
    FROM products
    WHERE store_id = p_store_id
      AND seo_breakdown IS NOT NULL
      AND seo_breakdown ? 'f_meta_title';

    IF v_pillars IS NULL THEN
        v_pillars := '{}'::jsonb;
    END IF;

    -- Previous month trend from kpi_snapshots
    v_change := 0;
    SELECT metric_value INTO v_prev_score
    FROM kpi_snapshots
    WHERE metric_name = 'seo_avg_score'
      AND snapshot_date >= (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::date
      AND snapshot_date < date_trunc('month', CURRENT_DATE)::date
    ORDER BY snapshot_date DESC
    LIMIT 1;

    IF v_prev_score IS NOT NULL THEN
        v_change := v_avg_score - v_prev_score;
    END IF;

    RETURN jsonb_build_object(
        'averageScore', v_avg_score,
        'analyzedProductsCount', v_analyzed_count,
        'totalProductsCount', v_total_count,
        'criticalCount', v_critical_count,
        'warningCount', v_warning_count,
        'goodCount', v_good_count,
        'previousMonthChange', COALESCE(ROUND(v_change), 0),
        'breakdown', v_breakdown,
        'pillars', v_pillars
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_seo_global_score(uuid) TO authenticated;
