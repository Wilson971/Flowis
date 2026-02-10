-- Create batch_jobs table
-- Manages AI content generation batch jobs

CREATE TABLE IF NOT EXISTS batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partial')),

  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  successful_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,

  settings JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create batch_job_items table
-- Individual items in a batch job

CREATE TABLE IF NOT EXISTS batch_job_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_job_id UUID NOT NULL REFERENCES batch_jobs(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_batch_jobs_store_id ON batch_jobs(store_id);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_created_at ON batch_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_batch_job_items_batch_job_id ON batch_job_items(batch_job_id);
CREATE INDEX IF NOT EXISTS idx_batch_job_items_product_id ON batch_job_items(product_id);
CREATE INDEX IF NOT EXISTS idx_batch_job_items_status ON batch_job_items(status);

-- Enable Row Level Security
ALTER TABLE batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_job_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for batch_jobs
CREATE POLICY "Users can view their batch jobs"
  ON batch_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = batch_jobs.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their batch jobs"
  ON batch_jobs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = batch_jobs.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their batch jobs"
  ON batch_jobs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = batch_jobs.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- RLS policies for batch_job_items
CREATE POLICY "Users can view their batch job items"
  ON batch_job_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM batch_jobs
      JOIN stores ON stores.id = batch_jobs.store_id
      WHERE batch_jobs.id = batch_job_items.batch_job_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their batch job items"
  ON batch_job_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM batch_jobs
      JOIN stores ON stores.id = batch_jobs.store_id
      WHERE batch_jobs.id = batch_job_items.batch_job_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their batch job items"
  ON batch_job_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM batch_jobs
      JOIN stores ON stores.id = batch_jobs.store_id
      WHERE batch_jobs.id = batch_job_items.batch_job_id
      AND stores.user_id = auth.uid()
    )
  );

-- Create updated_at trigger for batch_job_items
CREATE TRIGGER update_batch_job_items_updated_at
  BEFORE UPDATE ON batch_job_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE batch_jobs IS 'AI content generation batch jobs';
COMMENT ON TABLE batch_job_items IS 'Individual products in a batch job';
