/**
 * Products Hooks
 *
 * React Query hooks for managing product data.
 * Compatible with TanStack Query v5.
 *
 * NOTE: For product SAVE operations, use useProductSave (comprehensive dirty fields, optimistic locking).
 * For PUSH to store, use usePushToStore (correct edge function contract).
 * For DRAFT accept/reject, use useProductContent (granular field-level operations).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type {
  Product,
  ProductStats,
  BatchGenerationRequest,
  BatchJobItem,
} from '@/types/product';

/** Max products per page for list views */
const PRODUCTS_PAGE_SIZE = 200;

/**
 * List columns for product list views (excludes heavy JSONB fields).
 * Full metadata/working_content/draft_generated_content are loaded per-product via useProduct().
 */
const LIST_COLUMNS = 'id, title, platform_product_id, image_url, ai_enhanced, dirty_fields_content, last_synced_at, stock, store_id, imported_at, updated_at, status, platform, tenant_id';

/**
 * Fetch products for a store with server-side pagination.
 * Heavy JSONB columns (metadata, working_content, draft_generated_content) are excluded
 * from list queries to prevent OOM on large catalogs.
 */
export function useProducts(storeId?: string) {
  return useQuery({
    queryKey: ['products', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const supabase = createClient();

      // Try with seo_score column; fall back if migration not yet applied
      let { data, error } = await supabase
        .from('products')
        .select(`${LIST_COLUMNS}, seo_score`)
        .eq('store_id', storeId)
        .order('imported_at', { ascending: false })
        .order('title', { ascending: true })
        .order('id', { ascending: true })
        .limit(PRODUCTS_PAGE_SIZE);

      if (error && error.message?.includes('seo_score')) {
        const retry = await supabase
          .from('products')
          .select(LIST_COLUMNS)
          .eq('store_id', storeId)
          .order('imported_at', { ascending: false })
          .order('title', { ascending: true })
          .order('id', { ascending: true })
          .limit(PRODUCTS_PAGE_SIZE);
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      return (data || []) as Product[];
    },
    enabled: !!storeId,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Fetch a single product by ID (with related data)
 */
export function useProduct(productId: string) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          studio_jobs:studio_jobs(*),
          product_seo_analysis:product_seo_analysis(*),
          product_serp_analysis:product_serp_analysis(*)
        `
        )
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes — avoid re-fetching during edit session
    refetchOnWindowFocus: false, // Don't refetch on tab switch during editing
  });
}

/**
 * Fetch product statistics using server-side counts.
 * Uses head:true + count:'exact' to avoid transferring full rows.
 */
export function useProductStats(storeId?: string) {
  return useQuery({
    queryKey: ['product-stats', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const supabase = createClient();

      // Run count queries in parallel for efficiency
      const [totalRes, optimizedRes, withDraftsRes, needsSyncRes] = await Promise.all([
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeId),
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .eq('ai_enhanced', true),
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .not('draft_generated_content', 'is', null),
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .not('dirty_fields_content', 'eq', '[]')
          .not('dirty_fields_content', 'is', null),
      ]);

      if (totalRes.error) throw totalRes.error;

      const total = totalRes.count || 0;
      const optimized = optimizedRes.count || 0;

      return {
        total,
        optimized,
        notOptimized: total - optimized,
        withDrafts: withDraftsRes.count || 0,
        needsSync: needsSyncRes.count || 0,
      } as ProductStats;
    },
    enabled: !!storeId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Start batch generation for products (simple mutation via edge function).
 *
 * Used by useDraftActions for single-field regeneration.
 * For SSE-based batch generation with progress tracking, use useBatchGeneration from './useBatchGeneration'.
 */
export function useBatchGenerationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: BatchGenerationRequest) => {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke('batch-generation', {
        body: request,
      });

      if (error) throw error;
      return data as { batch_job_id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

/**
 * Get batch job items
 */
export function useBatchJobItems(batchJobId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['batch-job-items', batchJobId],
    queryFn: async () => {
      if (!batchJobId) return [];
      const supabase = createClient();

      const { data, error } = await supabase
        .from('batch_job_items')
        .select(
          `
          *,
          products:products(id, title, image_url)
        `
        )
        .eq('batch_job_id', batchJobId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as BatchJobItem[];
    },
    enabled: enabled && !!batchJobId,
    staleTime: 1000, // Deduplicate concurrent poll requests
    refetchInterval: 2000, // Poll every 2 seconds
  });
}
