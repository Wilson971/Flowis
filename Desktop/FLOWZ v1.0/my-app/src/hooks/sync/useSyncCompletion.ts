/**
 * useSyncCompletion - Hook pour détecter la fin de synchronisation
 *
 * Fournit des utilitaires pour:
 * - Détecter quand une sync est terminée
 * - Rafraîchir les stats du store après sync
 */

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { SyncJob } from '@/types/sync';

// ============================================================================
// useSyncCompletion
// ============================================================================

/**
 * Hook to detect sync completion and trigger side effects
 */
export function useSyncCompletion(
    storeId: string | null,
    options?: {
        onComplete?: (job: SyncJob) => void;
        onFail?: (job: SyncJob, error: string) => void;
        showToast?: boolean;
    }
) {
    const supabase = createClient();
    const queryClient = useQueryClient();
    const { onComplete, onFail, showToast = true } = options ?? {};

    useEffect(() => {
        if (!storeId) return;

        // Subscribe to sync_jobs changes for this store
        const channel = supabase
            .channel(`sync_completion:${storeId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'sync_jobs',
                    filter: `store_id=eq.${storeId}`,
                },
                (payload) => {
                    const job = payload.new as SyncJob;

                    // Check if job just completed
                    if (job.status === 'completed') {
                        // Invalidate relevant queries
                        queryClient.invalidateQueries({ queryKey: ['products', storeId] });
                        queryClient.invalidateQueries({ queryKey: ['categories', storeId] });
                        queryClient.invalidateQueries({ queryKey: ['stores'] });
                        queryClient.invalidateQueries({ queryKey: ['store-stats', storeId] });
                        queryClient.invalidateQueries({ queryKey: ['sync-jobs', storeId] });

                        if (showToast) {
                            toast.success('Synchronisation terminée', {
                                description: `${job.synced_products} produits, ${job.synced_categories} catégories importés`,
                            });
                        }

                        onComplete?.(job);
                    }

                    // Check if job failed
                    if (job.status === 'failed' || job.status === 'error') {
                        if (showToast) {
                            toast.error('Synchronisation échouée', {
                                description: job.error_message || 'Une erreur est survenue',
                            });
                        }

                        onFail?.(job, job.error_message || 'Unknown error');
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [storeId, queryClient, onComplete, onFail, showToast, supabase]);
}

// ============================================================================
// useRefreshStoreStats
// ============================================================================

/**
 * Hook to refresh store statistics after sync
 */
export function useRefreshStoreStats() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    const refresh = useCallback(async (storeId: string) => {
        // Invalidate all store-related queries
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['products', storeId] }),
            queryClient.invalidateQueries({ queryKey: ['products'] }),
            queryClient.invalidateQueries({ queryKey: ['categories', storeId] }),
            queryClient.invalidateQueries({ queryKey: ['categories'] }),
            queryClient.invalidateQueries({ queryKey: ['stores'] }),
            queryClient.invalidateQueries({ queryKey: ['store', storeId] }),
            queryClient.invalidateQueries({ queryKey: ['store-stats', storeId] }),
            queryClient.invalidateQueries({ queryKey: ['sync-jobs', storeId] }),
        ]);

        // Optionally fetch fresh stats from database
        const { data: stats } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('store_id', storeId);

        return {
            productCount: stats ? (stats as unknown as { count: number }).count : 0,
        };
    }, [queryClient, supabase]);

    return { refresh };
}

// ============================================================================
// useSyncCompletionMonitor
// ============================================================================

/**
 * Hook to monitor sync completion across all stores
 */
export function useSyncCompletionMonitor(
    options?: {
        onAnyComplete?: (job: SyncJob) => void;
    }
) {
    const supabase = createClient();
    const queryClient = useQueryClient();
    const { onAnyComplete } = options ?? {};

    useEffect(() => {
        // Subscribe to all sync_jobs completions for current user
        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const channel = supabase
                .channel('sync_completion_monitor')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'sync_jobs',
                        filter: `tenant_id=eq.${user.id}`,
                    },
                    (payload) => {
                        const job = payload.new as SyncJob;

                        if (job.status === 'completed') {
                            // Refresh global queries
                            queryClient.invalidateQueries({ queryKey: ['products'] });
                            queryClient.invalidateQueries({ queryKey: ['stores'] });

                            onAnyComplete?.(job);
                        }
                    }
                )
                .subscribe();

            return channel;
        };

        let channelRef: ReturnType<typeof supabase.channel> | null = null;

        setupSubscription().then((channel) => {
            if (channel) {
                channelRef = channel;
            }
        });

        return () => {
            if (channelRef) {
                supabase.removeChannel(channelRef);
            }
        };
    }, [queryClient, onAnyComplete, supabase]);
}
