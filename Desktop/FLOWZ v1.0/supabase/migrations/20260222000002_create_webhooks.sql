-- ============================================================
-- Webhooks
-- Allows users to register webhook URLs for FLOWZ events
-- Events: sync.completed, sync.failed, product.updated,
--         article.published, batch.completed
-- ============================================================

CREATE TABLE IF NOT EXISTS public.webhooks (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url               TEXT        NOT NULL,
  events            TEXT[]      NOT NULL DEFAULT '{}',
  secret            TEXT        NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  active            BOOLEAN     NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own webhooks"
  ON public.webhooks
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Performance index
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant
  ON public.webhooks (tenant_id);
