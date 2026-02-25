-- ============================================================================
-- Fix get_gsc_indexation_overview RPC
-- 1. Exclude noindex + blocked_robots from "not_indexed" problem bucket
-- 2. Add separate "intentional_exclusions" field
-- 3. Generate 30-day date spine with forward-fill for missing days
-- ============================================================================

CREATE OR REPLACE FUNCTION get_gsc_indexation_overview(
    p_tenant_id UUID,
    p_site_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Current live stats from status table
    SELECT jsonb_build_object(
        'total', COALESCE(COUNT(*), 0),
        'indexed', COALESCE(COUNT(*) FILTER (WHERE s.verdict = 'indexed'), 0),
        'not_indexed', COALESCE(COUNT(*) FILTER (WHERE s.verdict = 'not_indexed'), 0),
        'crawled_not_indexed', COALESCE(COUNT(*) FILTER (WHERE s.verdict = 'crawled_not_indexed'), 0),
        'discovered_not_indexed', COALESCE(COUNT(*) FILTER (WHERE s.verdict = 'discovered_not_indexed'), 0),
        'noindex', COALESCE(COUNT(*) FILTER (WHERE s.verdict = 'noindex'), 0),
        'blocked_robots', COALESCE(COUNT(*) FILTER (WHERE s.verdict = 'blocked_robots'), 0),
        'errors', COALESCE(COUNT(*) FILTER (WHERE s.verdict = 'error'), 0),
        'unknown', COALESCE(COUNT(*) FILTER (WHERE s.verdict = 'unknown'), 0),
        'intentional_exclusions', COALESCE(
            COUNT(*) FILTER (WHERE s.verdict = 'noindex') +
            COUNT(*) FILTER (WHERE s.verdict = 'blocked_robots'),
            0
        )
    ) INTO result
    FROM gsc_sitemap_urls u
    LEFT JOIN gsc_indexation_status s ON s.sitemap_url_id = u.id
    WHERE u.site_id = p_site_id
      AND u.tenant_id = p_tenant_id
      AND u.is_active = true;

    -- 30-day history with date spine + forward fill for missing days
    -- noindex and blocked_robots are excluded from not_indexed count
    -- they are reported separately as intentional_exclusions
    result := result || jsonb_build_object(
        'history', COALESCE(
            (
                WITH date_spine AS (
                    SELECT generate_series(
                        CURRENT_DATE - INTERVAL '29 days',
                        CURRENT_DATE,
                        INTERVAL '1 day'
                    )::date AS stat_date
                ),
                raw_history AS (
                    SELECT
                        h.stat_date,
                        h.total_urls,
                        h.indexed,
                        -- not_indexed excludes intentional exclusions (noindex, blocked_robots)
                        h.not_indexed + h.crawled_not_indexed + h.discovered_not_indexed + h.errors + h.unknown AS not_indexed,
                        h.noindex + h.blocked_robots AS intentional_exclusions
                    FROM gsc_indexation_history h
                    WHERE h.site_id = p_site_id
                      AND h.tenant_id = p_tenant_id
                      AND h.stat_date >= CURRENT_DATE - INTERVAL '29 days'
                ),
                -- Left join spine with available history rows
                spine_joined AS (
                    SELECT
                        ds.stat_date,
                        rh.total_urls,
                        rh.indexed,
                        rh.not_indexed,
                        rh.intentional_exclusions
                    FROM date_spine ds
                    LEFT JOIN raw_history rh ON rh.stat_date = ds.stat_date
                ),
                -- Forward fill: for missing days, carry the last non-null value
                filled AS (
                    SELECT
                        stat_date,
                        COALESCE(
                            total_urls,
                            LAST_VALUE(total_urls IGNORE NULLS) OVER (
                                ORDER BY stat_date
                                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                            ),
                            0
                        ) AS total_urls,
                        COALESCE(
                            indexed,
                            LAST_VALUE(indexed IGNORE NULLS) OVER (
                                ORDER BY stat_date
                                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                            ),
                            0
                        ) AS indexed,
                        COALESCE(
                            not_indexed,
                            LAST_VALUE(not_indexed IGNORE NULLS) OVER (
                                ORDER BY stat_date
                                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                            ),
                            0
                        ) AS not_indexed,
                        COALESCE(
                            intentional_exclusions,
                            LAST_VALUE(intentional_exclusions IGNORE NULLS) OVER (
                                ORDER BY stat_date
                                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                            ),
                            0
                        ) AS intentional_exclusions
                    FROM spine_joined
                )
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'date', f.stat_date,
                        'total', f.total_urls,
                        'indexed', f.indexed,
                        'not_indexed', f.not_indexed,
                        'intentional_exclusions', f.intentional_exclusions
                    )
                    ORDER BY f.stat_date
                )
                FROM filled f
            ),
            '[]'::jsonb
        )
    );

    RETURN result;
END;
$$;
