-- ============================================================================
-- Sprint 1 Security Fixes — 2026-03-10
-- 1. Fix SECURITY DEFINER RPCs: add auth.uid() ownership verification
-- 2. Fix gsc_keywords policy: restrict to service_role
-- 3. Fix get_dashboard_stats: add tenant ownership check
-- ============================================================================

-- ── 1. get_gsc_dashboard: verify caller owns the tenant_id ─────────────────

CREATE OR REPLACE FUNCTION get_gsc_dashboard(
    p_tenant_id uuid,
    p_site_id uuid,
    p_days integer DEFAULT 28
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_date_range text;
    v_start_date date;
    v_end_date date;
    v_prev_start date;
    v_prev_end date;
    v_kpis jsonb;
    v_kpis_previous jsonb;
    v_daily jsonb;
    v_top_keywords jsonb;
    v_top_pages jsonb;
    v_countries jsonb;
    v_devices jsonb;
BEGIN
    -- SECURITY FIX: verify caller is the tenant
    IF p_tenant_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Determine date range label
    IF p_days <= 7 THEN
        v_date_range := 'last_7_days';
    ELSE
        v_date_range := 'last_28_days';
    END IF;

    -- Calculate date bounds
    v_end_date := CURRENT_DATE - 3;
    v_start_date := v_end_date - p_days;
    v_prev_end := v_start_date;
    v_prev_start := v_prev_end - p_days;

    -- KPIs current period
    SELECT jsonb_build_object(
        'total_clicks', COALESCE(SUM(clicks), 0),
        'total_impressions', COALESCE(SUM(impressions), 0),
        'avg_ctr', COALESCE(AVG(ctr), 0),
        'avg_position', ROUND(COALESCE(AVG(position), 0)::numeric, 1)
    ) INTO v_kpis
    FROM gsc_daily_stats
    WHERE site_id = p_site_id
      AND tenant_id = p_tenant_id
      AND stat_date BETWEEN v_start_date AND v_end_date;

    -- KPIs previous period
    SELECT jsonb_build_object(
        'total_clicks', COALESCE(SUM(clicks), 0),
        'total_impressions', COALESCE(SUM(impressions), 0),
        'avg_ctr', COALESCE(AVG(ctr), 0),
        'avg_position', ROUND(COALESCE(AVG(position), 0)::numeric, 1)
    ) INTO v_kpis_previous
    FROM gsc_daily_stats
    WHERE site_id = p_site_id
      AND tenant_id = p_tenant_id
      AND stat_date BETWEEN v_prev_start AND v_prev_end;

    -- Daily time-series
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'stat_date', stat_date,
            'clicks', clicks,
            'impressions', impressions,
            'ctr', ctr,
            'position', position
        ) ORDER BY stat_date
    ), '[]'::jsonb) INTO v_daily
    FROM gsc_daily_stats
    WHERE site_id = p_site_id
      AND tenant_id = p_tenant_id
      AND stat_date BETWEEN v_start_date AND v_end_date;

    -- Top keywords
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'query', query,
            'clicks', clicks,
            'impressions', impressions,
            'ctr', ctr,
            'position', position
        ) ORDER BY impressions DESC
    ), '[]'::jsonb) INTO v_top_keywords
    FROM (
        SELECT query, SUM(clicks) AS clicks, SUM(impressions) AS impressions,
               AVG(ctr) AS ctr, AVG(position) AS position
        FROM gsc_keywords
        WHERE site_id = p_site_id
          AND tenant_id = p_tenant_id
          AND date_range = v_date_range
        GROUP BY query
        ORDER BY SUM(impressions) DESC
        LIMIT 20
    ) kw;

    -- Top pages
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'page_url', page_url,
            'clicks', clicks,
            'impressions', impressions,
            'ctr', ctr,
            'position', position
        ) ORDER BY impressions DESC
    ), '[]'::jsonb) INTO v_top_pages
    FROM (
        SELECT page_url, SUM(clicks) AS clicks, SUM(impressions) AS impressions,
               AVG(ctr) AS ctr, AVG(position) AS position
        FROM gsc_keywords
        WHERE site_id = p_site_id
          AND tenant_id = p_tenant_id
          AND date_range = v_date_range
        GROUP BY page_url
        ORDER BY SUM(impressions) DESC
        LIMIT 20
    ) pg;

    -- Countries
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'country', country,
            'clicks', clicks,
            'impressions', impressions,
            'ctr', ctr,
            'position', position
        ) ORDER BY clicks DESC
    ), '[]'::jsonb) INTO v_countries
    FROM gsc_country_stats
    WHERE site_id = p_site_id
      AND tenant_id = p_tenant_id
      AND date_range = v_date_range;

    -- Devices
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'device', device,
            'clicks', clicks,
            'impressions', impressions,
            'ctr', ctr,
            'position', position
        ) ORDER BY clicks DESC
    ), '[]'::jsonb) INTO v_devices
    FROM gsc_device_stats
    WHERE site_id = p_site_id
      AND tenant_id = p_tenant_id
      AND date_range = v_date_range;

    RETURN jsonb_build_object(
        'kpis', v_kpis,
        'kpis_previous', v_kpis_previous,
        'daily', v_daily,
        'top_keywords', v_top_keywords,
        'top_pages', v_top_pages,
        'countries', v_countries,
        'devices', v_devices
    );
END;
$$;

-- ── 2. get_gsc_indexation_overview: add ownership check ────────────────────

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
    -- SECURITY FIX: verify caller is the tenant
    IF p_tenant_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT jsonb_build_object(
        'total', COALESCE(COUNT(*), 0),
        'indexed', COALESCE(COUNT(*) FILTER (WHERE s.verdict = 'indexed'), 0),
        'not_indexed', COALESCE(COUNT(*) FILTER (WHERE s.verdict = 'not_indexed'), 0),
        'crawled_not_indexed', COALESCE(COUNT(*) FILTER (WHERE s.verdict = 'crawled_not_indexed'), 0),
        'discovered_not_indexed', COALESCE(COUNT(*) FILTER (WHERE s.verdict = 'discovered_not_indexed'), 0),
        'noindex', COALESCE(COUNT(*) FILTER (WHERE s.verdict = 'noindex'), 0),
        'blocked_robots', COALESCE(COUNT(*) FILTER (WHERE s.verdict = 'blocked_robots'), 0),
        'errors', COALESCE(COUNT(*) FILTER (WHERE s.verdict = 'error'), 0),
        'unknown', COALESCE(COUNT(*) FILTER (WHERE s.verdict = 'unknown'), 0)
    ) INTO result
    FROM gsc_sitemap_urls u
    LEFT JOIN gsc_indexation_status s ON s.sitemap_url_id = u.id
    WHERE u.site_id = p_site_id
      AND u.tenant_id = p_tenant_id
      AND u.is_active = true;

    -- Add 30-day history
    result := result || jsonb_build_object(
        'history', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'date', h.stat_date,
                    'total', h.total_urls,
                    'indexed', h.indexed,
                    'not_indexed', h.not_indexed + h.crawled_not_indexed + h.discovered_not_indexed + h.noindex + h.blocked_robots + h.errors + h.unknown
                )
                ORDER BY h.stat_date
            )
            FROM gsc_indexation_history h
            WHERE h.site_id = p_site_id
              AND h.tenant_id = p_tenant_id
              AND h.stat_date >= CURRENT_DATE - INTERVAL '30 days'),
            '[]'::jsonb
        )
    );

    RETURN result;
END;
$$;

-- ── 3. get_gsc_indexation_urls: add ownership check ────────────────────────

CREATE OR REPLACE FUNCTION get_gsc_indexation_urls(
    p_tenant_id UUID,
    p_site_id UUID,
    p_verdict TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_url_filter_rule TEXT DEFAULT NULL,
    p_url_filter_value TEXT DEFAULT NULL,
    p_source TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    total_count BIGINT;
BEGIN
    -- SECURITY FIX: verify caller is the tenant
    IF p_tenant_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Count
    SELECT COUNT(*) INTO total_count
    FROM gsc_sitemap_urls u
    LEFT JOIN gsc_indexation_status s ON s.sitemap_url_id = u.id
    WHERE u.site_id = p_site_id
      AND u.tenant_id = p_tenant_id
      AND u.is_active = true
      AND (p_verdict IS NULL OR s.verdict::text = p_verdict)
      AND (p_search IS NULL OR u.url ILIKE '%' || p_search || '%')
      AND (p_source IS NULL OR u.source = p_source)
      AND (
          p_url_filter_rule IS NULL OR p_url_filter_value IS NULL
          OR (p_url_filter_rule = 'contains' AND u.url ILIKE '%' || p_url_filter_value || '%')
          OR (p_url_filter_rule = 'not_contains' AND u.url NOT ILIKE '%' || p_url_filter_value || '%')
          OR (p_url_filter_rule = 'starts_with' AND u.url ILIKE p_url_filter_value || '%')
          OR (p_url_filter_rule = 'ends_with' AND u.url ILIKE '%' || p_url_filter_value)
      );

    -- Fetch
    SELECT jsonb_build_object(
        'urls', COALESCE(jsonb_agg(sub.row_data), '[]'::jsonb),
        'total', total_count
    ) INTO result
    FROM (
        SELECT jsonb_build_object(
            'id', u.id,
            'url', u.url,
            'source', u.source,
            'source_id', u.source_id,
            'verdict', COALESCE(s.verdict::text, 'unknown'),
            'coverage_state', s.coverage_state,
            'last_crawl_time', s.last_crawl_time,
            'inspected_at', s.inspected_at,
            'lastmod', u.lastmod,
            'is_active', u.is_active
        ) AS row_data
        FROM gsc_sitemap_urls u
        LEFT JOIN gsc_indexation_status s ON s.sitemap_url_id = u.id
        WHERE u.site_id = p_site_id
          AND u.tenant_id = p_tenant_id
          AND u.is_active = true
          AND (p_verdict IS NULL OR s.verdict::text = p_verdict)
          AND (p_search IS NULL OR u.url ILIKE '%' || p_search || '%')
          AND (p_source IS NULL OR u.source = p_source)
          AND (
              p_url_filter_rule IS NULL OR p_url_filter_value IS NULL
              OR (p_url_filter_rule = 'contains' AND u.url ILIKE '%' || p_url_filter_value || '%')
              OR (p_url_filter_rule = 'not_contains' AND u.url NOT ILIKE '%' || p_url_filter_value || '%')
              OR (p_url_filter_rule = 'starts_with' AND u.url ILIKE p_url_filter_value || '%')
              OR (p_url_filter_rule = 'ends_with' AND u.url ILIKE '%' || p_url_filter_value)
          )
        ORDER BY u.url
        LIMIT p_limit
        OFFSET p_offset
    ) sub;

    RETURN result;
END;
$$;

-- ── 4. get_gsc_queue_stats: add ownership check ───────────────────────────

CREATE OR REPLACE FUNCTION get_gsc_queue_stats(
    p_tenant_id UUID,
    p_site_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- SECURITY FIX: verify caller is the tenant
    IF p_tenant_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN (
        SELECT jsonb_build_object(
            'total_submitted', COALESCE(COUNT(*), 0),
            'pending', COALESCE(COUNT(*) FILTER (WHERE q.status = 'pending'), 0),
            'submitted', COALESCE(COUNT(*) FILTER (WHERE q.status = 'submitted'), 0),
            'failed', COALESCE(COUNT(*) FILTER (WHERE q.status = 'failed'), 0),
            'daily_quota_used', COALESCE(s.daily_submission_count, 0),
            'daily_quota_limit', 200
        )
        FROM gsc_indexation_queue q
        LEFT JOIN gsc_indexation_settings s ON s.site_id = p_site_id AND s.tenant_id = p_tenant_id
        WHERE q.site_id = p_site_id
          AND q.tenant_id = p_tenant_id
    );
END;
$$;

-- ── 5. snapshot_gsc_indexation_history: add ownership check ────────────────

CREATE OR REPLACE FUNCTION snapshot_gsc_indexation_history(
    p_tenant_id UUID,
    p_site_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- SECURITY FIX: verify caller is the tenant
    -- Note: Also called by edge functions with service_role which bypasses RLS
    -- but auth.uid() returns NULL for service_role, so we allow NULL tenant
    IF auth.uid() IS NOT NULL AND p_tenant_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    INSERT INTO gsc_indexation_history (
        site_id, tenant_id, stat_date, total_urls,
        indexed, not_indexed, crawled_not_indexed, discovered_not_indexed,
        noindex, blocked_robots, errors, unknown
    )
    SELECT
        p_site_id,
        p_tenant_id,
        CURRENT_DATE,
        COUNT(*),
        COUNT(*) FILTER (WHERE s.verdict = 'indexed'),
        COUNT(*) FILTER (WHERE s.verdict = 'not_indexed'),
        COUNT(*) FILTER (WHERE s.verdict = 'crawled_not_indexed'),
        COUNT(*) FILTER (WHERE s.verdict = 'discovered_not_indexed'),
        COUNT(*) FILTER (WHERE s.verdict = 'noindex'),
        COUNT(*) FILTER (WHERE s.verdict = 'blocked_robots'),
        COUNT(*) FILTER (WHERE s.verdict = 'error'),
        COUNT(*) FILTER (WHERE s.verdict = 'unknown')
    FROM gsc_sitemap_urls u
    LEFT JOIN gsc_indexation_status s ON s.sitemap_url_id = u.id
    WHERE u.site_id = p_site_id
      AND u.tenant_id = p_tenant_id
      AND u.is_active = true
    ON CONFLICT (site_id, stat_date) DO UPDATE SET
        total_urls = EXCLUDED.total_urls,
        indexed = EXCLUDED.indexed,
        not_indexed = EXCLUDED.not_indexed,
        crawled_not_indexed = EXCLUDED.crawled_not_indexed,
        discovered_not_indexed = EXCLUDED.discovered_not_indexed,
        noindex = EXCLUDED.noindex,
        blocked_robots = EXCLUDED.blocked_robots,
        errors = EXCLUDED.errors,
        unknown = EXCLUDED.unknown;
END;
$$;

-- ── 6. get_latest_seo_audit: add ownership check ──────────────────────────

CREATE OR REPLACE FUNCTION public.get_latest_seo_audit(
    p_tenant_id uuid,
    p_site_id   uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_audit record;
    v_issues jsonb;
BEGIN
    -- SECURITY FIX: verify caller is the tenant
    IF p_tenant_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT * INTO v_audit
    FROM public.seo_audits
    WHERE tenant_id = p_tenant_id AND site_id = p_site_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id',            i.id,
            'category',      i.category,
            'severity',      i.severity,
            'title',         i.title,
            'description',   i.description,
            'affected_count',i.affected_count,
            'metadata',      i.metadata
        ) ORDER BY
            CASE i.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
            i.category
    )
    INTO v_issues
    FROM public.seo_audit_issues i
    WHERE i.audit_id = v_audit.id;

    RETURN jsonb_build_object(
        'audit_id',           v_audit.id,
        'score',              v_audit.score,
        'score_technical',    v_audit.score_technical,
        'score_on_page',      v_audit.score_on_page,
        'score_quick_wins',   v_audit.score_quick_wins,
        'score_performance',  v_audit.score_performance,
        'summary',            v_audit.summary,
        'created_at',         v_audit.created_at,
        'issues',             COALESCE(v_issues, '[]'::jsonb)
    );
END;
$function$;

-- ── 7. get_dashboard_stats: add tenant ownership check ─────────────────────

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_store_id uuid DEFAULT NULL)
RETURNS TABLE (
    total_products BIGINT,
    total_categories BIGINT,
    total_blog_posts BIGINT,
    analyzed_products_count BIGINT,
    seo_avg_score NUMERIC,
    last_sync_date TIMESTAMP WITH TIME ZONE,
    products_with_errors BIGINT,
    published_blog_posts BIGINT,
    draft_blog_posts BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- SECURITY FIX: verify the caller owns the store
    IF p_store_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM stores WHERE id = p_store_id AND tenant_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT
        (SELECT count(*) FROM products p WHERE (p_store_id IS NULL OR p.store_id = p_store_id)),
        (SELECT count(*) FROM categories c WHERE (p_store_id IS NULL OR c.store_id = p_store_id)),
        (SELECT count(*) FROM blog_posts b WHERE (p_store_id IS NULL OR b.store_id = p_store_id)),
        (SELECT count(*) FROM product_seo_analysis psa JOIN products p ON p.id = psa.product_id WHERE (p_store_id IS NULL OR p.store_id = p_store_id)),
        (SELECT COALESCE(AVG(overall_score), 0) FROM product_seo_analysis psa JOIN products p ON p.id = psa.product_id WHERE (p_store_id IS NULL OR p.store_id = p_store_id)),
        (SELECT created_at FROM sync_jobs sj WHERE (p_store_id IS NULL OR sj.store_id = p_store_id) ORDER BY created_at DESC LIMIT 1),
        (SELECT count(*) FROM products p WHERE (p_store_id IS NULL OR p.store_id = p_store_id) AND p.sync_status = 'error'),
        (SELECT count(*) FROM blog_posts b WHERE (p_store_id IS NULL OR b.store_id = p_store_id) AND b.status = 'published'),
        (SELECT count(*) FROM blog_posts b WHERE (p_store_id IS NULL OR b.store_id = p_store_id) AND b.status = 'draft');
END;
$$;

-- ── 8. Fix gsc_keywords policy: restrict to service_role ───────────────────

DROP POLICY IF EXISTS "Service role manages gsc_keywords" ON public.gsc_keywords;

CREATE POLICY "Service role manages gsc_keywords"
  ON public.gsc_keywords
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
