/**
 * Products Hooks - Export centralisé
 */

// ============================================================================
// CONTENT & EDITING
// ============================================================================
export {
    useProductContent,
    useUpdateWorkingContent,
    useAcceptDraft,
    useRejectDraft,
    useDirtyFields,
} from './useProductContent';

export {
    useProductSave,
    type ProductSavePayload,
} from './useProductSave';

export { useAutoSaveProduct } from './useAutoSaveProduct';

export { useQuickUpdateProduct } from './useQuickUpdateProduct';

// ============================================================================
// VARIATIONS
// ============================================================================
export {
    useProductVariations,
    useUpdateVariation,
    useSyncProductVariations,
    useDirtyVariationsCount,
    type ProductVariation,
    type AppVariation,
    type VariationAttribute,
    type VariationImage,
} from './useProductVariations';

// ============================================================================
// CATEGORIES
// ============================================================================
export {
    useCategories,
    useCategoryTree,
    useCategory,
    useCategoryStats,
    useProductCategories,
    useUpdateProductCategories,
    useSyncCategories,
    type Category,
    type CategoryTree,
} from './useProductCategories';

// ============================================================================
// PUSH TO STORE (consolidated in hooks/sync/usePushToStore)
// ============================================================================
export {
    usePushToStore,
    usePushProductBatch,
    usePushSingleProduct,
    usePushProductToStore,
    usePushArticleToStore,
    useUnsyncedProducts,
    useCancelProductSync,
    useRevertToOriginal,
    useAutoSync,
    type PushResult,
    type PushResponse,
    type PushType,
} from '../sync/usePushToStore';

// ============================================================================
// SEO ANALYSIS
// ============================================================================
export {
    useProductSeoScore,
    useSeoStats,
    getSeoStatus,
    getSeoColor,
    getSeoLabel,
    type SeoStatus,
} from './useSeoAnalysis';

// ============================================================================
// CONFLICT DETECTION
// ============================================================================
export {
    useConflictDetection,
    useResolveConflicts,
    useForceStoreContent,
    type ContentConflict,
    type ConflictResolution,
    type ConflictDetectionResult,
} from './useConflictDetection';

// ============================================================================
// SYNC HISTORY
// ============================================================================
export {
    useSyncHistory,
    type SyncHistoryEntry,
} from './useSyncHistory';

// ============================================================================
// BATCH GENERATION
// ============================================================================
export { useBatchGeneration } from './useBatchGeneration';

export {
    useBatchProgress,
    useBatchJobs,
    useCancelBatchJob,
    useRetryBatchJob,
    useBatchJobRealtime,
    type BatchJob,
    type BatchJobItem,
} from './useBatchProgress';

// ============================================================================
// PRODUCTS CRUD & LISTING
// ============================================================================
export {
    useProducts,
    useProduct,
    useProductStats,
    useBatchJobItems,
    useBatchGenerationMutation,
} from './useProducts';

// ============================================================================
// DIRTY FIELDS UTILITY
// ============================================================================
export { computeDirtyFields } from './computeDirtyFields';

// ============================================================================
// TABLE & SEO UTILITIES
// ============================================================================
export { useTableFilters } from './useTableFilters';
export { useSerpAnalysisByProduct } from './useSerpAnalysis';
export { useProductSerpStatus } from './useProductSerpStatus';
export { useProductSeoStatus } from './useProductSeoStatus';
export { useSeoGlobalScore } from './useSeoGlobalScore';
