CREATE OR REPLACE FUNCTION get_studio_stats(p_tenant_id UUID, p_from DATE, p_to DATE)
RETURNS JSON LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object(
    'total_generations', COUNT(*)::int,
    'successful', COUNT(*) FILTER (WHERE status = 'done')::int,
    'failed', COUNT(*) FILTER (WHERE status = 'failed')::int,
    'success_rate', ROUND(AVG(CASE WHEN status = 'done' THEN 1.0 ELSE 0.0 END) * 100, 1),
    'total_cost_usd', COALESCE(SUM(estimated_cost_usd), 0),
    'avg_latency_ms', COALESCE(AVG(latency_ms)::int, 0),
    'by_action', COALESCE((
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT action, COUNT(*)::int as count, COALESCE(AVG(latency_ms)::int, 0) as avg_latency_ms,
          COALESCE(SUM(estimated_cost_usd), 0) as cost_usd,
          ROUND(AVG(CASE WHEN status = 'done' THEN 1.0 ELSE 0.0 END) * 100, 1) as success_rate
        FROM studio_metrics WHERE tenant_id = p_tenant_id AND created_at >= p_from AND created_at < p_to + INTERVAL '1 day'
        GROUP BY action
      ) t
    ), '[]'::json),
    'errors_by_type', COALESCE((
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT error_type, COUNT(*)::int as count
        FROM studio_metrics WHERE tenant_id = p_tenant_id AND status = 'failed'
          AND created_at >= p_from AND created_at < p_to + INTERVAL '1 day' AND error_type IS NOT NULL
        GROUP BY error_type
      ) t
    ), '[]'::json)
  ) FROM studio_metrics WHERE tenant_id = p_tenant_id AND created_at >= p_from AND created_at < p_to + INTERVAL '1 day';
$$;
