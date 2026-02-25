-- Add seo_breakdown jsonb column to products
-- Stores per-category breakdown: { titles, descriptions, images, technical } each /25
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_breakdown jsonb;

COMMENT ON COLUMN products.seo_breakdown IS 'SEO score breakdown by category: {titles, descriptions, images, technical} each /25';
