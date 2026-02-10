-- Create product_seo_analysis table
-- Stores SEO analysis results for products

CREATE TABLE IF NOT EXISTS product_seo_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  title_score INTEGER CHECK (title_score >= 0 AND title_score <= 100),
  description_score INTEGER CHECK (description_score >= 0 AND description_score <= 100),
  meta_score INTEGER CHECK (meta_score >= 0 AND meta_score <= 100),

  analysis_data JSONB DEFAULT '{}'::jsonb,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(product_id)
);

-- Create product_serp_analysis table
-- Stores SERP (Search Engine Results Page) analysis

CREATE TABLE IF NOT EXISTS product_serp_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  keyword TEXT NOT NULL,
  keyword_position INTEGER,
  search_volume INTEGER,
  competition TEXT CHECK (competition IN ('low', 'medium', 'high')),

  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  serp_data JSONB DEFAULT '{}'::jsonb,

  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create studio_jobs table
-- Manages AI image generation jobs

CREATE TABLE IF NOT EXISTS studio_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),
  job_type TEXT DEFAULT 'image_generation',

  settings JSONB DEFAULT '{}'::jsonb,
  result_url TEXT,
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_seo_analysis_product_id ON product_seo_analysis(product_id);
CREATE INDEX IF NOT EXISTS idx_product_seo_analysis_overall_score ON product_seo_analysis(overall_score);

CREATE INDEX IF NOT EXISTS idx_product_serp_analysis_product_id ON product_serp_analysis(product_id);
CREATE INDEX IF NOT EXISTS idx_product_serp_analysis_keyword ON product_serp_analysis(keyword);

CREATE INDEX IF NOT EXISTS idx_studio_jobs_product_id ON studio_jobs(product_id);
CREATE INDEX IF NOT EXISTS idx_studio_jobs_status ON studio_jobs(status);
CREATE INDEX IF NOT EXISTS idx_studio_jobs_created_at ON studio_jobs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE product_seo_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_serp_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_seo_analysis
CREATE POLICY "Users can view SEO analysis for their products"
  ON product_seo_analysis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      JOIN stores ON stores.id = products.store_id
      WHERE products.id = product_seo_analysis.product_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert SEO analysis for their products"
  ON product_seo_analysis FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      JOIN stores ON stores.id = products.store_id
      WHERE products.id = product_seo_analysis.product_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update SEO analysis for their products"
  ON product_seo_analysis FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products
      JOIN stores ON stores.id = products.store_id
      WHERE products.id = product_seo_analysis.product_id
      AND stores.user_id = auth.uid()
    )
  );

-- RLS policies for product_serp_analysis
CREATE POLICY "Users can view SERP analysis for their products"
  ON product_serp_analysis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      JOIN stores ON stores.id = products.store_id
      WHERE products.id = product_serp_analysis.product_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert SERP analysis for their products"
  ON product_serp_analysis FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      JOIN stores ON stores.id = products.store_id
      WHERE products.id = product_serp_analysis.product_id
      AND stores.user_id = auth.uid()
    )
  );

-- RLS policies for studio_jobs
CREATE POLICY "Users can view studio jobs for their products"
  ON studio_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      JOIN stores ON stores.id = products.store_id
      WHERE products.id = studio_jobs.product_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert studio jobs for their products"
  ON studio_jobs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      JOIN stores ON stores.id = products.store_id
      WHERE products.id = studio_jobs.product_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update studio jobs for their products"
  ON studio_jobs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products
      JOIN stores ON stores.id = products.store_id
      WHERE products.id = studio_jobs.product_id
      AND stores.user_id = auth.uid()
    )
  );

-- Add comments
COMMENT ON TABLE product_seo_analysis IS 'SEO analysis results for products';
COMMENT ON TABLE product_serp_analysis IS 'SERP analysis and keyword rankings';
COMMENT ON TABLE studio_jobs IS 'AI image generation jobs for products';
