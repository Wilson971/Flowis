/**
 * Push to Store Edge Function
 *
 * Synchronizes product changes to the e-commerce platform
 * Supports WooCommerce, Shopify, and other platforms
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushRequest {
  product_ids?: string[];
  ids?: string[];
  type?: string;
  force?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get request body — client sends { ids, type, force }, legacy sends { product_ids }
    const body: PushRequest = await req.json();
    const product_ids = body.product_ids || body.ids || [];

    if (product_ids.length === 0) {
      throw new Error('No product IDs provided');
    }

    console.log(`Pushing ${product_ids.length} products to store (type: ${body.type || 'product'})`);

    // Fetch products with their stores and platform connections (credentials)
    const { data: products, error: fetchError } = await supabaseClient
      .from('products')
      .select('*, stores(*, platform_connections(*))')
      .in('id', product_ids);

    if (fetchError) throw fetchError;
    if (!products || products.length === 0) {
      throw new Error('No products found');
    }

    const results = [];

    // Process each product
    for (const product of products) {
      try {
        const store = product.stores;
        if (!store) {
          results.push({
            product_id: product.id,
            success: false,
            error: 'Store not found',
          });
          continue;
        }

        // Sync based on platform
        if (store.platform === 'woocommerce') {
          await syncToWooCommerce(product, store);
          // Push dirty variations to WooCommerce
          await syncVariationsToWooCommerce(supabaseClient, product, store);
        } else if (store.platform === 'shopify') {
          await syncToShopify(product, store);
        } else {
          throw new Error(`Unsupported platform: ${store.platform}`);
        }

        // Update product sync status
        await supabaseClient
          .from('products')
          .update({
            last_synced_at: new Date().toISOString(),
            sync_source: 'push',
            dirty_fields_content: [],
          })
          .eq('id', product.id);

        results.push({
          product_id: product.id,
          success: true,
        });
      } catch (error: any) {
        console.error(`Error syncing product ${product.id}:`, error);
        results.push({
          product_id: product.id,
          success: false,
          error: error.message,
        });
      }
    }

    // Count successes and failures
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        total: products.length,
        successful: successCount,
        failed: failureCount,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Push to store error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

/**
 * Extract WooCommerce credentials from store + platform_connections
 */
function getWooCredentials(store: any): { shop_url: string; consumer_key: string; consumer_secret: string } {
  // platform_connections is joined via stores(*, platform_connections(*))
  const conn = store.platform_connections;
  if (!conn) {
    throw new Error('Platform connection not found for store');
  }
  const shop_url = conn.shop_url;
  // credentials_encrypted is a JSONB column with consumer_key and consumer_secret
  const creds = typeof conn.credentials_encrypted === 'string'
    ? JSON.parse(conn.credentials_encrypted)
    : conn.credentials_encrypted || {};
  const consumer_key = creds.consumer_key;
  const consumer_secret = creds.consumer_secret;

  if (!consumer_key || !consumer_secret || !shop_url) {
    throw new Error(`WooCommerce credentials incomplete: url=${!!shop_url}, key=${!!consumer_key}, secret=${!!consumer_secret}`);
  }

  return { shop_url, consumer_key, consumer_secret };
}

/**
 * Sync product to WooCommerce
 */
async function syncToWooCommerce(product: any, store: any) {
  const { shop_url, consumer_key, consumer_secret } = getWooCredentials(store);
  const auth = btoa(`${consumer_key}:${consumer_secret}`);
  const endpoint = `${shop_url}/wp-json/wc/v3/products/${product.platform_product_id}`;

  // Build update payload from working_content
  const payload: any = {};
  const workingContent = product.working_content || {};

  if (workingContent.title) payload.name = workingContent.title;
  if (workingContent.short_description) payload.short_description = workingContent.short_description;
  if (workingContent.description) payload.description = workingContent.description;
  if (workingContent.seo_title) payload.meta_data = [{ key: '_yoast_wpseo_title', value: workingContent.seo_title }];

  // For variable products, push attributes with variation:true so WC knows which attrs define variations
  if (product.product_type === 'variable' && Array.isArray(workingContent.attributes)) {
    payload.type = 'variable';
    payload.attributes = workingContent.attributes.map((attr: any) => ({
      id: attr.id || 0,
      name: attr.name,
      position: attr.position || 0,
      visible: attr.visible !== false,
      variation: attr.variation === true,
      options: attr.options || [],
    }));
  }

  console.log(`[product] PUT ${endpoint}, payload keys: ${Object.keys(payload).join(', ')}, type=${payload.type || 'n/a'}, attrs=${payload.attributes?.length ?? 0}`);

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WooCommerce API error: ${error}`);
  }

  return await response.json();
}

/**
 * Build WooCommerce variation payload from DB row
 */
function buildVariationPayload(v: any): any {
  const payload: any = {};
  if (v.sku) payload.sku = v.sku;
  if (v.regular_price != null) payload.regular_price = String(v.regular_price);
  if (v.sale_price != null) payload.sale_price = String(v.sale_price);
  if (v.stock_quantity != null) payload.stock_quantity = v.stock_quantity;
  if (v.stock_status) payload.stock_status = v.stock_status;
  if (v.manage_stock != null) payload.manage_stock = v.manage_stock;
  if (v.weight) payload.weight = v.weight;
  if (v.dimensions) payload.dimensions = v.dimensions;
  if (v.description) payload.description = v.description;
  if (v.status) payload.status = v.status;
  if (v.image) payload.image = v.image;
  if (v.attributes) payload.attributes = v.attributes;
  if (v.virtual != null) payload.virtual = v.virtual;
  if (v.downloadable != null) payload.downloadable = v.downloadable;
  if (v.backorders) payload.backorders = v.backorders;
  if (v.tax_status) payload.tax_status = v.tax_status;
  if (v.tax_class) payload.tax_class = v.tax_class;
  return payload;
}

/**
 * Sync dirty variations to WooCommerce using batch endpoint
 * POST /wp-json/wc/v3/products/{id}/variations/batch
 * Body: { create: [...], update: [...], delete: [id, ...] }
 */
async function syncVariationsToWooCommerce(supabaseClient: any, product: any, store: any) {
  const { shop_url, consumer_key, consumer_secret } = getWooCredentials(store);

  // Fetch dirty variations for this product
  const { data: dirtyVariations, error: fetchErr } = await supabaseClient
    .from('product_variations')
    .select('*')
    .eq('product_id', product.id)
    .eq('is_dirty', true);

  console.log(`[variations] product=${product.id}, found=${dirtyVariations?.length ?? 0}, fetchErr=${fetchErr?.message ?? 'none'}`);

  if (fetchErr || !dirtyVariations || dirtyVariations.length === 0) return;

  // Sort variations into batch operations
  const toCreate: any[] = [];   // DB rows for new variations
  const toUpdate: any[] = [];   // DB rows for modified variations
  const toDelete: any[] = [];   // DB rows for deleted variations
  const deleteWcIds: number[] = [];  // WC IDs to delete

  for (const v of dirtyVariations) {
    const isNew = v.dirty_action === 'created' || v.external_id?.startsWith('local_');

    if (v.dirty_action === 'deleted') {
      toDelete.push(v);
      if (v.external_id && !v.external_id.startsWith('local_')) {
        deleteWcIds.push(Number(v.external_id));
      }
    } else if (isNew) {
      toCreate.push(v);
    } else {
      toUpdate.push(v);
    }
  }

  // Build WC batch payload
  const batchPayload: any = {};

  if (toCreate.length > 0) {
    batchPayload.create = toCreate.map(buildVariationPayload);
  }
  if (toUpdate.length > 0) {
    batchPayload.update = toUpdate.map((v) => ({
      id: Number(v.external_id),
      ...buildVariationPayload(v),
    }));
  }
  if (deleteWcIds.length > 0) {
    batchPayload.delete = deleteWcIds;
  }

  console.log(`[variations] batch: create=${toCreate.length}, update=${toUpdate.length}, delete=${deleteWcIds.length}`);

  // Skip if nothing to send (e.g. only local_ deletions)
  const hasWcWork = toCreate.length > 0 || toUpdate.length > 0 || deleteWcIds.length > 0;
  if (!hasWcWork) {
    // Just clean up local-only deletions from DB
    if (toDelete.length > 0) {
      await supabaseClient
        .from('product_variations')
        .delete()
        .in('id', toDelete.map((v: any) => v.id));
    }
    return;
  }

  // Call WooCommerce batch endpoint
  const auth = btoa(`${consumer_key}:${consumer_secret}`);
  const batchUrl = `${shop_url}/wp-json/wc/v3/products/${product.platform_product_id}/variations/batch`;

  const response = await fetch(batchUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(batchPayload),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[variations] WC batch error (${response.status}): ${errText}`);
    throw new Error(`WooCommerce variations batch error: ${errText}`);
  }

  const batchResult = await response.json();
  console.log(`[variations] batch result: created=${batchResult.create?.length ?? 0}, updated=${batchResult.update?.length ?? 0}, deleted=${batchResult.delete?.length ?? 0}`);

  // Process created variations — update external_id with real WC IDs
  if (batchResult.create && batchResult.create.length > 0) {
    for (let i = 0; i < batchResult.create.length; i++) {
      const wcVar = batchResult.create[i];
      const dbVar = toCreate[i];
      if (wcVar.id && dbVar) {
        await supabaseClient
          .from('product_variations')
          .update({
            external_id: String(wcVar.id),
            is_dirty: false,
            dirty_action: null,
          })
          .eq('id', dbVar.id);
      }
    }
  }

  // Clear dirty flags for successfully updated variations
  if (toUpdate.length > 0) {
    await supabaseClient
      .from('product_variations')
      .update({ is_dirty: false, dirty_action: null })
      .in('id', toUpdate.map((v: any) => v.id));
  }

  // Hard delete removed variations from DB
  if (toDelete.length > 0) {
    await supabaseClient
      .from('product_variations')
      .delete()
      .in('id', toDelete.map((v: any) => v.id));
  }
}

/**
 * Sync product to Shopify
 */
async function syncToShopify(product: any, store: any) {
  const { access_token, shop_url } = store.platform_connections || {};

  if (!access_token || !shop_url) {
    throw new Error('Shopify credentials not configured');
  }

  const endpoint = `https://${shop_url}/admin/api/2024-01/products/${product.platform_product_id}.json`;

  // Build update payload from working_content
  const workingContent = product.working_content || {};
  const payload: any = {
    product: {},
  };

  if (workingContent.title) payload.product.title = workingContent.title;
  if (workingContent.description) payload.product.body_html = workingContent.description;

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'X-Shopify-Access-Token': access_token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Shopify API error: ${error}`);
  }

  return await response.json();
}
