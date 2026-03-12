import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useEffect } from 'react';
import { STALE_TIMES } from '@/lib/query-config';
import { createClient } from '@/lib/supabase/client';
import type { SeoBreakdown } from '@/lib/seo/analyzer';

/** Score moyen + nb produits sous le seuil (< 60) pour un pilier SEO */
export interface SeoPillarScore {
    avgScore: number;   // 0-100, moyenne sur le catalogue analysé
    issueCount: number; // nb produits avec score < 60 sur ce pilier
}

/** 6 piliers SEO détaillés — alimentés par les champs f_* du breakdown v2+ */
export interface SeoDetailedPillars {
    meta_title:       SeoPillarScore;
    title_product:    SeoPillarScore;
    meta_description: SeoPillarScore;
    description:      SeoPillarScore;
    images:           SeoPillarScore;
    slug:             SeoPillarScore;
}

export interface SeoGlobalScoreData {
    averageScore: number;
    analyzedProductsCount: number;
    totalProductsCount: number;
    criticalCount: number;
    warningCount: number;
    goodCount: number;
    previousMonthChange: number;
    breakdown: SeoBreakdown;
    detailedPillars: SeoDetailedPillars;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_BREAKDOWN: SeoBreakdown = { titles: 0, descriptions: 0, images: 0, technical: 0 };

const DEFAULT_PILLAR: SeoPillarScore = { avgScore: 0, issueCount: 0 };

const DEFAULT_PILLARS: SeoDetailedPillars = {
    meta_title:       DEFAULT_PILLAR,
    title_product:    DEFAULT_PILLAR,
    meta_description: DEFAULT_PILLAR,
    description:      DEFAULT_PILLAR,
    images:           DEFAULT_PILLAR,
    slug:             DEFAULT_PILLAR,
};

const DEFAULT_DATA: SeoGlobalScoreData = {
    averageScore: 0,
    analyzedProductsCount: 0,
    totalProductsCount: 0,
    criticalCount: 0,
    warningCount: 0,
    goodCount: 0,
    previousMonthChange: 0,
    breakdown: DEFAULT_BREAKDOWN,
    detailedPillars: DEFAULT_PILLARS,
};

/** Derive pillar score from aggregate /25 value when f_* fields are absent */
function fromAggregate(val: number): number {
    return Math.min(100, Math.round(val * 4));
}

/** Build pillars from RPC response, with fallback to breakdown aggregates */
function parsePillars(
    pillars: Record<string, { avgScore: number; issueCount: number }> | undefined,
    breakdown: SeoBreakdown,
): SeoDetailedPillars {
    if (pillars && pillars.meta_title && typeof pillars.meta_title.avgScore === 'number') {
        return {
            meta_title:       pillars.meta_title,
            title_product:    pillars.title_product ?? DEFAULT_PILLAR,
            meta_description: pillars.meta_description ?? DEFAULT_PILLAR,
            description:      pillars.description ?? DEFAULT_PILLAR,
            images:           pillars.images ?? DEFAULT_PILLAR,
            slug:             pillars.slug ?? DEFAULT_PILLAR,
        };
    }

    // Fallback: derive from 4-category breakdown (/25 → /100)
    const mk = (v: number): SeoPillarScore => ({
        avgScore: fromAggregate(v),
        issueCount: 0,
    });
    return {
        meta_title:       mk(breakdown.titles),
        title_product:    mk(breakdown.titles),
        meta_description: mk(breakdown.descriptions),
        description:      mk(breakdown.descriptions),
        images:           mk(breakdown.images),
        slug:             mk(breakdown.technical),
    };
}

/**
 * Hook pour récupérer le score SEO global + 6 piliers détaillés.
 * Auto-triggers batch analysis when products lack scores.
 */
export function useSeoGlobalScore(storeId: string | null) {
    const isValidId = storeId !== null && UUID_REGEX.test(storeId);
    const queryClient = useQueryClient();
    const batchRunningRef = useRef(false);

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['seo-global-score', storeId],
        queryFn: async (): Promise<SeoGlobalScoreData> => {
            const supabase = createClient();

            const { data: rpcResult, error: rpcError } = await supabase.rpc('get_seo_global_score', {
                p_store_id: storeId!,
            });

            if (rpcError) {
                if (rpcError.message?.includes('get_seo_global_score')) {
                    return DEFAULT_DATA;
                }
                throw new Error(rpcError.message);
            }

            const r = rpcResult as Record<string, unknown>;
            const breakdown: SeoBreakdown = (r.breakdown as SeoBreakdown) ?? DEFAULT_BREAKDOWN;
            const pillars = r.pillars as Record<string, { avgScore: number; issueCount: number }> | undefined;

            return {
                averageScore: (r.averageScore as number) ?? 0,
                analyzedProductsCount: (r.analyzedProductsCount as number) ?? 0,
                totalProductsCount: (r.totalProductsCount as number) ?? 0,
                criticalCount: (r.criticalCount as number) ?? 0,
                warningCount: (r.warningCount as number) ?? 0,
                goodCount: (r.goodCount as number) ?? 0,
                previousMonthChange: (r.previousMonthChange as number) ?? 0,
                breakdown,
                detailedPillars: parsePillars(pillars, breakdown),
            };
        },
        enabled: isValidId,
        staleTime: STALE_TIMES.DETAIL,
        placeholderData: DEFAULT_DATA,
    });

    // ── Auto-batch: enrich products that lack seo_breakdown ────────
    const batchMutation = useMutation({
        mutationFn: async (sid: string) => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60_000);
            try {
                const res = await fetch('/api/seo/batch-analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ store_id: sid }),
                    signal: controller.signal,
                });
                if (!res.ok) return { analyzed: 0, remaining: 0 };
                return res.json() as Promise<{ analyzed: number; remaining: number }>;
            } finally {
                clearTimeout(timeout);
            }
        },
        onSuccess: async (result) => {
            if (result.analyzed > 0) {
                // Refetch RPC to update UI with new scores
                await queryClient.invalidateQueries({ queryKey: ['seo-global-score', storeId] });
            }
            // Continue if more products need scoring
            if (result.remaining > 0 && storeId) {
                batchMutation.mutate(storeId);
            } else {
                batchRunningRef.current = false;
            }
        },
        onError: () => {
            batchRunningRef.current = false;
        },
    });

    const triggerBatch = useCallback(() => {
        if (!storeId || batchRunningRef.current) return;
        batchRunningRef.current = true;
        batchMutation.mutate(storeId);
    }, [storeId, batchMutation]);

    // Auto-trigger when we detect unscored products
    useEffect(() => {
        if (!data || !storeId) return;
        const hasUnscored = data.analyzedProductsCount < data.totalProductsCount;
        if (hasUnscored && !batchRunningRef.current) {
            triggerBatch();
        }
    }, [data, storeId, triggerBatch]);

    return {
        data: data ?? DEFAULT_DATA,
        isLoading,
        isError,
        error: error as Error | null,
        refetch,
        isBatchRunning: batchMutation.isPending,
    };
}
