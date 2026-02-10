/**
 * usePushToStore - Hook pour publier les modifications vers la boutique source
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface PushResult {
    product_id: string;
    status: 'success' | 'failed' | 'skipped' | 'pending';
    reason?: string;
    woo_product_id?: number;
    error?: string;
}

export interface PushResponse {
    success: boolean;
    total: number;
    pushed: number;
    failed: number;
    skipped: number;
    results: PushResult[];
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook pour publier des produits vers la boutique
 */
export function usePushToStore() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ product_ids }: { product_ids: string[] }): Promise<PushResponse> => {
            console.log('[usePushToStore] 🚀 Pushing products to store:', product_ids);

            const { data: session } = await supabase.auth.getSession();
            if (!session.session?.user) {
                throw new Error('Utilisateur non authentifié');
            }

            // Appeler l'Edge Function push-to-store
            // Format attendu par l'edge function v110: { type, ids, force? }
            const { data, error } = await supabase.functions.invoke('push-to-store', {
                body: { type: 'product', ids: product_ids },
            });

            if (error) {
                console.error('[usePushToStore] Error:', error);
                throw new Error(`Échec de la synchronisation: ${error.message}`);
            }

            return data || {
                success: true,
                total: product_ids.length,
                pushed: 0,
                failed: 0,
                skipped: product_ids.length,
                results: product_ids.map(id => ({
                    product_id: id,
                    status: 'pending' as const,
                    reason: 'queued_background',
                })),
            };
        },
        onSuccess: (data) => {
            // L'edge function retourne { success, total, successful, skipped, failed, results }
            const successCount = data.successful ?? data.pushed ?? 0;
            const failedCount = data.failed ?? 0;

            if (successCount > 0) {
                toast.success('Produits synchronisés', {
                    description: `${successCount} produit(s) mis à jour sur la boutique.`,
                });
            }

            if (failedCount > 0) {
                const failedResults = data.results?.filter((r: any) => !r.success && !r.skipped) || [];
                const firstError = failedResults[0]?.error;
                toast.warning('Erreurs de synchronisation', {
                    description: firstError || `${failedCount} produit(s) n'ont pas pu être synchronisés.`,
                });
            }

            if (successCount === 0 && failedCount === 0) {
                toast.info('Aucun changement à synchroniser');
            }

            // Invalider les queries
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['unsynced-products'] });
            queryClient.invalidateQueries({ queryKey: ['product-stats'] });
            queryClient.invalidateQueries({ queryKey: ['sync-history'] });
            queryClient.invalidateQueries({ queryKey: ['product-conflicts'] });
        },
        onError: (error: Error) => {
            console.error('[usePushToStore] onError:', error);
            toast.error('Erreur', {
                description: error.message || 'Impossible de lancer la synchronisation',
            });
        },
    });
}

/**
 * Hook pour publier un seul produit
 */
export function usePushSingleProduct() {
    const pushToStore = usePushToStore();

    return {
        ...pushToStore,
        push: (productId: string) => pushToStore.mutate({ product_ids: [productId] }),
        pushAsync: (productId: string) => pushToStore.mutateAsync({ product_ids: [productId] }),
    };
}

/**
 * Hook pour récupérer les produits non synchronisés
 */
export function useUnsyncedProducts(storeId?: string) {
    const supabase = createClient();

    return {
        queryKey: ['unsynced-products', storeId],
        queryFn: async () => {
            if (!storeId) return { total: 0, products: [] };

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('store_id', storeId)
                .not('dirty_fields_content', 'is', null)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            // Filtrer ceux qui ont vraiment des dirty fields
            const unsyncedProducts = (data || []).filter(p =>
                Array.isArray(p.dirty_fields_content) && p.dirty_fields_content.length > 0
            );

            return {
                total: unsyncedProducts.length,
                products: unsyncedProducts,
            };
        },
        enabled: !!storeId,
    };
}

/**
 * Hook pour annuler les modifications en attente de sync
 */
export function useCancelProductSync() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ productIds }: { productIds: string[] }) => {
            // Remettre le working_content au snapshot pour chaque produit
            const results = await Promise.all(
                productIds.map(async (productId) => {
                    const { data: product } = await supabase
                        .from('products')
                        .select('store_snapshot_content')
                        .eq('id', productId)
                        .single();

                    if (product) {
                        const { error } = await supabase
                            .from('products')
                            .update({
                                working_content: product.store_snapshot_content,
                                dirty_fields_content: [],
                                working_content_updated_at: new Date().toISOString(),
                            })
                            .eq('id', productId);

                        if (error) throw error;
                    }

                    return productId;
                })
            );

            return results;
        },
        onSuccess: (_, variables) => {
            variables.productIds.forEach(id => {
                queryClient.invalidateQueries({ queryKey: ['product', id] });
                queryClient.invalidateQueries({ queryKey: ['product-content', id] });
            });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['unsynced-products'] });
            toast.success('Modifications annulées');
        },
        onError: (error: Error) => {
            toast.error('Erreur', { description: error.message });
        },
    });
}

/**
 * Hook pour revenir à l'état original (snapshot)
 */
export function useRevertToOriginal() {
    const cancelSync = useCancelProductSync();

    return {
        ...cancelSync,
        revert: (productId: string) => cancelSync.mutate({ productIds: [productId] }),
        revertMultiple: (productIds: string[]) => cancelSync.mutate({ productIds }),
    };
}
