-- ============================================================
-- Migration: create_upsert_daily_snapshot RPC
-- Purpose: Client-callable RPC to upsert daily KPI snapshots
--          Called once per dashboard visit per day
-- ============================================================

CREATE OR REPLACE FUNCTION public.upsert_daily_snapshot(p_store_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_tid uuid := auth.uid();
  v_seo numeric;
  v_ai  bigint;
  v_total bigint;
  v_pub  bigint;
BEGIN
  IF v_tid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Compute current metrics
  SELECT
    AVG(seo_score),
    count(*) FILTER (WHERE working_content IS NOT NULL),
    count(*)
  INTO v_seo, v_ai, v_total
  FROM products
  WHERE tenant_id = v_tid
    AND (p_store_id IS NULL OR store_id = p_store_id);

  SELECT count(*) INTO v_pub
  FROM blog_articles
  WHERE tenant_id = v_tid
    AND (p_store_id IS NULL OR store_id = p_store_id)
    AND status IN ('publish', 'published')
    AND archived = false;

  -- Upsert snapshots for today
  INSERT INTO kpi_snapshots (tenant_id, store_id, metric_name, metric_value, snapshot_date)
  VALUES
    (v_tid, p_store_id, 'seo_avg_score', COALESCE(v_seo, 0), CURRENT_DATE),
    (v_tid, p_store_id, 'ai_optimized_products', COALESCE(v_ai, 0), CURRENT_DATE),
    (v_tid, p_store_id, 'total_products', COALESCE(v_total, 0), CURRENT_DATE),
    (v_tid, p_store_id, 'published_blog_posts', COALESCE(v_pub, 0), CURRENT_DATE)
  ON CONFLICT (tenant_id, COALESCE(store_id, '00000000-0000-0000-0000-000000000000'::uuid), snapshot_date, metric_name)
  DO UPDATE SET metric_value = EXCLUDED.metric_value;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.upsert_daily_snapshot(uuid) TO authenticated;

COMMENT ON FUNCTION public.upsert_daily_snapshot IS
  'Upserts daily KPI snapshots for the current user. Called from dashboard on each visit (deduplicated client-side).';
