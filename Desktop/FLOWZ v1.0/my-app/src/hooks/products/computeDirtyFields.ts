/**
 * computeDirtyFields - Shared utility for dirty field detection
 *
 * Compares working_content against store_snapshot_content to determine
 * which fields have been modified. Used by both useProductSave and
 * useProductContent to ensure consistent dirty field tracking.
 *
 * v3 - Comprehensive comparison of 40+ fields:
 * text, numeric, boolean, SEO, dimensions, categories, tags, images,
 * attributes, variations, linked products.
 */

import type { ContentData } from '@/types/productContent';
import { PRODUCT_TYPE_DEFAULT } from '@/features/products/schemas/product-schema';

// ============================================================================
// HELPERS
// ============================================================================

/** Normalize any value to a comparable string. Treats null/undefined/empty as '' */
function norm(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v ? '1' : '0';
    if (typeof v === 'number') return isNaN(v) ? '' : String(v);
    if (typeof v === 'string') return v;
    return JSON.stringify(v);
}

/** Normalize an array by extracting a key from each item, then sort for stable comparison */
function normArray(arr: unknown[] | null | undefined, extract: (item: any) => string): string {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return '';
    return arr.map(extract).filter(Boolean).sort().join('|');
}

/** Compare two numeric values (handles string "10" vs number 10, null vs undefined vs "") */
function sameNum(a: unknown, b: unknown): boolean {
    const aEmpty = a == null || a === '';
    const bEmpty = b == null || b === '';
    if (aEmpty && bEmpty) return true;
    if (aEmpty || bEmpty) return false;
    return Number(a) === Number(b);
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Compute dirty fields between working_content and store_snapshot_content.
 * Normalized comparison to avoid false positives from format differences.
 */
export function computeDirtyFields(
    working: ContentData | null,
    snapshot: ContentData | null
): string[] {
    if (!working || !snapshot) return [];

    const dirty: string[] = [];

    // --- Text fields: normalize then compare ---
    const textFields = [
        'title', 'description', 'short_description', 'sku', 'slug',
        'status', 'stock_status', 'vendor', 'product_type',
        'catalog_visibility', 'backorders', 'tax_status', 'tax_class',
        'shipping_class', 'global_unique_id', 'purchase_note',
        'external_url', 'button_text', 'date_on_sale_from', 'date_on_sale_to',
    ] as const;
    for (const f of textFields) {
        const wVal = norm(working[f]);
        const sVal = norm(snapshot[f]);
        // Skip false positives: default type vs "" for product_type
        if (f === 'product_type' && ((wVal === PRODUCT_TYPE_DEFAULT && sVal === '') || (wVal === '' && sVal === PRODUCT_TYPE_DEFAULT))) continue;
        if (wVal !== sVal) dirty.push(f);
    }

    // --- Numeric fields: compare as numbers ---
    const numFields = [
        'price', 'regular_price', 'sale_price', 'stock',
        'weight', 'low_stock_amount', 'menu_order',
    ] as const;
    for (const f of numFields) {
        if (!sameNum(working[f], snapshot[f])) dirty.push(f);
    }

    // --- Boolean fields ---
    const boolFields = [
        'manage_stock', 'virtual', 'downloadable', 'purchasable',
        'featured', 'sold_individually', 'reviews_allowed', 'on_sale',
    ] as const;
    for (const f of boolFields) {
        if (Boolean(working[f]) !== Boolean(snapshot[f])) dirty.push(f);
    }

    // --- SEO (nested, compare ALL subfields) ---
    if (norm(working.seo?.title) !== norm(snapshot.seo?.title)) dirty.push('seo.title');
    if (norm(working.seo?.description) !== norm(snapshot.seo?.description)) dirty.push('seo.description');
    if (norm(working.seo?.focus_keyword) !== norm(snapshot.seo?.focus_keyword)) dirty.push('seo.focus_keyword');

    // --- Dimensions (handle both nested object and flat fields) ---
    const wDim = `${norm(working.dimensions?.length)}|${norm(working.dimensions?.width)}|${norm(working.dimensions?.height)}`;
    const sDim = `${norm(snapshot.dimensions?.length)}|${norm(snapshot.dimensions?.width)}|${norm(snapshot.dimensions?.height)}`;
    if (wDim !== sDim) dirty.push('dimensions');

    // --- Categories: compare by name only (ignore id/slug format differences) ---
    const catKey = (c: any) => typeof c === 'string' ? c : (c?.name || '');
    if (normArray(working.categories, catKey) !== normArray(snapshot.categories, catKey)) {
        dirty.push('categories');
    }

    // --- Tags: compare by name only ---
    const tagKey = (t: any) => typeof t === 'string' ? t : (t?.name || '');
    if (normArray(working.tags, tagKey) !== normArray(snapshot.tags, tagKey)) {
        dirty.push('tags');
    }

    // --- Images: compare by src AND order (first image = featured, order matters) ---
    const imgListW = (working.images || []).map((i: any) => i?.src || '').filter(Boolean).join('|');
    const imgListS = (snapshot.images || []).map((i: any) => i?.src || '').filter(Boolean).join('|');
    if (imgListW !== imgListS) {
        dirty.push('images');
    }

    // --- Linked products ---
    const idKey = (x: any) => String(x);
    if (normArray(working.upsell_ids, idKey) !== normArray(snapshot.upsell_ids, idKey)) dirty.push('upsell_ids');
    if (normArray(working.cross_sell_ids, idKey) !== normArray(snapshot.cross_sell_ids, idKey)) dirty.push('cross_sell_ids');
    if (normArray(working.related_ids, idKey) !== normArray(snapshot.related_ids, idKey)) dirty.push('related_ids');

    // --- Attributes (for variable products) ---
    const attrKey = (a: any) => `${a?.name || ''}:${(Array.isArray(a?.options) ? a.options : []).sort().join(',')}:${!!a?.variation}`;
    if (normArray(working.attributes, attrKey) !== normArray(snapshot.attributes, attrKey)) {
        dirty.push('attributes');
    }

    // --- Variations ---
    // Variation dirty tracking is handled by the `is_dirty` flag in the
    // `product_variations` table (see useDirtyVariationsCount).
    // `working_content.variations` is a legacy array of WC variation IDs
    // that is NOT updated by the variation manager, so comparing it here
    // creates permanent false-positive "variations" dirty fields.

    return dirty;
}
