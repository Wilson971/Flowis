import { useQuery } from '@tanstack/react-query';
import type {
  DashboardKPIs,
  DashboardContext,
  UseDashboardKPIsReturn,
  KPIPeriod,
} from '@/types/dashboard';
import { createClient } from '@/lib/supabase/client';
import { useSelectedStore } from '../contexts/StoreContext';

/**
 * useDashboardKPIs Hook
 *
 * Fetches and manages dashboard KPI data from Supabase
 * Uses React Query for proper caching and automatic refetching on store change
 */

// Helper to calculate time saved based on stats
const calculateEstimatedTimeSaved = (productsCount: number, blogCount: number) => {
  const PRODUCT_TIME_MIN = 20;
  const BLOG_TIME_MIN = 120;
  return (productsCount * PRODUCT_TIME_MIN) + (blogCount * BLOG_TIME_MIN);
};

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
      console.log('[useDashboardKPIs] Fetching stats for store:', effectiveStoreId);

      const { data: stats, error: rpcError } = await supabase
        .rpc('get_dashboard_stats', { p_store_id: effectiveStoreId });

      if (rpcError) {
        console.error('[useDashboardKPIs] RPC error:', rpcError);
        throw rpcError;
      }

      console.log('[useDashboardKPIs] Received stats:', stats);

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
        last_sync_date: null
      };

      // Construct Context
      const context: DashboardContext = {
        selectedShopId: effectiveStoreId,
        selectedShopName: selectedStore?.name || 'Vue d\'ensemble',
        selectedShopPlatform: selectedStore?.platform || null,
        connectionStatus: selectedStore?.status === 'active' ? 'connected' :
          selectedStore?.status === 'error' ? 'pending' : 'disconnected',
        totalAccountShops: stores.length,
        activeShopsCount: stores.filter(s => s.status === 'active').length,
        shopStats: {
          totalProducts: Number(stat.total_products),
          totalCategories: Number(stat.total_categories),
          totalBlogPosts: Number(stat.total_blog_posts),
          syncErrors: Number(stat.products_with_errors)
        }
      };

      // Construct KPIs
      const timeSavedMinutes = calculateEstimatedTimeSaved(
        Number(stat.total_products),
        Number(stat.total_blog_posts)
      );

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
        productContentGeneratedCount: Number(stat.total_products) * 4,
        productFieldsBreakdown: {
          title: Number(stat.total_products),
          short_description: Number(stat.total_products),
          description: Number(stat.total_products),
          seo_title: Number(stat.total_products),
          seo_description: Number(stat.total_products),
          alt_text: 0
        },
        catalogCoveragePercent: stat.total_products > 0 ? (stat.analyzed_products_count / stat.total_products) * 100 : 0,
        totalFieldsToOptimize: 0,
        blogStats: {
          totalArticles: Number(stat.total_blog_posts),
          publishedCount: Number(stat.published_blog_posts),
          draftCount: Number(stat.draft_blog_posts),
          lastCreatedAt: stat.last_sync_date
        },
        timeSavedMinutes: timeSavedMinutes,
        moneySavedEuros: Math.round((timeSavedMinutes / 60) * 30),
        activeShopsCount: context.activeShopsCount,
        blogContentGeneratedCount: Number(stat.total_blog_posts)
      };

      return { context, kpis };
    },
    // Refetch when the storeId changes (built into queryKey)
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    context: data?.context,
    kpis: data?.kpis || null,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
};
