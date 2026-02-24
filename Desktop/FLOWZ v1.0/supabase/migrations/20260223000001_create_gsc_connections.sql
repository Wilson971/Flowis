-- ============================================================
-- GSC Connections
-- Stores OAuth2 tokens for Google Search Console per tenant.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gsc_connections (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- The verified site URL in GSC (e.g. "https://myshop.com/")
  site_url          TEXT        NOT NULL,

  -- Google account info (for display)
  google_email      TEXT,

  -- Encrypted OAuth tokens (AES-256-GCM at application level)
  -- Contains: access_token, refresh_token, expiry_at, scope
  tokens_encrypted  TEXT        NOT NULL,

  -- Sync state
  last_synced_at    TIMESTAMPTZ,
  sync_status       TEXT        NOT NULL DEFAULT 'idle'
                    CHECK (sync_status IN ('idle', 'syncing', 'error', 'success')),
  sync_error        TEXT,

  -- Soft deactivation
  active            BOOLEAN     NOT NULL DEFAULT true,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, site_url)
);

ALTER TABLE public.gsc_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own gsc_connections"
  ON public.gsc_connections
  FOR ALL
  USING  (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

CREATE INDEX idx_gsc_connections_tenant ON public.gsc_connections (tenant_id);
CREATE INDEX idx_gsc_connections_active ON public.gsc_connections (tenant_id) WHERE active = true;

-- Auto-update updated_at (reuse existing function if available)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at'
  ) THEN
    CREATE FUNCTION public.set_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS $fn$
    BEGIN NEW.updated_at = now(); RETURN NEW; END;
    $fn$;
  END IF;
END;
$$;

CREATE TRIGGER gsc_connections_updated_at
  BEFORE UPDATE ON public.gsc_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
