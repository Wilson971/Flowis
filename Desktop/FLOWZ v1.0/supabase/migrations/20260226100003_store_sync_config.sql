-- ============================================================================
-- Migration: store_sync_config — sync selective preferences (Scope 3)
-- Sprint 1 — Store Card P0
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.store_sync_config (
  store_id            uuid        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  tenant_id           uuid        NOT NULL,
  auto_sync_enabled   boolean     NOT NULL DEFAULT false,
  frequency           varchar(20) NOT NULL DEFAULT '24h',
  selected_entities   jsonb       NOT NULL DEFAULT '["products","categories","tags","images"]'::jsonb,
  cron_expression     varchar(100)         DEFAULT NULL,
  next_sync_at        timestamptz          DEFAULT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT store_sync_config_pkey PRIMARY KEY (store_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_store_sync_config_tenant_id
  ON public.store_sync_config (tenant_id);

-- Auto-sync scheduler index (for cron job to find stores due for sync)
CREATE INDEX IF NOT EXISTS idx_store_sync_config_next_sync
  ON public.store_sync_config (next_sync_at)
  WHERE auto_sync_enabled = true;

-- RLS
ALTER TABLE public.store_sync_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant can manage own sync config"
  ON public.store_sync_config FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- ============================================================================
-- Extend sync_jobs with tenant_id + entities columns (Scope 3)
-- sync_jobs already exists — add missing columns safely
-- ============================================================================
ALTER TABLE public.sync_jobs
  ADD COLUMN IF NOT EXISTS tenant_id  uuid    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS type       text    DEFAULT 'manual',  -- manual | auto
  ADD COLUMN IF NOT EXISTS entities   jsonb   DEFAULT '["products"]'::jsonb,
  ADD COLUMN IF NOT EXISTS triggered_by uuid  DEFAULT NULL;

-- Backfill tenant_id from stores join (best effort)
UPDATE public.sync_jobs sj
SET tenant_id = s.tenant_id
FROM public.stores s
WHERE sj.store_id = s.id
  AND sj.tenant_id IS NULL;

-- Add RLS policy for tenant_id isolation on sync_jobs (tenant-scoped)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sync_jobs' AND policyname = 'Tenant can view own sync jobs'
  ) THEN
    CREATE POLICY "Tenant can view own sync jobs"
      ON public.sync_jobs FOR SELECT
      USING (tenant_id = auth.uid());

    CREATE POLICY "Tenant can insert own sync jobs"
      ON public.sync_jobs FOR INSERT
      WITH CHECK (tenant_id = auth.uid());

    CREATE POLICY "Tenant can update own sync jobs"
      ON public.sync_jobs FOR UPDATE
      USING (tenant_id = auth.uid());
  END IF;
END $$;

COMMENT ON TABLE public.store_sync_config IS 'Configuration de synchronisation par boutique (fréquence, entités, auto-sync)';
COMMENT ON COLUMN public.sync_jobs.entities IS 'Liste des entités synchronisées : products, categories, tags, images';
COMMENT ON COLUMN public.sync_jobs.type     IS 'Type de déclenchement : manual | auto';
