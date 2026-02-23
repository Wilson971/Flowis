-- ============================================================
-- GSC Keywords Cache
-- Per-page keyword performance data fetched from GSC API.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gsc_keywords (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id   UUID        NOT NULL REFERENCES public.gsc_connections(id) ON DELETE CASCADE,
  tenant_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- The exact page URL as returned by GSC
  page_url        TEXT        NOT NULL,

  -- The search query (keyword)
  query           TEXT        NOT NULL,

  -- Date range: 'last_7_days', 'last_28_days'
  date_range      TEXT        NOT NULL DEFAULT 'last_28_days',

  -- GSC metrics
  clicks          INT         NOT NULL DEFAULT 0,
  impressions     INT         NOT NULL DEFAULT 0,
  ctr             NUMERIC(6,4) NOT NULL DEFAULT 0,     -- e.g. 0.0342 = 3.42%
  position        NUMERIC(6,2) NOT NULL DEFAULT 0,     -- avg position

  -- When this row was fetched from GSC
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (connection_id, page_url, date_range, query)
);

ALTER TABLE public.gsc_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own gsc_keywords"
  ON public.gsc_keywords
  FOR SELECT
  USING (tenant_id = auth.uid());

-- Service role can insert/update (edge function sync)
CREATE POLICY "Service role manages gsc_keywords"
  ON public.gsc_keywords
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_gsc_keywords_connection ON public.gsc_keywords (connection_id);
CREATE INDEX idx_gsc_keywords_tenant_page ON public.gsc_keywords (tenant_id, page_url);
CREATE INDEX idx_gsc_keywords_page_range ON public.gsc_keywords (page_url, date_range);

-- ============================================================
-- RPC: get_top_keywords_for_url
-- Returns top N keywords for a URL sorted by impressions
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_top_keywords_for_url(
  p_tenant_id   UUID,
  p_page_url    TEXT,
  p_date_range  TEXT DEFAULT 'last_28_days',
  p_limit       INT  DEFAULT 10
)
RETURNS TABLE (
  query       TEXT,
  clicks      INT,
  impressions INT,
  ctr         NUMERIC,
  position    NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT k.query, k.clicks, k.impressions, k.ctr, k.position
  FROM public.gsc_keywords k
  WHERE k.tenant_id = p_tenant_id
    AND k.page_url  = p_page_url
    AND k.date_range = p_date_range
  ORDER BY k.impressions DESC
  LIMIT p_limit;
$$;
