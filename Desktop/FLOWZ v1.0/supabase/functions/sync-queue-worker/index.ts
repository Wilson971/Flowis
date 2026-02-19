/**
 * sync-queue-worker - Edge Function to process the sync queue
 *
 * This worker is called periodically by pg_cron (every 30 seconds) to process
 * pending sync jobs from the sync_queue table.
 *
 * Features:
 * - Atomic job claiming with row-level locking (no duplicates)
 * - Selective field sync (only pushes dirty fields)
 * - Exponential backoff retry logic
 * - Dead letter queue for permanent failures
 * - Platform adapter pattern (WooCommerce, Shopify, etc.)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getCorsHeaders } from "../_shared/cors.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  BATCH_SIZE: 10,
  BASE_RETRY_DELAY_MS: 1000,
  MAX_RETRY_DELAY_MS: 300000, // 5 minutes
  REQUEST_TIMEOUT_MS: 30000,
};

// ============================================================================
// TYPES
// ============================================================================

interface SyncJob {
  id: string;
  store_id: string;
  product_id: string;
  direction: 'push' | 'pull';
  priority: number;
  dirty_fields: string[];
  payload: Record<string, unknown>;
  platform: string;
  platform_product_id: string;
  status: string;
  attempt_count: number;
  max_attempts: number;
  last_error: string | null;
}

interface StoreConnection {
  shop_url: string;
  credentials_encrypted?: Record<string, string>;
  api_key?: string;
  api_secret?: string;
}

interface SyncResult {
  success: boolean;
  error?: string;
  retryable?: boolean; // false = permanent failure (e.g. duplicate SKU), skip retries
  updatedProduct?: Record<string, unknown>;
}

interface WorkerResult {
  processed: number;
  succeeded: number;
  failed: number;
  retried: number;
  deadLettered: number;
  results: Array<{
    jobId: string;
    productId: string;
    success: boolean;
    error?: string;
    newStatus?: string;
  }>;
}

// ============================================================================
// PLATFORM ADAPTERS (Inline for Edge Function)
// ============================================================================

interface PlatformAdapter {
  updateProduct(
    productId: string,
    payload: Record<string, unknown>,
    dirtyFields: string[]
  ): Promise<SyncResult>;
}

function createWooCommerceAdapter(
  shopUrl: string,
  consumerKey: string,
  consumerSecret: string
): PlatformAdapter {
  const baseUrl = shopUrl.replace(/\/$/, '');

  return {
    async updateProduct(
      productId: string,
      payload: Record<string, unknown>,
      dirtyFields: string[]
    ): Promise<SyncResult> {
      // Build selective update data
      const updateData = buildWooPayload(payload, dirtyFields);

      if (Object.keys(updateData).length === 0) {
        return { success: true };
      }

      const endpoint = `${baseUrl}/wp-json/wc/v3/products/${productId}`;
      const isWooKeys = consumerKey.startsWith('ck_');

      try {
        let response: Response;

        if (isWooKeys) {
          const url = new URL(endpoint);
          url.searchParams.set('consumer_key', consumerKey);
          url.searchParams.set('consumer_secret', consumerSecret);

          response = await fetchWithTimeout(url.toString(), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          });
        } else {
          const auth = btoa(`${consumerKey}:${consumerSecret}`);
          response = await fetchWithTimeout(endpoint, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify(updateData),
          });
        }

        if (!response.ok) {
          const errorText = await response.text();
          const retryable = response.status >= 500 || response.status === 429;

          // Detect permanent failures that should not be retried
          let errorCode = '';
          try {
            const errJson = JSON.parse(errorText);
            errorCode = errJson?.code || '';
          } catch { /* not JSON */ }

          return {
            success: false,
            retryable: errorCode === 'product_invalid_sku' ? false : retryable,
            error: `WooCommerce API error ${response.status}: ${errorText.slice(0, 200)}`,
          };
        }

        const updatedProduct = await response.json();
        return { success: true, updatedProduct };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Network error',
        };
      }
    },
  };
}

function createShopifyAdapter(
  shopUrl: string,
  accessToken: string
): PlatformAdapter {
  let normalizedUrl = shopUrl.replace(/\/$/, '');
  if (!normalizedUrl.includes('.myshopify.com')) {
    normalizedUrl = `${normalizedUrl}.myshopify.com`;
  }
  normalizedUrl = normalizedUrl.replace(/^https?:\/\//, '');

  const graphqlUrl = `https://${normalizedUrl}/admin/api/2024-01/graphql.json`;

  return {
    async updateProduct(
      productId: string,
      payload: Record<string, unknown>,
      dirtyFields: string[]
    ): Promise<SyncResult> {
      const input = buildShopifyInput(payload, dirtyFields, productId);

      if (Object.keys(input).length === 1) {
        // Only ID, nothing to update
        return { success: true };
      }

      const mutation = `
        mutation productUpdate($input: ProductInput!) {
          productUpdate(input: $input) {
            product { id title updatedAt }
            userErrors { field message }
          }
        }
      `;

      try {
        const response = await fetchWithTimeout(graphqlUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
          },
          body: JSON.stringify({ query: mutation, variables: { input } }),
        });

        if (!response.ok) {
          return {
            success: false,
            error: `Shopify API error: ${response.status}`,
          };
        }

        const data = await response.json();
        const userErrors = data.data?.productUpdate?.userErrors || [];

        if (userErrors.length > 0) {
          return {
            success: false,
            error: userErrors.map((e: { message: string }) => e.message).join(', '),
          };
        }

        return { success: true, updatedProduct: data.data?.productUpdate?.product };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Network error',
        };
      }
    },
  };
}

function createAdapter(
  platform: string,
  connection: StoreConnection
): PlatformAdapter | null {
  const shopUrl = connection.shop_url;

  // Parse credentials
  let consumerKey = '';
  let consumerSecret = '';
  let accessToken = '';

  if (connection.credentials_encrypted) {
    const creds = connection.credentials_encrypted;
    consumerKey = creds.consumer_key || creds.api_key || '';
    consumerSecret = creds.consumer_secret || creds.api_secret || '';
    accessToken = creds.access_token || '';
  }

  // Fallback to direct columns
  if (!consumerKey) consumerKey = connection.api_key || '';
  if (!consumerSecret) consumerSecret = connection.api_secret || '';

  switch (platform.toLowerCase()) {
    case 'woocommerce':
      if (!shopUrl || !consumerKey) return null;
      return createWooCommerceAdapter(shopUrl, consumerKey, consumerSecret);

    case 'shopify':
      if (!shopUrl || !accessToken) return null;
      return createShopifyAdapter(shopUrl, accessToken);

    default:
      console.error(`[sync-queue-worker] Unsupported platform: ${platform}`);
      return null;
  }
}

// ============================================================================
// PAYLOAD BUILDERS
// ============================================================================

function buildWooPayload(
  payload: Record<string, unknown>,
  dirtyFields: string[]
): Record<string, unknown> {
  const updateData: Record<string, unknown> = {};
  const metaData: Array<{ key: string; value: string }> = [];

  for (const field of dirtyFields) {
    const value = payload[field];
    if (value === undefined) continue;

    switch (field) {
      case 'title':
      case 'name':
        updateData.name = value;
        break;
      case 'description':
        updateData.description = value;
        break;
      case 'short_description':
        updateData.short_description = value;
        break;
      case 'sku':
        updateData.sku = value;
        break;
      case 'regular_price':
        updateData.regular_price = String(value);
        break;
      case 'sale_price':
        updateData.sale_price = value ? String(value) : '';
        break;
      case 'stock':
      case 'stock_quantity':
        updateData.stock_quantity = value;
        break;
      case 'stock_status':
        updateData.stock_status = value;
        break;
      case 'manage_stock':
        updateData.manage_stock = value;
        break;
      case 'seo':
        // Handle nested seo object from payload
        if (typeof value === 'object' && value !== null) {
          const seo = value as Record<string, string>;
          if (seo.title) {
            metaData.push({ key: '_yoast_wpseo_title', value: seo.title });
            metaData.push({ key: 'rank_math_title', value: seo.title });
          }
          if (seo.description) {
            metaData.push({ key: '_yoast_wpseo_metadesc', value: seo.description });
            metaData.push({ key: 'rank_math_description', value: seo.description });
          }
        }
        break;
      case 'seo_title':
        metaData.push({ key: '_yoast_wpseo_title', value: String(value) });
        metaData.push({ key: 'rank_math_title', value: String(value) });
        break;
      case 'seo_description':
      case 'meta_description':
        metaData.push({ key: '_yoast_wpseo_metadesc', value: String(value) });
        metaData.push({ key: 'rank_math_description', value: String(value) });
        break;
    }
  }

  if (metaData.length > 0) {
    updateData.meta_data = metaData;
  }

  return updateData;
}

function buildShopifyInput(
  payload: Record<string, unknown>,
  dirtyFields: string[],
  productId: string
): Record<string, unknown> {
  // Convert to global ID if needed
  const gid = productId.startsWith('gid://')
    ? productId
    : `gid://shopify/Product/${productId}`;

  const input: Record<string, unknown> = { id: gid };

  for (const field of dirtyFields) {
    const value = payload[field];
    if (value === undefined) continue;

    switch (field) {
      case 'title':
        input.title = value;
        break;
      case 'slug':
        input.handle = value;
        break;
      case 'description':
        input.descriptionHtml = value;
        break;
      case 'status':
        input.status = value === 'publish' ? 'ACTIVE' : 'DRAFT';
        break;
      case 'seo_title':
      case 'seo_description':
        if (!input.seo) input.seo = {};
        if (field === 'seo_title') (input.seo as Record<string, unknown>).title = value;
        if (field === 'seo_description') (input.seo as Record<string, unknown>).description = value;
        break;
    }
  }

  return input;
}

// ============================================================================
// HELPERS
// ============================================================================

async function fetchWithTimeout(
  url: string,
  options: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function claimJobs(supabase: SupabaseClient): Promise<SyncJob[]> {
  const { data, error } = await supabase.rpc('claim_sync_jobs', {
    p_batch_size: CONFIG.BATCH_SIZE,
    p_direction: 'push',
  });

  if (error) {
    console.error('[sync-queue-worker] Failed to claim jobs:', error);
    return [];
  }

  return (data || []) as SyncJob[];
}

async function completeJob(
  supabase: SupabaseClient,
  jobId: string,
  storeSnapshot?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.rpc('complete_sync_job', {
    p_job_id: jobId,
    p_store_snapshot: storeSnapshot || null,
    p_store_last_modified_at: new Date().toISOString(),
  });

  if (error) {
    console.error(`[sync-queue-worker] Failed to complete job ${jobId}:`, error);
  }
}

async function failJob(
  supabase: SupabaseClient,
  jobId: string,
  errorMessage: string
): Promise<string> {
  const { data, error } = await supabase.rpc('fail_sync_job', {
    p_job_id: jobId,
    p_error: errorMessage,
    p_base_delay_ms: CONFIG.BASE_RETRY_DELAY_MS,
    p_max_delay_ms: CONFIG.MAX_RETRY_DELAY_MS,
  });

  if (error) {
    console.error(`[sync-queue-worker] Failed to fail job ${jobId}:`, error);
    return 'error';
  }

  return data as string; // 'pending' (retried) or 'dead_letter'
}

async function getStoreConnection(
  supabase: SupabaseClient,
  storeId: string
): Promise<{ platform: string; connection: StoreConnection } | null> {
  // Step 1: Get store with connection_id
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('platform, connection_id')
    .eq('id', storeId)
    .single();

  if (storeError || !store) {
    console.error(`[sync-queue-worker] Failed to get store ${storeId}:`, storeError);
    return null;
  }

  const connectionId = (store as { connection_id: string }).connection_id;
  if (!connectionId) {
    console.error(`[sync-queue-worker] No connection_id for store ${storeId}`);
    return null;
  }

  // Step 2: Get platform_connections credentials
  const { data: conn, error: connError } = await supabase
    .from('platform_connections')
    .select('shop_url, credentials_encrypted')
    .eq('id', connectionId)
    .single();

  if (connError || !conn) {
    console.error(`[sync-queue-worker] Failed to get connection ${connectionId}:`, connError);
    return null;
  }

  return {
    platform: (store as { platform: string }).platform,
    connection: conn as unknown as StoreConnection,
  };
}

// ============================================================================
// MAIN WORKER
// ============================================================================

async function processQueue(supabase: SupabaseClient): Promise<WorkerResult> {
  const result: WorkerResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    retried: 0,
    deadLettered: 0,
    results: [],
  };

  // Claim jobs atomically
  const jobs = await claimJobs(supabase);

  if (jobs.length === 0) {
    console.log('[sync-queue-worker] No pending jobs');
    return result;
  }

  console.log(`[sync-queue-worker] Claimed ${jobs.length} jobs`);

  // Process each job
  for (const job of jobs) {
    result.processed++;

    try {
      // Get store connection
      const storeData = await getStoreConnection(supabase, job.store_id);

      if (!storeData) {
        const newStatus = await failJob(supabase, job.id, 'Store connection not found');
        result.failed++;
        if (newStatus === 'dead_letter') result.deadLettered++;
        else result.retried++;

        result.results.push({
          jobId: job.id,
          productId: job.product_id,
          success: false,
          error: 'Store connection not found',
          newStatus,
        });
        continue;
      }

      // Create platform adapter
      const adapter = createAdapter(storeData.platform, storeData.connection);

      if (!adapter) {
        const newStatus = await failJob(
          supabase,
          job.id,
          `Unsupported platform or missing credentials: ${storeData.platform}`
        );
        result.failed++;
        if (newStatus === 'dead_letter') result.deadLettered++;
        else result.retried++;

        result.results.push({
          jobId: job.id,
          productId: job.product_id,
          success: false,
          error: `Unsupported platform: ${storeData.platform}`,
          newStatus,
        });
        continue;
      }

      // Execute sync
      console.log(
        `[sync-queue-worker] Processing job ${job.id} - product ${job.platform_product_id}, fields: ${job.dirty_fields.join(', ')}`
      );

      const syncResult = await adapter.updateProduct(
        job.platform_product_id,
        job.payload,
        job.dirty_fields
      );

      if (syncResult.success) {
        // Mark job as completed
        await completeJob(supabase, job.id, syncResult.updatedProduct);
        result.succeeded++;

        result.results.push({
          jobId: job.id,
          productId: job.product_id,
          success: true,
          newStatus: 'completed',
        });

        console.log(`[sync-queue-worker] Job ${job.id} completed successfully`);
      } else {
        // Permanent failure (e.g. duplicate SKU): dead-letter immediately, no retry
        if (syncResult.retryable === false) {
          console.log(
            `[sync-queue-worker] Job ${job.id} permanently failed (non-retryable): ${syncResult.error}`
          );
          const newStatus = await failJob(supabase, job.id, `[PERMANENT] ${syncResult.error}`);
          result.failed++;
          result.deadLettered++;

          // Force dead_letter status via direct update if failJob didn't do it
          if (newStatus !== 'dead_letter') {
            await supabase
              .from('sync_queue')
              .update({ status: 'dead_letter', last_error: `[PERMANENT] ${syncResult.error}` })
              .eq('id', job.id);
          }

          result.results.push({
            jobId: job.id,
            productId: job.product_id,
            success: false,
            error: syncResult.error,
            newStatus: 'dead_letter',
          });
        } else {
          // Retryable failure
          const newStatus = await failJob(supabase, job.id, syncResult.error || 'Unknown error');
          result.failed++;

          if (newStatus === 'dead_letter') {
            result.deadLettered++;
            console.log(
              `[sync-queue-worker] Job ${job.id} moved to dead letter queue after ${job.attempt_count + 1} attempts`
            );
          } else {
            result.retried++;
            console.log(
              `[sync-queue-worker] Job ${job.id} scheduled for retry (attempt ${job.attempt_count + 1})`
            );
          }

          result.results.push({
            jobId: job.id,
            productId: job.product_id,
            success: false,
            error: syncResult.error,
            newStatus,
          });
        }
      }
    } catch (error) {
      // Unexpected error - still try to fail the job properly
      const errorMessage = error instanceof Error ? error.message : 'Unexpected error';
      console.error(`[sync-queue-worker] Unexpected error for job ${job.id}:`, error);

      try {
        const newStatus = await failJob(supabase, job.id, errorMessage);
        result.failed++;
        if (newStatus === 'dead_letter') result.deadLettered++;
        else result.retried++;

        result.results.push({
          jobId: job.id,
          productId: job.product_id,
          success: false,
          error: errorMessage,
          newStatus,
        });
      } catch {
        // If we can't even fail the job, log it
        console.error(`[sync-queue-worker] Failed to handle error for job ${job.id}`);
        result.failed++;
      }
    }
  }

  console.log(
    `[sync-queue-worker] Completed: ${result.succeeded} success, ${result.retried} retried, ${result.deadLettered} dead lettered`
  );

  return result;
}

// ============================================================================
// HTTP HANDLER
// ============================================================================

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  try {
    // Create service role client for queue processing
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Process the queue
    const result = await processQueue(supabase);

    return new Response(JSON.stringify(result), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[sync-queue-worker] Fatal error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      }
    );
  }
});
