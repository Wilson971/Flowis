-- Add generation_manifest column to products table
-- Stores AI generation decisions per field: improved vs validated
ALTER TABLE products ADD COLUMN IF NOT EXISTS generation_manifest jsonb DEFAULT NULL;

COMMENT ON COLUMN products.generation_manifest IS 'Tracks AI generation decisions per field. Shape: { batch_job_id, generated_at, fields: { [field]: { status: improved|validated } } }';
