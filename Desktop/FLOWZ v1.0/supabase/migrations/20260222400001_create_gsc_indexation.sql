-- ============================================================================
-- GSC Indexation Feature
-- Tables: gsc_sitemap_urls, gsc_indexation_status, gsc_indexation_queue,
--         gsc_indexation_settings, gsc_indexation_history
-- RPCs: get_gsc_indexation_overview, get_gsc_indexation_urls, get_gsc_queue_stats
-- ============================================================================

-- Enums
CREATE TYPE gsc_indexation_verdict AS ENUM (
    'indexed',
    'not_indexed',
    'crawled_not_indexed',
    'discovered_not_indexed',
    'noindex',
    'blocked_robots',
    'error',
    'unknown'
);

CREATE TYPE gsc_queue_status AS ENUM (
    'pending',
    'submitted',
    'failed',
    'quota_exceeded'
);

-- ============================================================================
-- Table: gsc_sitemap_urls
-- Cache of URLs discovered via sitemap XML + FLOWZ products/blog
-- ============================================================================
CREATE TABLE gsc_sitemap_urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES gsc_sites(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('sitemap', 'product', 'blog', 'manual')),
    source_id UUID,
    lastmod TIMESTAMPTZ,
    first_seen_at TIMESTAMPTZ DEFAULT now(),
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE (site_id, url)
);

CREATE INDEX idx_gsc_sitemap_urls_tenant ON gsc_sitemap_urls(tenant_id);
CREATE INDEX idx_gsc_sitemap_urls_site_active ON gsc_sitemap_urls(site_id, is_active);

ALTER TABLE gsc_sitemap_urls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gsc_sitemap_urls_tenant" ON gsc_sitemap_urls
    FOR ALL USING (tenant_id = auth.uid())
    WITH CHECK (tenant_id = auth.uid());

-- ============================================================================
-- Table: gsc_indexation_status
-- URL Inspection API results per URL
-- ============================================================================
CREATE TABLE gsc_indexation_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sitemap_url_id UUID NOT NULL REFERENCES gsc_sitemap_urls(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES gsc_sites(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    verdict gsc_indexation_verdict DEFAULT 'unknown',
    coverage_state TEXT,
    last_crawl_time TIMESTAMPTZ,
    crawled_as TEXT,
    robots_txt_state TEXT,
    indexing_state TEXT,
    page_fetch_state TEXT,
    google_canonical TEXT,
    inspected_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (site_id, url)
);

CREATE INDEX idx_gsc_indexation_status_tenant ON gsc_indexation_status(tenant_id);
CREATE INDEX idx_gsc_indexation_status_site_verdict ON gsc_indexation_status(site_id, verdict);
CREATE INDEX idx_gsc_indexation_status_inspected ON gsc_indexation_status(inspected_at);

ALTER TABLE gsc_indexation_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gsc_indexation_status_tenant" ON gsc_indexation_status
    FOR ALL USING (tenant_id = auth.uid())
    WITH CHECK (tenant_id = auth.uid());

-- ============================================================================
-- Table: gsc_indexation_queue
-- Submission queue for Google Indexing API
-- ============================================================================
CREATE TABLE gsc_indexation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES gsc_sites(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('URL_UPDATED', 'URL_DELETED')),
    status gsc_queue_status DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    submitted_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (site_id, url, action)
);

CREATE INDEX idx_gsc_indexation_queue_tenant ON gsc_indexation_queue(tenant_id);
CREATE INDEX idx_gsc_indexation_queue_site_status ON gsc_indexation_queue(site_id, status);

ALTER TABLE gsc_indexation_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gsc_indexation_queue_tenant" ON gsc_indexation_queue
    FOR ALL USING (tenant_id = auth.uid())
    WITH CHECK (tenant_id = auth.uid());

-- ============================================================================
-- Table: gsc_indexation_settings
-- Auto-indexation configuration per site
-- ============================================================================
CREATE TABLE gsc_indexation_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES gsc_sites(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    auto_index_new BOOLEAN DEFAULT false,
    auto_index_updated BOOLEAN DEFAULT false,
    last_sitemap_hash TEXT,
    last_sitemap_check_at TIMESTAMPTZ,
    daily_submission_count INTEGER DEFAULT 0,
    daily_inspection_count INTEGER DEFAULT 0,
    quota_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (site_id)
);

ALTER TABLE gsc_indexation_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gsc_indexation_settings_tenant" ON gsc_indexation_settings
    FOR ALL USING (tenant_id = auth.uid())
    WITH CHECK (tenant_id = auth.uid());

-- ============================================================================
-- Table: gsc_indexation_history
-- Daily snapshot for charts
-- ============================================================================
CREATE TABLE gsc_indexation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES gsc_sites(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    total_urls INTEGER DEFAULT 0,
    indexed INTEGER DEFAULT 0,
    not_indexed INTEGER DEFAULT 0,
    crawled_not_indexed INTEGER DEFAULT 0,
    discovered_not_indexed INTEGER DEFAULT 0,
    noindex INTEGER DEFAULT 0,
    blocked_robots INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    unknown INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (site_id, stat_date)
);

CREATE INDEX idx_gsc_indexation_history_tenant ON gsc_indexation_history(tenant_id);

ALTER TABLE gsc_indexation_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gsc_indexation_history_tenant" ON gsc_indexation_history
    FOR ALL USING (tenant_id = auth.uid())
    WITH CHECK (tenant_id = auth.uid());

-- ============================================================================
-- RPC: get_gsc_indexation_overview
-- Returns aggregated stats + 30-day history for the indexation dashboard
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

-- ============================================================================
-- RPC: get_gsc_indexation_urls
-- Paginated URL list with filtering
-- ============================================================================
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

-- ============================================================================
-- RPC: get_gsc_queue_stats
-- Queue statistics for the "Pages en attente" tab
-- ============================================================================
CREATE OR REPLACE FUNCTION get_gsc_queue_stats(
    p_tenant_id UUID,
    p_site_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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

-- ============================================================================
-- RPC: snapshot_gsc_indexation_history
-- Called by cron to create daily snapshot
-- ============================================================================
CREATE OR REPLACE FUNCTION snapshot_gsc_indexation_history(
    p_tenant_id UUID,
    p_site_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
        COUNT(*) FILTER (WHERE COALESCE(s.verdict, 'unknown') = 'indexed'),
        COUNT(*) FILTER (WHERE COALESCE(s.verdict, 'unknown') = 'not_indexed'),
        COUNT(*) FILTER (WHERE COALESCE(s.verdict, 'unknown') = 'crawled_not_indexed'),
        COUNT(*) FILTER (WHERE COALESCE(s.verdict, 'unknown') = 'discovered_not_indexed'),
        COUNT(*) FILTER (WHERE COALESCE(s.verdict, 'unknown') = 'noindex'),
        COUNT(*) FILTER (WHERE COALESCE(s.verdict, 'unknown') = 'blocked_robots'),
        COUNT(*) FILTER (WHERE COALESCE(s.verdict, 'unknown') = 'error'),
        COUNT(*) FILTER (WHERE COALESCE(s.verdict, 'unknown') = 'unknown')
    FROM gsc_sitemap_urls u
    LEFT JOIN gsc_indexation_status s ON s.sitemap_url_id = u.id
    WHERE u.site_id = p_site_id
      AND u.tenant_id = p_tenant_id
      AND u.is_active = true
    ON CONFLICT (site_id, stat_date)
    DO UPDATE SET
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
