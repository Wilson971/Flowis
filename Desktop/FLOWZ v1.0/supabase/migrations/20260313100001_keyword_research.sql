-- ============================================================================
-- Keyword Research: cache + saved keywords
-- ============================================================================

-- Cache table for DataForSEO results (24h TTL)
CREATE TABLE IF NOT EXISTS keyword_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seed_keyword text NOT NULL,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  related_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  language text NOT NULL DEFAULT 'fr',
  location_code int NOT NULL DEFAULT 2250,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Saved/bookmarked keywords
CREATE TABLE IF NOT EXISTS saved_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  search_volume int,
  keyword_difficulty numeric(5,2),
  cpc numeric(10,4),
  intent text CHECK (intent IN ('informational', 'navigational', 'commercial', 'transactional')),
  source text,
  product_id uuid,
  article_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, keyword)
);

-- Indexes
CREATE INDEX idx_keyword_research_tenant ON keyword_research(tenant_id);
CREATE INDEX idx_keyword_research_seed ON keyword_research(tenant_id, seed_keyword, language, location_code);
CREATE INDEX idx_saved_keywords_tenant ON saved_keywords(tenant_id);

-- RLS
ALTER TABLE keyword_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "keyword_research_tenant" ON keyword_research
  FOR ALL USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "saved_keywords_tenant" ON saved_keywords
  FOR ALL USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());
