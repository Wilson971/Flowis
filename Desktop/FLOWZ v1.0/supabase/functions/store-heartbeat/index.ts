/**
 * store-heartbeat - Edge Function to detect store changes
 *
 * This worker is called periodically by pg_cron (every 15 minutes) to poll
 * stores for changes and apply the "Store Always Wins" conflict resolution.
 *
 * Features:
 * - Polls stores for products modified since last check
 * - Automatically applies store changes (store always wins)
 * - Logs conflicts when local changes are overwritten
 * - Tracks heartbeat health per store
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getCorsHeaders } from "../_shared/cors.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  HEARTBEAT_INTERVAL_MINUTES: 15,
  MAX_PRODUCTS_PER_HEARTBEAT: 100,
  REQUEST_TIMEOUT_MS: 60000, // Longer timeout for fetching many products
  MAX_CONSECUTIVE_FAILURES: 5, // Disable heartbeat after this many failures
};

// ============================================================================
// TYPES
// ============================================================================

interface StoreHeartbeat {
  id: string;
  store_id: string;
  last_checked_at: string | null;
  store_last_modified_at: string | null;
  interval_minutes: number;
  enabled: boolean;
  consecutive_failures: number;
}

interface StoreData {
  id: string;
  platform: string;
  platform_connections: {
    shop_url: string;
    credentials_encrypted?: Record<string, string>;
    api_key?: string;
    api_secret?: string;
  };
}

interface HeartbeatResult {
  storesChecked: number;
  productsUpdated: number;
  conflictsResolved: number;
  errors: number;
  details: Array<{
    storeId: string;
    success: boolean;
    productsFound: number;
    productsUpdated: number;
    conflicts: number;
    error?: string;
  }>;
}

interface PlatformProduct {
  id: string;
  title: string;
  description?: string;
  short_description?: string;
  sku?: string;
  price?: number;
  regular_price?: number;
  sale_price?: number;
  stock_quantity?: number;
  stock_status?: string;
  seo_title?: string;
  seo_description?: string;
  date_modified: string;
  raw: unknown;
}

// ============================================================================
// PLATFORM FETCHERS
// ============================================================================

async function fetchWooCommerceModifiedProducts(
  shopUrl: string,
  consumerKey: string,
  consumerSecret: string,
  since: Date
): Promise<PlatformProduct[]> {
  const products: PlatformProduct[] = [];
  const baseUrl = shopUrl.replace(/\/$/, '');
  let page = 1;
  let hasMore = true;

  while (hasMore && products.length < CONFIG.MAX_PRODUCTS_PER_HEARTBEAT) {
    const endpoint = `${baseUrl}/wp-json/wc/v3/products`;
    const url = new URL(endpoint);

    url.searchParams.set('modified_after', since.toISOString());
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', String(page));
    url.searchParams.set('orderby', 'modified');
    url.searchParams.set('order', 'asc');

    // Add auth
    if (consumerKey.startsWith('ck_')) {
      url.searchParams.set('consumer_key', consumerKey);
      url.searchParams.set('consumer_secret', consumerSecret);
    }

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (!consumerKey.startsWith('ck_')) {
      headers['Authorization'] = `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}`;
    }

    const response = await fetchWithTimeout(url.toString(), { method: 'GET', headers });

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.status}`);
    }

    const data = (await response.json()) as Array<Record<string, unknown>>;

    for (const p of data) {
      products.push(wooToFlowzProduct(p));
    }

    // Check for more pages
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
    hasMore = page < totalPages;
    page++;
  }

  return products;
}

function wooToFlowzProduct(p: Record<string, unknown>): PlatformProduct {
  const metaData = (p.meta_data as Array<{ key: string; value: string }>) || [];
  const getMeta = (key: string) => metaData.find((m) => m.key === key)?.value;

  return {
    id: String(p.id),
    title: String(p.name || ''),
    description: p.description as string | undefined,
    short_description: p.short_description as string | undefined,
    sku: p.sku as string | undefined,
    price: p.price ? parseFloat(String(p.price)) : undefined,
    regular_price: p.regular_price ? parseFloat(String(p.regular_price)) : undefined,
    sale_price: p.sale_price ? parseFloat(String(p.sale_price)) : undefined,
    stock_quantity: p.stock_quantity as number | undefined,
    stock_status: p.stock_status as string | undefined,
    seo_title: getMeta('_yoast_wpseo_title') || getMeta('rank_math_title'),
    seo_description: getMeta('_yoast_wpseo_metadesc') || getMeta('rank_math_description'),
    date_modified: String(p.date_modified_gmt || p.date_modified || new Date().toISOString()),
    raw: p,
  };
}

async function fetchShopifyModifiedProducts(
  shopUrl: string,
  accessToken: string,
  since: Date
): Promise<PlatformProduct[]> {
  let normalizedUrl = shopUrl.replace(/\/$/, '');
  if (!normalizedUrl.includes('.myshopify.com')) {
    normalizedUrl = `${normalizedUrl}.myshopify.com`;
  }
  normalizedUrl = normalizedUrl.replace(/^https?:\/\//, '');

  const graphqlUrl = `https://${normalizedUrl}/admin/api/2024-01/graphql.json`;

  const query = `
    query getModifiedProducts($query: String!, $first: Int!, $after: String) {
      products(query: $query, first: $first, after: $after) {
        edges {
          node {
            id
            title
            handle
            descriptionHtml
            seo { title description }
            variants(first: 1) {
              edges {
                node {
                  sku
                  price
                  compareAtPrice
                  inventoryQuantity
                }
              }
            }
            updatedAt
          }
          cursor
        }
        pageInfo { hasNextPage }
      }
    }
  `;

  const products: PlatformProduct[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  while (hasMore && products.length < CONFIG.MAX_PRODUCTS_PER_HEARTBEAT) {
    const response = await fetchWithTimeout(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        query,
        variables: {
          query: `updated_at:>'${since.toISOString()}'`,
          first: 50,
          after: cursor,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const data = await response.json();
    const edges = data.data?.products?.edges || [];

    for (const edge of edges) {
      products.push(shopifyToFlowzProduct(edge.node));
      cursor = edge.cursor;
    }

    hasMore = data.data?.products?.pageInfo?.hasNextPage || false;
  }

  return products;
}

function shopifyToFlowzProduct(p: Record<string, unknown>): PlatformProduct {
  const variant = ((p.variants as { edges?: Array<{ node: Record<string, unknown> }> })?.edges?.[0]?.node || {}) as Record<string, unknown>;
  const seo = p.seo as { title?: string; description?: string } | undefined;

  // Extract numeric ID from global ID
  const gid = String(p.id || '');
  const id = gid.match(/\/(\d+)$/)?.[1] || gid;

  return {
    id,
    title: String(p.title || ''),
    description: p.descriptionHtml as string | undefined,
    sku: variant.sku as string | undefined,
    price: variant.price ? parseFloat(String(variant.price)) : undefined,
    regular_price: variant.compareAtPrice ? parseFloat(String(variant.compareAtPrice)) : undefined,
    stock_quantity: variant.inventoryQuantity as number | undefined,
    stock_status: (variant.inventoryQuantity as number) > 0 ? 'instock' : 'outofstock',
    seo_title: seo?.title,
    seo_description: seo?.description,
    date_modified: String(p.updatedAt || new Date().toISOString()),
    raw: p,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function getStoresDueForHeartbeat(supabase: SupabaseClient): Promise<Array<{
  heartbeat: StoreHeartbeat;
  store: StoreData;
}>> {
  const cutoff = new Date(Date.now() - CONFIG.HEARTBEAT_INTERVAL_MINUTES * 60 * 1000);

  const { data, error } = await supabase
    .from('store_heartbeat')
    .select(`
      *,
      stores (
        id,
        platform,
        platform_connections (
          shop_url,
          credentials_encrypted,
          api_key,
          api_secret
        )
      )
    `)
    .eq('enabled', true)
    .lt('consecutive_failures', CONFIG.MAX_CONSECUTIVE_FAILURES)
    .or(`last_checked_at.is.null,last_checked_at.lt.${cutoff.toISOString()}`);

  if (error) {
    console.error('[store-heartbeat] Failed to get stores:', error);
    return [];
  }

  return (data || []).map((row) => ({
    heartbeat: row as StoreHeartbeat,
    store: (row as unknown as { stores: StoreData }).stores,
  }));
}

async function fetchModifiedProducts(
  store: StoreData,
  since: Date
): Promise<PlatformProduct[]> {
  const connection = store.platform_connections;
  if (!connection) throw new Error('No connection found');

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

  if (!consumerKey) consumerKey = connection.api_key || '';
  if (!consumerSecret) consumerSecret = connection.api_secret || '';

  switch (store.platform.toLowerCase()) {
    case 'woocommerce':
      return fetchWooCommerceModifiedProducts(
        connection.shop_url,
        consumerKey,
        consumerSecret,
        since
      );

    case 'shopify':
      return fetchShopifyModifiedProducts(connection.shop_url, accessToken, since);

    default:
      throw new Error(`Unsupported platform: ${store.platform}`);
  }
}

async function applyStoreChanges(
  supabase: SupabaseClient,
  storeId: string,
  storeProduct: PlatformProduct
): Promise<{ updated: boolean; hadConflict: boolean }> {
  // Find local product by platform_product_id
  const { data: localProduct, error: fetchError } = await supabase
    .from('products')
    .select('id, working_content, store_snapshot_content, dirty_fields_content')
    .eq('store_id', storeId)
    .eq('platform_product_id', storeProduct.id)
    .single();

  if (fetchError || !localProduct) {
    // Product doesn't exist locally - skip (could be new product)
    return { updated: false, hadConflict: false };
  }

  const hasDirtyFields =
    localProduct.dirty_fields_content &&
    Array.isArray(localProduct.dirty_fields_content) &&
    localProduct.dirty_fields_content.length > 0;

  // Build new content from store
  const newContent = {
    title: storeProduct.title,
    description: storeProduct.description,
    short_description: storeProduct.short_description,
    sku: storeProduct.sku,
    price: storeProduct.price,
    regular_price: storeProduct.regular_price,
    sale_price: storeProduct.sale_price,
    stock_quantity: storeProduct.stock_quantity,
    stock_status: storeProduct.stock_status,
    seo_title: storeProduct.seo_title,
    seo_description: storeProduct.seo_description,
  };

  // If local has dirty fields, log the conflict
  if (hasDirtyFields) {
    await supabase.from('conflict_log').insert({
      product_id: localProduct.id,
      store_id: storeId,
      conflict_type: 'store_wins',
      fields_affected: localProduct.dirty_fields_content,
      local_values: localProduct.working_content,
      store_values: newContent,
      resolved_values: newContent,
      resolution: 'auto_store_wins',
    });
  }

  // STORE ALWAYS WINS: Update both snapshot and working content
  const { error: updateError } = await supabase
    .from('products')
    .update({
      store_snapshot_content: newContent,
      working_content: newContent, // Overwrite local changes
      dirty_fields_content: [], // Clear dirty fields
      sync_status: 'synced',
      store_last_modified_at: storeProduct.date_modified,
      updated_at: new Date().toISOString(),
    })
    .eq('id', localProduct.id);

  if (updateError) {
    console.error(`[store-heartbeat] Failed to update product ${localProduct.id}:`, updateError);
    return { updated: false, hadConflict: hasDirtyFields };
  }

  return { updated: true, hadConflict: hasDirtyFields };
}

async function updateHeartbeatSuccess(
  supabase: SupabaseClient,
  heartbeatId: string,
  latestModified: Date | null,
  totalChecks: number,
  changesDetected: number
): Promise<void> {
  await supabase
    .from('store_heartbeat')
    .update({
      last_checked_at: new Date().toISOString(),
      last_successful_at: new Date().toISOString(),
      store_last_modified_at: latestModified?.toISOString() || null,
      consecutive_failures: 0,
      total_checks: totalChecks + 1,
      total_changes_detected: changesDetected,
      updated_at: new Date().toISOString(),
    })
    .eq('id', heartbeatId);
}

async function updateHeartbeatFailure(
  supabase: SupabaseClient,
  heartbeatId: string,
  consecutiveFailures: number,
  error: string
): Promise<void> {
  await supabase
    .from('store_heartbeat')
    .update({
      last_checked_at: new Date().toISOString(),
      consecutive_failures: consecutiveFailures + 1,
      last_error: error,
      updated_at: new Date().toISOString(),
    })
    .eq('id', heartbeatId);
}

// ============================================================================
// MAIN HEARTBEAT PROCESSOR
// ============================================================================

async function processHeartbeats(supabase: SupabaseClient): Promise<HeartbeatResult> {
  const result: HeartbeatResult = {
    storesChecked: 0,
    productsUpdated: 0,
    conflictsResolved: 0,
    errors: 0,
    details: [],
  };

  // Get stores due for heartbeat
  const stores = await getStoresDueForHeartbeat(supabase);

  if (stores.length === 0) {
    console.log('[store-heartbeat] No stores due for heartbeat');
    return result;
  }

  console.log(`[store-heartbeat] Checking ${stores.length} stores`);

  for (const { heartbeat, store } of stores) {
    result.storesChecked++;

    const storeDetail = {
      storeId: store.id,
      success: false,
      productsFound: 0,
      productsUpdated: 0,
      conflicts: 0,
      error: undefined as string | undefined,
    };

    try {
      // Determine the "since" date
      const since = heartbeat.store_last_modified_at
        ? new Date(heartbeat.store_last_modified_at)
        : new Date(0); // If never checked, get all

      // Fetch modified products from store
      const modifiedProducts = await fetchModifiedProducts(store, since);
      storeDetail.productsFound = modifiedProducts.length;

      console.log(
        `[store-heartbeat] Store ${store.id}: Found ${modifiedProducts.length} modified products`
      );

      // Track latest modification date
      let latestModified: Date | null = null;

      // Apply changes for each modified product
      for (const storeProduct of modifiedProducts) {
        const productModified = new Date(storeProduct.date_modified);
        if (!latestModified || productModified > latestModified) {
          latestModified = productModified;
        }

        const { updated, hadConflict } = await applyStoreChanges(
          supabase,
          store.id,
          storeProduct
        );

        if (updated) {
          storeDetail.productsUpdated++;
          result.productsUpdated++;
        }

        if (hadConflict) {
          storeDetail.conflicts++;
          result.conflictsResolved++;
        }
      }

      // Update heartbeat as success
      await updateHeartbeatSuccess(
        supabase,
        heartbeat.id,
        latestModified || (heartbeat.store_last_modified_at ? new Date(heartbeat.store_last_modified_at) : null),
        heartbeat.total_checks || 0,
        (heartbeat.total_changes_detected || 0) + modifiedProducts.length
      );

      storeDetail.success = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[store-heartbeat] Error for store ${store.id}:`, errorMessage);

      storeDetail.error = errorMessage;
      result.errors++;

      // Update heartbeat as failure
      await updateHeartbeatFailure(
        supabase,
        heartbeat.id,
        heartbeat.consecutive_failures,
        errorMessage
      );
    }

    result.details.push(storeDetail);
  }

  console.log(
    `[store-heartbeat] Completed: ${result.storesChecked} stores, ${result.productsUpdated} products updated, ${result.conflictsResolved} conflicts resolved`
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
    // Create service role client
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

    // Check for specific store_id in request (for manual trigger)
    let specificStoreId: string | null = null;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        specificStoreId = body.store_id || null;
      } catch {
        // No body or invalid JSON - that's fine
      }
    }

    if (specificStoreId) {
      console.log(`[store-heartbeat] Manual trigger for store ${specificStoreId}`);
      // Reset last_checked_at to force check
      await supabase
        .from('store_heartbeat')
        .update({ last_checked_at: null })
        .eq('store_id', specificStoreId);
    }

    // Process heartbeats
    const result = await processHeartbeats(supabase);

    return new Response(JSON.stringify(result), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[store-heartbeat] Fatal error:', error);

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
