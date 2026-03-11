-- ============================================================================
-- Drop SEO score triggers — score is now computed by TypeScript
-- (calculateProductSeoScore in lib/seo/analyzer.ts) and written to DB
-- by useProductSave and /api/seo/batch-analyze.
--
-- The trigger was overriding the TS-computed score with a simplified formula
-- (no bonus criteria, different image scoring), causing score mismatches
-- between the product list and the product editor.
--
-- Helper functions (strip_html, seo_score_by_length, compute_product_seo_score)
-- are kept for potential RPC/report usage.
-- ============================================================================

DROP TRIGGER IF EXISTS trg_compute_seo_score_insert ON products;
DROP TRIGGER IF EXISTS trg_compute_seo_score_update ON products;
