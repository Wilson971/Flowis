/**
 * Blog Types
 *
 * Core types for blog articles and management
 */

// ============================================================================
// ARTICLE STATUS
// ============================================================================

export type ArticleStatus =
  | 'published'
  | 'publish'
  | 'draft'
  | 'auto_draft'  // Flowriter auto-saved draft (not yet manually saved)
  | 'scheduled'
  | 'future'
  | 'ai_generated'
  | 'pending'
  | 'private'
  | 'archived';

// Legacy alias for backward compatibility
export type BlogPostStatus = 'draft' | 'published' | 'archived';

// ============================================================================
// BLOG ARTICLE
// ============================================================================

export interface BlogArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug?: string;
  status: ArticleStatus;
  author?: string;
  author_id?: string;
  category?: string;
  tags: string[];
  featured_image_url?: string;
  cover_image_url?: string;

  // SEO Fields
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  seo_og_image?: string;
  seo_canonical_url?: string;
  seo_schema_type?: string;
  seo_score?: number;

  // WordPress Meta
  format?: string;
  ping_status?: string;
  comment_status?: string;
  sticky?: boolean;
  parent_id?: string;
  menu_order?: number;

  // Metadata
  metadata?: Record<string, unknown>;
  editorial_lock?: EditorialLock;

  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;
  external_updated_at?: string;

  // Relations
  store_id: string;
  archived: boolean;

  // AI Generation Info
  ai_generated?: boolean;
  generation_config?: ArticleConfig;
}

// Legacy alias
export type BlogPost = BlogArticle;

export interface EditorialLock {
  title?: boolean;
  content?: boolean;
  excerpt?: boolean;
}

// ============================================================================
// BLOG COLLECTION
// ============================================================================

export interface Blog {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description?: string;
  external_id?: string;
  platform?: string;
  article_count?: number;
  created_at: string;
  updated_at: string;
  archived: boolean;
}

// ============================================================================
// STATS
// ============================================================================

export interface BlogStats {
  total: number;
  published: number;
  draft: number;
  scheduled: number;
  aiGenerated: number;
  notOptimized: number;
}

// ============================================================================
// FORM DATA
// ============================================================================

export interface BlogFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
  seo_og_image: string;
  seo_canonical_url: string;
  seo_schema_type: string;
  seo_score: number;
  status: ArticleStatus;
  author: string;
  category: string;
  tags: string[];
  featured_image_url: string;
  format: string;
  ping_status: string;
  comment_status: string;
  sticky: boolean;
  parent_id: string;
  menu_order: number;
  published_at?: Date;
}

export interface CreateBlogPostParams {
  title: string;
  slug?: string;
  status?: BlogPostStatus;
  store_id?: string;
}

// ============================================================================
// FILTER & PAGINATION
// ============================================================================

export interface BlogFilters {
  status?: ArticleStatus | 'all';
  category?: string;
  search?: string;
  sortBy?: 'created_at' | 'updated_at' | 'published_at' | 'title' | 'seo_score';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// ============================================================================
// SYNC
// ============================================================================

export interface BlogSyncResult {
  imported: number;
  updated: number;
  failed: number;
  errors?: string[];
}

// ============================================================================
// WOOCOMMERCE PUBLISH
// ============================================================================

export type WCSyncStatus = 'not_synced' | 'synced' | 'pending' | 'failed';

export interface WCCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count?: number;
}

export interface WCTag {
  id: number;
  name: string;
  slug: string;
  count?: number;
}

export interface WCPublishOptions {
  status: 'draft' | 'publish' | 'pending';
  categoryIds: number[];
  tagIds: number[];
  featuredImageUrl?: string;
}

export interface WCPublishResult {
  success: boolean;
  externalId?: string;
  externalUrl?: string;
  error?: string;
}

// ============================================================================
// AI GENERATION CONFIG (Imported from blog-ai)
// ============================================================================

export type ToneType = 'Expert' | 'Narratif' | 'Minimaliste' | 'Inspirant' | 'Conversationnel';
export type StyleType = 'Journalistique' | 'Académique' | 'Blog Lifestyle' | 'Storytelling' | 'Tutorial';
export type PersonaType = 'beginner' | 'intermediate' | 'expert';

export interface ArticleConfig {
  tone: ToneType;
  style: StyleType;
  targetWordCount: number;
  persona?: PersonaType;
  targetKeywords: string[];
  sources: string[];
  language: string;
  includeTableOfContents: boolean;
  includeFAQ: boolean;
}
