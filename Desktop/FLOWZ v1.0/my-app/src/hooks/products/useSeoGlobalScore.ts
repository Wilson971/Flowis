import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface SeoGlobalScoreData {
    averageScore: number;
    analyzedProductsCount: number;
    criticalCount: number;
    warningCount: number;
    goodCount: number;
    previousMonthChange: number; // Difference with previous month
}

interface UseSeoGlobalScoreReturn {
    data: SeoGlobalScoreData | null;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer le score SEO global depuis Supabase
 * Utilise la RPC get_seo_global_score
 */

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidUUID = (value: string | null): boolean => {
    return value !== null && UUID_REGEX.test(value);
};

export function useSeoGlobalScore(storeId: string | null): UseSeoGlobalScoreReturn {
    const [data, setData] = useState<SeoGlobalScoreData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        // Validate storeId is a real UUID (not mock data like "mock-shop-1")
        if (!storeId || !isValidUUID(storeId)) {
            setData({
                averageScore: 0,
                analyzedProductsCount: 0,
                criticalCount: 0,
                warningCount: 0,
                goodCount: 0,
                previousMonthChange: 0,
            });
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setIsError(false);
            setError(null);

            const supabase = createClient();

            const { data: result, error: rpcError } = await supabase
                .rpc('get_seo_global_score', { p_store_id: storeId });

            if (rpcError) {
                throw new Error(rpcError.message);
            }

            if (result && result.length > 0) {
                const row = result[0];
                const previousMonthChange = row.average_score - (row.previous_month_average || row.average_score);

                setData({
                    averageScore: row.average_score || 0,
                    analyzedProductsCount: row.analyzed_products_count || 0,
                    criticalCount: row.critical_count || 0,
                    warningCount: row.warning_count || 0,
                    goodCount: row.good_count || 0,
                    previousMonthChange,
                });
            } else {
                // No data - set defaults
                setData({
                    averageScore: 0,
                    analyzedProductsCount: 0,
                    criticalCount: 0,
                    warningCount: 0,
                    goodCount: 0,
                    previousMonthChange: 0,
                });
            }
        } catch (err) {
            setIsError(true);
            setError(err instanceof Error ? err : new Error('Unknown error'));
            console.error('Failed to fetch SEO global score:', err);
        } finally {
            setIsLoading(false);
        }
    }, [storeId]);

    const refetch = useCallback(async () => {
        await fetchData();
    }, [fetchData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        isLoading,
        isError,
        error,
        refetch,
    };
}
