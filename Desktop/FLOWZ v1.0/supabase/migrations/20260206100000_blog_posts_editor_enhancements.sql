-- Migration: Blog Posts Editor Enhancements
-- Adds columns for: source tracking, version history, WordPress sync, templates, series

-- ======================
-- 1. Source Tracking
-- ======================

-- Track where the article was created from
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'
CHECK (source IN ('manual', 'flowriter', 'import', 'wordpress'));

-- Link to FloWriter session if created via wizard
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS flowriter_session_id UUID;

-- ======================
-- 2. Version History
-- ======================

-- Current version number (increments on significant saves)
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1;

-- ======================
-- 3. WordPress Sync
-- ======================

-- WordPress post ID after sync
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS wordpress_post_id TEXT;

-- Sync status tracking
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS wordpress_sync_status TEXT
CHECK (wordpress_sync_status IN ('draft', 'pending', 'synced', 'failed', 'conflict'));

-- Last successful sync timestamp
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS wordpress_last_synced_at TIMESTAMPTZ;

-- ======================
-- 4. Templates
-- ======================

-- Reference to template used (will reference article_templates table)
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS template_id UUID;

-- ======================
-- 5. Article Series
-- ======================

-- Series identifier for grouped articles
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS series_id UUID;

-- Order within the series
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS series_order INTEGER;

-- ======================
-- 6. Indexes for New Columns
-- ======================

CREATE INDEX IF NOT EXISTS blog_posts_source_idx ON blog_posts(source);
CREATE INDEX IF NOT EXISTS blog_posts_wordpress_post_id_idx ON blog_posts(wordpress_post_id);
CREATE INDEX IF NOT EXISTS blog_posts_series_id_idx ON blog_posts(series_id);
CREATE INDEX IF NOT EXISTS blog_posts_template_id_idx ON blog_posts(template_id);

-- ======================
-- 7. Article Versions Table
-- ======================

CREATE TABLE IF NOT EXISTS article_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,

  -- Snapshot of article content
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  seo_title TEXT,
  seo_description TEXT,
  cover_image_url TEXT,
  tags JSONB DEFAULT '[]'::jsonb,

  -- Version metadata
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('auto_save', 'manual_save', 'publish', 'schedule', 'restore')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique version per article
  UNIQUE(article_id, version_number)
);

-- Indexes for versions
CREATE INDEX IF NOT EXISTS article_versions_article_idx ON article_versions(article_id);
CREATE INDEX IF NOT EXISTS article_versions_created_idx ON article_versions(created_at DESC);

-- RLS for versions
ALTER TABLE article_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their article versions" ON article_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = article_versions.article_id
      AND blog_posts.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions for their articles" ON article_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = article_versions.article_id
      AND blog_posts.author_id = auth.uid()
    )
  );

-- ======================
-- 8. Article Templates Table
-- ======================

CREATE TABLE IF NOT EXISTS article_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,

  -- Template structure
  structure JSONB NOT NULL DEFAULT '{"sections": []}'::jsonb,
  content_template TEXT, -- HTML with placeholders like {{title}}, {{intro}}
  seo_template JSONB DEFAULT '{}'::jsonb,

  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS article_templates_user_idx ON article_templates(user_id);
CREATE INDEX IF NOT EXISTS article_templates_category_idx ON article_templates(category);

-- RLS
ALTER TABLE article_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their templates" ON article_templates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create templates" ON article_templates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their templates" ON article_templates
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their templates" ON article_templates
  FOR DELETE USING (user_id = auth.uid());

-- ======================
-- 9. Article Schedules Table
-- ======================

CREATE TABLE IF NOT EXISTS article_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,

  -- Schedule configuration
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('publish', 'republish', 'unpublish', 'series')),
  scheduled_at TIMESTAMPTZ NOT NULL,

  -- Execution tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  executed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Options
  platforms TEXT[] DEFAULT ARRAY['flowz'],
  options JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS article_schedules_pending_idx
  ON article_schedules(scheduled_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS article_schedules_article_idx ON article_schedules(article_id);

-- RLS
ALTER TABLE article_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their schedules" ON article_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = article_schedules.article_id
      AND blog_posts.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can create schedules" ON article_schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = article_schedules.article_id
      AND blog_posts.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their schedules" ON article_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = article_schedules.article_id
      AND blog_posts.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their schedules" ON article_schedules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = article_schedules.article_id
      AND blog_posts.author_id = auth.uid()
    )
  );

-- ======================
-- 10. WordPress Sync Config Table
-- ======================

CREATE TABLE IF NOT EXISTS wordpress_sync_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- WordPress site info
  site_name TEXT NOT NULL,
  wp_site_url TEXT NOT NULL,

  -- Credentials (app password)
  wp_username TEXT NOT NULL,
  wp_app_password TEXT NOT NULL, -- Should be encrypted in production

  -- Default settings
  default_status TEXT DEFAULT 'draft' CHECK (default_status IN ('draft', 'publish', 'pending')),
  default_category_id INTEGER,
  sync_featured_images BOOLEAN DEFAULT true,
  sync_categories BOOLEAN DEFAULT true,
  sync_tags BOOLEAN DEFAULT true,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One config per user for now
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE wordpress_sync_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their WP config" ON wordpress_sync_configs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their WP config" ON wordpress_sync_configs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their WP config" ON wordpress_sync_configs
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their WP config" ON wordpress_sync_configs
  FOR DELETE USING (user_id = auth.uid());

-- ======================
-- 11. Article Series Table
-- ======================

CREATE TABLE IF NOT EXISTS article_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Series info
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,

  -- Settings
  auto_schedule BOOLEAN DEFAULT false,
  schedule_interval_days INTEGER DEFAULT 7,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK to blog_posts
ALTER TABLE blog_posts
ADD CONSTRAINT blog_posts_series_fk
FOREIGN KEY (series_id) REFERENCES article_series(id) ON DELETE SET NULL;

ALTER TABLE blog_posts
ADD CONSTRAINT blog_posts_template_fk
FOREIGN KEY (template_id) REFERENCES article_templates(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE article_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their series" ON article_series
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create series" ON article_series
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their series" ON article_series
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their series" ON article_series
  FOR DELETE USING (user_id = auth.uid());

-- Index
CREATE INDEX IF NOT EXISTS article_series_user_idx ON article_series(user_id);

-- ======================
-- Done!
-- ======================
COMMENT ON TABLE article_versions IS 'Stores version history snapshots for blog posts';
COMMENT ON TABLE article_templates IS 'User-created article templates for quick article creation';
COMMENT ON TABLE article_schedules IS 'Scheduled publishing actions (publish, republish, series)';
COMMENT ON TABLE wordpress_sync_configs IS 'WordPress blog connection credentials and settings';
COMMENT ON TABLE article_series IS 'Groups of related articles published in sequence';
