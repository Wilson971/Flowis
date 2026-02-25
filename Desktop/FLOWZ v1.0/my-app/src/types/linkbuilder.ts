/**
 * LinkBuilder Types
 *
 * Types for internal linking suggestions powered by semantic embeddings.
 */

// ============================================================================
// LINK SUGGESTION
// ============================================================================

export interface LinkSuggestion {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: string;
  link: string | null;
  similarity: number;
}

// ============================================================================
// INTERNAL LINK RECORD
// ============================================================================

export type InternalLinkStatus = 'suggested' | 'accepted' | 'rejected' | 'inserted';

export interface InternalLink {
  id: string;
  tenant_id: string;
  source_article_id: string;
  target_article_id: string;
  anchor_text: string;
  context_snippet: string | null;
  similarity_score: number | null;
  status: InternalLinkStatus;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// LINK STATS
// ============================================================================

export interface ArticleLinkStats {
  outgoing_links: number;
  incoming_links: number;
  suggested_links: number;
}

// ============================================================================
// API REQUEST / RESPONSE
// ============================================================================

export interface EmbedArticleRequest {
  article_id: string;
}

export interface EmbedArticleResponse {
  success: boolean;
  article_id: string;
  embedding_updated_at: string;
}

export interface SuggestLinksRequest {
  article_id: string;
  store_id: string;
  threshold?: number;
  max_results?: number;
}

export interface SuggestLinksResponse {
  suggestions: LinkSuggestion[];
  source_article: {
    id: string;
    title: string;
    has_embedding: boolean;
  };
}

export interface SaveLinkRequest {
  source_article_id: string;
  target_article_id: string;
  anchor_text: string;
  context_snippet?: string;
  similarity_score?: number;
  status: InternalLinkStatus;
}

export interface BulkEmbedRequest {
  store_id: string;
}

export interface BulkEmbedResponse {
  success: boolean;
  total: number;
  embedded: number;
  failed: number;
  errors?: string[];
}
