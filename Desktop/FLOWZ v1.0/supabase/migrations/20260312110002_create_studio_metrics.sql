CREATE TABLE studio_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES studio_jobs(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('done', 'failed')),
  latency_ms INT,
  gemini_tokens_input INT DEFAULT 0,
  gemini_tokens_output INT DEFAULT 0,
  estimated_cost_usd NUMERIC(10,6) DEFAULT 0,
  error_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_studio_metrics_tenant ON studio_metrics(tenant_id);
CREATE INDEX idx_studio_metrics_created ON studio_metrics(created_at);
CREATE INDEX idx_studio_metrics_action ON studio_metrics(action);
ALTER TABLE studio_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_reads_own_metrics" ON studio_metrics
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
