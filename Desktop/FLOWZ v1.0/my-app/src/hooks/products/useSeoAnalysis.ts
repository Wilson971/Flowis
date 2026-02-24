/**
 * useSeoAnalysis - Hook pour l'analyse SEO des produits (queries)
 * Simplifié : lit seo_score directement depuis la table products.
 * Helpers de statut/couleur/label utilisent les seuils unifiés 5 niveaux.
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-config';
import { createClient } from '@/lib/supabase/client';
import { getScoreColor, getScoreLabel, getScoreLevelKey } from '@/lib/seo/scoreColors';
import type { SeoLevelKey } from '@/types/seo';

// ============================================================================
// TYPES
// ============================================================================

export type SeoStatus = SeoLevelKey | 'not_analyzed';

// ============================================================================
// HELPERS (unified 5-level system)
// ============================================================================

/**
 * Obtenir le statut SEO basé sur le score (unified 5-level)
 */
export function getSeoStatus(score: number | null | undefined): SeoStatus {
    if (score === null || score === undefined) return 'not_analyzed';
    return getScoreLevelKey(score);
}

/**
 * Obtenir la couleur Tailwind du statut SEO
 */
export function getSeoColor(status: SeoStatus): string {
    if (status === 'not_analyzed') return 'text-muted-foreground';
    const scoreMap: Record<SeoLevelKey, number> = {
        excellent: 95,
        good: 80,
        average: 60,
        poor: 40,
        critical: 15,
    };
    return getScoreColor(scoreMap[status]);
}

/**
 * Obtenir le label du statut SEO
 */
export function getSeoLabel(status: SeoStatus): string {
    if (status === 'not_analyzed') return 'Non analysé';
    const scoreMap: Record<SeoLevelKey, number> = {
        excellent: 95,
        good: 80,
        average: 60,
        poor: 40,
        critical: 15,
    };
    return getScoreLabel(scoreMap[status]);
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook pour récupérer le score SEO d'un produit (depuis la colonne seo_score)
 */
export function useProductSeoScore(productId?: string) {
    const supabase = createClient();

    const { data, isLoading } = useQuery({
        queryKey: ['product-seo-score', productId],
        queryFn: async () => {
            if (!productId) return null;

            const { data: product, error } = await supabase
                .from('products')
                .select('seo_score')
                .eq('id', productId)
                .single();

            if (error) return null;
            return product?.seo_score as number | null;
        },
        enabled: !!productId,
        staleTime: STALE_TIMES.DETAIL,
    });

    const score = data ?? null;
    const status = getSeoStatus(score);

    return {
        score,
        status,
        color: getSeoColor(status),
        label: getSeoLabel(status),
        isLoading,
        hasAnalysis: score !== null,
    };
}

/**
 * Hook pour récupérer les statistiques SEO d'une boutique
 * Agrège directement depuis products.seo_score
 */
export function useSeoStats(storeId?: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['seo-stats', storeId],
        queryFn: async () => {
            if (!storeId) return null;

            const { data, error } = await supabase
                .from('products')
                .select('seo_score')
                .eq('store_id', storeId);

            // If seo_score column doesn't exist yet, return null gracefully
            if (error) {
                if (error.message?.includes('seo_score')) return null;
                throw error;
            }

            const products = data || [];
            const scored = products.filter(p => p.seo_score !== null);
            const scores = scored.map(p => p.seo_score as number);
            const total = products.length;

            if (scored.length === 0) {
                return {
                    total,
                    analyzed: 0,
                    averageScore: 0,
                    excellent: 0,
                    good: 0,
                    average: 0,
                    poor: 0,
                    critical: 0,
                };
            }

            const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

            return {
                total,
                analyzed: scored.length,
                averageScore,
                excellent: scores.filter(s => s >= 90).length,
                good: scores.filter(s => s >= 70 && s < 90).length,
                average: scores.filter(s => s >= 50 && s < 70).length,
                poor: scores.filter(s => s >= 30 && s < 50).length,
                critical: scores.filter(s => s < 30).length,
            };
        },
        enabled: !!storeId,
        staleTime: STALE_TIMES.DETAIL,
    });
}
