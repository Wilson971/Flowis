-- Add SEO score column to products for persistence and sorting
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_score smallint;
CREATE INDEX IF NOT EXISTS idx_products_seo_score ON products (seo_score) WHERE seo_score IS NOT NULL;
