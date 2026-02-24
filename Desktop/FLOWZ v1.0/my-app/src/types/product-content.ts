/**
 * Product Content Types
 *
 * Typed interfaces for JSONB fields (metadata, working_content, draft_generated_content)
 * to eliminate `as any` type assertions throughout the codebase.
 *
 * NOTE: The canonical ContentData interface lives in ./productContent.ts.
 * This file provides supplementary types for metadata access patterns
 * and re-exports for convenience.
 */

import type { ProductMetadata } from './product';
import type { ContentData, SeoData, ImageItem } from './productContent';

// Re-export for convenience
export type { ProductMetadata, ContentData, SeoData, ImageItem };

/** Metadata from WooCommerce (raw JSONB) — alias for ProductMetadata */
export type WooMetadata = ProductMetadata;

/** Working content (editable copy) — alias for ContentData */
export type WorkingContent = ContentData;

/** SEO fields — alias for SeoData */
export type SeoContent = SeoData;

/** Draft generated content (AI output) — alias for ContentData */
export type DraftGeneratedContent = ContentData;

/**
 * WordPress sync metadata attached to BlogArticle rows.
 * These fields come from the WordPress REST API and are stored
 * in JSONB columns (custom_fields, seo_data, taxonomies, author).
 */
export interface ArticleCustomFields {
    id?: number;
    link?: string;
    comment_status?: string;
    ping_status?: string;
    sticky?: boolean;
    format?: string;
    template?: string;
    _embedded?: {
        'wp:featuredmedia'?: Array<{ alt_text?: string; source_url?: string }>;
        author?: Array<{ id?: number; name?: string }>;
    };
    [key: string]: unknown;
}

export interface ArticleSeoData {
    title?: string;
    description?: string;
    og_image?: string;
    canonical?: string;
    robots?: {
        index?: string;
        follow?: string;
    };
    [key: string]: unknown;
}

export interface ArticleTaxonomies {
    categories?: Array<{ id?: number; name: string; slug?: string }>;
    tags?: Array<{ id?: number; name: string; slug?: string }>;
    [key: string]: unknown;
}

export interface ArticleAuthor {
    id?: number;
    name?: string;
    [key: string]: unknown;
}

/**
 * Extended BlogArticle fields from WordPress sync.
 * These are present on DB rows but not in the base BlogArticle interface.
 */
export interface BlogArticleSyncFields {
    custom_fields?: ArticleCustomFields;
    seo_data?: ArticleSeoData;
    taxonomies?: ArticleTaxonomies;
    author?: ArticleAuthor;
    featured_image?: string;
    featured_image_alt?: string;
    platform_post_id?: string;
}
