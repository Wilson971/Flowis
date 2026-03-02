-- ============================================================================
-- Sprint 3 — Scope 8 : Multi-user access management
-- Tables: store_members, store_invitations, store_audit_log
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE: store_members
-- Membres ayant accès à une boutique avec un rôle (owner, admin, viewer)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS store_members (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id    uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    tenant_id   uuid NOT NULL,
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role        text NOT NULL CHECK (role IN ('owner', 'admin', 'viewer')),
    invited_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    joined_at   timestamptz DEFAULT now(),
    created_at  timestamptz DEFAULT now(),
    UNIQUE(store_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_store_members_store_id   ON store_members(store_id);
CREATE INDEX IF NOT EXISTS idx_store_members_tenant_id  ON store_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_store_members_user_id    ON store_members(user_id);

ALTER TABLE store_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_members_select" ON store_members
    FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "store_members_insert" ON store_members
    FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "store_members_update" ON store_members
    FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "store_members_delete" ON store_members
    FOR DELETE USING (tenant_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE: store_invitations
-- Invitations en attente par email (token 32 bytes, expire après 7 jours)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS store_invitations (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id    uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    tenant_id   uuid NOT NULL,
    email       text NOT NULL,
    role        text NOT NULL CHECK (role IN ('admin', 'viewer')),
    token       text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    invited_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at  timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
    accepted_at timestamptz,
    created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_invitations_store_id  ON store_invitations(store_id);
CREATE INDEX IF NOT EXISTS idx_store_invitations_tenant_id ON store_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_store_invitations_token     ON store_invitations(token);
CREATE INDEX IF NOT EXISTS idx_store_invitations_email     ON store_invitations(email);

ALTER TABLE store_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_invitations_select" ON store_invitations
    FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "store_invitations_insert" ON store_invitations
    FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "store_invitations_update" ON store_invitations
    FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "store_invitations_delete" ON store_invitations
    FOR DELETE USING (tenant_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE: store_audit_log
-- Historique des actions par boutique (rétention 90 jours via pg_cron)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS store_audit_log (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id   uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    tenant_id  uuid NOT NULL,
    user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action     text NOT NULL,
    details    jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_audit_log_store_id    ON store_audit_log(store_id);
CREATE INDEX IF NOT EXISTS idx_store_audit_log_tenant_id   ON store_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_store_audit_log_created_at  ON store_audit_log(created_at DESC);

ALTER TABLE store_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_audit_log_select" ON store_audit_log
    FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "store_audit_log_insert" ON store_audit_log
    FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────────────
-- pg_cron: purge des audit logs > 90 jours et invitations expirées > 30 jours
-- (optionnel — uniquement si pg_cron est activé)
-- ────────────────────────────────────────────────────────────────────────────

DO $cron$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'purge-store-audit-log',
            '0 3 * * *',
            'DELETE FROM store_audit_log WHERE created_at < now() - interval ''90 days'''
        );
        PERFORM cron.schedule(
            'purge-expired-invitations',
            '0 4 * * *',
            'DELETE FROM store_invitations WHERE accepted_at IS NULL AND expires_at < now() - interval ''30 days'''
        );
    END IF;
END
$cron$;
