-- ============================================================
-- Migration: create_kpi_snapshots
-- Date: 2026-02-20
-- Purpose: Store daily metric snapshots for KPI trend calculation
--          (M-1 comparisons for dashboard NorthStar card, etc.)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.kpi_snapshots (
    id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id     uuid        NOT NULL,
    store_id      uuid        REFERENCES public.stores(id) ON DELETE CASCADE,
    snapshot_date date        NOT NULL DEFAULT CURRENT_DATE,
    metric_name   text        NOT NULL,
    metric_value  numeric     NOT NULL DEFAULT 0,
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- Unique index: one value per (tenant, store, date, metric).
-- COALESCE handles NULL store_id (global tenant snapshot).
CREATE UNIQUE INDEX kpi_snapshots_unique_idx
    ON public.kpi_snapshots (
        tenant_id,
        COALESCE(store_id, '00000000-0000-0000-0000-000000000000'::uuid),
        snapshot_date,
        metric_name
    );

-- Fast lookup for M-1 trend queries
CREATE INDEX kpi_snapshots_trend_idx
    ON public.kpi_snapshots (tenant_id, store_id, snapshot_date DESC, metric_name);

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE public.kpi_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kpi_snapshots_select_own"
    ON public.kpi_snapshots
    FOR SELECT
    USING (tenant_id = auth.uid());

CREATE POLICY "kpi_snapshots_insert_own"
    ON public.kpi_snapshots
    FOR INSERT
    WITH CHECK (tenant_id = auth.uid());

-- Comments
COMMENT ON TABLE public.kpi_snapshots IS
    'Daily KPI metric snapshots per tenant/store for dashboard trend calculation.';
COMMENT ON COLUMN public.kpi_snapshots.store_id IS
    'NULL = global tenant snapshot (all stores combined).';
COMMENT ON COLUMN public.kpi_snapshots.metric_name IS
    'Metric key: seo_avg_score | ai_optimized_products | total_products | published_blog_posts | total_blog_posts';
