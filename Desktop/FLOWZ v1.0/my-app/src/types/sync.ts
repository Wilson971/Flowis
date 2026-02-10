/**
 * Phase 2: Contrat de Données Typé pour la Synchronisation
 *
 * Types partagés entre le client et le serveur pour garantir la cohérence
 * des données de synchronisation.
 */

import { z } from 'zod';

// ============================================================================
// SYNC STATUS & PHASES
// ============================================================================

export type SyncStatus =
    | 'idle'
    | 'pending'
    | 'running'
    | 'discovering'
    | 'fetching'
    | 'saving'
    | 'syncing'
    | 'importing'
    | 'paused'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'error';

export type SyncPhase =
    | 'discovery'
    | 'categories'
    | 'products'
    | 'variations'
    | 'posts'
    | 'finalizing'
    | 'completed'
    | 'failed';

// ============================================================================
// SYNC JOB
// ============================================================================

export interface SyncJob {
    id: string;
    store_id: string;
    tenant_id?: string;
    connection_id?: string;
    job_type: string;
    status: SyncStatus;
    current_phase: SyncPhase;
    total_products: number;
    synced_products: number;
    total_variations: number;
    synced_variations: number;
    total_categories: number;
    synced_categories: number;
    total_posts?: number;
    synced_posts?: number;
    started_at: string;
    completed_at: string | null;
    paused_at?: string | null;
    error_message: string | null;
    result: SyncJobResult | null;
    config?: SyncJobConfig;
    created_at?: string;
    updated_at?: string;
}

export interface SyncJobConfig {
    mode: 'full' | 'incremental';
    limit?: number;
    sync_categories?: boolean;
    sync_products?: boolean;
    sync_posts?: boolean;
    sync_variations?: boolean;
}

export interface SyncJobResult {
    products_synced: number;
    variations_synced: number;
    categories_synced: number;
    posts_synced?: number;
    errors: string[];
    duration_seconds: number;
}

// ============================================================================
// SYNC LOG
// ============================================================================

export interface SyncLog {
    id: string;
    job_id: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success' | 'debug';
    phase?: SyncPhase;
    metadata?: Record<string, unknown>;
    created_at: string;
}

// ============================================================================
// SYNC MANAGER PARAMS
// ============================================================================

export interface SyncManagerParams {
    storeId: string;
    types?: 'all' | ('products' | 'categories' | 'posts' | 'variations')[];
    sync_type?: 'full' | 'incremental';
    forceRestart?: boolean;
    limit?: number;
}

// ============================================================================
// START SYNC OPTIONS
// ============================================================================

export interface StartSyncOptions {
    store_id: string;
    mode?: 'full' | 'incremental';
    limit?: number;
    sync_categories?: boolean;
    sync_products?: boolean;
    sync_posts?: boolean;
    sync_variations?: boolean;
}

// ============================================================================
// SYNC PROGRESS (Realtime)
// ============================================================================

export interface SyncProgress {
    phase: SyncPhase | 'starting';
    current: number;
    total: number;
    message: string;
    percent: number;
    timestamp?: number;
}

// ============================================================================
// MANIFEST-BASED SYNC (V3 Architecture)
// ============================================================================

export type ManifestStatus =
    | 'planning'
    | 'ready'
    | 'in_progress'
    | 'completed'
    | 'failed'
    | 'paused';

export type SyncUIStatus =
    | 'idle'
    | 'starting'
    | 'syncing'
    | 'paused'
    | 'completed'
    | 'failed';

export type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';

export interface PhaseProgress {
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
    pending: number;
    percent: number;
}

export interface ManifestProgress {
    status: ManifestStatus | 'idle';
    phases: {
        products: Omit<PhaseProgress, 'pending' | 'percent'>;
        variations: Omit<PhaseProgress, 'pending' | 'percent'>;
        categories: Omit<PhaseProgress, 'pending' | 'percent'>;
        posts?: Omit<PhaseProgress, 'pending' | 'percent'>;
    };
    elapsedSeconds: number;
    estimatedRemainingSeconds: number;
}

export interface UnifiedSyncProgress {
    manifestId: string;
    storeId: string;
    status: ManifestStatus;
    uiStatus: SyncUIStatus;

    // Compteurs
    totalItems: number;
    completedItems: number;
    failedItems: number;
    inProgressItems: number;
    pendingItems: number;

    // Pourcentage (0-100)
    progressPercent: number;

    // Temps
    elapsedSeconds: number;
    estimatedRemainingSeconds: number | null;
    startedAt: string | null;
    completedAt: string | null;
    updatedAt: string;

    // Phases détaillées
    phases: {
        categories: PhaseProgress;
        products: PhaseProgress;
        variations: PhaseProgress;
        posts: PhaseProgress;
    };

    // État de connexion
    connectionState: ConnectionState;

    // Workers actifs
    activeWorkers: number;
}

// ============================================================================
// SYNC RESULT (Edge Function Response)
// ============================================================================

export interface SyncResult {
    success: boolean;
    products_synced: number;
    variations_synced: number;
    categories_synced: number;
    total_products: number;
    errors: string[];
    duration_seconds: number;
}

export interface SyncedProduct {
    id: string;
    title: string;
    description?: string | null;
    short_description?: string | null;
    status: 'synced' | 'draft' | 'pending';
    dirty_fields_content: string[];
    working_content: Record<string, unknown>;
    working_content_updated_at: string | null;
    store_content_updated_at: string | null;
    last_synced_at: string | null;
    last_sync_attempt_at: string | null;
    store_snapshot_content: Record<string, unknown>;
    metadata: Record<string, unknown>;
    sync_source?: string | null;
    [key: string]: unknown;
}

export interface ProductSyncResult {
    product_id: string;
    status: 'success' | 'failed' | 'skipped';
    error?: string;
    reason?: string;
    product?: SyncedProduct;
}

export interface SyncResponse {
    success: boolean;
    total: number;
    pushed: number;
    failed: number;
    skipped: number;
    results: ProductSyncResult[];
    error?: string;
    details?: string;
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const SyncResultSchema = z.object({
    product_id: z.string(),
    status: z.enum(['success', 'failed', 'skipped']),
    error: z.string().optional(),
    reason: z.string().optional(),
    product: z.any().optional(),
});

export const SyncResponseSchema = z.object({
    success: z.boolean(),
    total: z.number(),
    pushed: z.number(),
    failed: z.number(),
    skipped: z.number(),
    results: z.array(SyncResultSchema),
    error: z.string().optional(),
    details: z.string().optional(),
});

// ============================================================================
// STATE MACHINE TYPES
// ============================================================================

export type SyncState = 'idle' | 'pending' | 'synced' | 'error' | 'dirty';

export interface SyncStateTransition {
    productId: string;
    previousState: SyncState;
    newState: SyncState;
    trigger: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}

// ============================================================================
// SYNC ACTIONS STATE
// ============================================================================

export interface SyncActionsState {
    canStart: boolean;
    canPause: boolean;
    canResume: boolean;
    canCancel: boolean;
    isRunning: boolean;
    isPaused: boolean;
    isCompleted: boolean;
    isFailed: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

export function toUIStatus(manifestStatus: ManifestStatus | null, isStarting: boolean): SyncUIStatus {
    if (isStarting) return 'starting';
    if (!manifestStatus) return 'idle';

    switch (manifestStatus) {
        case 'planning':
        case 'ready':
            return 'starting';
        case 'in_progress':
            return 'syncing';
        case 'paused':
            return 'paused';
        case 'completed':
            return 'completed';
        case 'failed':
            return 'failed';
    }
}

export function isActiveStatus(status: SyncStatus): boolean {
    return ['pending', 'running', 'discovering', 'fetching', 'saving', 'syncing', 'importing'].includes(status);
}

export function canPauseJob(job: SyncJob | null): boolean {
    if (!job) return false;
    return isActiveStatus(job.status);
}

export function canResumeJob(job: SyncJob | null): boolean {
    if (!job) return false;
    return job.status === 'paused';
}

export function canCancelJob(job: SyncJob | null): boolean {
    if (!job) return false;
    return isActiveStatus(job.status) || job.status === 'paused';
}
