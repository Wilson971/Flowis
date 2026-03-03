/**
 * useStoreKPIs - Hook pour récupérer les KPIs d'une boutique
 *
 * Combine requêtes directes (catégories, sync jobs) + RPC get_store_metrics
 * pour les métriques AI/SEO/blog (Scope 4).
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-config';
import { createClient } from '@/lib/supabase/client';
import type { StoreKPIs, StoreMetrics } from '@/types/store';

/**
 * Hook to get KPIs for a specific store
 */
export function useStoreKPIs(storeId: string | null) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['store-kpis', storeId],
        queryFn: async (): Promise<StoreKPIs | null> => {
            if (!storeId) return null;

            const [categoriesResult, syncJobsResult, storeResult, metricsResult] = await Promise.all([
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

                // Store for last sync timestamp
                supabase
                    .from('stores')
                    .select('last_synced_at')
                    .eq('id', storeId)
                    .single(),

                // Scope 4: aggregated metrics via RPC
                supabase
                    .rpc('get_store_metrics', { p_store_id: storeId })
                    .single(),
            ]);

            const metrics = (metricsResult.data ?? null) as StoreMetrics | null;

            const totalProducts = metrics?.total_products ?? 0;
            const optimizedProducts = metrics?.products_with_ai ?? 0;

            const totalCategories = categoriesResult.count || 0;

            const syncJobs = syncJobsResult.data || [];
            const successfulJobs = syncJobs.filter(j => j.status === 'completed').length;
            const syncSuccessRate = syncJobs.length > 0
                ? Math.round((successfulJobs / syncJobs.length) * 100)
                : 0;

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
                pendingProducts: 0,
                totalCategories,
                lastSyncAt: storeResult.data?.last_synced_at || null,
                syncSuccessRate,
                avgSyncDuration,
                // Scope 4 extended
                totalBlogPosts: metrics?.total_blog_posts ?? 0,
                avgSeoScore: metrics?.avg_seo_score ?? 0,
                coveragePercent: metrics?.coverage_percent ?? 0,
                productsWithoutDesc: metrics?.products_without_desc ?? 0,
            };
        },
        enabled: !!storeId,
        staleTime: STALE_TIMES.DETAIL,
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
