-- ============================================================================
-- GSC Country & Device Stats Tables
-- ============================================================================

-- Country stats (aggregated per sync)
CREATE TABLE IF NOT EXISTS gsc_country_stats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id uuid NOT NULL REFERENCES gsc_sites(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    country text NOT NULL,        -- ISO 3166-1 alpha-3 (e.g. "FRA")
    date_range text NOT NULL,     -- "last_7_days" | "last_28_days"
    clicks integer NOT NULL DEFAULT 0,
    impressions integer NOT NULL DEFAULT 0,
    ctr numeric(6,4) NOT NULL DEFAULT 0,
    position numeric(6,2) NOT NULL DEFAULT 0,
    fetched_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(site_id, country, date_range)
);

-- Device stats (aggregated per sync)
CREATE TABLE IF NOT EXISTS gsc_device_stats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id uuid NOT NULL REFERENCES gsc_sites(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device text NOT NULL,         -- "DESKTOP" | "MOBILE" | "TABLET"
    date_range text NOT NULL,
    clicks integer NOT NULL DEFAULT 0,
    impressions integer NOT NULL DEFAULT 0,
    ctr numeric(6,4) NOT NULL DEFAULT 0,
    position numeric(6,2) NOT NULL DEFAULT 0,
    fetched_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(site_id, device, date_range)
);

-- RLS
ALTER TABLE gsc_country_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_device_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_country_stats" ON gsc_country_stats
    FOR ALL USING (tenant_id = auth.uid());

CREATE POLICY "tenant_device_stats" ON gsc_device_stats
    FOR ALL USING (tenant_id = auth.uid());

-- Indexes
CREATE INDEX idx_gsc_country_stats_site ON gsc_country_stats(site_id, date_range);
CREATE INDEX idx_gsc_device_stats_site ON gsc_device_stats(site_id, date_range);

-- ============================================================================
-- Update get_gsc_dashboard RPC to include countries + devices
-- ============================================================================

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

    -- Top keywords (from gsc_keywords)
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
