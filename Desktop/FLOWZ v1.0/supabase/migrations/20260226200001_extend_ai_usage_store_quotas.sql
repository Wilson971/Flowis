-- ============================================================================
-- Migration: Sprint 2 P1 — Scope 4+5
-- 1. Extend ai_usage with store_id (nullable, non-breaking)
-- 2. Create store_quotas table with monthly reset
-- ============================================================================

-- ── 1. Extend ai_usage ───────────────────────────────────────────────────────

ALTER TABLE public.ai_usage
  ADD COLUMN IF NOT EXISTS store_id uuid DEFAULT NULL REFERENCES public.stores(id) ON DELETE SET NULL;

-- Index for per-store quota queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_store_month
  ON public.ai_usage (store_id, month)
  WHERE store_id IS NOT NULL;

-- Extend feature CHECK to include future features gracefully
-- (existing constraint covers flowriter|photo_studio — leave as-is)

-- ── 2. store_quotas ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.store_quotas (
  store_id         uuid        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  tenant_id        uuid        NOT NULL,
  monthly_limit    integer     NOT NULL DEFAULT 500,
  current_usage    integer     NOT NULL DEFAULT 0,
  period_start     date        NOT NULL DEFAULT date_trunc('month', now())::date,
  alert_80_sent    boolean     NOT NULL DEFAULT false,
  alert_95_sent    boolean     NOT NULL DEFAULT false,
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT store_quotas_pkey PRIMARY KEY (store_id)
);

CREATE INDEX IF NOT EXISTS idx_store_quotas_tenant_id
  ON public.store_quotas (tenant_id);

-- RLS
ALTER TABLE public.store_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant can read own store quotas"
  ON public.store_quotas FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Tenant can manage own store quotas"
  ON public.store_quotas FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Service role full access on store_quotas"
  ON public.store_quotas FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── 3. RPC: get_store_ai_usage ───────────────────────────────────────────────
-- Returns usage breakdown per store for a given month

CREATE OR REPLACE FUNCTION public.get_store_ai_usage(
  p_store_id uuid,
  p_month    text  -- format 'YYYY-MM'
)
RETURNS TABLE (
  feature      text,
  tokens_used  bigint,
  credits_used bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    feature,
    SUM(tokens_input + tokens_output)::bigint  AS tokens_used,
    SUM(tokens_input + tokens_output)::bigint  AS credits_used
  FROM public.ai_usage
  WHERE store_id = p_store_id
    AND month = p_month
  GROUP BY feature;
$$;

-- ── 4. Trigger: auto-update store_quotas.current_usage after ai_usage insert ─

CREATE OR REPLACE FUNCTION public.update_store_quota_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month text := to_char(now(), 'YYYY-MM');
  v_credits integer;
BEGIN
  -- Only process rows with a store_id
  IF NEW.store_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_credits := COALESCE(NEW.tokens_input, 0) + COALESCE(NEW.tokens_output, 0);

  -- Upsert quota row for this store
  INSERT INTO public.store_quotas (store_id, tenant_id, monthly_limit, current_usage, period_start, updated_at)
  VALUES (
    NEW.store_id,
    NEW.tenant_id,
    500,  -- default limit, overridable per store
    v_credits,
    date_trunc('month', now())::date,
    now()
  )
  ON CONFLICT (store_id) DO UPDATE SET
    -- Reset if we're in a new month
    current_usage = CASE
      WHEN store_quotas.period_start < date_trunc('month', now())::date
      THEN v_credits
      ELSE store_quotas.current_usage + v_credits
    END,
    period_start  = CASE
      WHEN store_quotas.period_start < date_trunc('month', now())::date
      THEN date_trunc('month', now())::date
      ELSE store_quotas.period_start
    END,
    -- Reset alert flags on new month
    alert_80_sent = CASE
      WHEN store_quotas.period_start < date_trunc('month', now())::date THEN false
      ELSE store_quotas.alert_80_sent
    END,
    alert_95_sent = CASE
      WHEN store_quotas.period_start < date_trunc('month', now())::date THEN false
      ELSE store_quotas.alert_95_sent
    END,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Attach trigger to ai_usage
DROP TRIGGER IF EXISTS trg_update_store_quota ON public.ai_usage;
CREATE TRIGGER trg_update_store_quota
  AFTER INSERT ON public.ai_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_store_quota_usage();

-- ── 5. RPC: get_store_metrics ─────────────────────────────────────────────────
-- Single RPC to power StoreMetricsSection (Scope 4)
-- Returns: total_products, products_with_ai, products_without_desc,
--          total_blog_posts, avg_seo_score, coverage_percent

CREATE OR REPLACE FUNCTION public.get_store_metrics(p_store_id uuid)
RETURNS TABLE (
  total_products        bigint,
  products_with_ai      bigint,
  products_without_desc bigint,
  total_blog_posts      bigint,
  avg_seo_score         numeric,
  coverage_percent      numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH product_stats AS (
    SELECT
      COUNT(*)                                                    AS total_products,
      COUNT(*) FILTER (WHERE working_content IS NOT NULL)         AS products_with_ai,
      COUNT(*) FILTER (
        WHERE (
          COALESCE(
            (working_content->>'short_description'),
            (metadata->>'short_description'),
            ''
          ) = ''
        )
      )                                                           AS products_without_desc,
      AVG(COALESCE(seo_score, 0)) FILTER (WHERE seo_score IS NOT NULL) AS avg_seo_score
    FROM public.products
    WHERE store_id = p_store_id
  ),
  blog_stats AS (
    SELECT COUNT(*) AS total_blog_posts
    FROM public.blog_posts
    WHERE store_id = p_store_id
      AND status != 'deleted'
  )
  SELECT
    ps.total_products,
    ps.products_with_ai,
    ps.products_without_desc,
    bs.total_blog_posts,
    ROUND(COALESCE(ps.avg_seo_score, 0), 1)                       AS avg_seo_score,
    CASE
      WHEN ps.total_products > 0
      THEN ROUND((ps.products_with_ai::numeric / ps.total_products) * 100, 1)
      ELSE 0
    END                                                           AS coverage_percent
  FROM product_stats ps
  CROSS JOIN blog_stats bs;
$$;

COMMENT ON TABLE  public.store_quotas            IS 'Quota mensuel de crédits IA par boutique';
COMMENT ON FUNCTION public.get_store_metrics     IS 'Métriques KPIs agrégées par boutique pour la StoreCard';
COMMENT ON FUNCTION public.get_store_ai_usage    IS 'Détail de consommation IA par feature et par boutique';
