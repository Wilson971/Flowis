/**
 * useUnifiedSync - Queue-based sync hook for FLOWZ Sync V2
 *
 * Replaces direct sync calls with a durable queue-based approach.
 * Products are added to sync_queue and processed by the background worker.
 *
 * Features:
 * - Selective field sync (only queues dirty fields)
 * - Immediate UI feedback with queue status
 * - Automatic retry with exponential backoff
 * - Dead letter queue for permanent failures
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface QueueSyncOptions {
  /** Product IDs to sync */
  productIds: string[];
  /** Specific fields to sync (optional - defaults to dirty_fields_content) */
  fields?: string[];
  /** Priority (1-10, lower = higher priority) */
  priority?: number;
}

export interface QueueSyncResult {
  success: boolean;
  queued: number;
  skipped: number;
  errors: string[];
  jobs: Array<{
    jobId: string;
    productId: string;
    status: string;
  }>;
}

interface ProductWithStore {
  id: string;
  store_id: string;
  platform_product_id: string | null;
  working_content: Record<string, unknown> | null;
  dirty_fields_content: string[] | null;
  stores: {
    platform: string;
  };
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Unified sync hook that queues products for background synchronization.
 *
 * @example
 * ```tsx
 * const { queueSync, isQueuing } = useUnifiedSync();
 *
 * // Queue specific products
 * await queueSync({ productIds: ['id1', 'id2'] });
 *
 * // Queue with specific fields only
 * await queueSync({
 *   productIds: ['id1'],
 *   fields: ['title', 'description'],
 *   priority: 1 // High priority
 * });
 * ```
 */
export function useUnifiedSync() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const mutation = useMutation({
    mutationFn: async ({
      productIds,
      fields,
      priority = 5,
    }: QueueSyncOptions): Promise<QueueSyncResult> => {



      const result: QueueSyncResult = {
        success: true,
        queued: 0,
        skipped: 0,
        errors: [],
        jobs: [],
      };

      // Fetch products to get their dirty fields and working content
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select(`
          id,
          store_id,
          platform_product_id,
          working_content,
          dirty_fields_content,
          stores!inner (
            platform
          )
        `)
        .in('id', productIds);

      if (fetchError) {
        throw new Error(`Failed to fetch products: ${fetchError.message}`);
      }

      if (!products || products.length === 0) {
        result.skipped = productIds.length;
        return result;
      }

      // Build jobs for each product
      const jobs: Array<{
        store_id: string;
        product_id: string;
        direction: 'push';
        priority: number;
        dirty_fields: string[];
        payload: Record<string, unknown>;
        platform: string;
        platform_product_id: string;
        idempotency_key: string;
      }> = [];

      for (const product of products as unknown as ProductWithStore[]) {
        // Determine dirty fields
        const dirtyFields = fields || product.dirty_fields_content || [];

        // Skip if no dirty fields
        if (dirtyFields.length === 0) {
          result.skipped++;
          continue;
        }

        // Skip if no platform product ID (not yet synced to store)
        if (!product.platform_product_id) {
          result.skipped++;
          result.errors.push(`Product ${product.id} has no platform_product_id`);
          continue;
        }

        jobs.push({
          store_id: product.store_id,
          product_id: product.id,
          direction: 'push',
          priority,
          dirty_fields: dirtyFields,
          payload: product.working_content || {},
          platform: product.stores.platform,
          platform_product_id: product.platform_product_id,
          idempotency_key: `${product.id}-push-${Date.now()}`,
        });
      }

      if (jobs.length === 0) {
        return result;
      }

      // Insert jobs into sync_queue
      const { data: insertedJobs, error: insertError } = await supabase
        .from('sync_queue')
        .insert(jobs)
        .select('id, product_id, status');

      if (insertError) {
        throw new Error(`Failed to queue sync: ${insertError.message}`);
      }

      // Update product sync status
      const queuedProductIds = jobs.map((j) => j.product_id);

      await supabase
        .from('products')
        .update({
          sync_status: 'pending_push',
          updated_at: new Date().toISOString(),
        })
        .in('id', queuedProductIds);

      // Build result
      result.queued = insertedJobs?.length || 0;
      result.jobs = (insertedJobs || []).map((j) => ({
        jobId: j.id,
        productId: j.product_id,
        status: j.status,
      }));




      return result;
    },

    onMutate: async ({ productIds }) => {
      // Optimistically update product status in cache
      for (const productId of productIds) {
        queryClient.setQueryData(['product', productId], (old: unknown) => {
          if (!old || typeof old !== 'object') return old;
          return {
            ...(old as Record<string, unknown>),
            sync_status: 'pending_push',
          };
        });
      }
    },

    onSuccess: (result) => {
      if (result.queued > 0) {
        toast.success('Synchronisation en file', {
          description: `${result.queued} produit(s) ajouté(s) à la file de synchronisation.${
            result.skipped > 0 ? ` ${result.skipped} ignoré(s).` : ''
          }`,
          duration: 4000,
        });
      } else if (result.skipped > 0) {
        toast.info('Aucun produit à synchroniser', {
          description: `${result.skipped} produit(s) n'ont pas de modifications à synchroniser.`,
          duration: 3000,
        });
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['unsynced-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sync-queue'] });
    },

    onError: (error, variables) => {
      console.error('[useUnifiedSync] Error:', error);

      // Rollback optimistic updates
      for (const productId of variables.productIds) {
        queryClient.invalidateQueries({ queryKey: ['product', productId] });
      }

      toast.error('Erreur de synchronisation', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    },
  });

  return {
    queueSync: mutation.mutateAsync,
    queueSyncMutate: mutation.mutate,
    isQueuing: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
  };
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Queue a single product for sync.
 */
export function useSyncProduct() {
  const { queueSync, isQueuing, error } = useUnifiedSync();

  const syncProduct = async (productId: string, fields?: string[]) => {
    return queueSync({
      productIds: [productId],
      fields,
      priority: 3, // Higher priority for single product
    });
  };

  return { syncProduct, isQueuing, error };
}

/**
 * Queue all unsynced products for a store.
 */
export function useSyncAllProducts(storeId: string | undefined) {
  const { queueSync, isQueuing, error } = useUnifiedSync();
  const supabase = createClient();

  const syncAll = async () => {
    if (!storeId) return;

    // Fetch all unsynced product IDs
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id')
      .eq('store_id', storeId)
      .not('dirty_fields_content', 'eq', '{}')
      .not('dirty_fields_content', 'is', null);

    if (fetchError) {
      throw new Error(`Failed to fetch unsynced products: ${fetchError.message}`);
    }

    if (!products || products.length === 0) {
      return { queued: 0, skipped: 0 };
    }

    return queueSync({
      productIds: products.map((p) => p.id),
      priority: 5, // Normal priority for bulk sync
    });
  };

  return { syncAll, isQueuing, error };
}
