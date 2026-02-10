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

export function usePushToStore() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    const executePush = useCallback(async (
        params: PushToStoreParams,
        attempt = 0
    ): Promise<PushResponse> => {
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
            // Retry logic with exponential backoff
            if (attempt < MAX_RETRIES - 1) {
                const delay = getBackoffDelay(attempt);
                console.warn(`[usePushToStore] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
                await sleep(delay);
                return executePush(params, attempt + 1);
            }
            throw err;
        }
    }, [supabase.functions]);

    return useMutation({
        mutationFn: async (params: PushToStoreParams): Promise<PushResponse> => {
            console.log('[usePushToStore] Starting push:', {
                type: params.type,
                count: params.ids.length,
                force: params.force,
            });
            return executePush(params);
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
            console.error(`[useAutoSync] Auto-sync failed for ${type} ${id}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            toast.error('Synchronisation automatique échouée', {
                description: `Les données sont sauvegardées localement. ${errorMessage}`,
                action: {
                    label: 'Réessayer',
                    onClick: () => triggerAutoSync(id),
                },
            });
            // Don't throw - auto-sync failure shouldn't break the save flow
            return null;
        }
    }, [pushMutation, type]);

    return {
        triggerAutoSync,
        isAutoSyncing: pushMutation.isPending,
    };
}
