-- Migration: Enhance Product Variations for CRUD + Dirty Tracking
-- Description: Adds product_id FK, dirty tracking columns, description, and user CRUD RLS policy
-- Version: 20260213100000

-- ============================================================================
-- ADD MISSING COLUMNS TO PRODUCT_VARIATIONS
-- ============================================================================

-- Add product_id FK column for direct product linking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'product_variations' AND column_name = 'product_id') THEN
        ALTER TABLE product_variations ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add dirty tracking for sync
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'product_variations' AND column_name = 'is_dirty') THEN
        ALTER TABLE product_variations ADD COLUMN is_dirty BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'product_variations' AND column_name = 'dirty_action') THEN
        ALTER TABLE product_variations ADD COLUMN dirty_action TEXT DEFAULT NULL;
        -- Values: 'created', 'updated', 'deleted'
    END IF;
END $$;

-- Add description for variation-level descriptions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'product_variations' AND column_name = 'description') THEN
        ALTER TABLE product_variations ADD COLUMN description TEXT DEFAULT '';
    END IF;
END $$;

-- ============================================================================
-- BACKFILL PRODUCT_ID FROM PARENT_PRODUCT_EXTERNAL_ID
-- ============================================================================

UPDATE product_variations pv
SET product_id = p.id
FROM products p
WHERE p.platform_product_id = pv.parent_product_external_id
  AND p.store_id = pv.store_id
  AND pv.product_id IS NULL;

-- ============================================================================
-- INDEX ON PRODUCT_ID
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_product_variations_product_id ON product_variations(product_id);

-- ============================================================================
-- RLS POLICY: Users can manage (INSERT/UPDATE/DELETE) their own variations
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_variations' AND policyname = 'Users can manage variations from their stores') THEN
        CREATE POLICY "Users can manage variations from their stores"
            ON product_variations FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM stores
                    WHERE stores.id = product_variations.store_id
                    AND stores.tenant_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM stores
                    WHERE stores.id = product_variations.store_id
                    AND stores.tenant_id = auth.uid()
                )
            );
    END IF;
END $$;
