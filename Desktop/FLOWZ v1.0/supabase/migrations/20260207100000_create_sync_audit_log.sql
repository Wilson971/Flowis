-- ============================================================================
-- Migration: Create sync_audit_log table for security auditing
-- Version: 20260207100000
-- Description: Tracks all sync operations for security and debugging
-- ============================================================================

-- Create sync_audit_log table
CREATE TABLE IF NOT EXISTS sync_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('product', 'article')),
    entity_ids UUID[] NOT NULL DEFAULT '{}',
    success BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_sync_audit_log_user_id ON sync_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_audit_log_created_at ON sync_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_audit_log_action ON sync_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_sync_audit_log_entity_type ON sync_audit_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_audit_log_success ON sync_audit_log(success) WHERE success = false;

-- Enable RLS
ALTER TABLE sync_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own audit logs
CREATE POLICY "Users can view own audit logs"
    ON sync_audit_log FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can insert (Edge Functions)
CREATE POLICY "Service role can insert audit logs"
    ON sync_audit_log FOR INSERT
    WITH CHECK (true);

-- No updates or deletes allowed (immutable audit log)
-- Intentionally no UPDATE or DELETE policies

-- Add comment
COMMENT ON TABLE sync_audit_log IS 'Immutable audit log for all sync operations - security and compliance';
COMMENT ON COLUMN sync_audit_log.action IS 'The action performed (e.g., push_to_store, pull_from_store)';
COMMENT ON COLUMN sync_audit_log.entity_type IS 'Type of entity synced (product or article)';
COMMENT ON COLUMN sync_audit_log.entity_ids IS 'Array of entity UUIDs that were synced';
COMMENT ON COLUMN sync_audit_log.metadata IS 'Additional context (success count, failure reasons, etc.)';
