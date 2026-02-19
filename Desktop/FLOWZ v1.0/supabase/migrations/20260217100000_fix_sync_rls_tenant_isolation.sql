-- ============================================================================
-- Fix RLS policies on sync_jobs and sync_logs for proper tenant isolation
--
-- PROBLEM: Original policies only checked if store_id exists in stores table
-- without verifying tenant_id = auth.uid(). Since the stores table itself
-- has NO RLS, any authenticated user could access any store's sync data.
--
-- FIX: Add explicit tenant_id = auth.uid() check via stores join.
-- Also add RLS to stores table if missing.
-- ============================================================================

-- ============================================================================
-- 1. Enable RLS on stores table (was missing!)
-- ============================================================================

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Drop existing stores policies if any (safe: IF EXISTS)
DROP POLICY IF EXISTS "Users can view their own stores" ON public.stores;
DROP POLICY IF EXISTS "Users can insert their own stores" ON public.stores;
DROP POLICY IF EXISTS "Users can update their own stores" ON public.stores;
DROP POLICY IF EXISTS "Users can delete their own stores" ON public.stores;

-- Create proper tenant-isolated policies for stores
CREATE POLICY "Users can view their own stores"
    ON public.stores FOR SELECT
    USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert their own stores"
    ON public.stores FOR INSERT
    WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own stores"
    ON public.stores FOR UPDATE
    USING (tenant_id = auth.uid());

CREATE POLICY "Users can delete their own stores"
    ON public.stores FOR DELETE
    USING (tenant_id = auth.uid());

-- ============================================================================
-- 2. Fix sync_jobs RLS policies
-- ============================================================================

-- Drop old insecure policies
DROP POLICY IF EXISTS "Users can view sync jobs for their stores" ON public.sync_jobs;
DROP POLICY IF EXISTS "Users can insert sync jobs for their stores" ON public.sync_jobs;
DROP POLICY IF EXISTS "Users can update sync jobs for their stores" ON public.sync_jobs;

-- Create secure policies with explicit tenant_id check
CREATE POLICY "Users can view sync jobs for their stores"
    ON public.sync_jobs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = sync_jobs.store_id
            AND stores.tenant_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert sync jobs for their stores"
    ON public.sync_jobs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = sync_jobs.store_id
            AND stores.tenant_id = auth.uid()
        )
    );

CREATE POLICY "Users can update sync jobs for their stores"
    ON public.sync_jobs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.stores
            WHERE stores.id = sync_jobs.store_id
            AND stores.tenant_id = auth.uid()
        )
    );

-- ============================================================================
-- 3. Fix sync_logs RLS policies
-- ============================================================================

-- Drop old insecure policies
DROP POLICY IF EXISTS "Users can view sync logs for their jobs" ON public.sync_logs;
DROP POLICY IF EXISTS "Users can insert sync logs for their jobs" ON public.sync_logs;

-- Create secure policies with explicit tenant_id check (via sync_jobs → stores)
CREATE POLICY "Users can view sync logs for their jobs"
    ON public.sync_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.sync_jobs
            JOIN public.stores ON stores.id = sync_jobs.store_id
            WHERE sync_jobs.id = sync_logs.job_id
            AND stores.tenant_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert sync logs for their jobs"
    ON public.sync_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sync_jobs
            JOIN public.stores ON stores.id = sync_jobs.store_id
            WHERE sync_jobs.id = sync_logs.job_id
            AND stores.tenant_id = auth.uid()
        )
    );

-- ============================================================================
-- 4. Add index to speed up RLS policy lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_stores_tenant_id ON public.stores (tenant_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_store_id ON public.sync_jobs (store_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_job_id ON public.sync_logs (job_id);
