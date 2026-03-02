-- ============================================================================
-- Migration: Create store_health_checks table (Scope 2)
-- Sprint 1 — Store Card P0
-- ============================================================================

-- Health check status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'health_check_status') THEN
    CREATE TYPE health_check_status AS ENUM ('healthy', 'degraded', 'down', 'unknown');
  END IF;
END $$;

-- Health check error codes enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'health_error_code') THEN
    CREATE TYPE health_error_code AS ENUM (
      'AUTH_EXPIRED',
      'SSL_ERROR',
      'SITE_DOWN',
      'RATE_LIMITED',
      'PERMISSION_DENIED',
      'TIMEOUT',
      'UNKNOWN'
    );
  END IF;
END $$;

-- Table: store_health_checks
CREATE TABLE IF NOT EXISTS public.store_health_checks (
  id               uuid              NOT NULL DEFAULT gen_random_uuid(),
  store_id         uuid              NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  tenant_id        uuid              NOT NULL,
  status           health_check_status NOT NULL DEFAULT 'unknown',
  response_time_ms integer           DEFAULT NULL,
  error_code       health_error_code DEFAULT NULL,
  error_message    text              DEFAULT NULL,
  cms_version      varchar(50)       DEFAULT NULL,
  checked_at       timestamptz       NOT NULL DEFAULT now(),

  CONSTRAINT store_health_checks_pkey PRIMARY KEY (id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_store_health_checks_store_id
  ON public.store_health_checks (store_id, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_store_health_checks_tenant_id
  ON public.store_health_checks (tenant_id);

-- RLS
ALTER TABLE public.store_health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant can read own health checks"
  ON public.store_health_checks FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Tenant can insert own health checks"
  ON public.store_health_checks FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

-- Service role can do everything (for edge functions / cron)
CREATE POLICY "Service role full access"
  ON public.store_health_checks FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- View: latest health check per store (replaces materialized view for simplicity)
-- ============================================================================
CREATE OR REPLACE VIEW public.store_current_health AS
SELECT DISTINCT ON (store_id)
  id,
  store_id,
  tenant_id,
  status,
  response_time_ms,
  error_code,
  error_message,
  cms_version,
  checked_at
FROM public.store_health_checks
ORDER BY store_id, checked_at DESC;

-- ============================================================================
-- Auto-purge health checks older than 30 days (pg_cron if available)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'purge-store-health-checks',
      '0 3 * * *',  -- every day at 3am UTC
      $$DELETE FROM public.store_health_checks WHERE checked_at < now() - interval '30 days'$$
    );
  END IF;
END $$;

COMMENT ON TABLE public.store_health_checks IS 'Historique des health checks de connexion API par boutique';
COMMENT ON VIEW  public.store_current_health  IS 'Dernier health check par boutique';
