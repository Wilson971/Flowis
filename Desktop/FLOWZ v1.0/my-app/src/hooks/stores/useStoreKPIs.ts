/**
 * useStoreKPIs - Hook pour récupérer les KPIs d'une boutique
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-config';
import { createClient } from '@/lib/supabase/client';
import type { StoreKPIs } from '@/types/store';

/**
 * Hook to get KPIs for a specific store
 */
export function useStoreKPIs(storeId: string | null) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['store-kpis', storeId],
        queryFn: async (): Promise<StoreKPIs | null> => {
            if (!storeId) return null;

            // Parallel queries for efficiency
            const [totalResult, optimizedResult, categoriesResult, syncJobsResult, storeResult] = await Promise.all([
                // Total products count (head: true avoids fetching rows)
                supabase
                    .from('products')
                    .select('id', { count: 'exact', head: true })
                    .eq('store_id', storeId),

                // AI-optimized products count (working_content IS NOT NULL)
                supabase
                    .from('products')
                    .select('id', { count: 'exact', head: true })
                    .eq('store_id', storeId)
                    .not('working_content', 'is', null),

                // Total categories
                supabase
                    .from('categories')
                    .select('id', { count: 'exact', head: true })
                    .eq('store_id', storeId),

                // Recent sync jobs for success rate
                supabase
                    .from('sync_jobs')
                    .select('id, status, started_at, completed_at')
                    .eq('store_id', storeId)
                    .order('created_at', { ascending: false })
                    .limit(10),

                // Store for last sync
                supabase
                    .from('stores')
                    .select('last_synced_at')
                    .eq('id', storeId)
                    .single(),
            ]);

            const totalProducts = totalResult.count || 0;
            const optimizedProducts = optimizedResult.count || 0;

            // Pending sync: products with AI content that haven't been pushed to store yet
            // (optimized but not yet synced — approximated as 0 since we'd need sync_status)
            const pendingProducts = 0;

            const totalCategories = categoriesResult.count || 0;

            const syncJobs = syncJobsResult.data || [];
            const successfulJobs = syncJobs.filter(j => j.status === 'completed').length;
            const syncSuccessRate = syncJobs.length > 0
                ? Math.round((successfulJobs / syncJobs.length) * 100)
                : 0;

            // Calculate average sync duration
            let avgSyncDuration = 0;
            const completedJobs = syncJobs.filter(j => j.started_at && j.completed_at);
            if (completedJobs.length > 0) {
                const totalDuration = completedJobs.reduce((sum, j) => {
                    const start = new Date(j.started_at!).getTime();
                    const end = new Date(j.completed_at!).getTime();
                    return sum + (end - start);
                }, 0);
                avgSyncDuration = Math.round(totalDuration / completedJobs.length / 1000);
            }

            return {
                totalProducts,
                optimizedProducts,
                pendingProducts,
                totalCategories,
                lastSyncAt: storeResult.data?.last_synced_at || null,
                syncSuccessRate,
                avgSyncDuration,
            };
        },
        enabled: !!storeId,
        staleTime: STALE_TIMES.STATIC,
    });
}

/**
 * Hook to get KPIs for all stores combined
 */
export function useAllStoresKPIs() {
    const supabase = createClient();

    return useQuery({
        queryKey: ['all-stores-kpis'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            const [storesResult, totalProductsResult, optimizedProductsResult, categoriesResult] = await Promise.all([
                supabase
                    .from('stores')
                    .select('id', { count: 'exact', head: true })
                    .eq('tenant_id', user.id),

                supabase
                    .from('products')
                    .select('id', { count: 'exact', head: true }),

                supabase
                    .from('products')
                    .select('id', { count: 'exact', head: true })
                    .not('working_content', 'is', null),

                supabase
                    .from('categories')
                    .select('id', { count: 'exact', head: true }),
            ]);

            const totalProducts = totalProductsResult.count || 0;
            const optimizedProducts = optimizedProductsResult.count || 0;

            return {
                totalStores: storesResult.count || 0,
                totalProducts,
                optimizedProducts,
                totalCategories: categoriesResult.count || 0,
                optimizationRate: totalProducts > 0
                    ? Math.round((optimizedProducts / totalProducts) * 100)
                    : 0,
            };
        },
        staleTime: STALE_TIMES.STATIC,
    });
}
