-- Fonction pour récupérer les statistiques globales du dashboard filtrées par boutique
-- Cette fonction remplace les données mockées du frontend

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
        (SELECT count(*) FROM products p WHERE (p_store_id IS NULL OR p.store_id = p_store_id)),
        (SELECT count(*) FROM categories c WHERE (p_store_id IS NULL OR c.store_id = p_store_id)),
        (SELECT count(*) FROM blog_posts b WHERE (p_store_id IS NULL OR b.store_id = p_store_id)),
        (SELECT count(*) FROM product_seo_analysis psa JOIN products p ON p.id = psa.product_id WHERE (p_store_id IS NULL OR p.store_id = p_store_id)),
        (SELECT COALESCE(AVG(overall_score), 0) FROM product_seo_analysis psa JOIN products p ON p.id = psa.product_id WHERE (p_store_id IS NULL OR p.store_id = p_store_id)),
        (SELECT created_at FROM sync_jobs sj WHERE (p_store_id IS NULL OR sj.store_id = p_store_id) ORDER BY created_at DESC LIMIT 1),
        (SELECT count(*) FROM products p WHERE (p_store_id IS NULL OR p.store_id = p_store_id) AND p.sync_status = 'error'),
        (SELECT count(*) FROM blog_posts b WHERE (p_store_id IS NULL OR b.store_id = p_store_id) AND b.status = 'published'),
        (SELECT count(*) FROM blog_posts b WHERE (p_store_id IS NULL OR b.store_id = p_store_id) AND b.status = 'draft');
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(uuid) TO service_role;

COMMENT ON FUNCTION public.get_dashboard_stats IS 'Returns aggregated dashboard stats filtered by optional store_id';
