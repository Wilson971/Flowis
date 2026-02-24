-- RPC: get_studio_stats
-- Returns exact counts for Photo Studio KPIs (not limited by client page size)
-- Includes total_images = sum of all gallery images across products

CREATE OR REPLACE FUNCTION get_studio_stats(p_store_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total',
      (SELECT COUNT(*) FROM products WHERE store_id = p_store_id),
    'with_images',
      (SELECT COUNT(*) FROM products
       WHERE store_id = p_store_id
         AND (
           image_url IS NOT NULL
           OR jsonb_array_length(COALESCE(metadata->'images', '[]'::jsonb)) > 0
         )),
    'total_images',
      (SELECT COALESCE(SUM(jsonb_array_length(COALESCE(metadata->'images', '[]'::jsonb))), 0)
       FROM products
       WHERE store_id = p_store_id),
    'processed',
      (SELECT COUNT(DISTINCT sj.product_id)
       FROM studio_jobs sj
       JOIN products p ON p.id = sj.product_id
       WHERE p.store_id = p_store_id
         AND sj.status = 'done')
  );
$$;
