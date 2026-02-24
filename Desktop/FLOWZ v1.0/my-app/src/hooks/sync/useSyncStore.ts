/**
 * useSyncStore - Hook simplifié pour la synchronisation WooCommerce
 *
 * Ce hook fournit une interface simple pour synchroniser une boutique:
 * 1. Appeler l'Edge Function sync-manager ou woo-sync
 * 2. S'abonner aux mises à jour de progression via Supabase Realtime
 * 3. Retourner l'état de progression pour l'affichage UI
 */

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { SyncProgress, SyncResult } from '@/types/sync';

// ============================================================================
// Types
// ============================================================================

export interface SyncStoreParams {
    storeId: string;
    platform?: 'shopify' | 'woocommerce';
    syncType?: 'full' | 'incremental';
    includeCategories?: boolean;
    includeVariations?: boolean;
    includePosts?: boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useSyncStore() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    // Progress state
    const [progress, setProgress] = useState<SyncProgress | null>(null);
    const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

    // Subscribe to real-time progress updates
    useEffect(() => {
        if (!activeStoreId) {
            // Cleanup when no active sync
            if (channel) {
                supabase.removeChannel(channel);
                setChannel(null);
            }
            setProgress(null);
            return;
        }

        // Create channel for this store's sync progress
        const newChannel = supabase.channel(`sync_progress:${activeStoreId}`);

        newChannel
            .on('broadcast', { event: 'progress' }, ({ payload }) => {
                const p = payload as SyncProgress & { timestamp?: number };
                setProgress({
                    phase: p.phase,
                    current: p.current,
                    total: p.total,
                    message: p.message,
                    percent: p.total > 0 ? Math.round((p.current / p.total) * 100) : 0,
                    timestamp: p.timestamp,
                });

                // Auto-clear progress on completion/failure
                if (p.phase === 'completed' || p.phase === 'failed') {
                    setTimeout(() => {
                        setActiveStoreId(null);
                    }, 3000); // Keep visible for 3s
                }
            })
            .subscribe((status) => {


            });

        setChannel(newChannel);

        // Cleanup on unmount or store change
        return () => {
            supabase.removeChannel(newChannel);
        };
    }, [activeStoreId, supabase]);

    // Clear progress manually
    const clearProgress = useCallback(() => {
        setActiveStoreId(null);
        setProgress(null);
    }, []);

    // Sync mutation
    const mutation = useMutation({
        mutationFn: async ({
            storeId,
            platform = 'woocommerce',
            syncType = 'full',
            includeCategories = true,
            includeVariations = true,
            includePosts = false,
        }: SyncStoreParams): Promise<SyncResult> => {
            // Set active store to start listening for progress
            setActiveStoreId(storeId);
            setProgress({
                phase: 'starting',
                current: 0,
                total: 1,
                message: 'Initialisation de la synchronisation...',
                percent: 0,
            });

            // Determine which edge function to call based on platform
            const functionName = platform === 'woocommerce' ? 'sync-manager' : 'shopify-sync';

            const { data, error } = await supabase.functions.invoke<SyncResult>(functionName, {
                body: {
                    storeId,
                    store_id: storeId, // Support both formats
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

            if (!data?.success && data?.errors?.length) {


            }

            return data as SyncResult;
        },

        onSuccess: async (data) => {
            // Show success toast
            const parts = [];
            if (data.products_synced > 0) parts.push(`${data.products_synced} produits`);
            if (data.variations_synced > 0) parts.push(`${data.variations_synced} variations`);
            if (data.categories_synced > 0) parts.push(`${data.categories_synced} catégories`);

            toast.success('Synchronisation terminée', {
                description: parts.length > 0
                    ? `Importé: ${parts.join(', ')} en ${data.duration_seconds}s`
                    : 'Aucun nouvel élément importé',
            });

            // Invalidate queries to refresh UI
            await queryClient.refetchQueries({ queryKey: ['stores'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['product-stats'] });
            queryClient.invalidateQueries({ queryKey: ['category-stats'] });
            queryClient.invalidateQueries({ queryKey: ['sync-jobs'] });
        },

        onError: (error: Error) => {
            setProgress({
                phase: 'failed',
                current: 0,
                total: 1,
                message: error.message,
                percent: 0,
            });

            toast.error('Erreur de synchronisation', {
                description: error.message || 'Impossible de synchroniser le store',
            });

            // Clear after showing error
            setTimeout(() => {
                setActiveStoreId(null);
            }, 5000);
        },
    });

    return {
        // Mutation
        ...mutation,
        sync: mutation.mutate,
        syncAsync: mutation.mutateAsync,

        // Progress state
        progress,
        clearProgress,
        isSyncing: mutation.isPending || (progress !== null && progress.phase !== 'completed' && progress.phase !== 'failed'),
        activeStoreId,
    };
}

export default useSyncStore;
