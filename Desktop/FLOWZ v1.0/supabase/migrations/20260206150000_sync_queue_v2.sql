-- Migration: Sync Queue V2
-- Description: Durable queue system for reliable store synchronization
-- Version: 20260206150000

-- ============================================================================
-- 1. SYNC QUEUE TABLE - Durable job queue with guaranteed delivery
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

    -- Job metadata
    direction TEXT NOT NULL CHECK (direction IN ('push', 'pull')),
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1=highest, 10=lowest

    -- Selective sync: only push/pull these fields
    dirty_fields TEXT[] DEFAULT '{}',
    payload JSONB, -- Pre-computed update payload

    -- Platform info (denormalized for performance)
    platform TEXT NOT NULL DEFAULT 'woocommerce',
    platform_product_id TEXT NOT NULL,

    -- Queue state machine
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Waiting in queue
        'processing',   -- Worker picked it up
        'completed',    -- Success
        'failed',       -- Permanent failure (after max retries)
        'dead_letter'   -- Moved to DLQ for manual review
    )),

    -- Retry logic with exponential backoff
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    last_error TEXT,
    next_retry_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Idempotency key to prevent duplicate processing
    idempotency_key TEXT UNIQUE
);

-- Indexes for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_sync_queue_pending
    ON sync_queue(priority, created_at)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_sync_queue_retry
    ON sync_queue(next_retry_at)
    WHERE status = 'pending' AND next_retry_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sync_queue_store
    ON sync_queue(store_id, status);

CREATE INDEX IF NOT EXISTS idx_sync_queue_product
    ON sync_queue(product_id, status);

-- ============================================================================
-- 2. STORE HEARTBEAT TABLE - Track store polling for change detection
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.store_heartbeat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,

    -- Last successful heartbeat
    last_checked_at TIMESTAMPTZ,
    last_successful_at TIMESTAMPTZ,

    -- Store's last modification timestamp (from WooCommerce modified_after)
    store_last_modified_at TIMESTAMPTZ,

    -- Heartbeat config
    interval_minutes INTEGER DEFAULT 15,
    enabled BOOLEAN DEFAULT TRUE,

    -- Error tracking
    consecutive_failures INTEGER DEFAULT 0,
    last_error TEXT,

    -- Stats
    total_checks INTEGER DEFAULT 0,
    total_changes_detected INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding stores due for heartbeat
CREATE INDEX IF NOT EXISTS idx_store_heartbeat_due
    ON store_heartbeat(last_checked_at, enabled)
    WHERE enabled = TRUE;

-- ============================================================================
-- 3. CONFLICT LOG TABLE - Track conflicts and auto-resolutions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.conflict_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

    -- What happened
    conflict_type TEXT NOT NULL CHECK (conflict_type IN ('store_wins', 'local_wins', 'merge', 'manual')),
    fields_affected TEXT[],

    -- Before/after for audit
    local_values JSONB,
    store_values JSONB,
    resolved_values JSONB,

    -- Resolution
    resolution TEXT NOT NULL CHECK (resolution IN ('auto_store_wins', 'auto_local_wins', 'manual', 'merge')),
    resolved_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_by UUID REFERENCES auth.users(id),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for viewing conflicts by product
CREATE INDEX IF NOT EXISTS idx_conflict_log_product
    ON conflict_log(product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conflict_log_store
    ON conflict_log(store_id, created_at DESC);

-- ============================================================================
-- 4. ADD MISSING COLUMNS TO PRODUCTS TABLE
-- ============================================================================

-- Add sync_status column for tracking current sync state
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'sync_status') THEN
        ALTER TABLE products ADD COLUMN sync_status TEXT DEFAULT 'synced'
            CHECK (sync_status IN ('synced', 'pending_push', 'pending_pull', 'conflict', 'processing'));
    END IF;
END $$;

-- Add store_last_modified_at to track when store last changed this product
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'store_last_modified_at') THEN
        ALTER TABLE products ADD COLUMN store_last_modified_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add content_hash for quick diff detection
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'content_hash') THEN
        ALTER TABLE products ADD COLUMN content_hash TEXT;
    END IF;
END $$;

-- Index for finding products needing sync
CREATE INDEX IF NOT EXISTS idx_products_sync_status
    ON products(store_id, sync_status)
    WHERE sync_status != 'synced';

-- ============================================================================
-- 5. CLAIM SYNC JOBS FUNCTION - Atomic job claiming with row-level locking
-- ============================================================================

CREATE OR REPLACE FUNCTION claim_sync_jobs(
    p_batch_size INTEGER DEFAULT 10,
    p_direction TEXT DEFAULT NULL
) RETURNS SETOF sync_queue AS $$
DECLARE
    v_job sync_queue;
BEGIN
    FOR v_job IN
        SELECT * FROM sync_queue
        WHERE status = 'pending'
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
        AND (p_direction IS NULL OR direction = p_direction)
        ORDER BY priority ASC, created_at ASC
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    LOOP
        UPDATE sync_queue SET
            status = 'processing',
            started_at = NOW(),
            updated_at = NOW()
        WHERE id = v_job.id;

        -- Return the job with updated status
        v_job.status := 'processing';
        v_job.started_at := NOW();
        v_job.updated_at := NOW();

        RETURN NEXT v_job;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. COMPLETE SYNC JOB FUNCTION - Mark job as completed and update product
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_sync_job(
    p_job_id UUID,
    p_store_snapshot JSONB DEFAULT NULL,
    p_store_last_modified_at TIMESTAMPTZ DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_job sync_queue;
BEGIN
    -- Get and lock the job
    SELECT * INTO v_job FROM sync_queue WHERE id = p_job_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Mark job as completed
    UPDATE sync_queue SET
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_job_id;

    -- Update product
    UPDATE products SET
        sync_status = 'synced',
        dirty_fields_content = '{}',
        last_synced_at = NOW(),
        sync_source = 'push',
        store_snapshot_content = COALESCE(p_store_snapshot, store_snapshot_content),
        store_last_modified_at = COALESCE(p_store_last_modified_at, store_last_modified_at),
        updated_at = NOW()
    WHERE id = v_job.product_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. FAIL SYNC JOB FUNCTION - Handle job failure with retry logic
-- ============================================================================

CREATE OR REPLACE FUNCTION fail_sync_job(
    p_job_id UUID,
    p_error TEXT,
    p_base_delay_ms INTEGER DEFAULT 1000,
    p_max_delay_ms INTEGER DEFAULT 300000
) RETURNS TEXT AS $$
DECLARE
    v_job sync_queue;
    v_next_attempt INTEGER;
    v_delay_ms INTEGER;
    v_new_status TEXT;
BEGIN
    -- Get and lock the job
    SELECT * INTO v_job FROM sync_queue WHERE id = p_job_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN 'not_found';
    END IF;

    v_next_attempt := v_job.attempt_count + 1;

    IF v_next_attempt >= v_job.max_attempts THEN
        -- Move to dead letter queue
        v_new_status := 'dead_letter';

        UPDATE sync_queue SET
            status = 'dead_letter',
            attempt_count = v_next_attempt,
            last_error = p_error,
            updated_at = NOW()
        WHERE id = p_job_id;

        -- Mark product as failed
        UPDATE products SET
            sync_status = 'conflict',
            updated_at = NOW()
        WHERE id = v_job.product_id;
    ELSE
        -- Calculate exponential backoff delay
        v_delay_ms := LEAST(p_base_delay_ms * POWER(2, v_next_attempt), p_max_delay_ms);
        v_new_status := 'pending';

        UPDATE sync_queue SET
            status = 'pending',
            attempt_count = v_next_attempt,
            last_error = p_error,
            next_retry_at = NOW() + (v_delay_ms || ' milliseconds')::INTERVAL,
            updated_at = NOW()
        WHERE id = p_job_id;
    END IF;

    RETURN v_new_status;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. ENQUEUE SYNC FUNCTION - Add products to sync queue
-- ============================================================================

CREATE OR REPLACE FUNCTION enqueue_sync(
    p_product_ids UUID[],
    p_direction TEXT DEFAULT 'push',
    p_priority INTEGER DEFAULT 5
) RETURNS INTEGER AS $$
DECLARE
    v_product RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR v_product IN
        SELECT
            p.id AS product_id,
            p.store_id,
            p.platform_product_id,
            p.working_content,
            p.dirty_fields_content,
            s.platform
        FROM products p
        JOIN stores s ON s.id = p.store_id
        WHERE p.id = ANY(p_product_ids)
        AND p.platform_product_id IS NOT NULL
        AND (p.dirty_fields_content IS NOT NULL AND array_length(p.dirty_fields_content, 1) > 0)
    LOOP
        -- Insert job, skip if already pending for this product/direction
        INSERT INTO sync_queue (
            store_id,
            product_id,
            direction,
            priority,
            dirty_fields,
            payload,
            platform,
            platform_product_id,
            idempotency_key
        ) VALUES (
            v_product.store_id,
            v_product.product_id,
            p_direction,
            p_priority,
            v_product.dirty_fields_content,
            v_product.working_content,
            v_product.platform,
            v_product.platform_product_id,
            v_product.product_id || '-' || p_direction || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT
        )
        ON CONFLICT (idempotency_key) DO NOTHING;

        -- Update product sync status
        UPDATE products SET
            sync_status = 'pending_push',
            updated_at = NOW()
        WHERE id = v_product.product_id;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. GET QUEUE STATS FUNCTION - For monitoring dashboard
-- ============================================================================

CREATE OR REPLACE FUNCTION get_sync_queue_stats(p_store_id UUID DEFAULT NULL)
RETURNS TABLE (
    status TEXT,
    count BIGINT,
    oldest_created_at TIMESTAMPTZ,
    avg_attempts NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sq.status,
        COUNT(*)::BIGINT,
        MIN(sq.created_at),
        AVG(sq.attempt_count)::NUMERIC
    FROM sync_queue sq
    WHERE p_store_id IS NULL OR sq.store_id = p_store_id
    GROUP BY sq.status
    ORDER BY sq.status;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_heartbeat ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflict_log ENABLE ROW LEVEL SECURITY;

-- sync_queue policies
CREATE POLICY "Users can view sync queue for their stores"
    ON sync_queue FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = sync_queue.store_id
        AND stores.tenant_id = auth.uid()
    ));

CREATE POLICY "Users can insert into sync queue for their stores"
    ON sync_queue FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = sync_queue.store_id
        AND stores.tenant_id = auth.uid()
    ));

CREATE POLICY "Service role can manage all sync queue"
    ON sync_queue FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- store_heartbeat policies
CREATE POLICY "Users can view heartbeat for their stores"
    ON store_heartbeat FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = store_heartbeat.store_id
        AND stores.tenant_id = auth.uid()
    ));

CREATE POLICY "Service role can manage all heartbeats"
    ON store_heartbeat FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- conflict_log policies
CREATE POLICY "Users can view conflicts for their stores"
    ON conflict_log FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = conflict_log.store_id
        AND stores.tenant_id = auth.uid()
    ));

CREATE POLICY "Service role can manage all conflicts"
    ON conflict_log FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- ============================================================================
-- 11. ENABLE REALTIME FOR SYNC QUEUE
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'sync_queue'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE sync_queue;
    END IF;
END $$;

-- ============================================================================
-- 12. AUTO-CREATE HEARTBEAT ON STORE INSERT
-- ============================================================================

CREATE OR REPLACE FUNCTION create_store_heartbeat()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO store_heartbeat (store_id)
    VALUES (NEW.id)
    ON CONFLICT (store_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_store_heartbeat ON stores;
CREATE TRIGGER trigger_create_store_heartbeat
    AFTER INSERT ON stores
    FOR EACH ROW
    EXECUTE FUNCTION create_store_heartbeat();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE sync_queue IS 'Durable queue for reliable store synchronization with retry logic';
COMMENT ON TABLE store_heartbeat IS 'Tracks periodic polling of stores to detect external changes';
COMMENT ON TABLE conflict_log IS 'Audit log of sync conflicts and how they were resolved';
COMMENT ON FUNCTION claim_sync_jobs IS 'Atomically claims pending sync jobs with row-level locking';
COMMENT ON FUNCTION complete_sync_job IS 'Marks a sync job as completed and updates the product';
COMMENT ON FUNCTION fail_sync_job IS 'Handles job failure with exponential backoff retry';
COMMENT ON FUNCTION enqueue_sync IS 'Adds products to the sync queue for background processing';
