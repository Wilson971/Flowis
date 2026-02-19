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

/**
 * Fetch all products for a store
 */
export function useProducts(storeId?: string) {
  return useQuery({
    queryKey: ['products', storeId],
    queryFn: async () => {
      if (!storeId) return [];
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
        .eq('store_id', storeId)
        .order('imported_at', { ascending: false })
        .order('title', { ascending: true })
        .order('id', { ascending: true });

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
 * Fetch product statistics
 */
export function useProductStats(storeId?: string) {
  return useQuery({
    queryKey: ['product-stats', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const supabase = createClient();

      const { data, error } = await supabase
        .from('products')
        .select('id, ai_enhanced, draft_generated_content, dirty_fields_content')
        .eq('store_id', storeId);

      if (error) throw error;

      const total = data?.length || 0;
      const optimized = data?.filter((p) => p.ai_enhanced).length || 0;
      const notOptimized = total - optimized;
      const withDrafts = data?.filter((p) => p.draft_generated_content !== null).length || 0;
      const needsSync =
        data?.filter(
          (p) => p.dirty_fields_content && p.dirty_fields_content.length > 0
        ).length || 0;

      return {
        total,
        optimized,
        notOptimized,
        withDrafts,
        needsSync,
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
