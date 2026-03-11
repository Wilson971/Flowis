-- ============================================================================
-- One-time reset: null-ify all seo_score/seo_breakdown so that
-- the batch-analyze API recalculates them using the TS scorer.
-- This ensures all products get scores from the single source of truth.
-- ============================================================================

UPDATE products
SET seo_score = NULL,
    seo_breakdown = NULL;
