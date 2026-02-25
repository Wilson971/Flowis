-- Migration: LinkBuilder - Embeddings & Internal Linking
-- Description: Enables pgvector for semantic search, adds embedding column to blog_articles,
--              creates match_articles RPC for cosine similarity, and article_internal_links table.
-- Version: 20260225100000

-- ============================================================================
-- STEP 1: Enable pgvector extension
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ============================================================================
-- STEP 2: Add embedding column to blog_articles
-- ============================================================================

-- Google text-multilingual-embedding-002 produces 768-dimensional vectors
ALTER TABLE blog_articles
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Index for fast cosine similarity search (IVFFlat for <10K articles, switch to HNSW for >10K)
CREATE INDEX IF NOT EXISTS idx_blog_articles_embedding
ON blog_articles USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Track when the embedding was last computed
ALTER TABLE blog_articles
ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ;

-- ============================================================================
-- STEP 3: match_articles RPC - Cosine similarity search
-- ============================================================================

CREATE OR REPLACE FUNCTION match_articles(
    query_embedding vector(768),
    match_tenant_id UUID,
    match_store_id UUID,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    exclude_article_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    excerpt TEXT,
    status TEXT,
    link TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ba.id,
        ba.title,
        ba.slug,
        ba.excerpt,
        ba.status,
        ba.link,
        1 - (ba.embedding <=> query_embedding) AS similarity
    FROM blog_articles ba
    WHERE ba.tenant_id = match_tenant_id
      AND ba.store_id = match_store_id
      AND ba.archived = false
      AND ba.embedding IS NOT NULL
      AND (exclude_article_id IS NULL OR ba.id != exclude_article_id)
      AND 1 - (ba.embedding <=> query_embedding) > match_threshold
    ORDER BY ba.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION match_articles(vector(768), UUID, UUID, FLOAT, INT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION match_articles(vector(768), UUID, UUID, FLOAT, INT, UUID) TO service_role;

COMMENT ON FUNCTION match_articles IS
'Finds semantically similar articles using cosine similarity on pgvector embeddings.
Returns articles above the similarity threshold, ordered by relevance.
Used by the LinkBuilder feature for internal linking suggestions.';

-- ============================================================================
-- STEP 4: article_internal_links table - Track confirmed internal links
-- ============================================================================

CREATE TABLE IF NOT EXISTS article_internal_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Source article (the one containing the link)
    source_article_id UUID NOT NULL REFERENCES blog_articles(id) ON DELETE CASCADE,

    -- Target article (the one being linked to)
    target_article_id UUID NOT NULL REFERENCES blog_articles(id) ON DELETE CASCADE,

    -- Link metadata
    anchor_text TEXT NOT NULL,
    context_snippet TEXT, -- surrounding text for context
    similarity_score FLOAT, -- score at time of suggestion

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'suggested'
        CHECK (status IN ('suggested', 'accepted', 'rejected', 'inserted')),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate links
    UNIQUE(source_article_id, target_article_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_article_links_source ON article_internal_links(source_article_id);
CREATE INDEX IF NOT EXISTS idx_article_links_target ON article_internal_links(target_article_id);
CREATE INDEX IF NOT EXISTS idx_article_links_tenant ON article_internal_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_article_links_status ON article_internal_links(status);

-- RLS
ALTER TABLE article_internal_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their internal links"
    ON article_internal_links FOR SELECT
    USING (tenant_id = auth.uid());

CREATE POLICY "Users can create internal links"
    ON article_internal_links FOR INSERT
    WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their internal links"
    ON article_internal_links FOR UPDATE
    USING (tenant_id = auth.uid());

CREATE POLICY "Users can delete their internal links"
    ON article_internal_links FOR DELETE
    USING (tenant_id = auth.uid());

COMMENT ON TABLE article_internal_links IS
'Tracks internal links between blog articles, suggested by the LinkBuilder AI feature.
Links flow: suggested → accepted → inserted (into article content).';

-- ============================================================================
-- STEP 5: RPC to get link stats per article
-- ============================================================================

CREATE OR REPLACE FUNCTION get_article_link_stats(p_article_id UUID)
RETURNS TABLE (
    outgoing_links BIGINT,
    incoming_links BIGINT,
    suggested_links BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT count(*) FROM article_internal_links
         WHERE source_article_id = p_article_id AND status = 'inserted'),
        (SELECT count(*) FROM article_internal_links
         WHERE target_article_id = p_article_id AND status = 'inserted'),
        (SELECT count(*) FROM article_internal_links
         WHERE source_article_id = p_article_id AND status = 'suggested');
END;
$$;

GRANT EXECUTE ON FUNCTION get_article_link_stats(UUID) TO authenticated;

COMMENT ON FUNCTION get_article_link_stats IS
'Returns outgoing, incoming, and pending suggestion counts for a given article.
Used by the LinkBuilder panel in the article editor.';
