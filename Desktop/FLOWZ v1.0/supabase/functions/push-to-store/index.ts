/**
 * push-to-store - Edge Function pour synchroniser vers WooCommerce/WordPress
 *
 * Version 3.0 - Security & Quality Hardened
 *
 * Security Features:
 * - User ownership verification (not just RLS bypass)
 * - UUID validation on all IDs
 * - Rate limiting (10 requests/minute per user)
 * - CORS restricted to allowed domains
 * - HTTPS enforcement for external URLs
 * - Sanitized error messages
 * - Audit logging
 *
 * @module push-to-store
 */

/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum IDs per request */
const MAX_IDS_PER_REQUEST = 50;

/** Rate limit: requests per window */
const RATE_LIMIT_MAX_REQUESTS = 10;

/** Rate limit window in milliseconds (1 minute) */
const RATE_LIMIT_WINDOW_MS = 60_000;

/** UUID v4 regex pattern */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Allowed CORS origins */
const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://flowz.app',
    'https://app.flowz.app',
    'https://staging.flowz.app',
];

/** Generic error messages for security */
const ERROR_MESSAGES = {
    INVALID_REQUEST: 'Invalid request format',
    UNAUTHORIZED: 'Unauthorized access',
    PRODUCT_NOT_FOUND: 'Product not found or access denied',
    STORE_NOT_CONFIGURED: 'Store connection not configured',
    SYNC_FAILED: 'Synchronization failed',
    RATE_LIMITED: 'Too many requests. Please try again later.',
    INTERNAL_ERROR: 'An internal error occurred',
} as const;

// ============================================================================
// TYPES
// ============================================================================

/** Valid sync entity types */
type SyncType = 'product' | 'article';

/** Push request body schema */
interface PushRequest {
    type: SyncType;
    ids: string[];
    force?: boolean;
}

/** Result of a single push operation */
interface PushResult {
    id: string;
    platformId: string;
    success: boolean;
    error?: string;
    skipped?: boolean;
    skipReason?: string;
}

/** WooCommerce API credentials */
interface WooCredentials {
    shopUrl: string;
    consumerKey: string;
    consumerSecret: string;
}

/** WordPress REST API credentials */
interface WordPressCredentials {
    siteUrl: string;
    username: string;
    appPassword: string;
}

/** Product data from database */
interface ProductRecord {
    id: string;
    tenant_id: string;
    platform_product_id: string | null;
    store_id: string;
    working_content: WorkingContent | null;
    metadata: ProductMetadata | null;
    dirty_fields_content: string[] | null;
    working_content_updated_at: string | null;
    last_synced_at: string | null;
    stores: StoreRecord;
}

/** Store data from database */
interface StoreRecord {
    id: string;
    platform: string;
    connection_id: string;
    platform_connections: PlatformConnection | null;
}

/** Platform connection data */
interface PlatformConnection {
    shop_url: string | null;
    credentials_encrypted: string | CredentialsData | null;
}

/** Parsed credentials structure */
interface CredentialsData {
    consumer_key?: string;
    consumer_secret?: string;
    api_key?: string;
    api_secret?: string;
}

/** Working content structure */
interface WorkingContent {
    title?: string;
    name?: string;
    slug?: string;
    description?: string;
    short_description?: string;
    sku?: string;
    status?: string;
    product_type?: string;
    regular_price?: string | number;
    sale_price?: string | number;
    manage_stock?: boolean;
    stock?: number;
    stock_quantity?: number;
    stock_status?: string;
    weight?: string;
    dimensions?: DimensionsData;
    dimensions_length?: string;
    dimensions_width?: string;
    dimensions_height?: string;
    shipping_class?: string;
    tax_status?: string;
    tax_class?: string;
    catalog_visibility?: string;
    virtual?: boolean;
    downloadable?: boolean;
    categories?: CategoryInput[];
    tags?: TagInput[];
    images?: ImageInput[];
    attributes?: AttributeInput[];
    meta_title?: string;
    seo_title?: string;
    meta_description?: string;
    seo_description?: string;
    seo?: SeoData;
    [key: string]: unknown;
}

/** Dimensions structure */
interface DimensionsData {
    length?: string;
    width?: string;
    height?: string;
}

/** SEO data structure */
interface SeoData {
    focus_keyword?: string;
}

/** Category input variants */
type CategoryInput = number | { id: number | string } | { name: string } | string;

/** Tag input variants */
type TagInput = number | { id: number | string } | { name: string; slug?: string } | string;

/** Image input structure */
interface ImageInput {
    id?: number | string;
    src?: string;
    name?: string;
    alt?: string;
    position?: number;
}

/** Attribute input structure */
interface AttributeInput {
    id?: number | string;
    name: string;
    options?: string[];
    visible?: boolean;
    variation?: boolean;
}

/** Product metadata structure */
interface ProductMetadata {
    categories?: Array<{ id: number; name: string }>;
    tags?: Array<{ id: number; name: string; slug: string }>;
    date_modified?: string;
    modified?: string;
    [key: string]: unknown;
}

/** WooCommerce product update payload */
interface WooProductPayload {
    name?: string;
    slug?: string;
    description?: string;
    short_description?: string;
    sku?: string;
    status?: string;
    regular_price?: string;
    sale_price?: string;
    manage_stock?: boolean;
    stock_quantity?: number;
    stock_status?: string;
    weight?: string;
    dimensions?: { length?: string; width?: string; height?: string };
    shipping_class?: string;
    tax_status?: string;
    tax_class?: string;
    catalog_visibility?: string;
    type?: string;
    virtual?: boolean;
    downloadable?: boolean;
    categories?: Array<{ id: number }>;
    tags?: Array<{ id: number }>;
    images?: Array<{ id?: number; src?: string; name?: string; alt?: string; position?: number }>;
    attributes?: Array<{ id?: number; name: string; options: string[]; visible?: boolean; variation?: boolean }>;
    meta_data?: Array<{ key: string; value: string }>;
}

/** Rate limit entry */
interface RateLimitEntry {
    count: number;
    resetAt: number;
}

// ============================================================================
// RATE LIMITING (In-memory for Edge Function)
// ============================================================================

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check and update rate limit for a user
 * @param userId - User identifier
 * @returns true if request is allowed, false if rate limited
 */
function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const entry = rateLimitStore.get(userId);

    if (!entry || now > entry.resetAt) {
        rateLimitStore.set(userId, {
            count: 1,
            resetAt: now + RATE_LIMIT_WINDOW_MS,
        });
        return true;
    }

    if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
        return false;
    }

    entry.count++;
    return true;
}

// ============================================================================
// CORS HELPERS
// ============================================================================

/**
 * Build CORS headers for a request origin
 * @param origin - Request origin header
 * @returns CORS headers object
 */
function buildCorsHeaders(origin: string | null): Record<string, string> {
    const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
        ? origin
        : ALLOWED_ORIGINS[0];

    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Max-Age": "86400",
    };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate UUID format
 * @param id - String to validate
 * @returns true if valid UUID v4
 */
function isValidUuid(id: string): boolean {
    return UUID_REGEX.test(id);
}

/**
 * Validate URL is HTTPS
 * @param url - URL to validate
 * @returns true if valid HTTPS URL
 */
function isValidHttpsUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Validate push request body
 * @param body - Request body to validate
 * @returns Validated request or null
 */
function validateRequest(body: unknown): PushRequest | null {
    if (!body || typeof body !== 'object') return null;

    const req = body as Record<string, unknown>;

    // Validate type
    if (!req.type || !['product', 'article'].includes(req.type as string)) {
        return null;
    }

    // Validate ids
    if (!Array.isArray(req.ids) || req.ids.length === 0) {
        return null;
    }

    if (req.ids.length > MAX_IDS_PER_REQUEST) {
        return null;
    }

    // Validate each ID is a valid UUID
    const validIds = req.ids.filter((id): id is string =>
        typeof id === 'string' && isValidUuid(id)
    );

    if (validIds.length !== req.ids.length) {
        return null;
    }

    return {
        type: req.type as SyncType,
        ids: validIds,
        force: req.force === true,
    };
}

// ============================================================================
// JWT HELPERS
// ============================================================================

/**
 * Verify user identity via Supabase Auth (server-side JWT validation)
 * @param supabaseUrl - Supabase project URL
 * @param anonKey - Supabase anon key
 * @param authHeader - Authorization header from request
 * @returns Verified user ID or null
 */
async function verifyUserId(
    supabaseUrl: string,
    anonKey: string,
    authHeader: string
): Promise<string | null> {
    try {
        const authClient = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: authHeader } },
        });
        const { data: { user }, error } = await authClient.auth.getUser();
        if (error || !user) return null;
        return user.id;
    } catch {
        return null;
    }
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Log audit event to database
 * @param supabase - Supabase client
 * @param event - Audit event details
 */
async function logAuditEvent(
    supabase: SupabaseClient,
    event: {
        userId: string;
        action: string;
        entityType: string;
        entityIds: string[];
        success: boolean;
        metadata?: Record<string, unknown>;
    }
): Promise<void> {
    try {
        await supabase.from('sync_audit_log').insert({
            user_id: event.userId,
            action: event.action,
            entity_type: event.entityType,
            entity_ids: event.entityIds,
            success: event.success,
            metadata: event.metadata || {},
            created_at: new Date().toISOString(),
        });
    } catch (error) {
        // Don't fail the request if audit logging fails
        console.error('[audit] Failed to log event:', error);
    }
}

// ============================================================================
// CREDENTIAL EXTRACTION
// ============================================================================

/**
 * Extract WooCommerce credentials from connection
 * @param connection - Platform connection data
 * @returns Credentials or null if invalid
 */
function extractWooCredentials(connection: PlatformConnection): WooCredentials | null {
    const shopUrl = connection.shop_url;
    if (!shopUrl) return null;

    // Enforce HTTPS for production
    if (!isValidHttpsUrl(shopUrl) && !shopUrl.startsWith('http://localhost')) {
        console.warn('[credentials] Non-HTTPS URL rejected:', shopUrl);
        return null;
    }

    let consumerKey = '';
    let consumerSecret = '';

    if (connection.credentials_encrypted) {
        try {
            const creds: CredentialsData = typeof connection.credentials_encrypted === 'string'
                ? JSON.parse(connection.credentials_encrypted)
                : connection.credentials_encrypted;

            consumerKey = creds.consumer_key || creds.api_key || '';
            consumerSecret = creds.consumer_secret || creds.api_secret || '';
        } catch {
            console.error('[credentials] Failed to parse credentials');
            return null;
        }
    }

    if (!consumerKey || !consumerSecret) return null;

    return {
        shopUrl,
        consumerKey,
        consumerSecret,
    };
}

/**
 * Extract WordPress credentials from connection and config
 * @param connection - Platform connection data
 * @param blogConfig - WordPress blog configuration
 * @returns Credentials or null if invalid
 */
function extractWordPressCredentials(
    connection: PlatformConnection,
    blogConfig: { site_url?: string; wp_username?: string; wp_app_password?: string } | null
): WordPressCredentials | null {
    const siteUrl = connection.shop_url || blogConfig?.site_url;
    if (!siteUrl) return null;

    // Enforce HTTPS for production
    if (!isValidHttpsUrl(siteUrl) && !siteUrl.startsWith('http://localhost')) {
        console.warn('[credentials] Non-HTTPS URL rejected:', siteUrl);
        return null;
    }

    const username = blogConfig?.wp_username;
    const appPassword = blogConfig?.wp_app_password;

    if (!username || !appPassword) return null;

    return { siteUrl, username, appPassword };
}

// ============================================================================
// PRODUCT DATA BUILDERS
// ============================================================================

/**
 * Get value from multiple sources with priority
 * @param sources - Array of source objects
 * @param keys - Keys to look for (primary + alternates)
 * @returns Found value or undefined
 */
function getValueFromSources(
    sources: Array<Record<string, unknown> | null | undefined>,
    keys: string[]
): unknown {
    for (const key of keys) {
        for (const source of sources) {
            if (source && key in source && source[key] !== undefined) {
                return source[key];
            }
        }
    }
    return undefined;
}

/**
 * Build categories array for WooCommerce
 * @param categories - Raw category input
 * @param metaCategories - Available categories from metadata
 * @returns Formatted category array
 */
function buildCategories(
    categories: CategoryInput[],
    metaCategories: Array<{ id: number; name: string }>
): Array<{ id: number }> {
    return categories
        .map((cat): { id: number } | null => {
            if (typeof cat === 'number') {
                return { id: cat };
            }
            if (typeof cat === 'object' && cat !== null && 'id' in cat) {
                return { id: Number(cat.id) };
            }
            if (typeof cat === 'string' || (typeof cat === 'object' && 'name' in cat)) {
                const name = typeof cat === 'string' ? cat : cat.name;
                const found = metaCategories.find(mc => mc.name === name);
                return found ? { id: found.id } : null;
            }
            return null;
        })
        .filter((c): c is { id: number } => c !== null && c.id > 0);
}

/**
 * Build tags array for WooCommerce
 * @param tags - Raw tag input
 * @param metaTags - Available tags from metadata
 * @returns Formatted tag array
 */
function buildTags(
    tags: TagInput[],
    metaTags: Array<{ id: number; name: string; slug: string }>
): Array<{ id: number }> {
    return tags
        .map((tag): { id: number } | null => {
            if (typeof tag === 'number') {
                return { id: tag };
            }
            if (typeof tag === 'object' && tag !== null && 'id' in tag) {
                return { id: Number(tag.id) };
            }
            if (typeof tag === 'string') {
                const found = metaTags.find(mt => mt.name === tag || mt.slug === tag);
                return found ? { id: found.id } : null;
            }
            if (typeof tag === 'object' && 'name' in tag) {
                const found = metaTags.find(mt =>
                    mt.name === tag.name || mt.slug === tag.slug
                );
                return found ? { id: found.id } : null;
            }
            return null;
        })
        .filter((t): t is { id: number } => t !== null && t.id > 0);
}

/**
 * Build images array for WooCommerce
 * @param images - Raw image input
 * @returns Formatted image array with positions
 */
function buildImages(
    images: ImageInput[]
): Array<{ id?: number; src: string; name: string; alt: string; position: number }> {
    return images.map((img, index) => {
        const numericId = typeof img.id === 'number'
            ? img.id
            : (typeof img.id === 'string' && /^\d+$/.test(img.id)
                ? parseInt(img.id, 10)
                : undefined);

        return {
            ...(numericId !== undefined ? { id: numericId } : {}),
            src: img.src || '',
            name: img.name || '',
            alt: img.alt || '',
            position: typeof img.position === 'number' ? img.position : index,
        };
    });
}

/**
 * Build attributes array for WooCommerce
 * @param attributes - Raw attribute input
 * @returns Formatted attribute array
 */
function buildAttributes(
    attributes: AttributeInput[]
): Array<{ id?: number; name: string; options: string[]; visible: boolean; variation: boolean }> {
    return attributes.map(attr => ({
        ...(attr.id ? { id: Number(attr.id) } : {}),
        name: String(attr.name || ''),
        options: Array.isArray(attr.options) ? attr.options : [],
        visible: attr.visible ?? true,
        variation: attr.variation ?? false,
    }));
}

/**
 * Build SEO metadata array
 * @param content - Working content
 * @param metadata - Product metadata
 * @returns SEO meta_data array for WooCommerce
 */
function buildSeoMetadata(
    content: WorkingContent,
    metadata: ProductMetadata
): Array<{ key: string; value: string }> {
    const metaData: Array<{ key: string; value: string }> = [];

    const seoTitle = content.meta_title || content.seo_title;
    if (seoTitle) {
        metaData.push({ key: '_yoast_wpseo_title', value: String(seoTitle) });
        metaData.push({ key: 'rank_math_title', value: String(seoTitle) });
    }

    const seoDescription = content.meta_description || content.seo_description;
    if (seoDescription) {
        metaData.push({ key: '_yoast_wpseo_metadesc', value: String(seoDescription) });
        metaData.push({ key: 'rank_math_description', value: String(seoDescription) });
    }

    const focusKeyword = content.seo?.focus_keyword ||
        (metadata.seo as SeoData | undefined)?.focus_keyword;
    if (focusKeyword) {
        metaData.push({ key: '_yoast_wpseo_focuskw', value: String(focusKeyword) });
        metaData.push({ key: 'rank_math_focus_keyword', value: String(focusKeyword) });
    }

    return metaData;
}

// ============================================================================
// VARIATION PUSH (WooCommerce Batch API)
// ============================================================================

/**
 * Push dirty variations to WooCommerce using the batch endpoint.
 * Handles create, update, and delete operations in a single API call.
 */
async function pushDirtyVariations(
    supabase: SupabaseClient,
    credentials: WooCredentials,
    productDbId: string,
    platformProductId: string,
    storeId: string
): Promise<void> {
    // Fetch all dirty variations for this product
    const { data: dirtyVariations, error: fetchError } = await supabase
        .from('product_variations')
        .select('*')
        .eq('store_id', storeId)
        .eq('parent_product_external_id', platformProductId)
        .eq('is_dirty', true);

    if (fetchError) {
        console.error('[push-variations] Fetch error:', fetchError);
        return;
    }

    if (!dirtyVariations || dirtyVariations.length === 0) {
        console.log('[push-variations] No dirty variations to push');
        return;
    }

    console.log(`[push-variations] Pushing ${dirtyVariations.length} dirty variations`);

    // Build batch payload
    const toCreate: Record<string, unknown>[] = [];
    const toUpdate: Record<string, unknown>[] = [];
    const toDeleteIds: number[] = [];

    // Track DB IDs for post-push cleanup
    const createDbIds: string[] = [];
    const updateDbIds: string[] = [];
    const deleteDbIds: string[] = [];

    for (const v of dirtyVariations) {
        const variationPayload = buildVariationPayload(v);

        switch (v.dirty_action) {
            case 'created':
                toCreate.push(variationPayload);
                createDbIds.push(v.id);
                break;
            case 'updated':
                if (v.external_id && !String(v.external_id).startsWith('local_')) {
                    toUpdate.push({ id: Number(v.external_id), ...variationPayload });
                    updateDbIds.push(v.id);
                } else {
                    // Variation was created locally and then updated before syncing
                    toCreate.push(variationPayload);
                    createDbIds.push(v.id);
                }
                break;
            case 'deleted':
                if (v.external_id && !String(v.external_id).startsWith('local_')) {
                    toDeleteIds.push(Number(v.external_id));
                    deleteDbIds.push(v.id);
                } else {
                    // Variation was created locally and deleted before syncing
                    // We just need to remove it from DB
                    deleteDbIds.push(v.id);
                }
                break;
        }
    }

    // WooCommerce batch endpoint: POST /products/{id}/variations/batch
    // Max 100 items per batch
    const batchBody: Record<string, unknown> = {};
    if (toCreate.length > 0) batchBody.create = toCreate;
    if (toUpdate.length > 0) batchBody.update = toUpdate;
    if (toDeleteIds.length > 0) batchBody.delete = toDeleteIds;

    if (Object.keys(batchBody).length === 0) return;

    const baseUrl = credentials.shopUrl.replace(/\/+$/, '');
    const batchUrl = `${baseUrl}/wp-json/wc/v3/products/${platformProductId}/variations/batch`;
    const authHeader = 'Basic ' + btoa(`${credentials.consumerKey}:${credentials.consumerSecret}`);

    const variationAbortController = new AbortController();
    const variationTimeoutId = setTimeout(() => variationAbortController.abort(), 25000);
    let response: Response;
    try {
        response = await fetch(batchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify(batchBody),
            signal: variationAbortController.signal,
        });
    } finally {
        clearTimeout(variationTimeoutId);
    }

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[push-variations] WC batch error ${response.status}:`, errorText);
        return;
    }

    const batchResult = await response.json() as {
        create?: Array<{ id: number }>;
        update?: Array<{ id: number }>;
        delete?: Array<{ id: number }>;
    };

    // Post-push cleanup: update external_ids for created variations
    if (batchResult.create && createDbIds.length > 0) {
        for (let i = 0; i < Math.min(batchResult.create.length, createDbIds.length); i++) {
            const wcVariation = batchResult.create[i];
            const dbId = createDbIds[i];
            if (wcVariation?.id) {
                await supabase
                    .from('product_variations')
                    .update({
                        external_id: String(wcVariation.id),
                        is_dirty: false,
                        dirty_action: null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', dbId);
            }
        }
    }

    // Clear dirty flags on updated variations
    if (updateDbIds.length > 0) {
        await supabase
            .from('product_variations')
            .update({ is_dirty: false, dirty_action: null })
            .in('id', updateDbIds);
    }

    // Hard-delete variations that were deleted from WooCommerce
    if (deleteDbIds.length > 0) {
        await supabase
            .from('product_variations')
            .delete()
            .in('id', deleteDbIds);
    }

    console.log(`[push-variations] Done: ${toCreate.length} created, ${toUpdate.length} updated, ${toDeleteIds.length} deleted`);
}

/**
 * Build a WooCommerce variation payload from a DB row
 */
function buildVariationPayload(v: Record<string, unknown>): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    if (v.sku) payload.sku = String(v.sku);
    if (v.regular_price != null) payload.regular_price = String(v.regular_price);
    if (v.sale_price != null) payload.sale_price = String(v.sale_price);
    if (v.manage_stock != null) payload.manage_stock = Boolean(v.manage_stock);
    if (v.stock_quantity != null) payload.stock_quantity = Number(v.stock_quantity);
    if (v.stock_status) payload.stock_status = String(v.stock_status);
    if (v.weight) payload.weight = String(v.weight);
    if (v.status) payload.status = String(v.status);
    if (v.description) payload.description = String(v.description);

    // Phase 1: Extended editable fields
    if (v.global_unique_id) payload.global_unique_id = String(v.global_unique_id);
    if (v.backorders) payload.backorders = String(v.backorders);
    if (v.tax_status) payload.tax_status = String(v.tax_status);
    if (v.tax_class != null) payload.tax_class = String(v.tax_class);
    if (v.date_on_sale_from) payload.date_on_sale_from = String(v.date_on_sale_from);
    if (v.date_on_sale_to) payload.date_on_sale_to = String(v.date_on_sale_to);

    // Phase 2: Sync-only fields (round-trip preservation)
    if (v.shipping_class) payload.shipping_class = String(v.shipping_class);
    if (v.download_limit != null && v.download_limit !== -1) payload.download_limit = Number(v.download_limit);
    if (v.download_expiry != null && v.download_expiry !== -1) payload.download_expiry = Number(v.download_expiry);
    if (Array.isArray(v.downloads) && v.downloads.length > 0) payload.downloads = v.downloads;
    if (v.menu_order != null) payload.menu_order = Number(v.menu_order);

    // Dimensions
    if (v.dimensions && typeof v.dimensions === 'object') {
        const dims = v.dimensions as Record<string, string>;
        if (dims.length || dims.width || dims.height) {
            payload.dimensions = {
                length: dims.length || '',
                width: dims.width || '',
                height: dims.height || '',
            };
        }
    }

    // Attributes
    if (Array.isArray(v.attributes)) {
        payload.attributes = (v.attributes as Array<{ name: string; option: string }>).map(a => ({
            name: String(a.name || ''),
            option: String(a.option || ''),
        }));
    }

    // Image
    if (v.image && typeof v.image === 'object') {
        const img = v.image as Record<string, unknown>;
        if (img.src) {
            payload.image = {
                ...(img.id ? { id: Number(img.id) } : {}),
                src: String(img.src),
                alt: String(img.alt || ''),
            };
        }
    }

    return payload;
}

/**
 * Build complete WooCommerce product update payload
 * @param workingContent - Product working content
 * @param metadata - Product metadata
 * @returns WooCommerce API payload
 */
function buildWooProductPayload(
    workingContent: WorkingContent,
    metadata: ProductMetadata
): WooProductPayload {
    const payload: WooProductPayload = {};
    const sources = [workingContent, metadata];

    const getValue = (keys: string[]): unknown =>
        getValueFromSources(sources, keys);

    // Basic fields
    const title = getValue(['title', 'name']);
    if (title) payload.name = String(title);

    const slug = getValue(['slug']);
    if (slug) payload.slug = String(slug);

    const description = getValue(['description']);
    if (description !== undefined) payload.description = String(description || '');

    const shortDesc = getValue(['short_description']);
    if (shortDesc !== undefined) payload.short_description = String(shortDesc || '');

    const sku = getValue(['sku']);
    if (sku) payload.sku = String(sku);

    // Status mapping
    const status = getValue(['status']);
    if (status) {
        payload.status = status === 'published' ? 'publish' : String(status);
    }

    // Type mapping
    const productType = getValue(['product_type', 'type']);
    if (productType) {
        payload.type = String(productType);
    }

    // Pricing
    const regularPrice = getValue(['regular_price']);
    if (regularPrice !== undefined && regularPrice !== null) {
        payload.regular_price = String(regularPrice);
    }

    const salePrice = getValue(['sale_price']);
    if (salePrice !== undefined) {
        payload.sale_price = salePrice ? String(salePrice) : '';
    }

    // Stock
    const manageStock = getValue(['manage_stock']);
    if (manageStock !== undefined) payload.manage_stock = Boolean(manageStock);

    const stock = getValue(['stock', 'stock_quantity']);
    if (stock !== undefined && stock !== null) {
        payload.stock_quantity = Number(stock);
    }

    const stockStatus = getValue(['stock_status']);
    if (stockStatus) payload.stock_status = String(stockStatus);

    // Dimensions
    const weight = getValue(['weight']);
    if (weight) payload.weight = String(weight);

    const dimensions = workingContent.dimensions;
    const dimLength = workingContent.dimensions_length;
    const dimWidth = workingContent.dimensions_width;
    const dimHeight = workingContent.dimensions_height;

    if (dimensions || dimLength || dimWidth || dimHeight) {
        payload.dimensions = {
            length: String(dimensions?.length || dimLength || ''),
            width: String(dimensions?.width || dimWidth || ''),
            height: String(dimensions?.height || dimHeight || ''),
        };
    }

    // Shipping & Tax
    const shippingClass = getValue(['shipping_class']);
    if (shippingClass) payload.shipping_class = String(shippingClass);

    const taxStatus = getValue(['tax_status']);
    if (taxStatus) payload.tax_status = String(taxStatus);

    const taxClass = getValue(['tax_class']);
    if (taxClass !== undefined) payload.tax_class = String(taxClass || '');

    // Visibility
    const catalogVisibility = getValue(['catalog_visibility']);
    if (catalogVisibility) payload.catalog_visibility = String(catalogVisibility);

    const virtual = getValue(['virtual']);
    if (virtual !== undefined) payload.virtual = Boolean(virtual);

    const downloadable = getValue(['downloadable']);
    if (downloadable !== undefined) payload.downloadable = Boolean(downloadable);

    // Categories
    if (workingContent.categories && Array.isArray(workingContent.categories)) {
        payload.categories = buildCategories(
            workingContent.categories,
            metadata.categories || []
        );
    }

    // Tags
    if (workingContent.tags && Array.isArray(workingContent.tags)) {
        payload.tags = buildTags(
            workingContent.tags,
            metadata.tags || []
        );
    }

    // Images
    if (workingContent.images && Array.isArray(workingContent.images)) {
        payload.images = buildImages(workingContent.images);
    }

    // Attributes
    if (workingContent.attributes && Array.isArray(workingContent.attributes)) {
        payload.attributes = buildAttributes(workingContent.attributes);
    }

    // SEO metadata
    const seoMeta = buildSeoMetadata(workingContent, metadata);
    if (seoMeta.length > 0) {
        payload.meta_data = seoMeta;
    }

    return payload;
}

// ============================================================================
// WOOCOMMERCE API
// ============================================================================

/**
 * Push product update to WooCommerce API
 * @param credentials - WooCommerce credentials
 * @param platformProductId - WooCommerce product ID
 * @param payload - Update payload
 * @returns Success status and response
 */
async function pushToWooCommerce(
    credentials: WooCredentials,
    platformProductId: string,
    payload: WooProductPayload
): Promise<{ success: boolean; error?: string; response?: Record<string, unknown> }> {
    try {
        const baseUrl = credentials.shopUrl.replace(/\/$/, '');
        const endpoint = new URL(`/wp-json/wc/v3/products/${platformProductId}`, baseUrl);

        const auth = btoa(`${credentials.consumerKey}:${credentials.consumerSecret}`);

        const productAbortController = new AbortController();
        const productTimeoutId = setTimeout(() => productAbortController.abort(), 25000);
        let response: Response;
        try {
            response = await fetch(endpoint.toString(), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${auth}`,
                },
                body: JSON.stringify(payload),
                signal: productAbortController.signal,
            });
        } finally {
            clearTimeout(productTimeoutId);
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[woo] API error:', response.status, errorText);
            // Don't expose internal error details
            return {
                success: false,
                error: ERROR_MESSAGES.SYNC_FAILED,
            };
        }

        const responseData = await response.json();
        return { success: true, response: responseData };
    } catch (error) {
        console.error('[woo] Exception:', error);
        return {
            success: false,
            error: ERROR_MESSAGES.SYNC_FAILED,
        };
    }
}

// ============================================================================
// TIMESTAMP CONFLICT RESOLUTION
// ============================================================================

/**
 * Check if local data should be pushed based on timestamps
 * @param localUpdatedAt - Local update timestamp
 * @param remoteModifiedAt - Remote modification timestamp
 * @param force - Force push regardless of timestamps
 * @returns Whether to push and reason if not
 */
function checkTimestampConflict(
    localUpdatedAt: string | null,
    remoteModifiedAt: string | null,
    force: boolean
): { shouldPush: boolean; reason?: string } {
    if (force) return { shouldPush: true };
    if (!localUpdatedAt) return { shouldPush: false, reason: 'No local update timestamp' };
    if (!remoteModifiedAt) return { shouldPush: true };

    const localDate = new Date(localUpdatedAt);
    // WooCommerce returns date_modified without timezone offset (e.g. "2026-02-15T12:32:34").
    // This is the server's LOCAL time, not UTC. Appending "Z" would be wrong.
    // Since we can't know the remote server's timezone, add a generous tolerance
    // to avoid false "remote is newer" rejections caused by timezone mismatch.
    const remoteDate = new Date(remoteModifiedAt);

    if (isNaN(localDate.getTime()) || isNaN(remoteDate.getTime())) {
        return { shouldPush: true }; // Can't compare invalid dates, allow push
    }

    // Add 2-hour tolerance to account for timezone differences between
    // WooCommerce server time and our UTC timestamps
    const TIMEZONE_TOLERANCE_MS = 2 * 60 * 60 * 1000; // 2 hours
    if (localDate.getTime() + TIMEZONE_TOLERANCE_MS > remoteDate.getTime()) {
        return { shouldPush: true };
    }

    return {
        shouldPush: false,
        reason: 'Remote data is newer than local data',
    };
}

// ============================================================================
// PRODUCT PUSH HANDLER
// ============================================================================

/**
 * Handle product push for multiple products
 * @param supabase - Supabase client
 * @param userId - Authenticated user ID
 * @param productIds - Array of product IDs to push
 * @param force - Force push regardless of timestamps
 * @returns Array of push results
 */
async function handleProductPush(
    supabase: SupabaseClient,
    userId: string,
    productIds: string[],
    force: boolean
): Promise<PushResult[]> {
    const results: PushResult[] = [];

    // SECURITY: Fetch products with tenant_id verification
    const { data: products, error } = await supabase
        .from('products')
        .select(`
            id,
            tenant_id,
            platform_product_id,
            store_id,
            working_content,
            metadata,
            dirty_fields_content,
            working_content_updated_at,
            last_synced_at,
            stores!inner (
                id,
                platform,
                connection_id,
                platform_connections (
                    shop_url,
                    credentials_encrypted
                )
            )
        `)
        .in('id', productIds)
        .eq('tenant_id', userId); // CRITICAL: Ownership verification

    if (error) {
        console.error('[products] Fetch error:', error);
        return productIds.map(id => ({
            id,
            platformId: '',
            success: false,
            error: ERROR_MESSAGES.PRODUCT_NOT_FOUND,
        }));
    }

    if (!products || products.length === 0) {
        return productIds.map(id => ({
            id,
            platformId: '',
            success: false,
            error: ERROR_MESSAGES.PRODUCT_NOT_FOUND,
        }));
    }

    // Check for products not found (user doesn't own them)
    const foundIds = new Set(products.map(p => p.id));
    for (const id of productIds) {
        if (!foundIds.has(id)) {
            results.push({
                id,
                platformId: '',
                success: false,
                error: ERROR_MESSAGES.PRODUCT_NOT_FOUND,
            });
        }
    }

    // Process each product
    for (const product of products as unknown as ProductRecord[]) {
        const store = product.stores;

        if (!store) {
            results.push({
                id: product.id,
                platformId: product.platform_product_id || '',
                success: false,
                error: ERROR_MESSAGES.STORE_NOT_CONFIGURED,
            });
            continue;
        }

        if (store.platform !== 'woocommerce') {
            results.push({
                id: product.id,
                platformId: product.platform_product_id || '',
                success: false,
                error: 'Only WooCommerce is currently supported',
            });
            continue;
        }

        const connection = store.platform_connections;
        if (!connection) {
            results.push({
                id: product.id,
                platformId: product.platform_product_id || '',
                success: false,
                error: ERROR_MESSAGES.STORE_NOT_CONFIGURED,
            });
            continue;
        }

        if (!product.platform_product_id) {
            results.push({
                id: product.id,
                platformId: '',
                success: false,
                error: 'Product not linked to WooCommerce',
            });
            continue;
        }

        const credentials = extractWooCredentials(connection);
        if (!credentials) {
            results.push({
                id: product.id,
                platformId: product.platform_product_id,
                success: false,
                error: ERROR_MESSAGES.STORE_NOT_CONFIGURED,
            });
            continue;
        }

        // Check timestamps
        const metadata = product.metadata || {};
        const remoteModifiedAt = metadata.date_modified || metadata.modified;
        const timestampCheck = checkTimestampConflict(
            product.working_content_updated_at,
            remoteModifiedAt as string | null,
            force
        );

        if (!timestampCheck.shouldPush) {
            results.push({
                id: product.id,
                platformId: product.platform_product_id,
                success: true,
                skipped: true,
                skipReason: timestampCheck.reason,
            });
            continue;
        }

        // Resolve category IDs from the categories table as fallback
        // This handles cases where working_content.categories only has {name: "..."} without id
        const workingContent = (product.working_content || {}) as WorkingContent;
        if (workingContent.categories && Array.isArray(workingContent.categories)) {
            const unresolvedCats = workingContent.categories.filter(
                (c: any) => typeof c === 'object' && c !== null && 'name' in c && !('id' in c)
            );
            if (unresolvedCats.length > 0) {
                const catNames = unresolvedCats.map((c: any) => c.name);
                const { data: storeCats } = await supabase
                    .from('categories')
                    .select('external_id, name, slug')
                    .eq('store_id', product.store_id)
                    .in('name', catNames);
                if (storeCats && storeCats.length > 0) {
                    const catLookup = new Map(storeCats.map(sc => [sc.name, sc]));
                    workingContent.categories = workingContent.categories.map((c: any) => {
                        if (typeof c === 'object' && c !== null && 'name' in c && !('id' in c)) {
                            const resolved = catLookup.get(c.name);
                            if (resolved) {
                                return { ...c, id: Number(resolved.external_id) };
                            }
                        }
                        return c;
                    });
                    console.log(`[push] Resolved ${storeCats.length}/${unresolvedCats.length} category IDs from DB for product ${product.id}`);
                }
            }
        }

        // Build and validate payload
        const payload = buildWooProductPayload(workingContent, metadata);

        // Determine if this is a variable product (needed for variation push regardless of product payload)
        const isVariable = (payload as Record<string, unknown>).type === 'variable' ||
            workingContent.product_type === 'variable' ||
            metadata.type === 'variable';

        if (Object.keys(payload).length === 0) {
            // No product-level changes, but still push dirty variations if variable product
            if (isVariable) {
                try {
                    await pushDirtyVariations(
                        supabase,
                        credentials,
                        product.id,
                        product.platform_product_id,
                        store.id
                    );
                } catch (variationError) {
                    console.error('[push] Variation push error (no-payload path):', variationError);
                }
            }
            results.push({
                id: product.id,
                platformId: product.platform_product_id,
                success: true,
                skipped: true,
                skipReason: 'No changes to push',
            });
            continue;
        }

        console.log(`[push] Product ${product.id}:`, Object.keys(payload));

        // Push to WooCommerce
        const pushResult = await pushToWooCommerce(
            credentials,
            product.platform_product_id,
            payload
        );

        if (pushResult.success) {
            const now = new Date().toISOString();
            try {
                // After successful push, copy working_content to store_snapshot_content
                // so that subsequent dirty field computations find no differences.
                // This prevents false "modifications en attente" from appearing after sync.
                await supabase
                    .from('products')
                    .update({
                        dirty_fields_content: [],
                        store_snapshot_content: workingContent,
                        store_content_updated_at: now,
                        last_synced_at: now,
                        sync_source: 'push',
                        metadata: {
                            ...metadata,
                            last_pushed_at: now,
                            // Store date_modified as proper UTC ISO string to avoid timezone
                            // comparison issues (WooCommerce returns local time without offset)
                            date_modified: now,
                        },
                    })
                    .eq('id', product.id)
                    .eq('tenant_id', userId); // Double-check ownership on update
            } catch (updateError) {
                console.error('[push] Failed to update product after push:', updateError);
            }
        }

        // ================================================================
        // PUSH DIRTY VARIATIONS TO WOOCOMMERCE (Batch API)
        // Always attempt variation push regardless of product push result.
        // ================================================================
        if (isVariable) {
            try {
                await pushDirtyVariations(
                    supabase,
                    credentials,
                    product.id,
                    product.platform_product_id,
                    store.id
                );
            } catch (variationError) {
                console.error('[push] Variation push error (non-blocking):', variationError);
                // Variation push failure should not block the main product push result
            }
        }

        results.push({
            id: product.id,
            platformId: product.platform_product_id,
            success: pushResult.success,
            error: pushResult.error,
        });
    }

    return results;
}

// ============================================================================
// ARTICLE PUSH HANDLER
// ============================================================================

/**
 * Handle article push for WordPress
 * @param supabase - Supabase client
 * @param userId - Authenticated user ID
 * @param articleIds - Array of article IDs to push
 * @param force - Force push regardless of timestamps
 * @returns Array of push results
 */
async function handleArticlePush(
    supabase: SupabaseClient,
    userId: string,
    articleIds: string[],
    force: boolean
): Promise<PushResult[]> {
    const results: PushResult[] = [];

    // SECURITY: Fetch articles with tenant_id verification
    const { data: articles, error } = await supabase
        .from('blog_articles')
        .select(`
            id,
            tenant_id,
            title,
            slug,
            content,
            excerpt,
            status,
            custom_fields,
            updated_at,
            store_id,
            stores!inner (
                id,
                platform,
                platform_connections!inner (
                    shop_url,
                    credentials_encrypted
                )
            )
        `)
        .in('id', articleIds)
        .eq('tenant_id', userId); // CRITICAL: Ownership verification

    if (error || !articles) {
        console.error('[articles] Fetch error:', error);
        return articleIds.map(id => ({
            id,
            platformId: '',
            success: false,
            error: ERROR_MESSAGES.PRODUCT_NOT_FOUND,
        }));
    }

    // Check for articles not found
    const foundIds = new Set(articles.map(a => a.id));
    for (const id of articleIds) {
        if (!foundIds.has(id)) {
            results.push({
                id,
                platformId: '',
                success: false,
                error: ERROR_MESSAGES.PRODUCT_NOT_FOUND,
            });
        }
    }

    for (const article of articles) {
        const store = (article as Record<string, unknown>).stores as StoreRecord | undefined;
        const connection = store?.platform_connections;
        const customFields = (article.custom_fields || {}) as Record<string, unknown>;
        const platformPostId = String(customFields.id || customFields.platform_post_id || '');

        if (!connection) {
            results.push({
                id: article.id,
                platformId: platformPostId,
                success: false,
                error: ERROR_MESSAGES.STORE_NOT_CONFIGURED,
            });
            continue;
        }

        if (!platformPostId) {
            results.push({
                id: article.id,
                platformId: '',
                success: false,
                error: 'Article not linked to WordPress',
            });
            continue;
        }

        // Fetch blog config for WordPress credentials
        const { data: blogConfig } = await supabase
            .from('wordpress_blog_configs')
            .select('site_url, wp_username, wp_app_password')
            .eq('store_id', article.store_id)
            .eq('tenant_id', userId) // Ownership check
            .single();

        const credentials = extractWordPressCredentials(connection, blogConfig);
        if (!credentials) {
            results.push({
                id: article.id,
                platformId: platformPostId,
                success: false,
                error: ERROR_MESSAGES.STORE_NOT_CONFIGURED,
            });
            continue;
        }

        // Build update data
        const updateData: Record<string, string> = {};
        if (article.title) updateData.title = article.title;
        if (article.slug) updateData.slug = article.slug;
        if (article.content) updateData.content = article.content;
        if (article.excerpt) updateData.excerpt = article.excerpt;
        if (article.status) {
            const statusMap: Record<string, string> = {
                'draft': 'draft',
                'published': 'publish',
                'publish': 'publish',
            };
            updateData.status = statusMap[article.status] || 'draft';
        }

        if (Object.keys(updateData).length === 0) {
            results.push({
                id: article.id,
                platformId: platformPostId,
                success: true,
                skipped: true,
                skipReason: 'No changes to push',
            });
            continue;
        }

        try {
            const baseUrl = credentials.siteUrl.replace(/\/$/, '');
            const endpoint = new URL(`/wp-json/wp/v2/posts/${platformPostId}`, baseUrl);
            const auth = btoa(`${credentials.username}:${credentials.appPassword}`);

            const response = await fetch(endpoint.toString(), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${auth}`,
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                results.push({
                    id: article.id,
                    platformId: platformPostId,
                    success: false,
                    error: ERROR_MESSAGES.SYNC_FAILED,
                });
                continue;
            }

            const responseData = await response.json() as Record<string, unknown>;
            const now = new Date().toISOString();

            try {
                await supabase
                    .from('blog_articles')
                    .update({
                        last_synced_at: now,
                        custom_fields: {
                            ...customFields,
                            last_pushed_at: now,
                            modified: responseData.modified || now,
                        },
                    })
                    .eq('id', article.id)
                    .eq('tenant_id', userId);
            } catch (updateError) {
                console.error('[push] Failed to update article after push:', updateError);
            }

            results.push({
                id: article.id,
                platformId: platformPostId,
                success: true,
            });
        } catch (error) {
            console.error('[wp] Exception:', error);
            results.push({
                id: article.id,
                platformId: platformPostId,
                success: false,
                error: ERROR_MESSAGES.SYNC_FAILED,
            });
        }
    }

    return results;
}

// ============================================================================
// MAIN SERVER
// ============================================================================

serve(async (req: Request) => {
    const origin = req.headers.get('Origin');
    const corsHeaders = buildCorsHeaders(origin);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    try {
        // Validate environment variables early
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

        if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
            console.error('[push-to-store] Missing environment variables');
            return new Response(
                JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Verify user identity via Supabase Auth (server-side JWT validation)
        const authHeader = req.headers.get('Authorization') || '';
        const userId = await verifyUserId(supabaseUrl, supabaseAnonKey, authHeader);

        if (!userId) {
            return new Response(
                JSON.stringify({ error: ERROR_MESSAGES.UNAUTHORIZED }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check rate limit
        if (!checkRateLimit(userId)) {
            return new Response(
                JSON.stringify({ error: ERROR_MESSAGES.RATE_LIMITED }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Parse and validate request
        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return new Response(
                JSON.stringify({ error: ERROR_MESSAGES.INVALID_REQUEST }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const validatedRequest = validateRequest(body);
        if (!validatedRequest) {
            return new Response(
                JSON.stringify({ error: ERROR_MESSAGES.INVALID_REQUEST }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { type, ids, force } = validatedRequest;

        console.log(`[push-to-store] User ${userId}: ${type} push for ${ids.length} items (force: ${force})`);

        // Create Supabase client with SERVICE_ROLE_KEY for DB operations
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Process request
        let results: PushResult[];

        if (type === 'product') {
            results = await handleProductPush(supabase, userId, ids, force);
        } else {
            results = await handleArticlePush(supabase, userId, ids, force);
        }

        const successCount = results.filter(r => r.success && !r.skipped).length;
        const skippedCount = results.filter(r => r.skipped).length;
        const failedCount = results.filter(r => !r.success).length;

        console.log(`[push-to-store] Completed: ${successCount} success, ${skippedCount} skipped, ${failedCount} failed`);

        // Audit log
        await logAuditEvent(supabase, {
            userId,
            action: 'push_to_store',
            entityType: type,
            entityIds: ids,
            success: failedCount === 0,
            metadata: {
                successCount,
                skippedCount,
                failedCount,
                force,
            },
        });

        return new Response(
            JSON.stringify({
                success: failedCount === 0,
                type,
                total: results.length,
                successful: successCount,
                skipped: skippedCount,
                failed: failedCount,
                results,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('[push-to-store] Exception:', error);
        return new Response(
            JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
