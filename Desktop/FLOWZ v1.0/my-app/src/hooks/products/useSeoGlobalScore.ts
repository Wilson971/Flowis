import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-config';
import { createClient } from '@/lib/supabase/client';

export interface SeoGlobalScoreData {
    averageScore: number;
    analyzedProductsCount: number;
    criticalCount: number;
    warningCount: number;
    goodCount: number;
    previousMonthChange: number;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_DATA: SeoGlobalScoreData = {
    averageScore: 0,
    analyzedProductsCount: 0,
    criticalCount: 0,
    warningCount: 0,
    goodCount: 0,
    previousMonthChange: 0,
};

/**
 * Hook pour récupérer le score SEO global
 * Agrège directement depuis products.seo_score
 */
export function useSeoGlobalScore(storeId: string | null) {
    const isValidId = storeId !== null && UUID_REGEX.test(storeId);

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['seo-global-score', storeId],
        queryFn: async (): Promise<SeoGlobalScoreData> => {
            const supabase = createClient();

            const { data: products, error: queryError } = await supabase
                .from('products')
                .select('seo_score')
                .eq('store_id', storeId!);

            // If seo_score column doesn't exist yet (migration pending), return defaults
            if (queryError) {
                if (queryError.message?.includes('seo_score')) return DEFAULT_DATA;
                throw new Error(queryError.message);
            }

            const scored = (products || []).filter(p => p.seo_score !== null);
            const scores = scored.map(p => p.seo_score as number);

            if (scores.length === 0) return DEFAULT_DATA;

            const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

            return {
                averageScore,
                analyzedProductsCount: scores.length,
                criticalCount: scores.filter(s => s < 50).length,
                warningCount: scores.filter(s => s >= 50 && s < 70).length,
                goodCount: scores.filter(s => s >= 70).length,
                previousMonthChange: 0, // TODO: implement with kpi_snapshots
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
