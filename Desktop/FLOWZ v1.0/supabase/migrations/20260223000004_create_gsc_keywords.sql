-- ============================================================================
-- GSC Keywords Cache Table
-- Stores cached keyword data from Google Search Console, linked to gsc_sites.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gsc_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.gsc_sites(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES auth.users(id),
    page_url TEXT NOT NULL,
    query TEXT NOT NULL,
    date_range TEXT NOT NULL CHECK (date_range IN ('last_7_days', 'last_28_days')),
    clicks INTEGER NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    ctr NUMERIC NOT NULL DEFAULT 0,
    "position" NUMERIC NOT NULL DEFAULT 0,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (site_id, page_url, date_range, query)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gsc_keywords_tenant ON public.gsc_keywords (tenant_id);
CREATE INDEX IF NOT EXISTS idx_gsc_keywords_site ON public.gsc_keywords (site_id);
CREATE INDEX IF NOT EXISTS idx_gsc_keywords_page ON public.gsc_keywords (page_url);

-- RLS
ALTER TABLE public.gsc_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own gsc_keywords"
    ON public.gsc_keywords FOR SELECT
    USING (tenant_id = auth.uid());

CREATE POLICY "Users insert own gsc_keywords"
    ON public.gsc_keywords FOR INSERT
    WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users update own gsc_keywords"
    ON public.gsc_keywords FOR UPDATE
    USING (tenant_id = auth.uid());

CREATE POLICY "Users delete own gsc_keywords"
    ON public.gsc_keywords FOR DELETE
    USING (tenant_id = auth.uid());

-- ============================================================================
-- RPC: get_top_keywords_for_url
-- Returns top keywords for a specific page URL, ordered by impressions.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_top_keywords_for_url(
    p_tenant_id UUID,
    p_page_url TEXT,
    p_date_range TEXT DEFAULT 'last_28_days',
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    keyword_query TEXT,
    keyword_clicks INTEGER,
    keyword_impressions INTEGER,
    keyword_ctr NUMERIC,
    keyword_position NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT
        gk.query AS keyword_query,
        gk.clicks AS keyword_clicks,
        gk.impressions AS keyword_impressions,
        gk.ctr AS keyword_ctr,
        gk."position" AS keyword_position
    FROM public.gsc_keywords gk
    WHERE gk.tenant_id = p_tenant_id
      AND gk.page_url = p_page_url
      AND gk.date_range = p_date_range
    ORDER BY gk.impressions DESC
    LIMIT p_limit;
$$;
