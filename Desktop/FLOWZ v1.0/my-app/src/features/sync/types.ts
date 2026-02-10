/**
 * Sync Feature - Types Unifiés
 *
 * Architecture de synchronisation v2 avec state machine
 */

import type { SyncJob, SyncPhase, SyncStatus } from '@/types/sync';

// ============================================================================
// STATE MACHINE
// ============================================================================

export type SyncMachineState =
    | 'idle'
    | 'starting'
    | 'discovering'
    | 'syncing'
    | 'paused'
    | 'completed'
    | 'failed';

export type SyncMachineEvent =
    | { type: 'START'; storeId: string; options?: SyncOptions }
    | { type: 'PROGRESS'; progress: SyncProgressData }
    | { type: 'JOB_UPDATE'; job: SyncJob }
    | { type: 'PAUSE' }
    | { type: 'RESUME' }
    | { type: 'CANCEL' }
    | { type: 'COMPLETE'; result: SyncResult }
    | { type: 'ERROR'; error: string }
    | { type: 'RESET' };

// ============================================================================
// SYNC OPTIONS
// ============================================================================

export interface SyncOptions {
    platform?: 'shopify' | 'woocommerce';
    syncType?: 'full' | 'incremental';
    includeCategories?: boolean;
    includeVariations?: boolean;
    includePosts?: boolean;
    limit?: number;
}

// ============================================================================
// PROGRESS DATA
// ============================================================================

export interface SyncProgressData {
    phase: SyncPhase | 'starting';
    current: number;
    total: number;
    message: string;
    percent: number;
    timestamp?: number;
}

export interface PhaseProgressData {
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
    percent: number;
}

export interface DetailedProgress {
    overall: SyncProgressData;
    phases: {
        categories: PhaseProgressData;
        products: PhaseProgressData;
        variations: PhaseProgressData;
        posts: PhaseProgressData;
    };
}

// ============================================================================
// SYNC RESULT
// ============================================================================

export interface SyncResult {
    success: boolean;
    productsImported: number;
    variationsImported: number;
    categoriesImported: number;
    postsImported: number;
    errors: string[];
    durationSeconds: number;
    completedAt: string;
}

// ============================================================================
// SYNC ENGINE STATE
// ============================================================================

export interface SyncEngineState {
    // Machine state
    machineState: SyncMachineState;

    // Active sync info
    activeStoreId: string | null;
    activeJobId: string | null;
    activeJob: SyncJob | null;

    // Progress
    progress: SyncProgressData | null;
    detailedProgress: DetailedProgress | null;

    // Result
    lastResult: SyncResult | null;
    error: string | null;

    // Connection
    connectionState: 'connected' | 'reconnecting' | 'disconnected';

    // Timestamps
    startedAt: string | null;
    updatedAt: string | null;
}

// ============================================================================
// SYNC CONTEXT
// ============================================================================

export interface SyncContextValue {
    // State
    state: SyncEngineState;

    // Computed
    isIdle: boolean;
    isSyncing: boolean;
    isPaused: boolean;
    isCompleted: boolean;
    isFailed: boolean;
    canStart: boolean;
    canPause: boolean;
    canResume: boolean;
    canCancel: boolean;

    // Actions
    startSync: (storeId: string, options?: SyncOptions) => Promise<void>;
    pauseSync: () => Promise<void>;
    resumeSync: () => Promise<void>;
    cancelSync: () => Promise<void>;
    reset: () => void;
}

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export interface SubscriptionConfig {
    storeId: string;
    jobId?: string;
    onProgress?: (progress: SyncProgressData) => void;
    onJobUpdate?: (job: SyncJob) => void;
    onComplete?: (result: SyncResult) => void;
    onError?: (error: string) => void;
}

export type UnsubscribeFn = () => void;

// ============================================================================
// QUERY INVALIDATION
// ============================================================================

export interface InvalidationConfig {
    storeId: string;
    includeGlobal?: boolean;
    debounceMs?: number;
}

export type QueryKeyPattern =
    | ['products']
    | ['products', string]
    | ['categories']
    | ['categories', string]
    | ['stores']
    | ['store', string]
    | ['store-stats', string]
    | ['sync-jobs']
    | ['sync-jobs', string]
    | ['product-stats'];
