CREATE TABLE studio_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES studio_jobs(id) ON DELETE SET NULL,
  storage_url TEXT NOT NULL,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'published')),
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  sort_order INT DEFAULT 0,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_studio_images_tenant ON studio_images(tenant_id);
CREATE INDEX idx_studio_images_product ON studio_images(product_id);
CREATE INDEX idx_studio_images_status ON studio_images(status);
CREATE INDEX idx_studio_images_job ON studio_images(job_id);
ALTER TABLE studio_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_manages_studio_images" ON studio_images
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
