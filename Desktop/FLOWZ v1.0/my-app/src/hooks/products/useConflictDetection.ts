/**
 * useConflictDetection - Hook pour détecter et résoudre les conflits produit
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { ContentData } from '@/types/productContent';

// ============================================================================
// TYPES
// ============================================================================

export interface ContentConflict {
    field: string;
    storeValue: unknown;
    localValue: unknown;
    lastSyncAt: string;
    storeUpdatedAt?: string | null;
    localUpdatedAt?: string | null;
}

export interface ConflictResolution {
    field: string;
    resolution: 'keep_local' | 'use_store' | 'merge';
    mergedValue?: unknown;
}

export interface ConflictDetectionResult {
    hasConflict: boolean;
    conflicts: ContentConflict[];
    lastSyncAt: string | null;
    storeUpdatedAt: string | null;
    localUpdatedAt: string | null;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Compare deux valeurs pour détecter les différences
 */
function valuesAreDifferent(a: unknown, b: unknown): boolean {
    if (a === b) return false;
    if (a === null || a === undefined) return b !== null && b !== undefined;
    if (b === null || b === undefined) return true;

    // Pour les objets et tableaux, comparer en JSON
    if (typeof a === 'object' && typeof b === 'object') {
        return JSON.stringify(a) !== JSON.stringify(b);
    }

    return a !== b;
}

/**
 * Détecte les conflits entre le contenu local et le snapshot boutique
 */
function detectConflicts(
    working: ContentData | null,
    snapshot: ContentData | null,
    storeUpdatedAt: string | null,
    localUpdatedAt: string | null,
    lastSyncAt: string | null
): ConflictDetectionResult {
    const conflicts: ContentConflict[] = [];

    if (!working || !snapshot) {
        return {
            hasConflict: false,
            conflicts: [],
            lastSyncAt,
            storeUpdatedAt,
            localUpdatedAt,
        };
    }

    // Vérifier si la boutique a été mise à jour après la dernière sync
    const storeHasUpdated = storeUpdatedAt && lastSyncAt
        ? new Date(storeUpdatedAt) > new Date(lastSyncAt)
        : false;

    if (!storeHasUpdated) {
        return {
            hasConflict: false,
            conflicts: [],
            lastSyncAt,
            storeUpdatedAt,
            localUpdatedAt,
        };
    }

    // Champs à vérifier
    const fieldsToCheck: (keyof ContentData)[] = [
        'title',
        'description',
        'short_description',
        'sku',
        'slug',
        'price',
        'regular_price',
        'sale_price',
        'stock',
    ];

    for (const field of fieldsToCheck) {
        const localValue = working[field];
        const storeValue = snapshot[field];

        if (valuesAreDifferent(localValue, storeValue)) {
            conflicts.push({
                field,
                storeValue,
                localValue,
                lastSyncAt: lastSyncAt || '',
                storeUpdatedAt,
                localUpdatedAt,
            });
        }
    }

    // Vérifier SEO
    if (working.seo && snapshot.seo) {
        if (valuesAreDifferent(working.seo.title, snapshot.seo.title)) {
            conflicts.push({
                field: 'seo.title',
                storeValue: snapshot.seo.title,
                localValue: working.seo.title,
                lastSyncAt: lastSyncAt || '',
            });
        }
        if (valuesAreDifferent(working.seo.description, snapshot.seo.description)) {
            conflicts.push({
                field: 'seo.description',
                storeValue: snapshot.seo.description,
                localValue: working.seo.description,
                lastSyncAt: lastSyncAt || '',
            });
        }
    }

    return {
        hasConflict: conflicts.length > 0,
        conflicts,
        lastSyncAt,
        storeUpdatedAt,
        localUpdatedAt,
    };
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook pour détecter les conflits d'un produit
 */
export function useConflictDetection(productId?: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['product-conflicts', productId],
        queryFn: async (): Promise<ConflictDetectionResult> => {
            if (!productId) {
                return {
                    hasConflict: false,
                    conflicts: [],
                    lastSyncAt: null,
                    storeUpdatedAt: null,
                    localUpdatedAt: null,
                };
            }

            const { data, error } = await supabase
                .from('products')
                .select(`
                    working_content,
                    store_snapshot_content,
                    last_synced_at,
                    store_content_updated_at,
                    working_content_updated_at
                `)
                .eq('id', productId)
                .single();

            if (error) throw error;

            return detectConflicts(
                data.working_content as ContentData,
                data.store_snapshot_content as ContentData,
                data.store_content_updated_at,
                data.working_content_updated_at,
                data.last_synced_at
            );
        },
        enabled: !!productId,
        staleTime: STALE_TIMES.LIST,
    });
}

/**
 * Hook pour résoudre les conflits
 */
export function useResolveConflicts() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({
            productId,
            resolutions,
        }: {
            productId: string;
            resolutions: ConflictResolution[];
        }) => {
            // Récupérer les contenus actuels
            const { data: product } = await supabase
                .from('products')
                .select('working_content, store_snapshot_content')
                .eq('id', productId)
                .single();

            if (!product) throw new Error('Produit non trouvé');

            const working = (product.working_content || {}) as ContentData;
            const snapshot = product.store_snapshot_content as ContentData;

            // Appliquer les résolutions
            const resolvedContent: ContentData = { ...working };

            for (const resolution of resolutions) {
                const { field, resolution: action, mergedValue } = resolution;

                if (field.startsWith('seo.')) {
                    const seoField = field.replace('seo.', '') as 'title' | 'description';
                    resolvedContent.seo = resolvedContent.seo || {};

                    switch (action) {
                        case 'use_store':
                            resolvedContent.seo[seoField] = snapshot.seo?.[seoField];
                            break;
                        case 'merge':
                            resolvedContent.seo[seoField] = mergedValue as string;
                            break;
                        // keep_local: ne rien faire
                    }
                } else {
                    switch (action) {
                        case 'use_store':
                            (resolvedContent as unknown as Record<string, unknown>)[field] = (snapshot as unknown as Record<string, unknown>)[field];
                            break;
                        case 'merge':
                            (resolvedContent as unknown as Record<string, unknown>)[field] = mergedValue;
                            break;
                        // keep_local: ne rien faire
                    }
                }
            }

            // Sauvegarder le contenu résolu
            // Recalculer les dirty fields (diff entre resolved et snapshot)
            const dirtyFields: string[] = [];
            const fieldsToCompare = ['title', 'description', 'short_description', 'sku', 'slug', 'regular_price', 'sale_price', 'stock', 'status', 'categories', 'tags', 'images'];
            for (const f of fieldsToCompare) {
                if (valuesAreDifferent(
                    (resolvedContent as unknown as Record<string, unknown>)[f],
                    (snapshot as unknown as Record<string, unknown>)[f]
                )) {
                    dirtyFields.push(f);
                }
            }

            const now = new Date().toISOString();
            const { error } = await supabase
                .from('products')
                .update({
                    working_content: resolvedContent,
                    working_content_updated_at: now,
                    dirty_fields_content: dirtyFields,
                    // Acknowledge store changes: set last_synced_at to clear the conflict flag
                    last_synced_at: now,
                })
                .eq('id', productId);

            if (error) throw error;

            return { productId, resolved: resolutions.length };
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product-content', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product-conflicts', variables.productId] });
            toast.success('Conflits résolus');
        },
        onError: (error: Error) => {
            toast.error('Erreur', { description: error.message });
        },
    });
}

/**
 * Hook pour forcer l'utilisation du contenu boutique
 */
export function useForceStoreContent() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ productId }: { productId: string }) => {
            const { data: product } = await supabase
                .from('products')
                .select('store_snapshot_content')
                .eq('id', productId)
                .single();

            if (!product) throw new Error('Produit non trouvé');

            const now = new Date().toISOString();
            const { error } = await supabase
                .from('products')
                .update({
                    working_content: product.store_snapshot_content,
                    dirty_fields_content: [],
                    working_content_updated_at: now,
                    // Clear conflict flag by acknowledging store content
                    last_synced_at: now,
                })
                .eq('id', productId);

            if (error) throw error;
            return { productId };
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product-content', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product-conflicts', variables.productId] });
            toast.success('Contenu boutique appliqué');
        },
        onError: (error: Error) => {
            toast.error('Erreur', { description: error.message });
        },
    });
}
