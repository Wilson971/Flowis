/**
 * Sync Hooks - Architecture Simplifiée + Queue-Based V2
 *
 * NEW (V2 Queue-Based):
 * - useUnifiedSync: Queue products for background sync
 * - useSyncProduct: Sync a single product
 * - useSyncAllProducts: Sync all dirty products for a store
 * - useSyncQueueStats: Get queue statistics
 * - useSyncQueueJobs: Get active sync jobs
 * - usePendingSyncCount: Badge count for pending syncs
 *
 * Main hooks:
 * - useSyncStore: Start sync, track progress via Realtime broadcast
 * - useSyncJob: CRUD operations on sync jobs
 * - useSyncProgress: Subscribe to real-time progress updates
 *
 * Utility hooks:
 * - useSyncCompletion, useRefreshStoreStats
 * - useSyncReports, useSyncStats
 *
 * Legacy hooks (backwards compatibility):
 * - useSyncManager (simple interface)
 */

// ============================================================================
// V2 QUEUE-BASED SYNC (RECOMMENDED)
// ============================================================================

// Unified sync hook - queue products for background processing
export {
    useUnifiedSync,
    useSyncProduct,
    useSyncAllProducts,
} from './useUnifiedSync';
export type { QueueSyncOptions, QueueSyncResult } from './useUnifiedSync';

// Real-time queue monitoring
export {
    useSyncQueueStats,
    useSyncQueueRealtime,
    useSyncQueueJobs,
    usePendingSyncCount,
} from './useSyncQueueStatus';
export type { SyncQueueStats, SyncQueueJob } from './useSyncQueueStatus';

// ============================================================================
// MAIN SYNC HOOKS
// ============================================================================

// Simplified sync hook with realtime progress
export { useSyncStore } from './useSyncStore';
export type { SyncStoreParams } from './useSyncStore';

// Sync job management (start, pause, resume, cancel)
export {
    useSyncJob,
    useLatestSyncJob,
    useSyncJobs,
    useStartSync,
    usePauseSync,
    useResumeSync,
    useCancelSyncJob,
    useSyncActions,
} from './useSyncJob';

// Real-time progress tracking
export { useSyncProgress } from './useSyncProgress';

// ============================================================================
// UTILITY HOOKS
// ============================================================================

// Sync completion detection
export {
    useSyncCompletion,
    useRefreshStoreStats,
    useSyncCompletionMonitor,
} from './useSyncCompletion';

// Sync reports and statistics
export {
    useSyncReports,
    useSyncReport,
    useSyncLogs,
    useSyncStats,
} from './useSyncReports';
export type { SyncReport } from './useSyncReports';

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

// Simple sync manager (legacy interface)
export { useSyncManager } from './useSyncManager';

// Cancel sync hook
export { useCancelSync } from '../useCancelSync';
