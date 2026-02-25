import { useQuery } from '@tanstack/react-query';
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
    criticalCount: 0,
    warningCount: 0,
    goodCount: 0,
    previousMonthChange: 0,
    breakdown: DEFAULT_BREAKDOWN,
    detailedPillars: DEFAULT_PILLARS,
};

/** Derive pillar score from aggregate /25 value when f_* fields are absent (old data) */
function fromAggregate(val: number): number {
    return Math.min(100, Math.round(val * 4));
}

/**
 * Agrège les 6 piliers SEO depuis les f_* champs du breakdown (v2+).
 * Fallback automatique sur les valeurs agrégées /25 pour les anciens produits.
 */
function aggregatePillars(
    withBreakdown: Array<{ seo_breakdown: unknown }>,
    breakdown: SeoBreakdown,
): SeoDetailedPillars {
    if (withBreakdown.length === 0) return DEFAULT_PILLARS;

    // Produits avec champs f_* (analyzer v2+)
    const withFields = withBreakdown.filter(p => {
        const bd = p.seo_breakdown as SeoBreakdown;
        return bd.f_meta_title !== undefined;
    });

    // Si aucun produit n'a encore les champs f_*, dériver depuis les agrégats /25
    if (withFields.length === 0) {
        const mk = (v: number): SeoPillarScore => ({
            avgScore: fromAggregate(v),
            issueCount: fromAggregate(v) < 60 ? withBreakdown.length : 0,
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

    // Agréger les scores f_* sur les produits qui les ont
    const n = withFields.length;
    const sum = { meta_title: 0, title: 0, meta_desc: 0, desc: 0, images: 0, slug: 0 };

    for (const p of withFields) {
        const bd = p.seo_breakdown as SeoBreakdown;
        sum.meta_title += bd.f_meta_title ?? fromAggregate(bd.titles);
        sum.title      += bd.f_title      ?? fromAggregate(bd.titles);
        sum.meta_desc  += bd.f_meta_description ?? fromAggregate(bd.descriptions);
        sum.desc       += bd.f_description      ?? fromAggregate(bd.descriptions);
        sum.images     += bd.f_images    ?? fromAggregate(bd.images);
        sum.slug       += bd.f_slug      ?? fromAggregate(bd.technical);
    }

    const avg = (v: number) => Math.round(v / n);
    const pillar = (v: number): SeoPillarScore => ({
        avgScore: avg(v),
        issueCount: withFields.filter(p => {
            // recompute per-product to count issues — inline
            return avg(v) < 60; // simplified: use avg as proxy
        }).length,
    });

    // Issue counts per pillar (product-level check)
    const issueCount = (getter: (bd: SeoBreakdown) => number) =>
        withFields.filter(p => getter(p.seo_breakdown as SeoBreakdown) < 60).length;

    return {
        meta_title: {
            avgScore: avg(sum.meta_title),
            issueCount: issueCount(bd => bd.f_meta_title ?? fromAggregate(bd.titles)),
        },
        title_product: {
            avgScore: avg(sum.title),
            issueCount: issueCount(bd => bd.f_title ?? fromAggregate(bd.titles)),
        },
        meta_description: {
            avgScore: avg(sum.meta_desc),
            issueCount: issueCount(bd => bd.f_meta_description ?? fromAggregate(bd.descriptions)),
        },
        description: {
            avgScore: avg(sum.desc),
            issueCount: issueCount(bd => bd.f_description ?? fromAggregate(bd.descriptions)),
        },
        images: {
            avgScore: avg(sum.images),
            issueCount: issueCount(bd => bd.f_images ?? fromAggregate(bd.images)),
        },
        slug: {
            avgScore: avg(sum.slug),
            issueCount: issueCount(bd => bd.f_slug ?? fromAggregate(bd.technical)),
        },
    };
}

/**
 * Hook pour récupérer le score SEO global + 6 piliers détaillés
 * Agrège depuis products.seo_score + products.seo_breakdown
 */
export function useSeoGlobalScore(storeId: string | null) {
    const isValidId = storeId !== null && UUID_REGEX.test(storeId);

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['seo-global-score', storeId],
        queryFn: async (): Promise<SeoGlobalScoreData> => {
            const supabase = createClient();

            const { data: products, error: queryError } = await supabase
                .from('products')
                .select('seo_score, seo_breakdown')
                .eq('store_id', storeId!);

            if (queryError) {
                if (queryError.message?.includes('seo_score') || queryError.message?.includes('seo_breakdown')) {
                    return DEFAULT_DATA;
                }
                throw new Error(queryError.message);
            }

            const scored = (products || []).filter(p => p.seo_score !== null);
            const scores = scored.map(p => p.seo_score as number);

            if (scores.length === 0) return DEFAULT_DATA;

            const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

            // Aggregate 4-category breakdown
            const withBreakdown = scored.filter(p => p.seo_breakdown != null);
            let breakdown = DEFAULT_BREAKDOWN;
            if (withBreakdown.length > 0) {
                const sum = { titles: 0, descriptions: 0, images: 0, technical: 0 };
                for (const p of withBreakdown) {
                    const bd = p.seo_breakdown as SeoBreakdown;
                    sum.titles       += bd.titles       ?? 0;
                    sum.descriptions += bd.descriptions ?? 0;
                    sum.images       += bd.images       ?? 0;
                    sum.technical    += bd.technical    ?? 0;
                }
                const n = withBreakdown.length;
                breakdown = {
                    titles:       Math.round(sum.titles / n),
                    descriptions: Math.round(sum.descriptions / n),
                    images:       Math.round(sum.images / n),
                    technical:    Math.round(sum.technical / n),
                };
            }

            // Aggregate 6-pillar detailed scores
            const detailedPillars = aggregatePillars(withBreakdown, breakdown);

            // Fetch M-1 snapshot for trend
            const now = new Date();
            const prevMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
            const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);

            let previousMonthChange = 0;
            const { data: snapshot } = await supabase
                .from('kpi_snapshots')
                .select('metric_value')
                .eq('metric_name', 'seo_avg_score')
                .gte('snapshot_date', prevMonthStart)
                .lte('snapshot_date', prevMonthEnd)
                .order('snapshot_date', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (snapshot?.metric_value != null) {
                previousMonthChange = Math.round(averageScore - Number(snapshot.metric_value));
            }

            return {
                averageScore,
                analyzedProductsCount: scores.length,
                criticalCount: scores.filter(s => s < 50).length,
                warningCount:  scores.filter(s => s >= 50 && s < 70).length,
                goodCount:     scores.filter(s => s >= 70).length,
                previousMonthChange,
                breakdown,
                detailedPillars,
            };
        },
        enabled: isValidId,
        staleTime: STALE_TIMES.DETAIL,
        placeholderData: DEFAULT_DATA,
    });

    return {
        data: data ?? DEFAULT_DATA,
        isLoading,
        isError,
        error: error as Error | null,
        refetch,
    };
}
