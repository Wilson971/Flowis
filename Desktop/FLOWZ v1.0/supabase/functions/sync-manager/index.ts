/**
 * Sync Manager v2 - Chunked Architecture for Large Catalogs
 *
 * Optimized for catalogs with 100+ products to avoid 150s Edge Function timeout.
 *
 * Flow:
 * 1. Discovery Phase (fast): Count pages, create chunks in DB
 * 2. Processing Phase (chunked): Process one page at a time
 * 3. Resume Support: If timeout, can be called again to continue
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, corsHeaders } from "../_shared/cors.ts";
import {
    transformWooCommerceProduct,
    transformWooCommerceCategory,
    WooCommerceCategory,
    chunkArray
} from "../_shared/woo-helpers.ts";

// ===========================================
// Configuration
// ===========================================

const CONFIG = {
    PRODUCTS_PER_PAGE: 50, // Reduced from 100 for faster processing
    UPSERT_BATCH_SIZE: 25, // Reduced for safety
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 2000,
    REQUEST_TIMEOUT_MS: 25000, // Reduced from 30s
    // Stop processing 50s before Edge Function timeout (150s limit) - more margin
    MAX_EXECUTION_TIME_MS: 100000,
    // Threshold to use chunked mode (if more than this, use chunks)
    CHUNKED_THRESHOLD_PRODUCTS: 30, // Lowered to use chunking more often
    RETRYABLE_STATUSES: [429, 502, 503, 504],
};

// ===========================================
// Types
// ===========================================

interface SyncRequest {
    storeId: string;
    store_id?: string;
    sync_type?: "full" | "incremental";
    types?: string[] | string;
    forceRestart?: boolean;
}

interface SyncProgress {
    phase: string;
    current: number;
    total: number;
    message: string;
}

interface WooApiResult {
    data: any[];
    totalItems: number;
    totalPages: number;
}

// ===========================================
// WordPress REST API Client (for posts)
// ===========================================

interface WordPressPost {
    id: number;
    date: string;
    date_gmt: string;
    modified: string;
    modified_gmt: string;
    slug: string;
    status: string;
    type: string;
    link: string;
    title: { rendered: string };
    content: { rendered: string; protected?: boolean };
    excerpt: { rendered: string; protected?: boolean };
    author: number;
    featured_media: number;
    categories: number[];
    tags: number[];
    // Additional WordPress fields
    comment_status?: string;
    ping_status?: string;
    sticky?: boolean;
    template?: string;
    format?: string;
    meta?: any;
    // SEO data
    yoast_head?: string;
    yoast_head_json?: any;
    rank_math_title?: string;
    rank_math_description?: string;
    // Embedded data
    _embedded?: {
        'wp:featuredmedia'?: Array<{
            id: number;
            source_url: string;
            alt_text?: string;
            media_details?: {
                width: number;
                height: number;
                sizes?: Record<string, { source_url: string; width: number; height: number }>;
            };
        }>;
        'wp:term'?: Array<Array<{
            id: number;
            name: string;
            slug: string;
            taxonomy?: string;
            link?: string;
        }>>;
        author?: Array<{
            id: number;
            name: string;
            url?: string;
            description?: string;
            avatar_urls?: Record<string, string>;
        }>;
    };
}

async function wpFetch(
    shopUrl: string,
    wpUsername: string,
    wpAppPassword: string,
    endpoint: string,
    params: Record<string, string> = {}
): Promise<WooApiResult> {
    const baseUrl = shopUrl.startsWith("http") ? shopUrl : `https://${shopUrl}`;
    const url = new URL(
        endpoint.startsWith("/wp-json") ? endpoint : `/wp-json${endpoint}`,
        baseUrl
    );

    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });

    // WordPress REST API uses Basic Auth with Application Password
    const authString = `${wpUsername}:${wpAppPassword}`;
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "FlowzSync/2.0",
        "Authorization": `Basic ${btoa(authString)}`
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= CONFIG.MAX_RETRIES; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);

            const response = await fetch(url.toString(), {
                method: "GET",
                headers,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const status = response.status;
                if (CONFIG.RETRYABLE_STATUSES.includes(status) && attempt < CONFIG.MAX_RETRIES) {
                    const delay = CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt);
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
                throw new Error(`WordPress API error: ${status} ${response.statusText}`);
            }

            const totalItems = parseInt(response.headers.get("X-WP-Total") || "0", 10);
            const totalPages = parseInt(response.headers.get("X-WP-TotalPages") || "1", 10);
            const data = await response.json();

            return { data, totalItems, totalPages };
        } catch (error: any) {
            lastError = error.name === "AbortError"
                ? new Error(`Request timeout for ${endpoint}`)
                : (error instanceof Error ? error : new Error(String(error)));

            if (attempt < CONFIG.MAX_RETRIES) {
                const delay = CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
        }
    }

    throw lastError || new Error("Unknown error in wpFetch");
}

// Transform WordPress post to blog_articles schema (unified table)
function transformWordPressPost(
    post: WordPressPost,
    storeId: string,
    tenantId: string,
    seoPlugin: "yoast" | "rankmath" | "none"
): Record<string, any> {
    // Extract featured image URL and full media data from embedded data
    let featuredImage: string | null = null;
    let featuredMediaData: Record<string, any> | null = null;
    if (post._embedded?.['wp:featuredmedia']?.[0]) {
        const media = post._embedded['wp:featuredmedia'][0];
        featuredImage = media.source_url;
        featuredMediaData = {
            id: media.id,
            source_url: media.source_url,
            alt_text: media.alt_text || "",
            media_details: media.media_details || null
        };
    }

    // Extract categories and tags from embedded terms (with full data)
    const taxonomies: { categories: any[]; tags: any[] } = { categories: [], tags: [] };
    const tagNames: string[] = [];
    let categoryName: string | null = null;

    if (post._embedded?.['wp:term']) {
        // First array is usually categories, second is tags
        if (post._embedded['wp:term'][0]) {
            taxonomies.categories = post._embedded['wp:term'][0].map(t => ({
                id: t.id,
                name: t.name,
                slug: t.slug,
                taxonomy: t.taxonomy || 'category',
                link: t.link || null
            }));
            // Get first category name for the category column
            if (taxonomies.categories.length > 0) {
                categoryName = taxonomies.categories[0].name;
            }
        }
        if (post._embedded['wp:term'][1]) {
            taxonomies.tags = post._embedded['wp:term'][1].map(t => {
                tagNames.push(t.name);
                return {
                    id: t.id,
                    name: t.name,
                    slug: t.slug,
                    taxonomy: t.taxonomy || 'post_tag',
                    link: t.link || null
                };
            });
        }
    }

    // Extract SEO data (full Yoast structure)
    let seoTitle = "";
    let seoDescription = "";
    let seoOgImage = "";

    if (post.yoast_head_json) {
        seoTitle = post.yoast_head_json.title || "";
        seoDescription = post.yoast_head_json.description || "";
        seoOgImage = post.yoast_head_json.og_image?.[0]?.url || "";
    } else if (seoPlugin === "rankmath") {
        seoTitle = post.rank_math_title || "";
        seoDescription = post.rank_math_description || "";
    }

    // Extract author info
    let authorName: string | null = null;
    let authorData: Record<string, any> | null = null;
    if (post._embedded?.author?.[0]) {
        const author = post._embedded.author[0];
        authorName = author.name;
        authorData = {
            id: author.id,
            name: author.name,
            url: author.url || null,
            description: author.description || null,
            avatar_urls: author.avatar_urls || null
        };
    }

    // Build comprehensive metadata for blog_articles
    const metadata: Record<string, any> = {
        source: 'wordpress_sync',
        wordpress_id: post.id,
        taxonomies: taxonomies,
        author_data: authorData,
        last_synced_at: new Date().toISOString(),
        // Full Yoast data for future use
        yoast_head_json: post.yoast_head_json || null,
        // Original embedded data
        _embedded: {
            author: post._embedded?.author || null,
            'wp:featuredmedia': featuredMediaData ? [featuredMediaData] : null,
            'wp:term': post._embedded?.['wp:term'] || null
        },
        // Meta data
        meta: post.meta || null
    };

    // Return blog_articles schema format
    return {
        store_id: storeId,
        tenant_id: tenantId,
        wordpress_post_id: String(post.id),
        title: post.title.rendered,
        slug: post.slug,
        excerpt: post.excerpt.rendered,
        content: post.content.rendered,
        status: post.status,
        featured_image_url: featuredImage,
        author: authorName,
        category: categoryName,
        tags: tagNames,
        // SEO fields
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_og_image: seoOgImage,
        seo_canonical_url: post.yoast_head_json?.canonical || null,
        // Dates
        published_at: post.status === 'publish' ? post.date : null,
        date_gmt: post.date_gmt || null,
        modified_gmt: post.modified_gmt || null,
        // WordPress specific fields
        link: post.link || null,
        comment_status: post.comment_status || 'open',
        ping_status: post.ping_status || 'closed',
        format: post.format || 'standard',
        sticky: post.sticky || false,
        post_type: post.type || 'post',
        // Metadata JSONB
        metadata: metadata,
        // Timestamps
        created_at: post.date,
        updated_at: post.modified,
        archived: false
    };
}

// ===========================================
// WooCommerce API Client
// ===========================================

async function wooFetch(
    shopUrl: string,
    consumerKey: string,
    consumerSecret: string,
    endpoint: string,
    params: Record<string, string> = {}
): Promise<WooApiResult> {
    const baseUrl = shopUrl.startsWith("http") ? shopUrl : `https://${shopUrl}`;
    const url = new URL(
        endpoint.startsWith("/wp-json") ? endpoint : `/wp-json${endpoint}`,
        baseUrl
    );

    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });

    const isWooKeys = consumerKey.startsWith("ck_") && consumerSecret.startsWith("cs_");
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "FlowzSync/2.0"
    };

    if (isWooKeys) {
        url.searchParams.set("consumer_key", consumerKey);
        url.searchParams.set("consumer_secret", consumerSecret);
    } else {
        headers["Authorization"] = `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}`;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= CONFIG.MAX_RETRIES; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);

            const response = await fetch(url.toString(), {
                method: "GET",
                headers,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const status = response.status;
                if (CONFIG.RETRYABLE_STATUSES.includes(status) && attempt < CONFIG.MAX_RETRIES) {
                    const delay = CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt);
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
                throw new Error(`WooCommerce API error: ${status} ${response.statusText}`);
            }

            const totalItems = parseInt(response.headers.get("X-WP-Total") || "0", 10);
            const totalPages = parseInt(response.headers.get("X-WP-TotalPages") || "1", 10);
            const data = await response.json();

            return { data, totalItems, totalPages };
        } catch (error: any) {
            lastError = error.name === "AbortError"
                ? new Error(`Request timeout for ${endpoint}`)
                : (error instanceof Error ? error : new Error(String(error)));

            if (attempt < CONFIG.MAX_RETRIES) {
                const delay = CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
        }
    }

    throw lastError || new Error("Unknown error in wooFetch");
}

// ===========================================
// Detect SEO Plugin
// ===========================================

async function detectSeoPlugin(
    shopUrl: string,
    consumerKey: string,
    consumerSecret: string
): Promise<"yoast" | "rankmath" | "none"> {
    try {
        const { data } = await wooFetch(shopUrl, consumerKey, consumerSecret, "/wp-json/");
        const namespaces = data.namespaces || [];
        if (namespaces.includes("yoast/v1")) return "yoast";
        if (namespaces.includes("rankmath/v1")) return "rankmath";
        return "none";
    } catch {
        return "none";
    }
}

// ===========================================
// Main Handler
// ===========================================

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: getCorsHeaders(req) });
    }

    const startTime = Date.now();
    const errors: string[] = [];
    let jobId: string | null = null;
    let supabase: SupabaseClient | null = null;

    // Helper to check if we're running out of time
    const isTimeUp = () => (Date.now() - startTime) > CONFIG.MAX_EXECUTION_TIME_MS;

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        supabase = createClient(supabaseUrl, supabaseKey);

        // ===========================================
        // 1. AUTHENTICATE
        // ===========================================
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.replace("Bearer ", "");

        if (!token) {
            return errorResponse(401, "Unauthorized - No token provided", req);
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return errorResponse(401, "Unauthorized - Invalid token", req);
        }

        console.log(`[sync-manager] User authenticated: ${user.id}`);

        // ===========================================
        // 2. PARSE REQUEST
        // ===========================================
        const body: SyncRequest = await req.json();
        const store_id = body.storeId || body.store_id;
        const sync_type = body.sync_type || "full";
        const forceRestart = body.forceRestart || false;

        let include_categories = true;
        let include_variations = true;
        let include_posts = false;

        if (body.types) {
            const types = Array.isArray(body.types) ? body.types : [body.types];
            if (types.includes('all')) {
                include_categories = true;
                include_variations = true;
                include_posts = true;
            } else {
                include_categories = types.includes('categories');
                include_posts = types.includes('posts');
            }
        }

        if (!store_id) {
            return errorResponse(400, "Missing required field: storeId", req);
        }

        console.log(`[sync-manager] Starting ${sync_type} sync for store ${store_id}`);

        // ===========================================
        // 3. CHECK FOR EXISTING RESUMABLE JOB
        // ===========================================
        let existingJob = null;
        if (!forceRestart) {
            const { data: resumableJob } = await supabase
                .from('sync_jobs')
                .select('*')
                .eq('store_id', store_id)
                .eq('is_chunked', true)
                .eq('can_resume', true)
                .in('status', ['discovering', 'syncing', 'pending'])
                .order('started_at', { ascending: false })
                .limit(1)
                .single();

            if (resumableJob) {
                existingJob = resumableJob;
                jobId = resumableJob.id;
                console.log(`[sync-manager] Resuming job ${jobId}`);
            }
        }

        // ===========================================
        // 4. GET STORE & CREDENTIALS
        // ===========================================
        const { data: store, error: storeError } = await supabase
            .from("stores")
            .select("*, platform_connections(*)")
            .eq("id", store_id)
            .eq("tenant_id", user.id)
            .single();

        if (storeError || !store) {
            return errorResponse(404, "Store not found or access denied", req);
        }

        if (store.platform !== "woocommerce") {
            return errorResponse(400, "Only WooCommerce stores are supported", req);
        }

        const connection = store.platform_connections;
        if (!connection) {
            return errorResponse(400, "No platform connection found for store", req);
        }

        const shop_url = connection.shop_url;
        let consumer_key = "";
        let consumer_secret = "";

        // WordPress credentials for blog posts
        let wp_username = "";
        let wp_app_password = "";

        if (connection.credentials_encrypted) {
            const creds = typeof connection.credentials_encrypted === 'string'
                ? JSON.parse(connection.credentials_encrypted)
                : connection.credentials_encrypted;
            consumer_key = creds.consumer_key || creds.api_key;
            consumer_secret = creds.consumer_secret || creds.api_secret;
            // WordPress Application Password credentials
            wp_username = creds.wp_username || "";
            wp_app_password = creds.wp_app_password || "";
        }

        if (!consumer_key) consumer_key = connection.api_key;
        if (!consumer_secret) consumer_secret = connection.api_secret;

        if (!shop_url || !consumer_key) {
            return errorResponse(400, "Missing WooCommerce credentials", req);
        }

        // Check if we can sync posts (need WordPress credentials)
        const canSyncPosts = include_posts && wp_username && wp_app_password;
        if (include_posts && !canSyncPosts) {
            console.log(`[sync-manager] Posts sync requested but WordPress credentials not configured`);
        }

        console.log(`[sync-manager] Store: ${store.name}, URL: ${shop_url}`);

        // Helper to update progress
        const updateProgress = async (progress: Partial<SyncProgress>) => {
            if (!jobId) return;

            const updates: any = {};
            if (progress.phase) updates.current_phase = progress.phase;

            if (progress.phase === 'products' || progress.phase === 'fetching' || progress.phase === 'saving') {
                if (progress.current !== undefined) updates.synced_products = progress.current;
                if (progress.total !== undefined) updates.total_products = progress.total;
            } else if (progress.phase === 'categories') {
                if (progress.current !== undefined) updates.synced_categories = progress.current;
                if (progress.total !== undefined) updates.total_categories = progress.total;
            } else if (progress.phase === 'posts') {
                if (progress.current !== undefined) updates.synced_posts = progress.current;
                if (progress.total !== undefined) updates.total_posts = progress.total;
            }

            await supabase!.from('sync_jobs').update(updates).eq('id', jobId);

            if (progress.message) {
                await supabase!.from('sync_logs').insert({
                    job_id: jobId,
                    message: progress.message,
                    type: 'info'
                });
            }
        };

        // ===========================================
        // 5. DISCOVERY PHASE (if new job)
        // ===========================================
        let totalProducts = 0;
        let totalPages = 0;
        let totalCategories = 0;
        let totalPosts = 0;
        let totalPostsPages = 0;
        let seoPlugin: "yoast" | "rankmath" | "none" = "none";

        if (!existingJob) {
            // Create new job
            const { data: jobData, error: jobError } = await supabase
                .from('sync_jobs')
                .insert({
                    store_id: store_id,
                    job_type: 'import',
                    status: 'discovering',
                    current_phase: 'discovery',
                    is_chunked: false,
                    can_resume: false,
                    started_at: new Date().toISOString()
                })
                .select()
                .single();

            if (jobError) {
                console.error("Failed to create sync job", jobError);
            } else {
                jobId = jobData.id;
            }

            // Detect SEO plugin
            await updateProgress({ phase: "discovery", message: "Detecting SEO plugin..." });
            seoPlugin = await detectSeoPlugin(shop_url, consumer_key, consumer_secret);
            console.log(`[sync-manager] SEO plugin: ${seoPlugin}`);

            // Quick discovery - just get counts
            await updateProgress({ phase: "discovery", message: "Counting products..." });

            const { totalItems, totalPages: pages } = await wooFetch(
                shop_url, consumer_key, consumer_secret,
                "/wc/v3/products",
                { per_page: "1", page: "1" }
            );
            totalProducts = totalItems;
            totalPages = pages;

            // Count categories
            const { totalItems: catCount } = await wooFetch(
                shop_url, consumer_key, consumer_secret,
                "/wc/v3/products/categories",
                { per_page: "1" }
            );
            totalCategories = catCount;

            // Count posts if WordPress credentials are available
            if (canSyncPosts) {
                try {
                    const { totalItems: postCount, totalPages: postPages } = await wpFetch(
                        shop_url, wp_username, wp_app_password,
                        "/wp/v2/posts",
                        { per_page: "1", status: "publish,draft,pending,private" }
                    );
                    totalPosts = postCount;
                    totalPostsPages = postPages;
                    console.log(`[sync-manager] WordPress posts: ${totalPosts} (${totalPostsPages} pages)`);
                } catch (postError: any) {
                    console.warn(`[sync-manager] Failed to count posts: ${postError.message}`);
                }
            }

            console.log(`[sync-manager] Discovery: ${totalProducts} products (${totalPages} pages), ${totalCategories} categories, ${totalPosts} posts`);

            // Update job with totals
            await supabase.from('sync_jobs').update({
                total_products: totalProducts,
                total_categories: totalCategories,
                total_posts: totalPosts,
                status: 'syncing'
            }).eq('id', jobId);

            // Decide: chunked or direct mode
            if (totalProducts > CONFIG.CHUNKED_THRESHOLD_PRODUCTS) {
                console.log(`[sync-manager] Large catalog detected (${totalProducts}), using chunked mode`);

                // Calculate actual number of pages based on our page size (not the API's per_page=1)
                const actualProductPages = Math.ceil(totalProducts / CONFIG.PRODUCTS_PER_PAGE);
                console.log(`[sync-manager] Creating ${actualProductPages} product chunks (${CONFIG.PRODUCTS_PER_PAGE} per page)`);

                // Create chunks for products
                const chunks = [];
                for (let page = 1; page <= actualProductPages; page++) {
                    const isLastPage = page === actualProductPages;
                    const itemsInPage = isLastPage
                        ? (totalProducts % CONFIG.PRODUCTS_PER_PAGE) || CONFIG.PRODUCTS_PER_PAGE
                        : CONFIG.PRODUCTS_PER_PAGE;
                    chunks.push({
                        job_id: jobId,
                        store_id: store_id,
                        chunk_type: 'products',
                        page_number: page,
                        items_total: itemsInPage,
                        status: 'pending'
                    });
                }

                // Add category chunk (single page for simplicity)
                if (include_categories && totalCategories > 0) {
                    chunks.push({
                        job_id: jobId,
                        store_id: store_id,
                        chunk_type: 'categories',
                        page_number: 1,
                        items_total: totalCategories,
                        status: 'pending'
                    });
                }

                // Add posts chunks if WordPress credentials are available
                if (canSyncPosts && totalPosts > 0) {
                    const postsPerPage = CONFIG.PRODUCTS_PER_PAGE; // Reuse same page size
                    const actualPostsPages = Math.ceil(totalPosts / postsPerPage);
                    console.log(`[sync-manager] Creating ${actualPostsPages} posts chunks (${postsPerPage} per page)`);

                    for (let page = 1; page <= actualPostsPages; page++) {
                        const isLastPage = page === actualPostsPages;
                        const itemsInPage = isLastPage
                            ? (totalPosts % postsPerPage) || postsPerPage
                            : postsPerPage;
                        chunks.push({
                            job_id: jobId,
                            store_id: store_id,
                            chunk_type: 'posts',
                            page_number: page,
                            items_total: itemsInPage,
                            status: 'pending'
                        });
                    }
                }

                // Insert all chunks
                const { error: chunkError } = await supabase
                    .from('sync_import_chunks')
                    .insert(chunks);

                if (chunkError) {
                    console.error("Failed to create chunks", chunkError);
                    errors.push(`Failed to create chunks: ${chunkError.message}`);
                }

                // Update job to chunked mode
                await supabase.from('sync_jobs').update({
                    is_chunked: true,
                    can_resume: true,
                    total_chunks: chunks.length,
                    completed_chunks: 0
                }).eq('id', jobId);

                await updateProgress({ phase: "products", message: `Created ${chunks.length} chunks for processing` });
            }
        } else {
            // Resume existing job - get the stored values
            totalProducts = existingJob.total_products || 0;
            totalCategories = existingJob.total_categories || 0;
            totalPosts = existingJob.total_posts || 0;

            // Re-detect SEO plugin for transformations
            seoPlugin = await detectSeoPlugin(shop_url, consumer_key, consumer_secret);
        }

        // ===========================================
        // 6. PROCESSING PHASE
        // ===========================================

        // Check if chunked mode
        const { data: jobCheck } = await supabase
            .from('sync_jobs')
            .select('is_chunked, total_products')
            .eq('id', jobId)
            .single();

        const isChunked = jobCheck?.is_chunked || false;
        let productsUpserted = 0;
        let variationsSynced = 0;
        let categoriesSynced = 0;
        let postsSynced = 0;

        if (isChunked) {
            // ===========================================
            // CHUNKED MODE - Process one chunk at a time
            // ===========================================
            console.log(`[sync-manager] Processing in chunked mode`);

            while (!isTimeUp()) {
                // Claim next chunk
                const { data: chunk } = await supabase.rpc('claim_next_import_chunk', {
                    p_job_id: jobId
                });

                if (!chunk || !chunk.id) {
                    console.log(`[sync-manager] No more pending chunks`);
                    break;
                }

                console.log(`[sync-manager] Processing chunk ${chunk.id}: ${chunk.chunk_type} page ${chunk.page_number}`);

                try {
                    if (chunk.chunk_type === 'products') {
                        // Fetch products for this page
                        // IMPORTANT: Use orderby=id&order=asc for stable pagination
                        // This prevents products being skipped when sort order changes during sync
                        const { data: products } = await wooFetch(
                            shop_url, consumer_key, consumer_secret,
                            "/wc/v3/products",
                            {
                                per_page: String(CONFIG.PRODUCTS_PER_PAGE),
                                page: String(chunk.page_number),
                                status: "any",
                                orderby: "id",
                                order: "asc"
                            }
                        );

                        // DON'T fetch variations inline - queue them as separate chunks instead
                        // This prevents timeout issues with large catalogs
                        const variableProducts = products.filter((p: any) => p.type === "variable" && p.variations?.length > 0);

                        // Mark all products without variations initially (they'll be fetched via variation chunks)
                        for (const product of products) {
                            product._variationsDetailed = [];
                        }

                        // Deduplicate products by ID (in case WooCommerce returns duplicates)
                        const seenIds = new Set<number>();
                        const uniqueProducts = products.filter((p: any) => {
                            if (seenIds.has(p.id)) {
                                console.warn(`[sync-manager] Duplicate product ID ${p.id} on page ${chunk.page_number}`);
                                return false;
                            }
                            seenIds.add(p.id);
                            return true;
                        });

                        if (uniqueProducts.length !== products.length) {
                            await supabase.from('sync_logs').insert({
                                job_id: jobId,
                                message: `Removed ${products.length - uniqueProducts.length} duplicate(s) on page ${chunk.page_number}`,
                                type: 'warning'
                            });
                        }

                        // Transform
                        const transformed = uniqueProducts.map((p: any) =>
                            transformWooCommerceProduct(p, store.id, user.id, seoPlugin)
                        );

                        // Upsert products with detailed error logging
                        const { error: upsertError, data: upsertedData } = await supabase
                            .from("products")
                            .upsert(transformed, {
                                onConflict: "store_id,platform_product_id",
                                ignoreDuplicates: false
                            })
                            .select('id, platform_product_id');

                        if (upsertError) {
                            console.error(`[sync-manager] Products upsert error on page ${chunk.page_number}:`, upsertError);
                            // Log detailed error for debugging
                            await supabase.from('sync_logs').insert({
                                job_id: jobId,
                                message: `Failed to upsert ${transformed.length} products on page ${chunk.page_number}: ${upsertError.message}`,
                                type: 'error'
                            });
                            throw new Error(upsertError.message);
                        }

                        const actualUpserted = upsertedData?.length || transformed.length;
                        productsUpserted += actualUpserted;

                        // Log if there's a discrepancy
                        if (actualUpserted !== transformed.length) {
                            console.warn(`[sync-manager] Upsert discrepancy: sent ${transformed.length}, got ${actualUpserted}`);
                            await supabase.from('sync_logs').insert({
                                job_id: jobId,
                                message: `Upsert discrepancy on page ${chunk.page_number}: sent ${transformed.length}, upserted ${actualUpserted}`,
                                type: 'warning'
                            });
                        }

                        // Queue variation chunks for variable products (robust approach - no timeout issues)
                        if (variableProducts.length > 0) {
                            const variationChunksData = variableProducts.map((p: any) => ({
                                woo_id: p.id,
                                name: p.name || `Product ${p.id}`,
                                expected_count: p.variations?.length || 0
                            }));

                            const { data: queuedCount, error: queueError } = await supabase.rpc('queue_variation_chunks', {
                                p_job_id: jobId,
                                p_store_id: store_id,
                                p_variable_products: variationChunksData
                            });

                            if (queueError) {
                                console.error(`[sync-manager] Failed to queue variation chunks:`, queueError);
                            } else {
                                console.log(`[sync-manager] Queued ${queuedCount} variation chunks for page ${chunk.page_number}`);
                            }
                        }

                        // Complete chunk
                        await supabase.rpc('complete_import_chunk', {
                            p_chunk_id: chunk.id,
                            p_items_processed: transformed.length
                        });

                        // Update progress
                        const { data: currentJob } = await supabase
                            .from('sync_jobs')
                            .select('synced_products')
                            .eq('id', jobId)
                            .single();

                        const newSynced = (currentJob?.synced_products || 0) + transformed.length;
                        await supabase.from('sync_jobs').update({
                            synced_products: newSynced,
                            current_phase: 'products'
                        }).eq('id', jobId);

                        await updateProgress({
                            phase: 'products',
                            current: newSynced,
                            total: totalProducts,
                            message: `Processed page ${chunk.page_number}: ${transformed.length} products`
                        });

                    } else if (chunk.chunk_type === 'categories') {
                        // Fetch all categories
                        const allCategories: WooCommerceCategory[] = [];
                        let catPage = 1;
                        let catTotalPages = 1;

                        while (catPage <= catTotalPages) {
                            const { data: cats, totalPages } = await wooFetch(
                                shop_url, consumer_key, consumer_secret,
                                "/wc/v3/products/categories",
                                { per_page: "100", page: String(catPage) }
                            );
                            allCategories.push(...cats);
                            catTotalPages = totalPages;
                            catPage++;
                        }

                        if (allCategories.length > 0) {
                            // Use the full transformation function for complete metadata
                            const transformedCats = allCategories.map((c: WooCommerceCategory) =>
                                transformWooCommerceCategory(c, store.id)
                            );

                            const { error: catError } = await supabase
                                .from("categories")
                                .upsert(transformedCats, { onConflict: "store_id,external_id" });

                            if (catError) {
                                throw new Error(catError.message);
                            }

                            categoriesSynced = transformedCats.length;
                        }

                        await supabase.rpc('complete_import_chunk', {
                            p_chunk_id: chunk.id,
                            p_items_processed: categoriesSynced
                        });

                        await supabase.from('sync_jobs').update({
                            synced_categories: categoriesSynced,
                            current_phase: 'categories'
                        }).eq('id', jobId);

                        await updateProgress({
                            phase: 'categories',
                            current: categoriesSynced,
                            total: totalCategories,
                            message: `Synced ${categoriesSynced} categories`
                        });

                    } else if (chunk.chunk_type === 'posts' && canSyncPosts) {
                        // Fetch posts for this page with embedded data
                        const { data: posts } = await wpFetch(
                            shop_url, wp_username, wp_app_password,
                            "/wp/v2/posts",
                            {
                                per_page: String(CONFIG.PRODUCTS_PER_PAGE),
                                page: String(chunk.page_number),
                                status: "publish,draft,pending,private",
                                _embed: "wp:featuredmedia,wp:term,author" // Get featured image, categories, tags, author
                            }
                        );

                        if (posts.length > 0) {
                            // Transform posts
                            const transformedPosts = posts.map((post: WordPressPost) =>
                                transformWordPressPost(post, store.id, user.id, seoPlugin)
                            );

                            // Upsert to blog_articles table (unified table)
                            const { error: postsError, data: upsertedPosts } = await supabase
                                .from("blog_articles")
                                .upsert(transformedPosts, {
                                    onConflict: "store_id,wordpress_post_id",
                                    ignoreDuplicates: false
                                })
                                .select('id, wordpress_post_id');

                            if (postsError) {
                                // Log individual failures for debugging
                                console.error(`[sync-manager] Posts upsert error:`, postsError);
                                await supabase.from('sync_logs').insert({
                                    job_id: jobId,
                                    message: `Failed to upsert ${transformedPosts.length} posts: ${postsError.message}`,
                                    type: 'error'
                                });
                                throw new Error(postsError.message);
                            }

                            postsSynced += transformedPosts.length;
                            console.log(`[sync-manager] Successfully upserted ${transformedPosts.length} posts to blog_articles`);
                        }

                        // Complete chunk
                        await supabase.rpc('complete_import_chunk', {
                            p_chunk_id: chunk.id,
                            p_items_processed: posts.length
                        });

                        // Update progress
                        const { data: currentJob } = await supabase
                            .from('sync_jobs')
                            .select('synced_posts')
                            .eq('id', jobId)
                            .single();

                        const newSyncedPosts = (currentJob?.synced_posts || 0) + posts.length;
                        await supabase.from('sync_jobs').update({
                            synced_posts: newSyncedPosts,
                            current_phase: 'posts'
                        }).eq('id', jobId);

                        await updateProgress({
                            phase: 'posts',
                            current: newSyncedPosts,
                            total: totalPosts,
                            message: `Processed page ${chunk.page_number}: ${posts.length} articles`
                        });

                    } else if (chunk.chunk_type === 'variations') {
                        // ============================================================
                        // VARIATION CHUNK PROCESSING - Robust approach for large catalogs
                        // Each variable product gets its own chunk, preventing timeout issues
                        // ============================================================
                        const chunkMetadata = chunk.metadata || {};
                        const wooProductId = chunkMetadata.woo_product_id;
                        const productName = chunkMetadata.product_name || `Product ${wooProductId}`;

                        if (!wooProductId) {
                            console.error(`[sync-manager] Variation chunk ${chunk.id} missing woo_product_id`);
                            await supabase.rpc('fail_import_chunk', {
                                p_chunk_id: chunk.id,
                                p_error: 'Missing woo_product_id in chunk metadata'
                            });
                            continue;
                        }

                        console.log(`[sync-manager] Fetching variations for product ${wooProductId} (${productName})`);

                        // Fetch all variations for this product (with pagination support)
                        const allVariations: any[] = [];
                        let varPage = 1;
                        let hasMore = true;

                        while (hasMore) {
                            try {
                                const { data: variations, totalPages } = await wooFetch(
                                    shop_url, consumer_key, consumer_secret,
                                    `/wc/v3/products/${wooProductId}/variations`,
                                    { per_page: "100", page: String(varPage) }
                                );

                                allVariations.push(...variations);
                                hasMore = varPage < totalPages;
                                varPage++;

                                // Safety check - don't loop forever
                                if (varPage > 10) {
                                    console.warn(`[sync-manager] Product ${wooProductId} has too many variation pages, stopping at 1000`);
                                    break;
                                }
                            } catch (varError: any) {
                                console.error(`[sync-manager] Failed to fetch variations page ${varPage} for product ${wooProductId}:`, varError);
                                hasMore = false;
                            }
                        }

                        console.log(`[sync-manager] Fetched ${allVariations.length} variations for product ${wooProductId}`);

                        // Update the product's metadata with the detailed variations
                        if (allVariations.length > 0) {
                            // Get the product from DB
                            const { data: existingProduct } = await supabase
                                .from('products')
                                .select('id, metadata, working_content, store_snapshot_content')
                                .eq('store_id', store_id)
                                .eq('platform_product_id', String(wooProductId))
                                .single();

                            if (existingProduct) {
                                // Update metadata.variants with the detailed variations
                                const updatedMetadata = {
                                    ...(existingProduct.metadata || {}),
                                    variants: allVariations,
                                    variations_synced_at: new Date().toISOString()
                                };

                                // Build the normalized variation data
                                const normalizedVariations = allVariations.map((v: any) => ({
                                    id: v.id,
                                    sku: v.sku,
                                    global_unique_id: v.global_unique_id || null,
                                    price: v.price,
                                    regular_price: v.regular_price,
                                    sale_price: v.sale_price,
                                    date_on_sale_from: v.date_on_sale_from || null,
                                    date_on_sale_to: v.date_on_sale_to || null,
                                    on_sale: v.on_sale ?? false,
                                    stock_quantity: v.stock_quantity,
                                    stock_status: v.stock_status,
                                    manage_stock: v.manage_stock ?? false,
                                    backorders: v.backorders || 'no',
                                    low_stock_amount: v.low_stock_amount || null,
                                    weight: v.weight || null,
                                    dimensions: v.dimensions || null,
                                    shipping_class: v.shipping_class || null,
                                    tax_status: v.tax_status || 'taxable',
                                    tax_class: v.tax_class || '',
                                    virtual: v.virtual ?? false,
                                    downloadable: v.downloadable ?? false,
                                    downloads: v.downloads || [],
                                    download_limit: v.download_limit ?? -1,
                                    download_expiry: v.download_expiry ?? -1,
                                    description: v.description || null,
                                    status: v.status || 'publish',
                                    menu_order: v.menu_order ?? 0,
                                    attributes: v.attributes,
                                    image: v.image,
                                    meta_data: v.meta_data || [],
                                }));

                                // Update BOTH working_content AND store_snapshot_content
                                // so that dirty_fields_content doesn't show false positives
                                const updatedWorkingContent = {
                                    ...(existingProduct.working_content || {}),
                                    variations: normalizedVariations
                                };

                                const updatedSnapshotContent = {
                                    ...(existingProduct.store_snapshot_content || {}),
                                    variations: normalizedVariations
                                };

                                const { error: updateError } = await supabase
                                    .from('products')
                                    .update({
                                        metadata: updatedMetadata,
                                        working_content: updatedWorkingContent,
                                        store_snapshot_content: updatedSnapshotContent,
                                        dirty_fields_content: [],
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('id', existingProduct.id);

                                if (updateError) {
                                    console.error(`[sync-manager] Failed to update product ${wooProductId} with variations:`, updateError);
                                    throw new Error(updateError.message);
                                }

                                variationsSynced += allVariations.length;
                                console.log(`[sync-manager] Updated product ${wooProductId} with ${allVariations.length} variations`);
                            } else {
                                console.warn(`[sync-manager] Product ${wooProductId} not found in DB, skipping variation update`);
                            }
                        }

                        // Complete the variation chunk
                        await supabase.rpc('complete_import_chunk', {
                            p_chunk_id: chunk.id,
                            p_items_processed: allVariations.length
                        });

                        await updateProgress({
                            phase: 'variations',
                            current: variationsSynced,
                            total: 0, // Unknown total at this point
                            message: `Synced ${allVariations.length} variations for "${productName}"`
                        });
                    }

                } catch (chunkError: any) {
                    console.error(`[sync-manager] Chunk ${chunk.id} failed:`, chunkError);
                    await supabase.rpc('fail_import_chunk', {
                        p_chunk_id: chunk.id,
                        p_error: chunkError.message
                    });
                    errors.push(`Chunk ${chunk.chunk_type} page ${chunk.page_number}: ${chunkError.message}`);
                }
            }

            // Check if we timed out or finished
            const { data: pendingChunks } = await supabase
                .from('sync_import_chunks')
                .select('id')
                .eq('job_id', jobId)
                .in('status', ['pending', 'processing'])
                .limit(1);

            if (pendingChunks && pendingChunks.length > 0) {
                // Still work to do - mark as resumable
                await supabase.from('sync_jobs').update({
                    can_resume: true,
                    status: 'syncing'
                }).eq('id', jobId);

                console.log(`[sync-manager] Time limit reached, job can be resumed`);

                return new Response(
                    JSON.stringify({
                        success: true,
                        status: 'in_progress',
                        can_resume: true,
                        message: 'Processing in progress, call again to continue',
                        products_synced: productsUpserted,
                        job_id: jobId
                    }),
                    { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
                );
            }

        } else {
            // ===========================================
            // DIRECT MODE - Small catalog, process all at once
            // ===========================================
            console.log(`[sync-manager] Processing in direct mode (small catalog)`);

            await updateProgress({ phase: "products", current: 0, total: totalProducts, message: "Fetching products..." });

            const allProducts: any[] = [];
            let page = 1;

            while (page <= totalPages) {
                // IMPORTANT: Use orderby=id&order=asc for stable pagination
                const result = await wooFetch(shop_url, consumer_key, consumer_secret, "/wc/v3/products", {
                    per_page: String(CONFIG.PRODUCTS_PER_PAGE),
                    page: String(page),
                    status: "any",
                    orderby: "id",
                    order: "asc"
                });

                allProducts.push(...result.data);
                await updateProgress({
                    phase: "products",
                    current: allProducts.length,
                    total: totalProducts,
                    message: `Fetched page ${page}/${totalPages}`
                });
                page++;
            }

            // Fetch variations for variable products with pagination support
            const variableProducts = allProducts.filter(p => p.type === "variable" && p.variations?.length > 0);
            for (const product of variableProducts) {
                try {
                    const allVariations: any[] = [];
                    let varPage = 1;
                    let hasMore = true;

                    while (hasMore) {
                        const { data: variations, totalPages } = await wooFetch(
                            shop_url, consumer_key, consumer_secret,
                            `/wc/v3/products/${product.id}/variations`,
                            { per_page: "100", page: String(varPage) }
                        );
                        allVariations.push(...variations);
                        hasMore = varPage < totalPages;
                        varPage++;
                        if (varPage > 10) break; // Safety limit
                    }

                    product._variationsDetailed = allVariations;
                    variationsSynced += allVariations.length;
                } catch (e) {
                    console.warn(`[sync-manager] Failed to fetch variations for product ${product.id}`);
                    product._variationsDetailed = [];
                }
            }

            // Deduplicate products by ID (in case WooCommerce returns duplicates across pages)
            const seenIds = new Set<number>();
            const uniqueProducts = allProducts.filter((p: any) => {
                if (seenIds.has(p.id)) {
                    console.warn(`[sync-manager] Duplicate product ID ${p.id} found across pages`);
                    return false;
                }
                seenIds.add(p.id);
                return true;
            });

            if (uniqueProducts.length !== allProducts.length) {
                const duplicateCount = allProducts.length - uniqueProducts.length;
                console.warn(`[sync-manager] Removed ${duplicateCount} duplicate product(s)`);
                await supabase.from('sync_logs').insert({
                    job_id: jobId,
                    message: `Removed ${duplicateCount} duplicate product(s) from WooCommerce response`,
                    type: 'warning'
                });
            }

            // Transform and upsert
            const transformed = uniqueProducts.map(p => transformWooCommerceProduct(p, store.id, user.id, seoPlugin));

            const batches = chunkArray(transformed, CONFIG.UPSERT_BATCH_SIZE);
            let batchIndex = 0;
            for (const batch of batches) {
                batchIndex++;
                const { error: upsertError, data: upsertedData } = await supabase
                    .from("products")
                    .upsert(batch, { onConflict: "store_id,platform_product_id", ignoreDuplicates: false })
                    .select('id, platform_product_id');

                if (upsertError) {
                    console.error(`[sync-manager] Products batch ${batchIndex} upsert error:`, upsertError);
                    errors.push(`Upsert error batch ${batchIndex}: ${upsertError.message}`);
                    // Log detailed error
                    await supabase.from('sync_logs').insert({
                        job_id: jobId,
                        message: `Failed batch ${batchIndex}/${batches.length} (${batch.length} products): ${upsertError.message}`,
                        type: 'error'
                    });
                } else {
                    const actualCount = upsertedData?.length || batch.length;
                    productsUpserted += actualCount;

                    // Log discrepancy if any
                    if (actualCount !== batch.length) {
                        console.warn(`[sync-manager] Batch ${batchIndex} discrepancy: sent ${batch.length}, got ${actualCount}`);
                    }
                }

                await updateProgress({
                    phase: "products",
                    current: productsUpserted,
                    total: totalProducts,
                    message: `Saved ${productsUpserted}/${totalProducts} products`
                });
            }

            // Sync categories
            if (include_categories) {
                await updateProgress({ phase: "categories", current: 0, total: 1, message: "Syncing categories..." });

                const allCategories: WooCommerceCategory[] = [];
                let catPage = 1;
                let catTotalPages = 1;

                while (catPage <= catTotalPages) {
                    const { data: cats, totalPages } = await wooFetch(
                        shop_url, consumer_key, consumer_secret,
                        "/wc/v3/products/categories",
                        { per_page: "100", page: String(catPage) }
                    );
                    allCategories.push(...cats);
                    catTotalPages = totalPages;
                    catPage++;
                }

                if (allCategories.length > 0) {
                    // Use the full transformation function for complete metadata
                    const transformedCats = allCategories.map((c: WooCommerceCategory) =>
                        transformWooCommerceCategory(c, store.id)
                    );

                    const { error: catError } = await supabase
                        .from("categories")
                        .upsert(transformedCats, { onConflict: "store_id,external_id" });

                    if (!catError) {
                        categoriesSynced = transformedCats.length;
                    }
                }

                await supabase.from('sync_jobs').update({ synced_categories: categoriesSynced }).eq('id', jobId);
                await updateProgress({
                    phase: "categories",
                    current: categoriesSynced,
                    total: totalCategories,
                    message: `Synced ${categoriesSynced} categories`
                });
            }

            // Sync posts (if WordPress credentials available)
            if (canSyncPosts) {
                await updateProgress({ phase: "posts", current: 0, total: 1, message: "Syncing blog posts..." });

                const allPosts: WordPressPost[] = [];
                let postPage = 1;
                let postTotalPages = 1;

                while (postPage <= postTotalPages) {
                    try {
                        const { data: posts, totalPages } = await wpFetch(
                            shop_url, wp_username, wp_app_password,
                            "/wp/v2/posts",
                            {
                                per_page: String(CONFIG.PRODUCTS_PER_PAGE),
                                page: String(postPage),
                                status: "publish,draft,pending,private",
                                _embed: "wp:featuredmedia,wp:term,author"
                            }
                        );
                        allPosts.push(...posts);
                        postTotalPages = totalPages;
                        postPage++;
                    } catch (postError: any) {
                        console.warn(`[sync-manager] Failed to fetch posts page ${postPage}: ${postError.message}`);
                        break;
                    }
                }

                if (allPosts.length > 0) {
                    const transformedPosts = allPosts.map((post: WordPressPost) =>
                        transformWordPressPost(post, store.id, user.id, seoPlugin)
                    );

                    // Upsert in batches to blog_articles (unified table)
                    const postBatches = chunkArray(transformedPosts, CONFIG.UPSERT_BATCH_SIZE);
                    for (const batch of postBatches) {
                        const { error: postsError } = await supabase
                            .from("blog_articles")
                            .upsert(batch, {
                                onConflict: "store_id,wordpress_post_id",
                                ignoreDuplicates: false
                            });

                        if (postsError) {
                            console.error(`[sync-manager] Posts batch upsert error:`, postsError);
                            errors.push(`Posts upsert error: ${postsError.message}`);
                            // Log individual batch failure
                            await supabase.from('sync_logs').insert({
                                job_id: jobId,
                                message: `Failed batch of ${batch.length} posts: ${postsError.message}`,
                                type: 'error'
                            });
                        } else {
                            postsSynced += batch.length;
                        }

                        await updateProgress({
                            phase: "posts",
                            current: postsSynced,
                            total: allPosts.length,
                            message: `Saved ${postsSynced}/${allPosts.length} articles`
                        });
                    }
                }

                await supabase.from('sync_jobs').update({ synced_posts: postsSynced }).eq('id', jobId);
                await updateProgress({
                    phase: "posts",
                    current: postsSynced,
                    total: allPosts.length || totalPosts,
                    message: `Synced ${postsSynced} blog posts`
                });
            }
        }

        // ===========================================
        // 7. COMPLETION
        // ===========================================
        const durationSeconds = Math.round((Date.now() - startTime) / 1000);

        // Get final counts from DB
        const { data: finalJob } = await supabase
            .from('sync_jobs')
            .select('synced_products, synced_categories, synced_posts')
            .eq('id', jobId)
            .single();

        const result = {
            success: errors.length === 0,
            products_synced: finalJob?.synced_products || productsUpserted,
            variations_synced: variationsSynced,
            categories_synced: finalJob?.synced_categories || categoriesSynced,
            posts_synced: finalJob?.synced_posts || postsSynced,
            total_products: totalProducts,
            total_posts: totalPosts,
            errors,
            duration_seconds: durationSeconds,
            job_id: jobId
        };

        await supabase.from('sync_jobs').update({
            status: errors.length === 0 ? 'completed' : 'failed',
            current_phase: 'completed',
            can_resume: false,
            completed_at: new Date().toISOString(),
            result: result as any,
            error_message: errors.length > 0 ? errors.join('; ') : null
        }).eq('id', jobId);

        await supabase.from('sync_logs').insert({
            job_id: jobId,
            message: `Sync completed in ${durationSeconds}s. Products: ${result.products_synced}, Categories: ${result.categories_synced}, Articles: ${result.posts_synced}`,
            type: result.success ? 'success' : 'error'
        });

        console.log(`[sync-manager] Completed in ${durationSeconds}s:`, result);

        return new Response(
            JSON.stringify(result),
            { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("[sync-manager] Fatal error:", error);

        if (jobId && supabase) {
            await supabase.from('sync_jobs').update({
                status: 'failed',
                can_resume: false,
                error_message: error.message
            }).eq('id', jobId);
        }

        return errorResponse(500, error.message || "Internal server error", req);
    }
});

function errorResponse(status: number, message: string, req?: Request): Response {
    const headers = req ? getCorsHeaders(req) : corsHeaders;
    return new Response(
        JSON.stringify({ success: false, error: message }),
        { status, headers: { ...headers, "Content-Type": "application/json" } }
    );
}
