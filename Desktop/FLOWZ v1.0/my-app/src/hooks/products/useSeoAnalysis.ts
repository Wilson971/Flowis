/**
 * useSeoAnalysis - Hook pour l'analyse SEO des produits
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface SeoScore {
    category: string;
    score: number;
    maxScore: number;
    issues: SeoIssue[];
}

export interface SeoIssue {
    type: 'error' | 'warning' | 'success' | 'info';
    message: string;
    field?: string;
    suggestion?: string;
}

export interface SeoAnalysis {
    id: string;
    product_id: string;
    overall_score: number;
    title_score: number;
    description_score: number;
    meta_score: number;
    images_score: number;
    structure_score: number;
    issues: SeoIssue[];
    recommendations: string[];
    focus_keyword?: string;
    keyword_density?: number;
    analyzed_at: string;
    created_at: string;
    updated_at: string;
}

export type SeoStatus = 'excellent' | 'good' | 'needs_work' | 'poor' | 'not_analyzed';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtenir le statut SEO basé sur le score
 */
export function getSeoStatus(score: number | null | undefined): SeoStatus {
    if (score === null || score === undefined) return 'not_analyzed';
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'needs_work';
    return 'poor';
}

/**
 * Obtenir la couleur du statut SEO
 */
export function getSeoColor(status: SeoStatus): string {
    switch (status) {
        case 'excellent':
            return 'text-green-500';
        case 'good':
            return 'text-blue-500';
        case 'needs_work':
            return 'text-amber-500';
        case 'poor':
            return 'text-red-500';
        default:
            return 'text-gray-400';
    }
}

/**
 * Obtenir le badge du statut SEO
 */
export function getSeoLabel(status: SeoStatus): string {
    switch (status) {
        case 'excellent':
            return 'Excellent';
        case 'good':
            return 'Bon';
        case 'needs_work':
            return 'À améliorer';
        case 'poor':
            return 'Faible';
        default:
            return 'Non analysé';
    }
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook pour récupérer l'analyse SEO d'un produit
 */
export function useSeoAnalysis(productId?: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['seo-analysis', productId],
        queryFn: async () => {
            if (!productId) return null;

            const { data, error } = await supabase
                .from('product_seo_analysis')
                .select('*')
                .eq('product_id', productId)
                .order('analyzed_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data as SeoAnalysis | null;
        },
        enabled: !!productId,
    });
}

/**
 * Hook pour déclencher une analyse SEO
 */
export function useRunSeoAnalysis() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({
            productId,
            focusKeyword,
        }: {
            productId: string;
            focusKeyword?: string;
        }) => {
            const { data, error } = await supabase.functions.invoke('analyze-seo', {
                body: {
                    product_id: productId,
                    focus_keyword: focusKeyword,
                },
            });

            if (error) throw error;
            return data as SeoAnalysis;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['seo-analysis', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
            toast.success('Analyse SEO terminée');
        },
        onError: (error: Error) => {
            toast.error('Erreur d\'analyse', { description: error.message });
        },
    });
}

/**
 * Hook pour récupérer le score SEO rapide d'un produit
 */
export function useProductSeoScore(productId?: string) {
    const { data: analysis, isLoading } = useSeoAnalysis(productId);

    const score = analysis?.overall_score ?? null;
    const status = getSeoStatus(score);

    return {
        score,
        status,
        color: getSeoColor(status),
        label: getSeoLabel(status),
        isLoading,
        hasAnalysis: !!analysis,
        analyzedAt: analysis?.analyzed_at,
    };
}

/**
 * Hook pour récupérer les statistiques SEO d'une boutique
 */
export function useSeoStats(storeId?: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['seo-stats', storeId],
        queryFn: async () => {
            if (!storeId) return null;

            // Récupérer les analyses SEO des produits de la boutique
            const { data, error } = await supabase
                .from('product_seo_analysis')
                .select(`
                    overall_score,
                    products!inner(store_id)
                `)
                .eq('products.store_id', storeId);

            if (error) throw error;

            const scores = (data || []).map(d => d.overall_score);
            const total = scores.length;

            if (total === 0) {
                return {
                    total: 0,
                    analyzed: 0,
                    averageScore: 0,
                    excellent: 0,
                    good: 0,
                    needsWork: 0,
                    poor: 0,
                };
            }

            const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / total);

            return {
                total,
                analyzed: total,
                averageScore,
                excellent: scores.filter(s => s >= 80).length,
                good: scores.filter(s => s >= 60 && s < 80).length,
                needsWork: scores.filter(s => s >= 40 && s < 60).length,
                poor: scores.filter(s => s < 40).length,
            };
        },
        enabled: !!storeId,
        staleTime: 60000, // 1 minute
    });
}

/**
 * Hook pour l'analyse SEO batch
 */
export function useBatchSeoAnalysis() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({
            productIds,
            focusKeyword,
        }: {
            productIds: string[];
            focusKeyword?: string;
        }) => {
            const { data, error } = await supabase.functions.invoke('batch-analyze-seo', {
                body: {
                    product_ids: productIds,
                    focus_keyword: focusKeyword,
                },
            });

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            // Invalider toutes les analyses concernées
            variables.productIds.forEach(id => {
                queryClient.invalidateQueries({ queryKey: ['seo-analysis', id] });
                queryClient.invalidateQueries({ queryKey: ['product', id] });
            });
            queryClient.invalidateQueries({ queryKey: ['seo-stats'] });
            toast.success('Analyses SEO terminées', {
                description: `${variables.productIds.length} produit(s) analysé(s)`,
            });
        },
        onError: (error: Error) => {
            toast.error('Erreur d\'analyse batch', { description: error.message });
        },
    });
}
