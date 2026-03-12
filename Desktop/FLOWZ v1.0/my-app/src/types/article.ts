/**
 * WordPress sync metadata types for BlogArticle rows.
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
