-- Migration: Complete Sync Schema
-- Description: Ensures all required columns exist for complete store synchronization
-- Version: 20260201200000

-- ============================================================================
-- ADD MISSING COLUMNS TO PRODUCTS TABLE (if not exists)
-- ============================================================================

-- Add slug column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'slug') THEN
        ALTER TABLE products ADD COLUMN slug TEXT;
    END IF;
END $$;

-- Add description column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'description') THEN
        ALTER TABLE products ADD COLUMN description TEXT;
    END IF;
END $$;

-- Add short_description column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'short_description') THEN
        ALTER TABLE products ADD COLUMN short_description TEXT;
    END IF;
END $$;

-- Add regular_price column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'regular_price') THEN
        ALTER TABLE products ADD COLUMN regular_price NUMERIC(10, 2);
    END IF;
END $$;

-- Add sale_price column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'sale_price') THEN
        ALTER TABLE products ADD COLUMN sale_price NUMERIC(10, 2);
    END IF;
END $$;

-- Add stock_status column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'stock_status') THEN
        ALTER TABLE products ADD COLUMN stock_status TEXT DEFAULT 'instock';
    END IF;
END $$;

-- Add manage_stock column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'manage_stock') THEN
        ALTER TABLE products ADD COLUMN manage_stock BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add seo_title column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'seo_title') THEN
        ALTER TABLE products ADD COLUMN seo_title TEXT;
    END IF;
END $$;

-- Add seo_description column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'seo_description') THEN
        ALTER TABLE products ADD COLUMN seo_description TEXT;
    END IF;
END $$;

-- Add tenant_id column if not exists (for multi-tenant support)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'tenant_id') THEN
        ALTER TABLE products ADD COLUMN tenant_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- ============================================================================
-- CREATE PRODUCT_VARIATIONS TABLE (for separate variation tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    external_id TEXT NOT NULL,
    parent_product_external_id TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'woocommerce',

    -- Basic variation info
    sku TEXT,
    price NUMERIC(10, 2),
    regular_price NUMERIC(10, 2),
    sale_price NUMERIC(10, 2),
    on_sale BOOLEAN DEFAULT FALSE,

    -- Stock
    stock_status TEXT DEFAULT 'instock',
    stock_quantity INTEGER,
    manage_stock BOOLEAN DEFAULT FALSE,

    -- Physical
    weight TEXT,
    dimensions JSONB,

    -- Attributes
    attributes JSONB DEFAULT '[]'::jsonb,
    image JSONB,

    -- Status
    status TEXT DEFAULT 'publish',

    -- Original WooCommerce data
    original_data JSONB,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint
    UNIQUE(store_id, external_id)
);

-- Indexes for product_variations
CREATE INDEX IF NOT EXISTS idx_product_variations_store_id ON product_variations(store_id);
CREATE INDEX IF NOT EXISTS idx_product_variations_parent ON product_variations(parent_product_external_id);
CREATE INDEX IF NOT EXISTS idx_product_variations_sku ON product_variations(sku);

-- Enable RLS on product_variations
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_variations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_variations' AND policyname = 'Users can view variations from their stores') THEN
        CREATE POLICY "Users can view variations from their stores"
            ON product_variations FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM stores
                    WHERE stores.id = product_variations.store_id
                    AND stores.tenant_id = auth.uid()
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_variations' AND policyname = 'Service role can manage all variations') THEN
        CREATE POLICY "Service role can manage all variations"
            ON product_variations FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- ============================================================================
-- UPDATE STORES TABLE FOR COMPLETE CONNECTION TRACKING
-- ============================================================================

-- Add credentials_encrypted if not exists on platform_connections
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'platform_connections' AND column_name = 'credentials_encrypted') THEN
        ALTER TABLE platform_connections ADD COLUMN credentials_encrypted JSONB;
    END IF;
END $$;

-- ============================================================================
-- CREATE INDEX FOR METADATA JSONB QUERIES
-- ============================================================================

-- GIN index for faster JSONB queries on metadata
CREATE INDEX IF NOT EXISTS idx_products_metadata_gin ON products USING gin(metadata);

-- Index for metadata.type field (product type)
CREATE INDEX IF NOT EXISTS idx_products_metadata_type ON products ((metadata->>'type'));

-- Index for metadata.status field
CREATE INDEX IF NOT EXISTS idx_products_metadata_status ON products ((metadata->>'status'));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE product_variations IS 'Product variations synced from WooCommerce (also stored in products.metadata.variants JSONB)';
COMMENT ON COLUMN products.metadata IS 'Complete WooCommerce product data including variants, images, attributes, meta_data (JSONB)';
COMMENT ON COLUMN products.seo_title IS 'SEO title from Yoast/RankMath/AIOSEO';
COMMENT ON COLUMN products.seo_description IS 'SEO meta description from Yoast/RankMath/AIOSEO';
