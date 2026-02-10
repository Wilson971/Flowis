-- RPC function to accept draft content
-- Moves draft_generated_content to working_content and clears the draft

CREATE OR REPLACE FUNCTION accept_draft_content(product_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_draft JSONB;
  v_working JSONB;
  v_result JSONB;
BEGIN
  -- Check if user has access to this product
  IF NOT EXISTS (
    SELECT 1 FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE p.id = product_id
    AND s.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Product not found or access denied';
  END IF;

  -- Get current draft and working content
  SELECT draft_generated_content, working_content
  INTO v_draft, v_working
  FROM products
  WHERE id = product_id;

  -- If no draft, return error
  IF v_draft IS NULL THEN
    RAISE EXCEPTION 'No draft content to accept';
  END IF;

  -- Merge draft into working content
  v_working := COALESCE(v_working, '{}'::jsonb) || v_draft;

  -- Update product
  UPDATE products
  SET
    working_content = v_working,
    draft_generated_content = NULL,
    dirty_fields_content = array_append(
      COALESCE(dirty_fields_content, ARRAY[]::TEXT[]),
      VARIADIC ARRAY(SELECT jsonb_object_keys(v_draft))
    ),
    ai_enhanced = TRUE,
    updated_at = NOW()
  WHERE id = product_id;

  -- Return success with updated content
  SELECT jsonb_build_object(
    'success', true,
    'working_content', v_working,
    'message', 'Draft content accepted successfully'
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- RPC function to reject draft content
-- Clears draft_generated_content without applying it

CREATE OR REPLACE FUNCTION reject_draft_content(product_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Check if user has access to this product
  IF NOT EXISTS (
    SELECT 1 FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE p.id = product_id
    AND s.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Product not found or access denied';
  END IF;

  -- Check if there's a draft to reject
  IF NOT EXISTS (
    SELECT 1 FROM products
    WHERE id = product_id
    AND draft_generated_content IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'No draft content to reject';
  END IF;

  -- Clear draft content
  UPDATE products
  SET
    draft_generated_content = NULL,
    updated_at = NOW()
  WHERE id = product_id;

  -- Return success
  SELECT jsonb_build_object(
    'success', true,
    'message', 'Draft content rejected successfully'
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- RPC function to cancel sync
-- Clears dirty_fields_content for specified products

CREATE OR REPLACE FUNCTION cancel_sync(product_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_result JSONB;
BEGIN
  -- Update products and count affected rows
  WITH updated AS (
    UPDATE products p
    SET
      dirty_fields_content = ARRAY[]::TEXT[],
      updated_at = NOW()
    WHERE p.id = ANY(product_ids)
    AND EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = p.store_id
      AND s.user_id = auth.uid()
    )
    RETURNING p.id
  )
  SELECT COUNT(*) INTO v_count FROM updated;

  -- Return result
  SELECT jsonb_build_object(
    'success', true,
    'count', v_count,
    'message', format('%s product(s) sync canceled', v_count)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- RPC function to get active batch job for a store
-- Retrieves the most recent incomplete batch job

CREATE OR REPLACE FUNCTION get_active_batch_job(p_store_id UUID)
RETURNS TABLE (
  id UUID,
  status TEXT,
  total_items INTEGER,
  processed_items INTEGER,
  successful_items INTEGER,
  failed_items INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has access to this store
  IF NOT EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = p_store_id
    AND stores.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Store not found or access denied';
  END IF;

  RETURN QUERY
  SELECT
    bj.id,
    bj.status,
    bj.total_items,
    bj.processed_items,
    bj.successful_items,
    bj.failed_items,
    bj.created_at,
    bj.started_at
  FROM batch_jobs bj
  WHERE bj.store_id = p_store_id
  AND bj.status IN ('pending', 'running')
  ORDER BY bj.created_at DESC
  LIMIT 1;
END;
$$;

-- Add comments
COMMENT ON FUNCTION accept_draft_content IS 'Accepts AI-generated draft content and applies it to working content';
COMMENT ON FUNCTION reject_draft_content IS 'Rejects AI-generated draft content without applying it';
COMMENT ON FUNCTION cancel_sync IS 'Cancels pending sync for specified products';
COMMENT ON FUNCTION get_active_batch_job IS 'Gets the active batch job for a store';
