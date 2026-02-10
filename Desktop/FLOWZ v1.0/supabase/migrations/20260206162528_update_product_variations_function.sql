-- Function to update product variations in metadata JSONB
CREATE OR REPLACE FUNCTION update_product_variations(
    p_store_id UUID,
    p_platform_product_id TEXT,
    p_variations JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE products
    SET
        metadata = jsonb_set(
            jsonb_set(
                COALESCE(metadata, '{}'::jsonb),
                '{variations_detailed}',
                COALESCE(p_variations, '[]'::jsonb)
            ),
            '{variants}',
            COALESCE(p_variations, '[]'::jsonb)
        ),
        updated_at = NOW()
    WHERE store_id = p_store_id
      AND platform_product_id = p_platform_product_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION update_product_variations TO authenticated;
GRANT EXECUTE ON FUNCTION update_product_variations TO service_role;
