-- ============================================================
-- CRITICAL RLS FIX MIGRATION
-- Date: 2026-02-22
-- Fixes: Missing RLS on core tables, weak policies, SECURITY DEFINER leaks
-- ============================================================

-- ============================================================
-- 1. Enable RLS on tables missing it
-- ============================================================

ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blog_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_seo_analysis ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Add tenant isolation policies for products
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'tenant_isolation_select') THEN
    CREATE POLICY tenant_isolation_select ON public.products FOR SELECT USING (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'tenant_isolation_insert') THEN
    CREATE POLICY tenant_isolation_insert ON public.products FOR INSERT WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'tenant_isolation_update') THEN
    CREATE POLICY tenant_isolation_update ON public.products FOR UPDATE USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'tenant_isolation_delete') THEN
    CREATE POLICY tenant_isolation_delete ON public.products FOR DELETE USING (tenant_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 3. Add tenant isolation policies for blog_articles
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_articles' AND policyname = 'tenant_isolation_select') THEN
    CREATE POLICY tenant_isolation_select ON public.blog_articles FOR SELECT USING (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_articles' AND policyname = 'tenant_isolation_insert') THEN
    CREATE POLICY tenant_isolation_insert ON public.blog_articles FOR INSERT WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_articles' AND policyname = 'tenant_isolation_update') THEN
    CREATE POLICY tenant_isolation_update ON public.blog_articles FOR UPDATE USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_articles' AND policyname = 'tenant_isolation_delete') THEN
    CREATE POLICY tenant_isolation_delete ON public.blog_articles FOR DELETE USING (tenant_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 4. Add store-based isolation for categories
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'tenant_isolation_select') THEN
    CREATE POLICY tenant_isolation_select ON public.categories FOR SELECT
      USING (store_id IN (SELECT id FROM public.stores WHERE tenant_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'tenant_isolation_insert') THEN
    CREATE POLICY tenant_isolation_insert ON public.categories FOR INSERT
      WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE tenant_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'tenant_isolation_update') THEN
    CREATE POLICY tenant_isolation_update ON public.categories FOR UPDATE
      USING (store_id IN (SELECT id FROM public.stores WHERE tenant_id = auth.uid()))
      WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE tenant_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'tenant_isolation_delete') THEN
    CREATE POLICY tenant_isolation_delete ON public.categories FOR DELETE
      USING (store_id IN (SELECT id FROM public.stores WHERE tenant_id = auth.uid()));
  END IF;
END $$;

-- ============================================================
-- 5. Add store-based isolation for platform_connections
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_connections' AND policyname = 'tenant_isolation_select') THEN
    CREATE POLICY tenant_isolation_select ON public.platform_connections FOR SELECT
      USING (store_id IN (SELECT id FROM public.stores WHERE tenant_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_connections' AND policyname = 'tenant_isolation_insert') THEN
    CREATE POLICY tenant_isolation_insert ON public.platform_connections FOR INSERT
      WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE tenant_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_connections' AND policyname = 'tenant_isolation_update') THEN
    CREATE POLICY tenant_isolation_update ON public.platform_connections FOR UPDATE
      USING (store_id IN (SELECT id FROM public.stores WHERE tenant_id = auth.uid()))
      WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE tenant_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_connections' AND policyname = 'tenant_isolation_delete') THEN
    CREATE POLICY tenant_isolation_delete ON public.platform_connections FOR DELETE
      USING (store_id IN (SELECT id FROM public.stores WHERE tenant_id = auth.uid()));
  END IF;
END $$;

-- ============================================================
-- 6. Add product-based isolation for product_seo_analysis
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_seo_analysis' AND policyname = 'tenant_isolation_select') THEN
    CREATE POLICY tenant_isolation_select ON public.product_seo_analysis FOR SELECT
      USING (product_id IN (SELECT id FROM public.products WHERE tenant_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_seo_analysis' AND policyname = 'tenant_isolation_insert') THEN
    CREATE POLICY tenant_isolation_insert ON public.product_seo_analysis FOR INSERT
      WITH CHECK (product_id IN (SELECT id FROM public.products WHERE tenant_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_seo_analysis' AND policyname = 'tenant_isolation_update') THEN
    CREATE POLICY tenant_isolation_update ON public.product_seo_analysis FOR UPDATE
      USING (product_id IN (SELECT id FROM public.products WHERE tenant_id = auth.uid()))
      WITH CHECK (product_id IN (SELECT id FROM public.products WHERE tenant_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_seo_analysis' AND policyname = 'tenant_isolation_delete') THEN
    CREATE POLICY tenant_isolation_delete ON public.product_seo_analysis FOR DELETE
      USING (product_id IN (SELECT id FROM public.products WHERE tenant_id = auth.uid()));
  END IF;
END $$;

-- ============================================================
-- 7. Fix weak product_categories policies (auth.role() only → tenant-based)
-- ============================================================

DROP POLICY IF EXISTS "Allow authenticated select" ON public.product_categories;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.product_categories;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.product_categories;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.product_categories;
DROP POLICY IF EXISTS "Authenticated users can read" ON public.product_categories;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.product_categories;
DROP POLICY IF EXISTS "Authenticated users can update" ON public.product_categories;
DROP POLICY IF EXISTS "Authenticated users can delete" ON public.product_categories;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_categories' AND policyname = 'tenant_isolation_select') THEN
    CREATE POLICY tenant_isolation_select ON public.product_categories FOR SELECT
      USING (store_id IN (SELECT id FROM public.stores WHERE tenant_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_categories' AND policyname = 'tenant_isolation_insert') THEN
    CREATE POLICY tenant_isolation_insert ON public.product_categories FOR INSERT
      WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE tenant_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_categories' AND policyname = 'tenant_isolation_update') THEN
    CREATE POLICY tenant_isolation_update ON public.product_categories FOR UPDATE
      USING (store_id IN (SELECT id FROM public.stores WHERE tenant_id = auth.uid()))
      WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE tenant_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_categories' AND policyname = 'tenant_isolation_delete') THEN
    CREATE POLICY tenant_isolation_delete ON public.product_categories FOR DELETE
      USING (store_id IN (SELECT id FROM public.stores WHERE tenant_id = auth.uid()));
  END IF;
END $$;

-- ============================================================
-- 8. Fix weak blog_posts policies (auth.role() only → tenant-based)
-- ============================================================

DROP POLICY IF EXISTS "Allow authenticated select" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can read" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can update" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can delete" ON public.blog_posts;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_posts' AND policyname = 'tenant_isolation_select') THEN
    CREATE POLICY tenant_isolation_select ON public.blog_posts FOR SELECT USING (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_posts' AND policyname = 'tenant_isolation_insert') THEN
    CREATE POLICY tenant_isolation_insert ON public.blog_posts FOR INSERT WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_posts' AND policyname = 'tenant_isolation_update') THEN
    CREATE POLICY tenant_isolation_update ON public.blog_posts FOR UPDATE USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blog_posts' AND policyname = 'tenant_isolation_delete') THEN
    CREATE POLICY tenant_isolation_delete ON public.blog_posts FOR DELETE USING (tenant_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 9. Fix ai_usage INSERT policy (WITH CHECK (true) → tenant check)
-- ============================================================

DROP POLICY IF EXISTS "Service role insert ai_usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users insert own ai_usage" ON public.ai_usage;

CREATE POLICY "Users insert own ai_usage" ON public.ai_usage
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- ============================================================
-- 10. Fix get_ai_credits_used — remove p_tenant_id, use auth.uid()
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_ai_credits_used(p_month TEXT)
RETURNS INT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(SUM(tokens_input + tokens_output), 0)::INT
  FROM public.ai_usage
  WHERE tenant_id = auth.uid() AND month = p_month;
$$;

-- ============================================================
-- 11. Add missing indexes for RLS performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_blog_articles_tenant_id ON public.blog_articles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tenant_id ON public.blog_posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON public.categories(store_id);
CREATE INDEX IF NOT EXISTS idx_platform_connections_store_id ON public.platform_connections(store_id);
