-- ============================================================================
-- Backfill: trigger SEO score computation on all existing products
-- This is a one-time migration that forces the trigger to fire
-- ============================================================================

-- Touch working_content to fire the BEFORE UPDATE trigger on unscored products
UPDATE products
SET working_content = COALESCE(working_content, '{}'::jsonb)
WHERE seo_score IS NULL OR seo_breakdown IS NULL;
