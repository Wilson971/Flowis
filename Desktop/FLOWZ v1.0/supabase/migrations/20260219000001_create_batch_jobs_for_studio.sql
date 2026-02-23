-- ============================================================================
-- Create batch_jobs table with photo-studio support
--
-- This table supports two use cases:
--   1. Store-based batch content generation (uses store_id)
--   2. Photo Studio batch processing (uses tenant_id)
--
-- Both store_id and tenant_id are nullable to support both flows.
-- ============================================================================

-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS public.batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Store-based batches (content generation)
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,

  -- Tenant-based batches (photo studio)
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Shared fields
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'processing', 'completed', 'failed', 'partial')),

  content_types JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,

  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  successful_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 2. Safety: add columns if table already existed with old schema
DO $$ BEGIN
  -- Add tenant_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'batch_jobs' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.batch_jobs ADD COLUMN tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add content_types if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'batch_jobs' AND column_name = 'content_types'
  ) THEN
    ALTER TABLE public.batch_jobs ADD COLUMN content_types JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Make store_id nullable if it was NOT NULL
  ALTER TABLE public.batch_jobs ALTER COLUMN store_id DROP NOT NULL;
END $$;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_batch_jobs_tenant_id ON public.batch_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_store_id ON public.batch_jobs(store_id);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON public.batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_created_at ON public.batch_jobs(created_at DESC);

-- 4. Enable RLS
ALTER TABLE public.batch_jobs ENABLE ROW LEVEL SECURITY;

-- 5. Drop old policies if they exist (from my-app/supabase migration)
DROP POLICY IF EXISTS "Users can view their batch jobs" ON public.batch_jobs;
DROP POLICY IF EXISTS "Users can insert their batch jobs" ON public.batch_jobs;
DROP POLICY IF EXISTS "Users can update their batch jobs" ON public.batch_jobs;

-- 6. Create unified RLS policies
-- A user can access batch_jobs they own directly (tenant_id) OR via their stores (store_id)
CREATE POLICY "batch_jobs_select" ON public.batch_jobs
  FOR SELECT USING (
    tenant_id = auth.uid()
    OR store_id IN (SELECT id FROM public.stores WHERE tenant_id = auth.uid())
  );

CREATE POLICY "batch_jobs_insert" ON public.batch_jobs
  FOR INSERT WITH CHECK (
    tenant_id = auth.uid()
    OR store_id IN (SELECT id FROM public.stores WHERE tenant_id = auth.uid())
  );

CREATE POLICY "batch_jobs_update" ON public.batch_jobs
  FOR UPDATE USING (
    tenant_id = auth.uid()
    OR store_id IN (SELECT id FROM public.stores WHERE tenant_id = auth.uid())
  );

CREATE POLICY "batch_jobs_delete" ON public.batch_jobs
  FOR DELETE USING (
    tenant_id = auth.uid()
    OR store_id IN (SELECT id FROM public.stores WHERE tenant_id = auth.uid())
  );

-- 7. Comments
COMMENT ON TABLE public.batch_jobs IS 'Batch processing jobs for content generation and photo studio';
COMMENT ON COLUMN public.batch_jobs.store_id IS 'Store reference for content batch generation (nullable for studio batches)';
COMMENT ON COLUMN public.batch_jobs.tenant_id IS 'User reference for photo studio batch processing (nullable for store batches)';
COMMENT ON COLUMN public.batch_jobs.content_types IS 'JSON describing batch content types (photo studio metadata)';
