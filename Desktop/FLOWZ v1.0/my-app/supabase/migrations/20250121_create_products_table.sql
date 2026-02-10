-- Create products table
-- Manages products imported from e-commerce platforms

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Basic product info
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  platform_product_id TEXT NOT NULL,
  image_url TEXT,
  price NUMERIC(10, 2),
  stock INTEGER DEFAULT 0,
  sku TEXT,
  product_type TEXT,

  -- Timestamps
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Metadata and content
  metadata JSONB DEFAULT '{}'::jsonb,
  draft_generated_content JSONB,
  working_content JSONB DEFAULT '{}'::jsonb,

  -- Content management
  dirty_fields_content TEXT[] DEFAULT ARRAY[]::TEXT[],
  editorial_lock JSONB DEFAULT '{}'::jsonb,
  ai_enhanced BOOLEAN DEFAULT FALSE,

  -- Sync status
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_source TEXT CHECK (sync_source IN ('webhook', 'push', 'manual')),
  sync_conflict_count INTEGER DEFAULT 0,

  -- Ensure unique products per store
  UNIQUE(store_id, platform_product_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_platform_product_id ON products(platform_product_id);
CREATE INDEX IF NOT EXISTS idx_products_ai_enhanced ON products(ai_enhanced);
CREATE INDEX IF NOT EXISTS idx_products_imported_at ON products(imported_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_title_search ON products USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_products_draft_content ON products(draft_generated_content) WHERE draft_generated_content IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_dirty_fields ON products USING gin(dirty_fields_content);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can only access products from their stores)
CREATE POLICY "Users can view products from their stores"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert products to their stores"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update products in their stores"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete products from their stores"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE products IS 'Products imported from e-commerce platforms';
COMMENT ON COLUMN products.draft_generated_content IS 'AI-generated content pending approval';
COMMENT ON COLUMN products.working_content IS 'Current active content for the product';
COMMENT ON COLUMN products.dirty_fields_content IS 'Fields that have been modified but not synced';
COMMENT ON COLUMN products.editorial_lock IS 'Fields locked from AI modification';
