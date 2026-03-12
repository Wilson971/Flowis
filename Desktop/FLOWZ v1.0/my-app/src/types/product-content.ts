/**
 * Re-export bridge — prefer importing from '@/types/product' or '@/types/productContent' directly.
 * @deprecated Import from '@/types/product' or '@/types/productContent' instead.
 */

export type { ProductMetadata } from './product';
export type { ContentData, SeoData, ImageItem } from './productContent';

// Article types moved to '@/types/article'
export type {
    ArticleCustomFields,
    ArticleSeoData,
    ArticleTaxonomies,
    ArticleAuthor,
    BlogArticleSyncFields,
} from './article';

/** @deprecated Use ProductMetadata from '@/types/product' */
export type { ProductMetadata as WooMetadata } from './product';
/** @deprecated Use ContentData from '@/types/productContent' */
export type { ContentData as WorkingContent } from './productContent';
/** @deprecated Use SeoData from '@/types/productContent' */
export type { SeoData as SeoContent } from './productContent';
/** @deprecated Use ContentData from '@/types/productContent' */
export type { ContentData as DraftGeneratedContent } from './productContent';
