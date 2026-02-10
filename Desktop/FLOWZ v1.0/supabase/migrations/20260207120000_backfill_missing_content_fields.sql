-- ============================================================================
-- Migration: Backfill missing fields in working_content and store_snapshot_content
-- Version: 20260207120000
-- Description: Adds 15+ missing fields from metadata to working_content
-- ============================================================================

-- Backfill working_content with all missing fields from metadata
UPDATE products
SET
    working_content = COALESCE(working_content, '{}'::jsonb) || jsonb_build_object(
        -- Identification
        'global_unique_id', COALESCE(metadata->>'global_unique_id', ''),

        -- Pricing (on_sale, sale dates)
        'on_sale', COALESCE((metadata->>'on_sale')::boolean, false),
        'date_on_sale_from', metadata->>'date_on_sale_from',
        'date_on_sale_to', metadata->>'date_on_sale_to',

        -- Stock extended fields
        'backorders', COALESCE(metadata->>'backorders', 'no'),
        'low_stock_amount', metadata->'low_stock_amount',

        -- Type & Status extended
        'featured', COALESCE((metadata->>'featured')::boolean, false),
        'purchasable', COALESCE((metadata->>'purchasable')::boolean, true),
        'sold_individually', COALESCE((metadata->>'sold_individually')::boolean, false),

        -- Shipping extended
        'shipping_class_id', metadata->'shipping_class_id',

        -- Linked products
        'related_ids', COALESCE(metadata->'related_ids', '[]'::jsonb),
        'upsell_ids', COALESCE(metadata->'upsell_ids', '[]'::jsonb),
        'cross_sell_ids', COALESCE(metadata->'cross_sell_ids', '[]'::jsonb),

        -- Reviews
        'reviews_allowed', COALESCE((metadata->>'reviews_allowed')::boolean, true),

        -- Ordering & Display
        'menu_order', COALESCE((metadata->>'menu_order')::integer, 0),

        -- Additional info
        'purchase_note', COALESCE(metadata->>'purchase_note', ''),
        'button_text', COALESCE(metadata->>'button_text', ''),
        'external_url', COALESCE(metadata->>'external_url', ''),
        'total_sales', COALESCE((metadata->>'total_sales')::integer, 0),

        -- Attributes & Variations
        'attributes', COALESCE(metadata->'attributes', '[]'::jsonb),
        'variations', COALESCE(metadata->'variations_detailed', '[]'::jsonb)
    ),

    store_snapshot_content = COALESCE(store_snapshot_content, '{}'::jsonb) || jsonb_build_object(
        -- Identification
        'global_unique_id', COALESCE(metadata->>'global_unique_id', ''),

        -- Pricing (on_sale, sale dates)
        'on_sale', COALESCE((metadata->>'on_sale')::boolean, false),
        'date_on_sale_from', metadata->>'date_on_sale_from',
        'date_on_sale_to', metadata->>'date_on_sale_to',

        -- Stock extended fields
        'backorders', COALESCE(metadata->>'backorders', 'no'),
        'low_stock_amount', metadata->'low_stock_amount',

        -- Type & Status extended
        'featured', COALESCE((metadata->>'featured')::boolean, false),
        'purchasable', COALESCE((metadata->>'purchasable')::boolean, true),
        'sold_individually', COALESCE((metadata->>'sold_individually')::boolean, false),

        -- Shipping extended
        'shipping_class_id', metadata->'shipping_class_id',

        -- Linked products
        'related_ids', COALESCE(metadata->'related_ids', '[]'::jsonb),
        'upsell_ids', COALESCE(metadata->'upsell_ids', '[]'::jsonb),
        'cross_sell_ids', COALESCE(metadata->'cross_sell_ids', '[]'::jsonb),

        -- Reviews
        'reviews_allowed', COALESCE((metadata->>'reviews_allowed')::boolean, true),

        -- Ordering & Display
        'menu_order', COALESCE((metadata->>'menu_order')::integer, 0),

        -- Additional info
        'purchase_note', COALESCE(metadata->>'purchase_note', ''),
        'button_text', COALESCE(metadata->>'button_text', ''),
        'external_url', COALESCE(metadata->>'external_url', ''),
        'total_sales', COALESCE((metadata->>'total_sales')::integer, 0),

        -- Attributes & Variations
        'attributes', COALESCE(metadata->'attributes', '[]'::jsonb),
        'variations', COALESCE(metadata->'variations_detailed', '[]'::jsonb)
    ),

    updated_at = NOW()
WHERE platform = 'woocommerce'
AND metadata IS NOT NULL;

-- Log the migration
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Backfilled % products with missing content fields', updated_count;
END $$;
