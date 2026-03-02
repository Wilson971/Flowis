-- ============================================================================
-- Migration: Extend stores table with identity fields (Scope 1)
-- Sprint 1 — Store Card P0
-- ============================================================================

-- Add identity fields to stores table (non-breaking: all nullable or with default)
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS logo_url        text          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS currency        varchar(3)    DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS primary_language varchar(5)   DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS country_code    varchar(2)    DEFAULT NULL;

-- Add index for multi-store tenant queries (idempotent)
CREATE INDEX IF NOT EXISTS idx_stores_tenant_id ON public.stores (tenant_id);

-- Add status column if not already present with all required values
-- (stores table may already have a status column — extend enum safely)
DO $$
BEGIN
  -- Add 'paused' value to status if it's an enum type
  -- (if status is text, this block is a no-op)
  IF EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'store_status'
    AND e.enumlabel = 'active'
  ) THEN
    -- Only add if not already present
    IF NOT EXISTS (
      SELECT 1 FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'store_status'
      AND e.enumlabel = 'paused'
    ) THEN
      ALTER TYPE store_status ADD VALUE IF NOT EXISTS 'paused';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'store_status'
      AND e.enumlabel = 'deleted'
    ) THEN
      ALTER TYPE store_status ADD VALUE IF NOT EXISTS 'deleted';
    END IF;
  END IF;
END $$;

-- Add soft-delete / pause columns
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS paused_at       timestamptz   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_at      timestamptz   DEFAULT NULL;

COMMENT ON COLUMN public.stores.logo_url         IS 'URL du logo/favicon de la boutique (Supabase Storage)';
COMMENT ON COLUMN public.stores.currency         IS 'Devise ISO 4217 (EUR, USD, GBP…)';
COMMENT ON COLUMN public.stores.primary_language IS 'Langue principale ISO 639-1 (fr, en, es…)';
COMMENT ON COLUMN public.stores.country_code     IS 'Code pays ISO 3166-1 alpha-2';
COMMENT ON COLUMN public.stores.paused_at        IS 'Date de mise en pause (null = actif)';
COMMENT ON COLUMN public.stores.deleted_at       IS 'Soft delete — purge après 30 jours';
