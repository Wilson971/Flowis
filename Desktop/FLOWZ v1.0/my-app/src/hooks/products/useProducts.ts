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
import { STALE_TIMES } from '@/lib/query-config';
import { createClient } from '@/lib/supabase/client';
import type {
  Product,
  ProductStats,
  BatchGenerationRequest,
  BatchJobItem,
} from '@/types/product';

/**
 * List columns for product list views (excludes heavy JSONB fields).
 * Full metadata/working_content/draft_generated_content are loaded per-product via useProduct().
 */
const LIST_COLUMNS = 'id, title, platform_product_id, image_url, ai_enhanced, dirty_fields_content, last_synced_at, stock, stock_status, manage_stock, store_id, imported_at, updated_at, status, platform, tenant_id, price, regular_price, sale_price, product_type, metadata, draft_generated_content';

/** Server-side filter parameters for product list queries */
export interface ProductListFilters {
  search?: string;
  status?: string;
  type?: string;
  ai_status?: string;
  sync_status?: string;
  stock?: string;
  price_range?: string;
  price_min?: string;
  price_max?: string;
  seo_score?: string;
  sales?: string;
  page?: number;
  pageSize?: number;
}

/** Result shape for paginated product queries */
export interface ProductListResult {
  products: Product[];
  totalCount: number;
}

/**
 * Apply server-side filters to a Supabase products query.
 * Uses `any` for the query builder because Supabase's chained generic types
 * are not inferrable across filter branches.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyServerFilters(query: any, filters: ProductListFilters) {
  // Text search (title or platform_product_id)
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,platform_product_id.ilike.%${filters.search}%`);
  }

  // Status filter (uses metadata->status via JSONB operator)
  if (filters.status && filters.status !== 'all') {
    query = query.eq('metadata->>status', filters.status);
  }

  // Product type filter
  if (filters.type && filters.type !== 'all') {
    query = query.eq('product_type', filters.type);
  }

  // AI status filter
  if (filters.ai_status && filters.ai_status !== 'all') {
    switch (filters.ai_status) {
      case 'optimized':
        query = query.eq('ai_enhanced', true);
        break;
      case 'not_optimized':
        query = query.eq('ai_enhanced', false);
        break;
      case 'has_draft':
        query = query.not('draft_generated_content', 'is', null);
        break;
    }
  }

  // Sync status filter
  if (filters.sync_status && filters.sync_status !== 'all') {
    switch (filters.sync_status) {
      case 'synced':
        query = query.not('last_synced_at', 'is', null);
        // Synced = last_synced_at exists AND no dirty fields
        query = query.or('dirty_fields_content.is.null,dirty_fields_content.eq.[]');
        break;
      case 'pending':
        query = query.not('dirty_fields_content', 'is', null).not('dirty_fields_content', 'eq', '[]');
        break;
      case 'never':
        query = query.is('last_synced_at', null);
        break;
    }
  }

  // Stock filter
  if (filters.stock && filters.stock !== 'all') {
    switch (filters.stock) {
      case 'in_stock':
        query = query.gt('stock', 0);
        break;
      case 'low_stock':
        query = query.gt('stock', 0).lte('stock', 10);
        break;
      case 'out_of_stock':
        query = query.lte('stock', 0);
        break;
    }
  }

  // Price filter
  if (filters.price_range && filters.price_range !== 'all') {
    if (filters.price_range === 'custom') {
      const min = filters.price_min ? Number(filters.price_min) : 0;
      const max = filters.price_max ? Number(filters.price_max) : undefined;
      query = query.gte('price', min);
      if (max !== undefined) query = query.lte('price', max);
    } else if (filters.price_range === '500+') {
      query = query.gte('price', 500);
    } else {
      const [min, max] = filters.price_range.split('-').map(Number);
      query = query.gte('price', min).lt('price', max);
    }
  }

  // SEO score filter
  if (filters.seo_score && filters.seo_score !== 'all') {
    switch (filters.seo_score) {
      case 'excellent':
        query = query.gte('seo_score', 80);
        break;
      case 'good':
        query = query.gte('seo_score', 50).lt('seo_score', 80);
        break;
      case 'low':
        query = query.lt('seo_score', 50).not('seo_score', 'is', null);
        break;
      case 'none':
        query = query.is('seo_score', null);
        break;
    }
  }

  // Sales filter (JSONB metadata->total_sales, cast to int)
  if (filters.sales && filters.sales !== 'all') {
    switch (filters.sales) {
      case 'no_sales':
        query = query.or('metadata->total_sales.is.null,metadata->total_sales.eq.0');
        break;
      case '1-10':
        query = query.gte('metadata->total_sales', 1).lte('metadata->total_sales', 10);
        break;
      case '11-50':
        query = query.gte('metadata->total_sales', 11).lte('metadata->total_sales', 50);
        break;
      case '50+':
        query = query.gte('metadata->total_sales', 50);
        break;
    }
  }

  return query;
}

/**
 * Fetch products for a store with server-side pagination and filtering.
 * Uses Supabase count:'exact' + .range() for true server-side pagination.
 */
export function useProducts(storeId?: string, filters: ProductListFilters = {}) {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 25;

  return useQuery({
    queryKey: ['products', storeId, filters],
    queryFn: async (): Promise<ProductListResult> => {
      if (!storeId) return { products: [], totalCount: 0 };
      const supabase = createClient();

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Try with seo_score column; fall back if migration not yet applied
      let query = supabase
        .from('products')
        .select(`${LIST_COLUMNS}, seo_score`, { count: 'exact' })
        .eq('store_id', storeId);

      query = applyServerFilters(query, filters) as typeof query;

      let { data, error, count } = await query
        .order('imported_at', { ascending: false })
        .order('title', { ascending: true })
        .order('id', { ascending: true })
        .range(from, to);

      if (error && error.message?.includes('seo_score')) {
        let fallbackQuery = supabase
          .from('products')
          .select(LIST_COLUMNS, { count: 'exact' })
          .eq('store_id', storeId);

        fallbackQuery = applyServerFilters(fallbackQuery, filters) as typeof fallbackQuery;

        const retry = await fallbackQuery
          .order('imported_at', { ascending: false })
          .order('title', { ascending: true })
          .order('id', { ascending: true })
          .range(from, to);
        data = retry.data;
        error = retry.error;
        count = retry.count;
      }

      if (error) throw error;
      return {
        products: (data || []) as Product[],
        totalCount: count ?? 0,
      };
    },
    enabled: !!storeId,
    staleTime: STALE_TIMES.LIST,
    placeholderData: (prev) => prev, // Keep previous data while loading new page
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
          id, title, platform_product_id, image_url, ai_enhanced, dirty_fields_content,
          last_synced_at, stock, stock_status, manage_stock, store_id, imported_at,
          updated_at, status, platform, tenant_id, price, regular_price, sale_price,
          product_type, sku, metadata, working_content, draft_generated_content, seo_score,
          studio_jobs:studio_jobs(id, action, status, output_urls, error_message, created_at, batch_id)
            .order(created_at, { ascending: false })
            .limit(10),
          product_seo_analysis:product_seo_analysis(id, score, title_score, description_score, created_at)
            .order(created_at, { ascending: false })
            .limit(1),
          product_serp_analysis:product_serp_analysis(id, keyword, position, url, created_at)
            .order(created_at, { ascending: false })
            .limit(5)
        `
        )
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!productId,
    staleTime: STALE_TIMES.STATIC, // avoid re-fetching during edit session
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
    staleTime: STALE_TIMES.DETAIL,
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
    staleTime: STALE_TIMES.POLLING, // Deduplicate concurrent poll requests
    refetchInterval: () => {
      if (typeof document !== 'undefined' && document.hidden) return false;
      return 2000;
    },
  });
}
