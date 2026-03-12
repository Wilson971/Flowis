-- ============================================================================
-- Backfill v2: re-trigger SEO computation to populate f_* pillar fields
-- The initial backfill ran before the trigger was created, so f_* are missing
-- ============================================================================

-- Force trigger by toggling metadata (add then remove a temp key)
UPDATE products
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"_seo_backfill": true}'::jsonb
WHERE seo_breakdown IS NULL
   OR NOT (seo_breakdown ? 'f_meta_title');

-- Clean up the temp key
UPDATE products
SET metadata = metadata - '_seo_backfill'
WHERE metadata ? '_seo_backfill';
