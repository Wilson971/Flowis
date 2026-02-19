/**
 * useProductContent - Hook pour gérer le contenu produit (triple-buffer)
 * 
 * Architecture triple-buffer:
 * - store_snapshot_content: Contenu synchronisé depuis la boutique
 * - working_content: Contenu de travail local
 * - draft_generated_content: Propositions IA en attente d'approbation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { ContentData, ProductContentBuffer } from '@/types/productContent';
import { computeDirtyFields } from './computeDirtyFields';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Retire un champ du draft de manière propre
 */
function removeFieldFromDraft(draft: ContentData, field: string): ContentData {
    const result = { ...draft };

    if (field === 'seo.title' || field === 'seo.description') {
        const seoField = field === 'seo.title' ? 'title' : 'description';
        if (result.seo) {
            const updatedSeo = { ...result.seo };
            delete updatedSeo[seoField];

            // Si l'objet SEO est vide, le supprimer
            if (!updatedSeo.title && !updatedSeo.description) {
                delete result.seo;
            } else {
                result.seo = updatedSeo;
            }
        }
    } else if (field === 'images') {
        delete result.images;
    } else {
        delete result[field as keyof ContentData];
    }

    return result;
}

/**
 * Vérifie si le draft contient des propositions valides
 */
function hasValidDraftContent(draft: ContentData | null): boolean {
    if (!draft) return false;

    const validFields = ['title', 'description', 'short_description', 'sku', 'images'];

    for (const field of validFields) {
        const value = draft[field as keyof ContentData];
        if (value !== undefined && value !== null && value !== '') {
            return true;
        }
    }

    // Check SEO
    if (draft.seo?.title || draft.seo?.description) {
        return true;
    }

    return false;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

interface ProductContentData extends ProductContentBuffer {
    id: string;
    content_version: number;
    platform: string;
}

/**
 * Hook pour lire le contenu d'un produit
 */
export function useProductContent(productId: string | null) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['product-content', productId],
        queryFn: async (): Promise<ProductContentData | null> => {
            if (!productId) return null;

            const { data, error } = await supabase
                .from('products')
                .select(`
                    id,
                    store_snapshot_content,
                    working_content,
                    draft_generated_content,
                    dirty_fields_content,
                    store_content_updated_at,
                    working_content_updated_at,
                    platform,
                    content_version
                `)
                .eq('id', productId)
                .single();

            if (error) throw error;

            return {
                id: data.id,
                store_snapshot_content: data.store_snapshot_content as ContentData,
                working_content: data.working_content as ContentData,
                draft_generated_content: data.draft_generated_content as ContentData | null,
                dirty_fields_content: (Array.isArray(data.dirty_fields_content)
                    ? data.dirty_fields_content.filter((i: unknown) => typeof i === 'string')
                    : []) as string[],
                store_content_updated_at: data.store_content_updated_at,
                working_content_updated_at: data.working_content_updated_at,
                content_version: (data.content_version as number) ?? 1,
                platform: data.platform,
            };
        },
        enabled: !!productId,
        staleTime: 30_000, // 30s — dedup rapid mounts; realtime/invalidation covers live updates
        refetchOnMount: true,
        refetchOnWindowFocus: true, // Safe: content data doesn't overwrite form state
    });
}

/**
 * Hook pour mettre à jour le working_content
 */
export function useUpdateWorkingContent() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({
            productId,
            workingContent,
        }: {
            productId: string;
            workingContent: ContentData;
        }) => {
            // Récupérer le snapshot pour calculer les dirty fields
            const { data: current } = await supabase
                .from('products')
                .select('store_snapshot_content')
                .eq('id', productId)
                .single();

            if (!current) throw new Error('Product not found');

            const dirtyFields = computeDirtyFields(
                workingContent,
                current.store_snapshot_content as ContentData
            );

            const { data, error } = await supabase
                .from('products')
                .update({
                    working_content: workingContent,
                    dirty_fields_content: dirtyFields,
                    working_content_updated_at: new Date().toISOString(),
                })
                .eq('id', productId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product-content', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Modifications enregistrées');
        },
        onError: (error: Error) => {
            toast.error('Erreur', { description: error.message });
        },
    });
}

/**
 * Hook pour accepter un brouillon généré (granulaire ou global)
 */
export function useAcceptDraft() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({
            productId,
            field,
        }: {
            productId: string;
            field?: string;
        }) => {
            const { data: current } = await supabase
                .from('products')
                .select('draft_generated_content, working_content, store_snapshot_content')
                .eq('id', productId)
                .single();

            if (!current?.draft_generated_content) {
                throw new Error('Aucun brouillon à accepter');
            }

            const draft = current.draft_generated_content as ContentData;
            const working = (current.working_content as ContentData) || {};
            const snapshot = current.store_snapshot_content as ContentData;

            // Acceptation granulaire d'un champ
            if (field) {
                let updatedWorking: ContentData;
                let updatedDraft: ContentData;

                if (field === 'seo.title' || field === 'seo.description') {
                    const seoField = field === 'seo.title' ? 'title' : 'description';
                    const draftValue = draft.seo?.[seoField];
                    if (!draftValue) throw new Error(`Pas de valeur pour ${field}`);

                    updatedWorking = {
                        ...working,
                        seo: { ...working.seo, [seoField]: draftValue },
                    };
                    updatedDraft = removeFieldFromDraft(draft, field);
                } else if (field === 'images') {
                    if (!draft.images?.length) throw new Error('Pas d\'images à accepter');
                    updatedWorking = { ...working, images: draft.images };
                    updatedDraft = removeFieldFromDraft(draft, field);
                } else {
                    const draftValue = draft[field as keyof ContentData];
                    if (draftValue === undefined) throw new Error(`Pas de valeur pour ${field}`);

                    updatedWorking = { ...working, [field]: draftValue };
                    updatedDraft = removeFieldFromDraft(draft, field);
                }

                const dirtyFields = computeDirtyFields(updatedWorking, snapshot);
                const finalDraft = hasValidDraftContent(updatedDraft) ? updatedDraft : null;

                const { data, error } = await supabase
                    .from('products')
                    .update({
                        working_content: updatedWorking,
                        draft_generated_content: finalDraft,
                        dirty_fields_content: dirtyFields,
                        working_content_updated_at: new Date().toISOString(),
                    })
                    .eq('id', productId)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }

            // Acceptation globale
            const dirtyFields = computeDirtyFields(draft, snapshot);

            const { data, error } = await supabase
                .from('products')
                .update({
                    working_content: draft,
                    draft_generated_content: null,
                    dirty_fields_content: dirtyFields,
                    working_content_updated_at: new Date().toISOString(),
                })
                .eq('id', productId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product-content', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Modifications acceptées');
        },
        onError: (error: Error) => {
            toast.error('Erreur', { description: error.message });
        },
    });
}

/**
 * Hook pour rejeter un brouillon généré
 */
export function useRejectDraft() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({
            productId,
            field,
        }: {
            productId: string;
            field?: string;
        }) => {
            if (field) {
                // Rejet granulaire
                const { data: current } = await supabase
                    .from('products')
                    .select('draft_generated_content, working_content')
                    .eq('id', productId)
                    .single();

                if (!current?.draft_generated_content) {
                    throw new Error('Aucun brouillon à rejeter');
                }

                const draft = current.draft_generated_content as ContentData;
                const working = current.working_content as ContentData;
                const updatedDraft = removeFieldFromDraft(draft, field);
                const finalDraft = hasValidDraftContent(updatedDraft) ? updatedDraft : null;

                const { data, error } = await supabase
                    .from('products')
                    .update({ draft_generated_content: finalDraft })
                    .eq('id', productId)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }

            // Rejet global
            const { data, error } = await supabase
                .from('products')
                .update({ draft_generated_content: null })
                .eq('id', productId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product-content', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
            toast.success('Brouillon rejeté');
        },
        onError: (error: Error) => {
            toast.error('Erreur', { description: error.message });
        },
    });
}

/**
 * Hook pour récupérer les dirty fields
 */
export function useDirtyFields(productId: string | null) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['dirty-fields', productId],
        queryFn: async () => {
            if (!productId) return [];

            const { data, error } = await supabase
                .from('products')
                .select('dirty_fields_content')
                .eq('id', productId)
                .single();

            if (error) throw error;

            return (Array.isArray(data?.dirty_fields_content)
                ? data.dirty_fields_content.filter((i: unknown) => typeof i === 'string')
                : []) as string[];
        },
        enabled: !!productId,
    });
}
