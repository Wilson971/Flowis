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
    useQuickUpdateProduct,
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
    useRunSeoAnalysis,
    useProductSeoScore,
    useSeoStats,
    useBatchSeoAnalysis,
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
    useSeoAnalysisRealtime,
    useStudioJobsRealtime,
    useProductFullRealtime,
} from './useProductRealtime';

// ============================================================================
// BATCH GENERATION
// ============================================================================
export { useBatchGeneration } from './useBatchGeneration';

export {
    useBatchJobStatus,
    useBatchProgress,
    useBatchJobs,
    useActiveJobs,
    useBatchJobDetails,
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
