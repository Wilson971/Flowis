-- Migration complète : Création des tables manquantes et de la fonction RPC

-- 1. Création de la table blog_posts si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT,
    excerpt TEXT,
    status TEXT DEFAULT 'draft', -- 'published', 'draft'
    author_id UUID REFERENCES auth.users(id),
    store_id UUID, -- Référence optionnelle au store si multi-boutiques
    featured_image_url TEXT
);

-- Index pour la recherche rapide par store
CREATE INDEX IF NOT EXISTS idx_blog_posts_store_id ON public.blog_posts(store_id);

-- 2. Création de la table product_seo_analysis si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.product_seo_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    overall_score NUMERIC DEFAULT 0,
    title_score NUMERIC,
    description_score NUMERIC,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    issues JSONB DEFAULT '[]'::jsonb,
    recommendations TEXT[]
);

-- Index pour les jointures
CREATE INDEX IF NOT EXISTS idx_product_seo_analysis_product_id ON public.product_seo_analysis(product_id);

-- 3. Fonction RPC pour dashboard stats (Mise à jour)
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
         
        -- Produits avec erreurs
        (SELECT count(*) 
         FROM products p 
         WHERE (p_store_id IS NULL OR p.store_id = p_store_id) 
         AND p.sync_status = 'error'),
         
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
