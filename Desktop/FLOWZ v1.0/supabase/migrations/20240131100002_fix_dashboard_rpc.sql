-- Correction de la fonction RPC : products.sync_status n'existe pas
-- Remplacement par la détection des champs "dirty" (modifiés mais non synchronisés)

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_store_id uuid DEFAULT NULL)
RETURNS TABLE (
    total_products BIGINT,
    total_categories BIGINT,
    total_blog_posts BIGINT,
    analyzed_products_count BIGINT,
    seo_avg_score NUMERIC,
    last_sync_date TIMESTAMP WITH TIME ZONE,
    products_with_errors BIGINT,
    published_blog_posts BIGINT,
    draft_blog_posts BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Compte total des produits
        (SELECT count(*) FROM products p WHERE (p_store_id IS NULL OR p.store_id = p_store_id)),
        
        -- Compte total des catégories
        (SELECT count(*) FROM categories c WHERE (p_store_id IS NULL OR c.store_id = p_store_id)),
        
        -- Compte total des articles de blog
        (SELECT count(*) FROM blog_posts b WHERE (p_store_id IS NULL OR b.store_id = p_store_id)),
        
        -- Produits analysés SEO
        (SELECT count(*) 
         FROM product_seo_analysis psa 
         JOIN products p ON p.id = psa.product_id 
         WHERE (p_store_id IS NULL OR p.store_id = p_store_id)),
         
        -- Score SEO moyen
        (SELECT COALESCE(AVG(overall_score), 0) 
         FROM product_seo_analysis psa 
         JOIN products p ON p.id = psa.product_id 
         WHERE (p_store_id IS NULL OR p.store_id = p_store_id)),
         
        -- Date de dernière synchro
        (SELECT created_at 
         FROM sync_jobs sj 
         WHERE (p_store_id IS NULL OR sj.store_id = p_store_id) 
         ORDER BY created_at DESC LIMIT 1),
         
        -- Produits non synchronisés (dirty fields) - Remplace sync_status qui n'existe pas
        (SELECT count(*) 
         FROM products p 
         WHERE (p_store_id IS NULL OR p.store_id = p_store_id) 
         AND p.dirty_fields_content IS NOT NULL 
         AND array_length(p.dirty_fields_content, 1) > 0),
         
        -- Articles publiés
        (SELECT count(*) 
         FROM blog_posts b 
         WHERE (p_store_id IS NULL OR b.store_id = p_store_id) 
         AND b.status = 'published'),
         
        -- Articles brouillons
        (SELECT count(*) 
         FROM blog_posts b 
         WHERE (p_store_id IS NULL OR b.store_id = p_store_id) 
         AND b.status = 'draft');
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(uuid) TO service_role;
