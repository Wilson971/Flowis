/**
 * Products Hooks
 *
 * React Query hooks for managing product data
 * Compatible with TanStack Query v5
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type {
  Product,
  ProductStats,
  UnsyncedProductsData,
  BatchGenerationRequest,
  BatchJob,
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
 * Fetch a single product by ID
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
 * Fetch unsynced products
 */
export function useUnsyncedProducts(storeId?: string) {
  return useQuery({
    queryKey: ['unsynced-products', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const supabase = createClient();

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .not('dirty_fields_content', 'is', null);

      if (error) throw error;

      return {
        total: data?.length || 0,
        products: (data || []) as Product[],
      } as UnsyncedProductsData;
    },
    enabled: !!storeId,
  });
}

/**
 * Accept draft content for a product
 */
export function useAcceptDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId }: { productId: string }) => {
      const supabase = createClient();
      // Call Supabase edge function or RPC
      const { data, error } = await supabase.rpc('accept_draft_content', {
        product_id: productId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
    },
  });
}

/**
 * Reject draft content for a product
 */
export function useRejectDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId }: { productId: string }) => {
      const supabase = createClient();
      // Call Supabase edge function or RPC
      const { data, error } = await supabase.rpc('reject_draft_content', {
        product_id: productId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
    },
  });
}

/**
 * Push products to store (sync)
 */
export function usePushToStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ product_ids }: { product_ids: string[] }) => {
      const supabase = createClient();
      // Call Supabase edge function
      const { data, error } = await supabase.functions.invoke('push-to-store', {
        body: { product_ids },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
      queryClient.invalidateQueries({ queryKey: ['unsynced-products'] });
    },
  });
}

/**
 * Cancel sync for products
 */
export function useCancelSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ product_ids }: { product_ids: string[] }) => {
      const supabase = createClient();
      // Call Supabase edge function or RPC
      const { data, error } = await supabase.rpc('cancel_sync', {
        product_ids,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
      queryClient.invalidateQueries({ queryKey: ['unsynced-products'] });
    },
  });
}

/**
 * Start batch generation for products
 */
export function useBatchGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: BatchGenerationRequest) => {
      const supabase = createClient();
      // Call Supabase edge function
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
 * Get batch job status
 */
export function useBatchJobStatus(batchJobId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['batch-job', batchJobId],
    queryFn: async () => {
      if (!batchJobId) return null;
      const supabase = createClient();

      const { data, error } = await supabase
        .from('batch_jobs')
        .select('*')
        .eq('id', batchJobId)
        .single();

      if (error) throw error;
      return data as BatchJob;
    },
    enabled: enabled && !!batchJobId,
    staleTime: 1000, // Deduplicate concurrent poll requests
    refetchInterval: (query) => {
      // Stop polling if job is complete
      const data = query.state.data;
      if (!data) return false;
      if (['completed', 'failed', 'partial'].includes(data.status)) return false;
      return 2000; // Poll every 2 seconds while running
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

/**
 * Update a product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      data: formData,
    }: {
      productId: string;
      data: any;
    }) => {
      const supabase = createClient();
      // 1. Update product table fields
      const { error: productError } = await supabase
        .from('products')
        .update({
          title: formData.title,
          price: formData.regular_price || formData.price, // Fallback to price if regular_price is null
          stock: formData.stock,
          sku: formData.sku,
          updated_at: new Date().toISOString(),
          // Metadata handling - Store rich data here
          metadata: {
            status: formData.status,
            handle: formData.slug,
            attributes: formData.attributes,
            // Extended fields
            regular_price: formData.regular_price,
            sale_price: formData.sale_price,
            categories: formData.categories,
            images: formData.images, // Persist gallery
            product_type: formData.product_type,
            brand: formData.brand,
            weight: formData.weight,
            dimensions: {
              length: formData.dimensions_length,
              width: formData.dimensions_width,
              height: formData.dimensions_height
            },
            shipping_class: formData.shipping_class,
            tax_status: formData.tax_status,
            tax_class: formData.tax_class,
            visibility: formData.catalog_visibility,
            is_virtual: formData.virtual,
            is_downloadable: formData.downloadable
          },
          // Content fields - mapping back form data to working_content
          working_content: {
            title: formData.title,
            short_description: formData.short_description,
            description: formData.description,
            seo: {
              title: formData.meta_title,
              description: formData.meta_description
            }
          }
        })
        .eq('id', productId);

      if (productError) throw productError;

      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
