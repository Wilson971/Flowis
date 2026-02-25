import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-config';
import type {
  DashboardKPIs,
  DashboardContext,
  UseDashboardKPIsReturn,
  KPIPeriod,
} from '@/types/dashboard';
import { createClient } from '@/lib/supabase/client';
import { useSelectedStore } from '@/contexts/StoreContext';

/**
 * useDashboardKPIs Hook
 *
 * Fetches and manages dashboard KPI data from Supabase
 * Uses React Query for proper caching and automatic refetching on store change
 */


// Query key factory for dashboard stats
export const dashboardKeys = {
  all: ['dashboard-stats'] as const,
  byStore: (storeId: string | null) => ['dashboard-stats', storeId] as const,
};

export const useDashboardKPIs = (period: KPIPeriod = 'current_month', storeId?: string): UseDashboardKPIsReturn => {
  const { selectedStore, stores } = useSelectedStore();
  const supabase = createClient();

  // Use the storeId parameter - this is the key for filtering
  const effectiveStoreId = storeId || null;

  const { data, isLoading, isError, error, refetch } = useQuery({
    // IMPORTANT: Include storeId in the query key so React Query refetches when store changes
    queryKey: dashboardKeys.byStore(effectiveStoreId),
    queryFn: async () => {



      const { data: stats, error: rpcError } = await supabase
        .rpc('get_dashboard_stats', { p_store_id: effectiveStoreId });

      if (rpcError) {
        throw rpcError;
      }




      // Safe destructuring of result
      const stat = stats && stats[0] ? stats[0] : {
        total_products: 0,
        total_categories: 0,
        total_blog_posts: 0,
        analyzed_products_count: 0,
        seo_avg_score: 0,
        products_with_errors: 0,
        published_blog_posts: 0,
        draft_blog_posts: 0,
        last_sync_date: null,
        // New fields from extended RPC
        store_last_synced_at: null,
        ai_optimized_products: 0,
        seo_avg_score_prev_month: null,
        ai_optimized_prev_month: null,
      };

      // Construct Context
      const context: DashboardContext = {
        selectedShopId: effectiveStoreId,
        selectedShopName: selectedStore?.name || 'Vue d\'ensemble',
        selectedShopPlatform: selectedStore?.platform || null,
        connectionStatus: selectedStore?.connection_status === 'connected' ? 'connected' : 'disconnected',
        totalAccountShops: stores.length,
        activeShopsCount: stores.filter(s => s.connection_status === 'connected').length,
        shopStats: {
          totalProducts: Number(stat.total_products),
          totalCategories: Number(stat.total_categories),
          totalBlogPosts: Number(stat.total_blog_posts),
          syncErrors: Number(stat.products_with_errors)
        }
      };

      // Construct KPIs
      const totalProducts = Number(stat.total_products);
      const aiOptimized = Number(stat.ai_optimized_products ?? 0);

      const kpis: DashboardKPIs = {
        period: period,
        seoHealth: {
          averageScore: Number(stat.seo_avg_score),
          analyzedProductsCount: Number(stat.analyzed_products_count),
          criticalCount: 0,
          warningCount: 0,
          goodCount: 0,
          topIssue: null
        },
        // SEO trend from M-1 snapshot
        seoScorePrevMonth: stat.seo_avg_score_prev_month != null
          ? Number(stat.seo_avg_score_prev_month)
          : null,
        productContentGeneratedCount: aiOptimized,
        productFieldsBreakdown: {
          title: aiOptimized,
          short_description: aiOptimized,
          description: aiOptimized,
          seo_title: aiOptimized,
          seo_description: aiOptimized,
          alt_text: 0
        },
        // Real AI coverage: products with working_content IS NOT NULL
        catalogCoveragePercent: totalProducts > 0
          ? Math.round((aiOptimized / totalProducts) * 100 * 10) / 10
          : 0,
        totalFieldsToOptimize: totalProducts - aiOptimized,
        aiOptimizedProducts: aiOptimized,
        aiOptimizedPrevMonth: stat.ai_optimized_prev_month != null
          ? Number(stat.ai_optimized_prev_month)
          : null,
        blogStats: {
          totalArticles: Number(stat.total_blog_posts),
          publishedCount: Number(stat.published_blog_posts),
          draftCount: Number(stat.draft_blog_posts),
          lastCreatedAt: stat.last_sync_date
        },
        // Real last sync from stores.last_synced_at
        storeLastSyncedAt: stat.store_last_synced_at ?? null,
        activeShopsCount: context.activeShopsCount,
        blogContentGeneratedCount: Number(stat.total_blog_posts)
      };

      return { context, kpis };
    },
    // Refetch when the storeId changes (built into queryKey)
    staleTime: STALE_TIMES.LIST,
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Upsert daily KPI snapshot once per store per day
  useEffect(() => {
    if (!effectiveStoreId || isLoading) return;
    const key = `snapshot-${effectiveStoreId}-${new Date().toISOString().slice(0, 10)}`;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key)) return;
    supabase.rpc('upsert_daily_snapshot', { p_store_id: effectiveStoreId })
      .then(() => {
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, '1');
      })
      .catch(() => { /* silent — snapshot is best-effort */ });
  }, [effectiveStoreId, isLoading, supabase]);

  return {
    context: data?.context,
    kpis: data?.kpis || null,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
};
