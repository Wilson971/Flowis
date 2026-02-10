/**
 * SyncProvider - Context Provider pour la Synchronisation
 *
 * Fournit l'état et les actions de synchronisation à toute l'application.
 * À placer au niveau du layout dashboard.
 */

'use client';

import {
    createContext,
    useContext,
    useEffect,
    type ReactNode,
} from 'react';

import { useSyncEngine } from './useSyncEngine';
import { syncSubscriptions } from './subscriptions';
import type { SyncContextValue, SyncEngineState, SyncOptions } from './types';

// ============================================================================
// CONTEXT
// ============================================================================

const SyncContext = createContext<SyncContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface SyncProviderProps {
    children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
    const syncEngine = useSyncEngine();

    // Cleanup global à l'unmount
    useEffect(() => {
        return () => {
            console.log('[SyncProvider] Unmounting, cleaning up...');
            syncSubscriptions.cleanup();
        };
    }, []);

    return (
        <SyncContext.Provider value={syncEngine}>
            {children}
        </SyncContext.Provider>
    );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook pour accéder au contexte de synchronisation complet
 */
export function useSyncContext(): SyncContextValue {
    const context = useContext(SyncContext);

    if (!context) {
        throw new Error('useSyncContext must be used within a SyncProvider');
    }

    return context;
}

/**
 * Hook pour accéder uniquement à l'état de sync
 */
export function useSyncState(): SyncEngineState {
    const { state } = useSyncContext();
    return state;
}

/**
 * Hook pour accéder aux indicateurs de statut
 */
export function useSyncStatus() {
    const context = useSyncContext();

    return {
        isIdle: context.isIdle,
        isSyncing: context.isSyncing,
        isPaused: context.isPaused,
        isCompleted: context.isCompleted,
        isFailed: context.isFailed,
        machineState: context.state.machineState,
        progress: context.state.progress,
        error: context.state.error,
        activeStoreId: context.state.activeStoreId,
    };
}

/**
 * Hook pour accéder aux actions de sync
 */
export function useSyncActions() {
    const context = useSyncContext();

    return {
        startSync: context.startSync,
        pauseSync: context.pauseSync,
        resumeSync: context.resumeSync,
        cancelSync: context.cancelSync,
        reset: context.reset,
        canStart: context.canStart,
        canPause: context.canPause,
        canResume: context.canResume,
        canCancel: context.canCancel,
    };
}

/**
 * Hook pour la progression de sync
 */
export function useSyncProgress() {
    const { state } = useSyncContext();

    return {
        progress: state.progress,
        detailedProgress: state.detailedProgress,
        percent: state.progress?.percent ?? 0,
        message: state.progress?.message ?? '',
        phase: state.progress?.phase ?? null,
    };
}

/**
 * Hook pour démarrer une sync (API simplifiée)
 */
export function useStartSync() {
    const { startSync, canStart, isSyncing } = useSyncContext();

    return {
        startSync: (storeId: string, options?: SyncOptions) => {
            if (canStart) {
                return startSync(storeId, options);
            }
            console.warn('[useStartSync] Cannot start: sync already in progress');
            return Promise.resolve();
        },
        canStart,
        isSyncing,
    };
}

/**
 * Hook combiné pour un store spécifique
 */
export function useSyncForStore(storeId: string | null) {
    const context = useSyncContext();
    const isActiveStore = context.state.activeStoreId === storeId;

    return {
        // State pour ce store
        isActive: isActiveStore,
        isSyncing: isActiveStore && context.isSyncing,
        isPaused: isActiveStore && context.isPaused,
        isCompleted: isActiveStore && context.isCompleted,
        isFailed: isActiveStore && context.isFailed,
        progress: isActiveStore ? context.state.progress : null,
        error: isActiveStore ? context.state.error : null,

        // Actions
        start: (options?: SyncOptions) => {
            if (storeId && context.canStart) {
                return context.startSync(storeId, options);
            }
            return Promise.resolve();
        },
        pause: () => {
            if (isActiveStore && context.canPause) {
                return context.pauseSync();
            }
            return Promise.resolve();
        },
        resume: () => {
            if (isActiveStore && context.canResume) {
                return context.resumeSync();
            }
            return Promise.resolve();
        },
        cancel: () => {
            if (isActiveStore && context.canCancel) {
                return context.cancelSync();
            }
            return Promise.resolve();
        },

        // Capabilities
        canStart: context.canStart || !isActiveStore,
        canPause: isActiveStore && context.canPause,
        canResume: isActiveStore && context.canResume,
        canCancel: isActiveStore && context.canCancel,
    };
}
