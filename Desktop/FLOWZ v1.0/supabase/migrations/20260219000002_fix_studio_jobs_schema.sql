-- ============================================================================
-- Fix studio_jobs schema: align column names + add FK constraint
--
-- PROBLEMS:
--   1. Migration defined user_id, code inserts tenant_id
--   2. Migration defined preset_settings, code inserts preset_json
--   3. No FK constraint on batch_id → batch_jobs.id
--   4. RLS policy references user_id instead of tenant_id
--
-- FIX: Rename columns, add FK, update RLS + indexes.
-- ============================================================================

-- 1. Rename user_id → tenant_id (if user_id still exists)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'studio_jobs' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.studio_jobs RENAME COLUMN user_id TO tenant_id;
  END IF;
END $$;

-- 2. Rename preset_settings → preset_json (if preset_settings still exists)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'studio_jobs' AND column_name = 'preset_settings'
  ) THEN
    ALTER TABLE public.studio_jobs RENAME COLUMN preset_settings TO preset_json;
  END IF;
END $$;

-- 3. Add FK constraint on batch_id → batch_jobs.id (if not already present)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_studio_jobs_batch' AND table_name = 'studio_jobs'
  ) THEN
    ALTER TABLE public.studio_jobs
      ADD CONSTRAINT fk_studio_jobs_batch
      FOREIGN KEY (batch_id) REFERENCES public.batch_jobs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Drop old index on user_id and create new one on tenant_id
DROP INDEX IF EXISTS idx_studio_jobs_user;
CREATE INDEX IF NOT EXISTS idx_studio_jobs_tenant ON public.studio_jobs(tenant_id);

-- 5. Update RLS policy
DROP POLICY IF EXISTS "Users can manage own studio jobs" ON public.studio_jobs;
DROP POLICY IF EXISTS "Tenant can manage studio jobs" ON public.studio_jobs;

CREATE POLICY "Tenant can manage studio jobs" ON public.studio_jobs
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- 6. Comments
COMMENT ON COLUMN public.studio_jobs.tenant_id IS 'User owning this studio job (renamed from user_id for tenant isolation consistency)';
COMMENT ON COLUMN public.studio_jobs.preset_json IS 'Preset configuration as JSON (renamed from preset_settings for code consistency)';
COMMENT ON COLUMN public.studio_jobs.batch_id IS 'FK to batch_jobs.id — groups jobs for batch processing';
