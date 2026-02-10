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
  product_ids: string[];
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

    // Get request body
    const { product_ids }: PushRequest = await req.json();

    if (!product_ids || product_ids.length === 0) {
      throw new Error('No product IDs provided');
    }

    console.log(`Pushing ${product_ids.length} products to store`);

    // Fetch products with their stores
    const { data: products, error: fetchError } = await supabaseClient
      .from('products')
      .select('*, stores(*)')
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
 * Sync product to WooCommerce
 */
async function syncToWooCommerce(product: any, store: any) {
  const { api_key, api_secret, shop_url } = store.platform_connections || {};

  if (!api_key || !api_secret || !shop_url) {
    throw new Error('WooCommerce credentials not configured');
  }

  const auth = btoa(`${api_key}:${api_secret}`);
  const endpoint = `${shop_url}/wp-json/wc/v3/products/${product.platform_product_id}`;

  // Build update payload from working_content
  const payload: any = {};
  const workingContent = product.working_content || {};

  if (workingContent.title) payload.name = workingContent.title;
  if (workingContent.short_description) payload.short_description = workingContent.short_description;
  if (workingContent.description) payload.description = workingContent.description;
  if (workingContent.seo_title) payload.meta_data = [{ key: '_yoast_wpseo_title', value: workingContent.seo_title }];

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
