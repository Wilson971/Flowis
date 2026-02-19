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
    useAutoSaveProduct,
    type ProductSavePayload,
} from './useProductSave';

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
// PUSH TO STORE
// ============================================================================
export {
    usePushToStore,
    usePushSingleProduct,
    useUnsyncedProducts,
    useCancelProductSync,
    useRevertToOriginal,
    type PushResult,
    type PushResponse,
} from './usePushToStore';

// ============================================================================
// SEO ANALYSIS
// ============================================================================
export {
    useSeoAnalysis,
    getSeoStatus,
    getSeoColor,
    getSeoLabel,
    type SeoAnalysis,
    type SeoScore,
    type SeoIssue,
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
// REALTIME
// ============================================================================
export {
    useProductRealtime,
    useProductListRealtime,
} from './useProductRealtime';

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
// APPROVAL (existing)
// ============================================================================
export * from './useApproval';

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
