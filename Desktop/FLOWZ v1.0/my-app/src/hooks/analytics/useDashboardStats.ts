/**
 * useDashboardStats - Hook pour récupérer les statistiques globales du dashboard
 *
 * FIXED: Added storeId parameter for multi-store filtering
 * When storeId is provided, stats are filtered to that store only
 * When storeId is null/undefined, returns stats across all stores
 */
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useStores } from '@/hooks/stores/useStores';

export interface DashboardStats {
    totalProducts: number;
    syncedProducts: number;
    pendingProducts: number;
    errorProducts: number;
    totalStores: number;
    activeStores: number;
    totalJobs: number;
    failedJobs: number;
}

// Query key factory for proper cache management
export const dashboardStatsKeys = {
    all: ['dashboard-stats'] as const,
    byStore: (storeId: string | null) => ['dashboard-stats', storeId] as const,
};

export function useDashboardStats(storeId?: string) {
    const supabase = createClient();
    const { data: stores, isLoading: isLoadingStores } = useStores();

    return useQuery({
        // FIXED: Include storeId in query key for proper refetching on store change
        queryKey: dashboardStatsKeys.byStore(storeId || null),
        queryFn: async (): Promise<DashboardStats> => {
            // Helper to build product queries with optional store filter
            const buildProductQuery = () => {
                let query = supabase.from('products').select('*', { count: 'exact', head: true });
                if (storeId) {
                    query = query.eq('store_id', storeId);
                }
                return query;
            };

            // Helper to build sync_jobs queries with optional store filter
            const buildJobsQuery = () => {
                let query = supabase.from('sync_jobs').select('*', { count: 'exact', head: true });
                if (storeId) {
                    query = query.eq('store_id', storeId);
                }
                return query;
            };

            // Parallel requests for stats - FIXED: All queries now filter by store_id
            const [
                { count: totalProducts },
                { count: syncedProducts },
                { count: pendingProducts },
                { count: errorProducts },
                { count: totalJobs },
                { count: failedJobs },
            ] = await Promise.all([
                buildProductQuery(),
                buildProductQuery().eq('sync_status', 'synced'),
                buildProductQuery().eq('sync_status', 'pending'),
                buildProductQuery().eq('sync_status', 'error'),
                buildJobsQuery(),
                buildJobsQuery().eq('status', 'failed'),
            ]);

            return {
                totalProducts: totalProducts || 0,
                syncedProducts: syncedProducts || 0,
                pendingProducts: pendingProducts || 0,
                errorProducts: errorProducts || 0,
                totalStores: stores?.length || 0,
                activeStores: stores?.filter(s => s.status === 'active').length || 0,
                totalJobs: totalJobs || 0,
                failedJobs: failedJobs || 0,
            };
        },
        enabled: !isLoadingStores,
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: true,
    });
}
