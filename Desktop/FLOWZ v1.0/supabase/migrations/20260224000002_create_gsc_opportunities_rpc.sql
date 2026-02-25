-- ============================================================
-- Migration: create_gsc_opportunities_rpc
-- Date: 2026-02-24
-- Purpose: Create the missing get_gsc_opportunities RPC
--          called by /api/gsc/opportunities route.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_gsc_opportunities(
    p_tenant_id uuid,
    p_site_id uuid,
    p_date_range text DEFAULT 'last_28_days'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_result jsonb;
    v_avg_ctr numeric;
BEGIN
    -- Verify tenant ownership of site
    IF NOT EXISTS (
        SELECT 1 FROM gsc_sites
        WHERE id = p_site_id AND tenant_id = p_tenant_id
    ) THEN
        RETURN jsonb_build_object(
            'quick_wins', '[]'::jsonb,
            'low_ctr', '[]'::jsonb,
            'no_clicks', '[]'::jsonb,
            'cannibalization', '[]'::jsonb,
            'avg_ctr', 0
        );
    END IF;

    -- Average CTR for this site/range
    SELECT AVG(k.ctr) INTO v_avg_ctr
    FROM gsc_keywords k
    WHERE k.site_id = p_site_id
      AND k.tenant_id = p_tenant_id
      AND k.date_range = p_date_range;

    SELECT jsonb_build_object(
        -- Quick wins: keywords at positions 8-20 with decent impressions
        'quick_wins', COALESCE((
            SELECT jsonb_agg(row_to_json(q)::jsonb)
            FROM (
                SELECT query, page_url, clicks, impressions, ctr, position
                FROM gsc_keywords
                WHERE site_id = p_site_id
                  AND tenant_id = p_tenant_id
                  AND date_range = p_date_range
                  AND position BETWEEN 8 AND 20
                  AND impressions > 10
                ORDER BY impressions DESC
                LIMIT 10
            ) q
        ), '[]'::jsonb),

        -- Low CTR: top 10 positions but CTR below average
        'low_ctr', COALESCE((
            SELECT jsonb_agg(row_to_json(q)::jsonb)
            FROM (
                SELECT query, page_url, clicks, impressions, ctr, position
                FROM gsc_keywords
                WHERE site_id = p_site_id
                  AND tenant_id = p_tenant_id
                  AND date_range = p_date_range
                  AND position <= 10
                  AND ctr < COALESCE(v_avg_ctr, 0.03)
                  AND impressions > 50
                ORDER BY impressions DESC
                LIMIT 10
            ) q
        ), '[]'::jsonb),

        -- No clicks: high impressions but zero clicks
        'no_clicks', COALESCE((
            SELECT jsonb_agg(row_to_json(q)::jsonb)
            FROM (
                SELECT query, page_url, clicks, impressions, ctr, position
                FROM gsc_keywords
                WHERE site_id = p_site_id
                  AND tenant_id = p_tenant_id
                  AND date_range = p_date_range
                  AND clicks = 0
                  AND impressions > 100
                ORDER BY impressions DESC
                LIMIT 10
            ) q
        ), '[]'::jsonb),

        -- Cannibalization: same query ranking for multiple pages
        'cannibalization', COALESCE((
            SELECT jsonb_agg(row_to_json(c)::jsonb)
            FROM (
                SELECT
                    query,
                    count(DISTINCT page_url)::int as page_count,
                    sum(impressions)::int as total_impressions,
                    jsonb_agg(
                        jsonb_build_object(
                            'page_url', page_url,
                            'position', position,
                            'clicks', clicks,
                            'impressions', impressions
                        )
                    ) as pages
                FROM gsc_keywords
                WHERE site_id = p_site_id
                  AND tenant_id = p_tenant_id
                  AND date_range = p_date_range
                GROUP BY query
                HAVING count(DISTINCT page_url) > 1
                ORDER BY sum(impressions) DESC
                LIMIT 5
            ) c
        ), '[]'::jsonb),

        'avg_ctr', COALESCE(v_avg_ctr, 0)
    ) INTO v_result;

    RETURN v_result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_gsc_opportunities(uuid, uuid, text) TO authenticated;
