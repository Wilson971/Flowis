-- ============================================================
-- Migration: create_activity_log
-- Purpose: Unified activity feed for dashboard timeline
--          Captures sync, generation, publication, photo studio events
-- ============================================================

CREATE TABLE IF NOT EXISTS public.activity_log (
    id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id   uuid        NOT NULL,
    store_id    uuid        REFERENCES public.stores(id) ON DELETE SET NULL,
    type        text        NOT NULL,  -- 'sync' | 'generation' | 'publication' | 'product_edit' | 'seo_analysis' | 'photo_studio'
    title       text        NOT NULL,
    description text,
    status      text        NOT NULL DEFAULT 'info',  -- 'success' | 'warning' | 'error' | 'info'
    metadata    jsonb       DEFAULT '{}',
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast dashboard queries
CREATE INDEX activity_log_tenant_idx ON activity_log (tenant_id, created_at DESC);
CREATE INDEX activity_log_store_idx ON activity_log (store_id, created_at DESC);

-- Auto-cleanup: keep only last 90 days (optional, can be run via cron)
COMMENT ON TABLE public.activity_log IS
    'Unified activity feed for dashboard. Types: sync, generation, publication, product_edit, seo_analysis, photo_studio.';

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_log_select_own" ON public.activity_log
    FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "activity_log_insert_own" ON public.activity_log
    FOR INSERT WITH CHECK (tenant_id = auth.uid());
