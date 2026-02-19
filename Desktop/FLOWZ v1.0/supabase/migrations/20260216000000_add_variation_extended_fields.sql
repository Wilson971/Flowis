-- ============================================================================
-- Migration: Add extended fields to product_variations
-- Date: 2026-02-16
-- Purpose: Phase 1 (editable UI fields) + Phase 2 (sync-only for scalability)
-- ============================================================================

-- Phase 1: Editable fields (exposed in VariationGrid + VariationDetailSheet)
ALTER TABLE product_variations ADD COLUMN IF NOT EXISTS global_unique_id TEXT DEFAULT '';
ALTER TABLE product_variations ADD COLUMN IF NOT EXISTS backorders TEXT DEFAULT 'no';
ALTER TABLE product_variations ADD COLUMN IF NOT EXISTS tax_status TEXT DEFAULT 'taxable';
ALTER TABLE product_variations ADD COLUMN IF NOT EXISTS tax_class TEXT DEFAULT '';
ALTER TABLE product_variations ADD COLUMN IF NOT EXISTS date_on_sale_from TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE product_variations ADD COLUMN IF NOT EXISTS date_on_sale_to TIMESTAMPTZ DEFAULT NULL;

-- Phase 2: Sync-only columns (no UI yet, stored for future use and WooCommerce round-trip)
ALTER TABLE product_variations ADD COLUMN IF NOT EXISTS shipping_class TEXT DEFAULT '';
ALTER TABLE product_variations ADD COLUMN IF NOT EXISTS download_limit INTEGER DEFAULT -1;
ALTER TABLE product_variations ADD COLUMN IF NOT EXISTS download_expiry INTEGER DEFAULT -1;
ALTER TABLE product_variations ADD COLUMN IF NOT EXISTS downloads JSONB DEFAULT '[]'::jsonb;
ALTER TABLE product_variations ADD COLUMN IF NOT EXISTS menu_order INTEGER DEFAULT 0;
ALTER TABLE product_variations ADD COLUMN IF NOT EXISTS variation_meta_data JSONB DEFAULT '[]'::jsonb;
ALTER TABLE product_variations ADD COLUMN IF NOT EXISTS low_stock_amount INTEGER DEFAULT NULL;

-- Partial index on GTIN for marketplace lookups (Google Shopping, Amazon, etc.)
CREATE INDEX IF NOT EXISTS idx_pv_global_unique_id
    ON product_variations(global_unique_id)
    WHERE global_unique_id IS NOT NULL AND global_unique_id != '';
