CREATE TABLE studio_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL,
  generations_used INT DEFAULT 0,
  generations_limit INT DEFAULT 100,
  cost_usd NUMERIC(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, month)
);
ALTER TABLE studio_quotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_manages_own_quotas" ON studio_quotas
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
