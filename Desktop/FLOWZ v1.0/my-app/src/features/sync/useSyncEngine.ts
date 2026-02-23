/**
 * useSyncEngine - Hook Principal de Synchronisation
 *
 * Fournit une interface unifiée pour:
 * - Démarrer/Pause/Resume/Cancel une sync
 * - Suivre la progression en temps réel
 * - Gérer les états via state machine
 * - Invalider les queries de manière optimisée
 */

import { useReducer, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

import { syncReducer, initialSyncState, syncSelectors } from './machine';
import { syncSubscriptions } from './subscriptions';
import { queryInvalidation } from './invalidation';
import type {
    SyncEngineState,
    SyncMachineEvent,
    SyncOptions,
    SyncProgressData,
    SyncResult,
    SyncContextValue,
} from './types';
import type { SyncJob } from '@/types/sync';

// ============================================================================
// HOOK
// ============================================================================

export function useSyncEngine(): SyncContextValue {
    const queryClient = useQueryClient();
    const supabase = createClient();

    // State machine
    const [state, dispatch] = useReducer(syncReducer, initialSyncState);

    // Refs pour éviter les closures périmées
    const stateRef = useRef(state);
    stateRef.current = state;

    // Ref pour le timeout de cleanup
    const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Ref pour tracker si déjà initialisé
    const initializedRef = useRef(false);

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        // Initialiser les managers
        syncSubscriptions.init(supabase);
        queryInvalidation.init(queryClient);



    }, [supabase, queryClient]);

    // ========================================================================
    // SUBSCRIPTION MANAGEMENT
    // ========================================================================

    useEffect(() => {
        const storeId = state.activeStoreId;
        if (!storeId) {
            return;
        }




        const unsubscribe = syncSubscriptions.subscribeToStore({
            storeId,
            jobId: state.activeJobId ?? undefined,

            onProgress: (progress: SyncProgressData) => {
                dispatch({ type: 'PROGRESS', progress });

                // Invalider sync-jobs pendant la progression (debounced)
                queryInvalidation.onSyncProgress(storeId);
            },

            onJobUpdate: (job: SyncJob) => {
                dispatch({ type: 'JOB_UPDATE', job });
            },

            onComplete: (result: SyncResult) => {
                dispatch({ type: 'COMPLETE', result });

                // Afficher le toast de succès
                const parts: string[] = [];
                if (result.productsImported > 0)
                    parts.push(`${result.productsImported} produits`);
                if (result.variationsImported > 0)
                    parts.push(`${result.variationsImported} variations`);
                if (result.categoriesImported > 0)
                    parts.push(`${result.categoriesImported} catégories`);

                toast.success('Synchronisation terminée', {
                    description:
                        parts.length > 0
                            ? `Importé: ${parts.join(', ')} en ${result.durationSeconds}s`
                            : 'Aucun nouvel élément importé',
                });

                // Invalider les queries (immédiat pour une meilleure UX)
                queryInvalidation.onSyncComplete(storeId, true);

                // Auto-reset après 3 secondes
                cleanupTimeoutRef.current = setTimeout(() => {
                    dispatch({ type: 'RESET' });
                }, 3000);
            },

            onError: (error: string) => {
                dispatch({ type: 'ERROR', error });

                toast.error('Erreur de synchronisation', {
                    description: error,
                });

                queryInvalidation.onSyncError(storeId);

                // Auto-reset après 5 secondes
                cleanupTimeoutRef.current = setTimeout(() => {
                    dispatch({ type: 'RESET' });
                }, 5000);
            },
        });

        // Cleanup
        return () => {


            unsubscribe();

            if (cleanupTimeoutRef.current) {
                clearTimeout(cleanupTimeoutRef.current);
                cleanupTimeoutRef.current = null;
            }
        };
    }, [state.activeStoreId, state.activeJobId]);

    // ========================================================================
    // MUTATIONS
    // ========================================================================

    const startMutation = useMutation({
        mutationFn: async ({
            storeId,
            options,
        }: {
            storeId: string;
            options?: SyncOptions;
        }) => {
            const {
                platform = 'woocommerce',
                syncType = 'full',
                includeCategories = true,
                includeVariations = true,
                includePosts = false,
            } = options ?? {};

            const functionName =
                platform === 'woocommerce' ? 'sync-manager' : 'shopify-sync';

            const { data, error } = await supabase.functions.invoke(functionName, {
                body: {
                    storeId,
                    store_id: storeId,
                    sync_type: syncType,
                    types: 'all',
                    include_categories: includeCategories,
                    include_variations: includeVariations,
                    include_posts: includePosts,
                },
            });

            if (error) {
                throw new Error(error.message || 'Sync failed');
            }

            return data;
        },
    });

    const pauseMutation = useMutation({
        mutationFn: async (jobId: string) => {
            const { error } = await supabase
                .from('sync_jobs')
                .update({ status: 'paused', paused_at: new Date().toISOString() })
                .eq('id', jobId);

            if (error) throw error;
        },
    });

    const resumeMutation = useMutation({
        mutationFn: async (job: SyncJob) => {
            await supabase
                .from('sync_jobs')
                .update({ status: 'running', paused_at: null })
                .eq('id', job.id);

            await supabase.functions.invoke('sync-manager', {
                body: {
                    storeId: job.store_id,
                    jobId: job.id,
                    resume: true,
                },
            });
        },
    });

    const cancelMutation = useMutation({
        mutationFn: async (jobId: string) => {
            const { error } = await supabase
                .from('sync_jobs')
                .update({
                    status: 'cancelled',
                    completed_at: new Date().toISOString(),
                })
                .eq('id', jobId);

            if (error) throw error;
        },
    });

    // ========================================================================
    // ACTIONS
    // ========================================================================

    const startSync = useCallback(
        async (storeId: string, options?: SyncOptions) => {
            if (!syncSelectors.canStart(stateRef.current)) {


                return;
            }

            // Dispatch start event
            dispatch({ type: 'START', storeId, options });

            try {
                await startMutation.mutateAsync({ storeId, options });
            } catch (error) {
                dispatch({
                    type: 'ERROR',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        },
        [startMutation]
    );

    const pauseSync = useCallback(async () => {
        const { activeJobId, activeJob } = stateRef.current;

        if (!activeJobId || !syncSelectors.canPause(stateRef.current)) {


            return;
        }

        dispatch({ type: 'PAUSE' });

        try {
            await pauseMutation.mutateAsync(activeJobId);
            toast.info('Synchronisation mise en pause');
        } catch (error) {
            // Revert state
            if (activeJob) {
                dispatch({ type: 'JOB_UPDATE', job: activeJob });
            }
        }
    }, [pauseMutation]);

    const resumeSync = useCallback(async () => {
        const { activeJob } = stateRef.current;

        if (!activeJob || !syncSelectors.canResume(stateRef.current)) {


            return;
        }

        dispatch({ type: 'RESUME' });

        try {
            await resumeMutation.mutateAsync(activeJob);
            toast.success('Synchronisation reprise');
        } catch (error) {
            dispatch({ type: 'PAUSE' });
        }
    }, [resumeMutation]);

    const cancelSync = useCallback(async () => {
        const { activeJobId, activeStoreId } = stateRef.current;

        if (!activeJobId || !syncSelectors.canCancel(stateRef.current)) {


            return;
        }

        dispatch({ type: 'CANCEL' });

        try {
            await cancelMutation.mutateAsync(activeJobId);
            toast.info('Synchronisation annulée');

            if (activeStoreId) {
                queryInvalidation.onSyncError(activeStoreId);
            }
        } catch (error) {
            console.error('[SyncEngine] Failed to cancel:', error);
        }
    }, [cancelMutation]);

    const reset = useCallback(() => {
        // Cleanup timeout si existant
        if (cleanupTimeoutRef.current) {
            clearTimeout(cleanupTimeoutRef.current);
            cleanupTimeoutRef.current = null;
        }

        // Cleanup subscriptions pour le store actif
        if (state.activeStoreId) {
            syncSubscriptions.unsubscribeFromStore(state.activeStoreId);
        }

        dispatch({ type: 'RESET' });
    }, [state.activeStoreId]);

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    const contextValue: SyncContextValue = {
        state,

        // Computed from selectors
        isIdle: syncSelectors.isIdle(state),
        isSyncing: syncSelectors.isSyncing(state),
        isPaused: syncSelectors.isPaused(state),
        isCompleted: syncSelectors.isCompleted(state),
        isFailed: syncSelectors.isFailed(state),
        canStart: syncSelectors.canStart(state),
        canPause: syncSelectors.canPause(state),
        canResume: syncSelectors.canResume(state),
        canCancel: syncSelectors.canCancel(state),

        // Actions
        startSync,
        pauseSync,
        resumeSync,
        cancelSync,
        reset,
    };

    return contextValue;
}
