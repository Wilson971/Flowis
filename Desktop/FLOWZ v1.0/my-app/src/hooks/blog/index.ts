/**
 * Blog Hooks - Central Export
 */

// Article management
export {
  useBlogArticles,
  useBlogStats,
  useCreateBlogArticle,
  useDeleteBlogArticle,
  useBulkDeleteBlogArticles,
  useBulkUpdateStatus,
  blogArticlesKeys,
} from './useBlogArticles';

// Single article
export {
  useBlogArticle,
  useUpdateBlogArticle,
  useAutoSave,
  useDuplicateBlogArticle,
} from './useBlogArticle';

// AI Generation (Flowriter)
export {
  useBlogAI,
  useGenerateTitles,
  useGenerateOutline,
  useGenerateArticle,
  useGenerateMeta,
  useRewriteText,
  useAnalyzeSeo,
  useGenerateBlockContent,
} from './useBlogAI';

// State management
export {
  useFlowriterState,
  type FlowriterActions,
} from './useFlowriterState';

// Backend sync for Flowriter drafts
export {
  useFlowriterSync,
  type FlowriterSyncOptions,
  type FlowriterSyncReturn,
  type AutoDraftData,
} from './useFlowriterSync';

// Article Editor (Standalone)
export { useArticleEditorForm } from './useArticleEditorForm';
export { useAIEditorActions } from './useAIEditorActions';
export { useArticleSync, articleSyncKeys } from './useArticleSync';
