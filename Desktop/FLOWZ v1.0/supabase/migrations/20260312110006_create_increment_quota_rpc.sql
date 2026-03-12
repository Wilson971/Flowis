CREATE OR REPLACE FUNCTION increment_studio_quota(p_tenant_id UUID, p_cost NUMERIC DEFAULT 0)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO studio_quotas (tenant_id, month, generations_used, cost_usd)
  VALUES (p_tenant_id, date_trunc('month', CURRENT_DATE)::date, 1, p_cost)
  ON CONFLICT (tenant_id, month)
  DO UPDATE SET generations_used = studio_quotas.generations_used + 1, cost_usd = studio_quotas.cost_usd + p_cost;
END;
$$;
