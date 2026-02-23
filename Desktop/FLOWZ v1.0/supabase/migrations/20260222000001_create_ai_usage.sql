-- ============================================================
-- AI Usage Tracking
-- Tracks token consumption per tenant per month per feature
-- Used to power the AI Credits gauge in Plans & Credits
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature      TEXT        NOT NULL CHECK (feature IN ('flowriter', 'photo_studio')),
  tokens_input  INT        NOT NULL DEFAULT 0,
  tokens_output INT        NOT NULL DEFAULT 0,
  month        TEXT        NOT NULL, -- format: 'YYYY-MM'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own ai_usage"
  ON public.ai_usage
  FOR SELECT
  USING (tenant_id = auth.uid());

-- Service role (edge functions, API routes) can insert
CREATE POLICY "Service role insert ai_usage"
  ON public.ai_usage
  FOR INSERT
  WITH CHECK (true);

-- Performance index
CREATE INDEX IF NOT EXISTS idx_ai_usage_tenant_month
  ON public.ai_usage (tenant_id, month);

-- ============================================================
-- RPC: get_ai_credits_used
-- Returns total tokens used by a tenant in a given month
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_ai_credits_used(
  p_tenant_id UUID,
  p_month     TEXT
)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(tokens_input + tokens_output), 0)::INT
  FROM public.ai_usage
  WHERE tenant_id = p_tenant_id
    AND month = p_month;
$$;
