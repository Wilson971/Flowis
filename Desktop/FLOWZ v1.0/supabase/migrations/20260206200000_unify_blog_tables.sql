-- Migration: Unify Blog Tables
-- Description: Migrates data from 'articles' (sync target) to 'blog_articles' (unified table)
-- This allows the dashboard and app to show ALL articles (synced + created)
-- Version: 20260206200000

-- ============================================================================
-- STEP 1: Migrate existing articles from 'articles' to 'blog_articles'
-- ============================================================================

-- Insert articles from WordPress sync that don't already exist in blog_articles
INSERT INTO blog_articles (
    store_id,
    tenant_id,
    title,
    slug,
    excerpt,
    content,
    status,
    featured_image_url,
    wordpress_post_id,
    published_at,
    created_at,
    updated_at,
    metadata,
    link,
    date_gmt,
    modified_gmt,
    archived,
    post_type,
    -- SEO fields from seo_data jsonb
    seo_title,
    seo_description
)
SELECT
    a.store_id,
    -- Get tenant_id from the store
    s.tenant_id,
    a.title,
    a.slug,
    a.excerpt,
    a.content,
    a.status,
    a.featured_image,
    a.platform_post_id,
    a.published_at,
    a.created_at,
    a.updated_at,
    -- Merge custom_fields and taxonomies into metadata
    jsonb_build_object(
        'source', 'wordpress_sync',
        'original_id', a.id,
        'custom_fields', COALESCE(a.custom_fields, '{}'::jsonb),
        'taxonomies', COALESCE(a.taxonomies, '{}'::jsonb),
        'author_data', COALESCE(a.author, '{}'::jsonb),
        'last_synced_at', a.last_synced_at
    ),
    -- Extract link from custom_fields if available
    a.custom_fields->>'link',
    -- date_gmt from custom_fields
    (a.custom_fields->>'date_gmt')::timestamptz,
    -- modified_gmt from custom_fields
    (a.custom_fields->>'modified_gmt')::timestamptz,
    false, -- not archived
    COALESCE(a.custom_fields->>'type', 'post'),
    -- SEO fields
    COALESCE(a.seo_data->>'title', ''),
    COALESCE(a.seo_data->>'description', '')
FROM articles a
JOIN stores s ON s.id = a.store_id
WHERE NOT EXISTS (
    SELECT 1 FROM blog_articles ba
    WHERE ba.store_id = a.store_id
    AND ba.wordpress_post_id = a.platform_post_id
);

-- Log the migration
DO $$
DECLARE
    migrated_count INT;
BEGIN
    SELECT COUNT(*) INTO migrated_count
    FROM blog_articles
    WHERE metadata->>'source' = 'wordpress_sync';

    RAISE NOTICE 'Migrated % articles from articles table to blog_articles', migrated_count;
END $$;

-- ============================================================================
-- STEP 2: Add unique constraint to prevent duplicates on future syncs
-- ============================================================================

-- Create unique index for wordpress synced articles (only when wordpress_post_id is not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_articles_store_wp_id
ON blog_articles (store_id, wordpress_post_id)
WHERE wordpress_post_id IS NOT NULL;

-- ============================================================================
-- STEP 3: Update get_dashboard_stats to count from unified blog_articles
-- (Already done in previous migration - this confirms it's correct)
-- ============================================================================

-- The get_dashboard_stats RPC already uses blog_articles table
-- This migration ensures all WordPress posts are now in that table

-- ============================================================================
-- STEP 4: Create view for backward compatibility (optional)
-- ============================================================================

-- Create a view that matches the old articles table structure for any legacy code
CREATE OR REPLACE VIEW articles_compat AS
SELECT
    id,
    store_id,
    COALESCE(wordpress_post_id, id::text) as platform_post_id,
    title,
    slug,
    excerpt,
    content,
    featured_image_url as featured_image,
    status,
    jsonb_build_object(
        'title', seo_title,
        'description', seo_description
    ) as seo_data,
    jsonb_build_object(
        'categories', COALESCE(metadata->'taxonomies'->'categories', '[]'::jsonb),
        'tags', COALESCE(metadata->'taxonomies'->'tags', '[]'::jsonb)
    ) as taxonomies,
    COALESCE(metadata->'custom_fields', '{}'::jsonb) as custom_fields,
    COALESCE(metadata->'author_data', '{}'::jsonb) as author,
    published_at,
    (metadata->>'last_synced_at')::timestamptz as last_synced_at,
    created_at,
    updated_at
FROM blog_articles
WHERE archived = false;

-- Grant permissions on the view
GRANT SELECT ON articles_compat TO authenticated;
GRANT SELECT ON articles_compat TO service_role;

-- ============================================================================
-- STEP 5: Add comment for documentation
-- ============================================================================

COMMENT ON TABLE blog_articles IS
'Unified blog articles table. Contains both:
- Articles created in the app (FloWriter, manual)
- Articles synced from WordPress (identified by wordpress_post_id)
Migration 20260206200000 unified the articles table into this one.';

