-- ============================================================================
-- Fix sync system: missing columns, indexes, and RPC fixes
-- ============================================================================

-- 1. CRITICAL: Add missing columns on products table (referenced by complete_sync_job RPC)
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sync_source TEXT;

-- 2. HIGH: Add missing indexes for sync performance
CREATE INDEX IF NOT EXISTS idx_sync_queue_claim
  ON sync_queue (status, priority, created_at)
  WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_sync_logs_job_created
  ON sync_logs (job_id, created_at);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_tenant_status
  ON sync_jobs (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_conflict_log_composite
  ON conflict_log (product_id, store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_audit_log_user_action
  ON sync_audit_log (user_id, action, created_at DESC);

-- 3. MEDIUM: Add jitter to fail_sync_job retry to prevent thundering herd
CREATE OR REPLACE FUNCTION fail_sync_job(
  p_job_id UUID,
  p_error TEXT,
  p_base_delay_ms INT DEFAULT 1000,
  p_max_delay_ms INT DEFAULT 300000
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job sync_queue%ROWTYPE;
  v_delay_ms INT;
  v_jitter_ms INT;
  v_new_status TEXT;
BEGIN
  -- Lock the job
  SELECT * INTO v_job FROM sync_queue WHERE id = p_job_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  -- Increment attempt count
  v_job.attempt_count := v_job.attempt_count + 1;

  IF v_job.attempt_count >= v_job.max_attempts THEN
    -- Move to dead letter queue
    v_new_status := 'dead_letter';

    UPDATE sync_queue SET
      status = 'dead_letter',
      attempt_count = v_job.attempt_count,
      last_error = p_error,
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_job_id;

    -- Mark product as conflict
    UPDATE products SET sync_status = 'conflict'
    WHERE id = v_job.product_id;

    RETURN 'dead_letter';
  ELSE
    -- Calculate exponential backoff WITH jitter
    v_delay_ms := LEAST(p_base_delay_ms * POWER(2, v_job.attempt_count - 1)::INT, p_max_delay_ms);
    v_jitter_ms := (RANDOM() * v_delay_ms * 0.3)::INT; -- 0-30% jitter
    v_delay_ms := v_delay_ms + v_jitter_ms;
    v_new_status := 'pending';

    UPDATE sync_queue SET
      status = 'pending',
      attempt_count = v_job.attempt_count,
      last_error = p_error,
      next_retry_at = NOW() + (v_delay_ms || ' milliseconds')::INTERVAL,
      updated_at = NOW()
    WHERE id = p_job_id;

    RETURN 'retrying';
  END IF;
END;
$$;
