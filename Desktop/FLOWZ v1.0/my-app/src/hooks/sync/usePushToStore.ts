/**
 * usePushToStore - Hook pour pousser les modifications vers WooCommerce/WordPress
 *
 * Features:
 * - Push produits vers WooCommerce
 * - Push articles vers WordPress
 * - Gestion des conflits par timestamp
 * - Auto-sync après sauvegarde
 * - Retry avec exponential backoff
 *
 * @module hooks/sync/usePushToStore
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useCallback } from 'react';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum retry attempts */
const MAX_RETRIES = 3;

/** Base delay for exponential backoff (ms) */
const BASE_RETRY_DELAY_MS = 1000;

/** Delay before auto-sync (randomized for timing attack prevention) */
const AUTO_SYNC_MIN_DELAY_MS = 400;
const AUTO_SYNC_MAX_DELAY_MS = 600;

// ============================================================================
// TYPES
// ============================================================================

export type PushType = 'product' | 'article';

export interface PushResult {
    id: string;
    platformId: string;
    success: boolean;
    error?: string;
    skipped?: boolean;
    skipReason?: string;
}

export interface PushResponse {
    success: boolean;
    type: PushType;
    total: number;
    successful: number;
    skipped: number;
    failed: number;
    results: PushResult[];
}

interface PushToStoreParams {
    type: PushType;
    ids: string[];
    force?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate randomized delay for timing attack prevention
 */
function getRandomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number): number {
    return BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Standalone push executor with exponential backoff retry.
 * Used by both usePushToStore mutation and usePushProductBatch.
 */
async function executePushWithRetry(
    supabase: ReturnType<typeof createClient>,
    params: PushToStoreParams,
    attempt = 0
): Promise<PushResponse> {
    try {
        const { data, error } = await supabase.functions.invoke('push-to-store', {
            body: params,
        });

        if (error) {
            throw new Error(error.message || 'Erreur de synchronisation');
        }

        if (!data) {
            throw new Error('Réponse vide de la fonction');
        }

        return data as PushResponse;
    } catch (err) {
        if (attempt < MAX_RETRIES - 1) {
            const delay = getBackoffDelay(attempt);
            await sleep(delay);
            return executePushWithRetry(supabase, params, attempt + 1);
        }
        throw err;
    }
}

export function usePushToStore() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: PushToStoreParams): Promise<PushResponse> => {
            return executePushWithRetry(supabase, params);
        },
        onSuccess: (data, variables) => {
            // Invalidate specific queries based on type
            if (variables.type === 'product') {
                // Invalidate only affected products
                for (const result of data.results) {
                    if (result.success) {
                        queryClient.invalidateQueries({ queryKey: ['product', result.id] });
                        queryClient.invalidateQueries({ queryKey: ['product-content', result.id] });
                    }
                }
                // Also invalidate the list
                queryClient.invalidateQueries({ queryKey: ['products'] });
            } else {
                // Invalidate only affected articles
                for (const result of data.results) {
                    if (result.success) {
                        queryClient.invalidateQueries({ queryKey: ['blog-article', result.id] });
                    }
                }
                queryClient.invalidateQueries({ queryKey: ['blog-articles'] });
            }

            // Show toast based on results
            if (data.failed === 0) {
                if (data.skipped === data.total) {
                    toast.info('Aucun changement à synchroniser', {
                        description: 'Les données sont déjà à jour.',
                    });
                } else if (data.skipped > 0) {
                    toast.success(`${data.successful} élément(s) synchronisé(s)`, {
                        description: `${data.skipped} ignoré(s) (déjà à jour)`,
                    });
                } else {
                    toast.success(`${data.successful} élément(s) synchronisé(s)`, {
                        description: 'Modifications poussées vers la boutique.',
                    });
                }
            } else {
                toast.warning('Synchronisation partielle', {
                    description: `${data.successful} réussi(s), ${data.failed} échoué(s)`,
                });
            }
        },
        onError: (error: Error) => {
            console.error('[usePushToStore] Push failed:', error);
            toast.error('Erreur de synchronisation', {
                description: error.message,
            });
        },
    });
}

// ============================================================================
// PRODUCT-SPECIFIC HOOK
// ============================================================================

export function usePushProductToStore() {
    const pushMutation = usePushToStore();

    const pushProduct = useCallback(async (productId: string, force = false) => {
        return pushMutation.mutateAsync({
            type: 'product',
            ids: [productId],
            force,
        });
    }, [pushMutation]);

    const pushProducts = useCallback(async (productIds: string[], force = false) => {
        return pushMutation.mutateAsync({
            type: 'product',
            ids: productIds,
            force,
        });
    }, [pushMutation]);

    return {
        pushProduct,
        pushProducts,
        isPushing: pushMutation.isPending,
        lastPushResult: pushMutation.data,
        error: pushMutation.error,
    };
}

// ============================================================================
// ARTICLE-SPECIFIC HOOK
// ============================================================================

export function usePushArticleToStore() {
    const pushMutation = usePushToStore();

    const pushArticle = useCallback(async (articleId: string, force = false) => {
        return pushMutation.mutateAsync({
            type: 'article',
            ids: [articleId],
            force,
        });
    }, [pushMutation]);

    const pushArticles = useCallback(async (articleIds: string[], force = false) => {
        return pushMutation.mutateAsync({
            type: 'article',
            ids: articleIds,
            force,
        });
    }, [pushMutation]);

    return {
        pushArticle,
        pushArticles,
        isPushing: pushMutation.isPending,
        lastPushResult: pushMutation.data,
        error: pushMutation.error,
    };
}

// ============================================================================
// AUTO-SYNC WRAPPER
// ============================================================================

/**
 * Hook pour auto-sync après sauvegarde
 * À utiliser dans useProductSave et useArticleEditorForm
 */
// ============================================================================
// PRODUCT-SPECIFIC: BATCH PUSH (wraps generic mutation for product pages)
// ============================================================================

export function usePushProductBatch() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ product_ids, force = true }: { product_ids: string[]; force?: boolean }): Promise<PushResponse> => {
            const { data: session } = await supabase.auth.getSession();
            if (!session.session?.user) {
                throw new Error('Utilisateur non authentifié');
            }

            const response = await executePushWithRetry(supabase, {
                type: 'product',
                ids: product_ids,
                force,
            });

            return response;
        },
        onSuccess: (data, variables) => {
            const successCount = data.successful ?? 0;
            const failedCount = data.failed ?? 0;
            const toastId = variables.product_ids.length > 1 ? 'batch-sync' : undefined;

            if (successCount > 0 && failedCount === 0) {
                toast.success('Produits synchronisés', {
                    id: toastId,
                    duration: 4000,
                    description: `${successCount} produit(s) mis à jour sur la boutique.`,
                });
            } else if (successCount > 0 && failedCount > 0) {
                toast.warning('Synchronisation partielle', {
                    id: toastId,
                    duration: 4000,
                    description: `${successCount} synchronisé(s), ${failedCount} échoué(s).`,
                });
            } else if (failedCount > 0) {
                const failedResults = data.results?.filter((r) => !r.success) || [];
                const firstError = failedResults[0]?.error;
                toast.error('Échec de synchronisation', {
                    id: toastId,
                    duration: 6000,
                    description: firstError || `${failedCount} produit(s) n'ont pas pu être synchronisés.`,
                });
            } else {
                toast.info('Aucun changement à synchroniser', { id: toastId, duration: 4000 });
            }

            for (const id of variables.product_ids) {
                queryClient.invalidateQueries({ queryKey: ['product', id] });
                queryClient.invalidateQueries({ queryKey: ['product-content', id] });
            }

            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['unsynced-products'] });
            queryClient.invalidateQueries({ queryKey: ['product-stats'] });
            queryClient.invalidateQueries({ queryKey: ['sync-history'] });
            queryClient.invalidateQueries({ queryKey: ['product-conflicts'] });
            queryClient.invalidateQueries({ queryKey: ['dirty-variations-count'] });
            queryClient.invalidateQueries({ queryKey: ['product-versions'] });
        },
        onError: (error: Error, variables) => {
            console.error('[usePushProductBatch] onError:', error);
            const isNetwork = error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Failed to fetch');
            const toastId = variables.product_ids.length > 1 ? 'batch-sync' : undefined;
            toast.error(isNetwork ? 'Connexion perdue' : 'Erreur de synchronisation', {
                id: toastId,
                duration: 6000,
                description: isNetwork
                    ? 'Vérifiez votre connexion internet et réessayez.'
                    : (error.message || 'Impossible de lancer la synchronisation'),
            });
        },
    });
}

export function usePushSingleProduct() {
    const pushToStore = usePushProductBatch();

    return {
        ...pushToStore,
        push: (productId: string) => pushToStore.mutate({ product_ids: [productId] }),
        pushAsync: (productId: string) => pushToStore.mutateAsync({ product_ids: [productId] }),
    };
}

// ============================================================================
// PRODUCT-SPECIFIC: UNSYNCED & REVERT UTILITIES
// ============================================================================

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

            const unsyncedProducts = (data || []).filter((p: { dirty_fields_content: unknown }) =>
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

export function useCancelProductSync() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ productIds }: { productIds: string[] }) => {
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
            toast.error('Erreur d\'annulation', { description: error.message || 'Impossible d\'annuler les modifications.' });
        },
    });
}

export function useRevertToOriginal() {
    const cancelSync = useCancelProductSync();

    return {
        ...cancelSync,
        revert: (productId: string) => cancelSync.mutate({ productIds: [productId] }),
        revertMultiple: (productIds: string[]) => cancelSync.mutate({ productIds }),
    };
}

// ============================================================================
// AUTO-SYNC WRAPPER
// ============================================================================

export function useAutoSync(type: PushType) {
    const pushMutation = usePushToStore();

    const triggerAutoSync = useCallback(async (id: string) => {
        try {
            // Randomized delay to prevent timing attacks
            const delay = getRandomDelay(AUTO_SYNC_MIN_DELAY_MS, AUTO_SYNC_MAX_DELAY_MS);
            await sleep(delay);

            const result = await pushMutation.mutateAsync({
                type,
                ids: [id],
                force: true, // Auto-sync after user save: always push (user deliberately saved)
            });

            return result;
        } catch (error) {
            // The mutation's onError already shows a toast — only log here.
            // Auto-sync failure is non-fatal: data is saved locally.
            console.error(`[useAutoSync] Auto-sync failed for ${type} ${id}:`, error);
            return null;
        }
    }, [pushMutation, type]);

    return {
        triggerAutoSync,
        isAutoSyncing: pushMutation.isPending,
    };
}
