/**
 * Sync State Machine
 *
 * Gère les transitions d'état de la synchronisation de manière prévisible.
 * Utilise un pattern reducer pour des mises à jour atomiques.
 */

import type {
    SyncMachineState,
    SyncMachineEvent,
    SyncEngineState,
    SyncProgressData,
    SyncResult,
} from './types';
import type { SyncJob, SyncStatus } from '@/types/sync';

// ============================================================================
// INITIAL STATE
// ============================================================================

export const initialSyncState: SyncEngineState = {
    machineState: 'idle',
    activeStoreId: null,
    activeJobId: null,
    activeJob: null,
    progress: null,
    detailedProgress: null,
    lastResult: null,
    error: null,
    connectionState: 'disconnected',
    startedAt: null,
    updatedAt: null,
};

// ============================================================================
// STATE MACHINE TRANSITIONS
// ============================================================================

/**
 * Définit les transitions valides entre états
 */
const validTransitions: Record<SyncMachineState, SyncMachineState[]> = {
    idle: ['starting'],
    starting: ['discovering', 'syncing', 'failed', 'idle'],
    discovering: ['syncing', 'paused', 'failed', 'idle'],
    syncing: ['paused', 'completed', 'failed', 'idle'],
    paused: ['syncing', 'failed', 'idle'],
    completed: ['idle', 'starting'],
    failed: ['idle', 'starting'],
};

/**
 * Vérifie si une transition est valide
 */
export function canTransition(
    from: SyncMachineState,
    to: SyncMachineState
): boolean {
    return validTransitions[from]?.includes(to) ?? false;
}

// ============================================================================
// SYNC STATUS TO MACHINE STATE MAPPING
// ============================================================================

/**
 * Mappe les statuts de job Supabase vers les états machine
 */
export function mapStatusToMachineState(status: SyncStatus): SyncMachineState {
    switch (status) {
        case 'idle':
            return 'idle';
        case 'pending':
            return 'starting';
        case 'discovering':
            return 'discovering';
        case 'running':
        case 'fetching':
        case 'saving':
        case 'syncing':
        case 'importing':
            return 'syncing';
        case 'paused':
            return 'paused';
        case 'completed':
            return 'completed';
        case 'failed':
        case 'error':
        case 'cancelled':
            return 'failed';
        default:
            return 'idle';
    }
}

// ============================================================================
// REDUCER
// ============================================================================

/**
 * Reducer principal pour gérer les événements de la machine à états
 */
export function syncReducer(
    state: SyncEngineState,
    event: SyncMachineEvent
): SyncEngineState {
    const now = new Date().toISOString();

    switch (event.type) {
        case 'START': {
            if (!canTransition(state.machineState, 'starting')) {


                return state;
            }

            return {
                ...initialSyncState,
                machineState: 'starting',
                activeStoreId: event.storeId,
                connectionState: 'connected',
                startedAt: now,
                updatedAt: now,
                progress: {
                    phase: 'starting',
                    current: 0,
                    total: 1,
                    message: 'Initialisation de la synchronisation...',
                    percent: 0,
                },
            };
        }

        case 'PROGRESS': {
            // Accepter les progress dans n'importe quel état actif
            const activeStates: SyncMachineState[] = [
                'starting',
                'discovering',
                'syncing',
            ];
            if (!activeStates.includes(state.machineState)) {
                return state;
            }

            // Déterminer le nouvel état machine basé sur la phase
            let newMachineState = state.machineState;
            if (
                event.progress.phase === 'discovery' &&
                state.machineState === 'starting'
            ) {
                newMachineState = 'discovering';
            } else if (
                ['categories', 'products', 'variations', 'posts', 'finalizing'].includes(
                    event.progress.phase
                )
            ) {
                newMachineState = 'syncing';
            }

            return {
                ...state,
                machineState: newMachineState,
                progress: event.progress,
                updatedAt: now,
            };
        }

        case 'JOB_UPDATE': {
            const newMachineState = mapStatusToMachineState(event.job.status);

            // Extraire les données de progression du job
            const progress: SyncProgressData = {
                phase: event.job.current_phase,
                current: event.job.synced_products + event.job.synced_variations,
                total: event.job.total_products + event.job.total_variations,
                message: getPhaseMessage(event.job.current_phase, event.job),
                percent: calculatePercent(event.job),
            };

            return {
                ...state,
                machineState: newMachineState,
                activeJobId: event.job.id,
                activeJob: event.job,
                progress,
                error: event.job.error_message,
                updatedAt: now,
            };
        }

        case 'PAUSE': {
            if (!canTransition(state.machineState, 'paused')) {


                return state;
            }

            return {
                ...state,
                machineState: 'paused',
                updatedAt: now,
            };
        }

        case 'RESUME': {
            if (state.machineState !== 'paused') {


                return state;
            }

            return {
                ...state,
                machineState: 'syncing',
                updatedAt: now,
            };
        }

        case 'CANCEL': {
            return {
                ...state,
                machineState: 'failed',
                error: 'Synchronisation annulée par l\'utilisateur',
                updatedAt: now,
            };
        }

        case 'COMPLETE': {
            return {
                ...state,
                machineState: 'completed',
                progress: {
                    phase: 'completed',
                    current: event.result.productsImported,
                    total: event.result.productsImported,
                    message: 'Synchronisation terminée',
                    percent: 100,
                },
                lastResult: event.result,
                error: null,
                updatedAt: now,
            };
        }

        case 'ERROR': {
            return {
                ...state,
                machineState: 'failed',
                error: event.error,
                updatedAt: now,
            };
        }

        case 'RESET': {
            return {
                ...initialSyncState,
                lastResult: state.lastResult, // Conserver le dernier résultat
            };
        }

        default:
            return state;
    }
}

// ============================================================================
// HELPERS
// ============================================================================

function getPhaseMessage(phase: string, job: SyncJob): string {
    switch (phase) {
        case 'discovery':
            return 'Découverte des produits...';
        case 'categories':
            return `Catégories: ${job.synced_categories}/${job.total_categories}`;
        case 'products':
            return `Produits: ${job.synced_products}/${job.total_products}`;
        case 'variations':
            return `Variations: ${job.synced_variations}/${job.total_variations}`;
        case 'posts':
            return `Articles: ${job.synced_posts ?? 0}/${job.total_posts ?? 0}`;
        case 'finalizing':
            return 'Finalisation...';
        case 'completed':
            return 'Terminé';
        case 'failed':
            return job.error_message || 'Erreur';
        default:
            return 'En cours...';
    }
}

function calculatePercent(job: SyncJob): number {
    const total =
        job.total_products +
        job.total_variations +
        job.total_categories +
        (job.total_posts ?? 0);

    if (total === 0) return 0;

    const synced =
        job.synced_products +
        job.synced_variations +
        job.synced_categories +
        (job.synced_posts ?? 0);

    return Math.round((synced / total) * 100);
}

// ============================================================================
// SELECTORS
// ============================================================================

export const syncSelectors = {
    isIdle: (state: SyncEngineState) => state.machineState === 'idle',
    isStarting: (state: SyncEngineState) => state.machineState === 'starting',
    isSyncing: (state: SyncEngineState) =>
        ['starting', 'discovering', 'syncing'].includes(state.machineState),
    isPaused: (state: SyncEngineState) => state.machineState === 'paused',
    isCompleted: (state: SyncEngineState) => state.machineState === 'completed',
    isFailed: (state: SyncEngineState) => state.machineState === 'failed',

    canStart: (state: SyncEngineState) =>
        canTransition(state.machineState, 'starting'),
    canPause: (state: SyncEngineState) =>
        canTransition(state.machineState, 'paused'),
    canResume: (state: SyncEngineState) => state.machineState === 'paused',
    canCancel: (state: SyncEngineState) =>
        ['starting', 'discovering', 'syncing', 'paused'].includes(
            state.machineState
        ),

    getProgressPercent: (state: SyncEngineState) => state.progress?.percent ?? 0,
    getProgressMessage: (state: SyncEngineState) =>
        state.progress?.message ?? '',
};
