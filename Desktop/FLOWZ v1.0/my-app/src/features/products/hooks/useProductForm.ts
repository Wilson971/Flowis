"use client";

import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { Product } from "@/types/product";
import {
    ProductFormSchema,
    ProductFormValues,
    DEFAULT_FORM_VALUES
} from "../schemas/product-schema";
import { ContentBufferData } from "../context/ProductEditContext";

// ============================================================================
// TYPES
// ============================================================================

interface UseProductFormOptions {
    product?: Product | null;
    contentBuffer?: ContentBufferData;
}

// ============================================================================
// HELPER: Calculate initial form values from product + content buffer
// Priority: workingContent (user edits) → metadata (sync data) → default
// Uses ?? (nullish) not || (falsy) to preserve 0, false, "" values
// ============================================================================

/**
 * Resolve a value from multiple sources with nullish coalescing.
 * Treats undefined and null as "missing", preserves 0, false, "".
 */
function resolve<T>(primary: T | undefined | null, ...fallbacks: (T | undefined | null)[]): T | null {
    if (primary !== undefined && primary !== null) return primary;
    for (const fb of fallbacks) {
        if (fb !== undefined && fb !== null) return fb;
    }
    return null;
}

/** Same as resolve but with a guaranteed non-null default */
function resolveWithDefault<T>(primary: T | undefined | null, fallback1: T | undefined | null, defaultVal: T): T {
    if (primary !== undefined && primary !== null) return primary;
    if (fallback1 !== undefined && fallback1 !== null) return fallback1;
    return defaultVal;
}

/** Map category/tag objects to string names */
function mapToNames(items: any[] | undefined | null): string[] {
    if (!items || !Array.isArray(items)) return [];
    return items.map((item: any) => {
        if (typeof item === 'string') return item;
        if (item?.name) return item.name;
        return String(item);
    }).filter(Boolean);
}

/** Convert images from any source format to form format */
function mapToFormImages(
    wcImages: any[] | undefined | null,
    metaImages: any[] | undefined | null,
    fallbackUrl: string | null | undefined
): any[] {
    const source = wcImages?.length ? wcImages : metaImages?.length ? metaImages : null;
    if (source) {
        return source.map((img: any, idx: number) => ({
            id: img.id ?? `img-${idx}`,
            src: img.src || '',
            name: img.name || '',
            alt: img.alt || '',
            order: idx,
            isPrimary: idx === 0,
        }));
    }
    if (fallbackUrl) {
        return [{ id: 'main', src: fallbackUrl, alt: '', order: 0, isPrimary: true, name: '' }];
    }
    return [];
}

function calculateInitialFormValues(
    product: Product | null | undefined,
    contentBuffer?: ContentBufferData
): ProductFormValues {
    if (!product) return DEFAULT_FORM_VALUES;

    const metadata = product.metadata || {};
    const wc = (contentBuffer?.working_content || product.working_content || {}) as any;

    return {
        // ===== INFORMATIONS DE BASE =====
        title: resolveWithDefault(wc.title, product.title, ""),
        sku: resolve(wc.sku, product.sku, metadata.sku),
        global_unique_id: resolve(wc.global_unique_id, metadata.global_unique_id),
        short_description: resolveWithDefault(wc.short_description, metadata.short_description, ""),
        description: resolveWithDefault(wc.description, metadata.description, ""),
        permalink: resolve(metadata.permalink),

        // ===== TARIFICATION & PROMOTIONS =====
        regular_price: resolve(wc.regular_price, product.regular_price, metadata.regular_price, product.price),
        sale_price: resolve(wc.sale_price, product.sale_price, metadata.sale_price),
        on_sale: wc.on_sale ?? metadata.on_sale ?? false,
        date_on_sale_from: resolve(wc.date_on_sale_from, metadata.date_on_sale_from),
        date_on_sale_to: resolve(wc.date_on_sale_to, metadata.date_on_sale_to),

        // ===== INVENTAIRE =====
        stock: resolve(wc.stock, product.stock, metadata.stock_quantity),
        stock_status: resolveWithDefault(wc.stock_status, metadata.stock_status, "instock") as "instock" | "outofstock" | "onbackorder",
        manage_stock: wc.manage_stock ?? metadata.manage_stock ?? false,
        backorders: resolveWithDefault(wc.backorders, metadata.backorders, "no") as "no" | "notify" | "yes",
        low_stock_amount: resolve(wc.low_stock_amount, metadata.low_stock_amount),

        // ===== SEO (normalized: wc.seo.title → flat meta_title) =====
        meta_title: resolveWithDefault(wc.seo?.title, metadata.seo?.title, ""),
        meta_description: resolveWithDefault(wc.seo?.description, metadata.seo?.description, ""),
        slug: resolveWithDefault(wc.slug, metadata.slug, ""),

        // ===== ORGANISATION =====
        product_type: resolveWithDefault(wc.product_type, metadata.type ?? product.product_type, "simple"),
        brand: resolveWithDefault(wc.vendor, metadata.brand, ""),
        status: resolveWithDefault(wc.status, metadata.status, "draft"),
        featured: wc.featured ?? metadata.featured ?? false,
        categories: mapToNames(wc.categories) .length > 0 ? mapToNames(wc.categories) : mapToNames(metadata.categories),
        tags: mapToNames(wc.tags).length > 0 ? mapToNames(wc.tags) : mapToNames(metadata.tags),

        // ===== MÉDIAS =====
        images: mapToFormImages(wc.images, metadata.images, product.image_url),

        // ===== LOGISTIQUE =====
        weight: resolveWithDefault(wc.weight != null ? String(wc.weight) : undefined, metadata.weight != null ? String(metadata.weight) : undefined, ""),
        dimensions_length: resolveWithDefault(wc.dimensions?.length, metadata.dimensions?.length, ""),
        dimensions_width: resolveWithDefault(wc.dimensions?.width, metadata.dimensions?.width, ""),
        dimensions_height: resolveWithDefault(wc.dimensions?.height, metadata.dimensions?.height, ""),
        shipping_class: resolveWithDefault(wc.shipping_class, metadata.shipping_class, ""),

        // ===== FISCALITÉ =====
        tax_status: resolveWithDefault(wc.tax_status, metadata.tax_status, "taxable") as "taxable" | "shipping" | "none",
        tax_class: resolveWithDefault(wc.tax_class, metadata.tax_class, ""),

        // ===== VISIBILITÉ =====
        catalog_visibility: resolveWithDefault(wc.catalog_visibility, metadata.catalog_visibility, "visible"),
        virtual: wc.virtual ?? metadata.virtual ?? false,
        downloadable: wc.downloadable ?? metadata.downloadable ?? false,
        purchasable: wc.purchasable ?? metadata.purchasable ?? true,

        // ===== PRODUITS EXTERNES =====
        external_url: resolve(wc.external_url, metadata.external_url),
        button_text: resolve(wc.button_text, metadata.button_text),

        // ===== AUTRES OPTIONS =====
        sold_individually: wc.sold_individually ?? metadata.sold_individually ?? false,
        purchase_note: resolveWithDefault(wc.purchase_note, metadata.purchase_note, ""),
        menu_order: wc.menu_order ?? metadata.menu_order ?? 0,
        reviews_allowed: wc.reviews_allowed ?? metadata.reviews_allowed ?? true,

        // ===== AVIS (Readonly from sync) =====
        average_rating: resolve(wc.average_rating, metadata.average_rating),
        rating_count: resolve(wc.rating_count, metadata.rating_count),
        total_sales: resolve(wc.total_sales, metadata.total_sales),

        // ===== PRODUITS LIÉS =====
        upsell_ids: wc.upsell_ids ?? metadata.upsell_ids ?? [],
        cross_sell_ids: wc.cross_sell_ids ?? metadata.cross_sell_ids ?? [],
        related_ids: wc.related_ids ?? metadata.related_ids ?? [],
    };
}

// ============================================================================
// HOOK
// ============================================================================

export const useProductForm = (options?: UseProductFormOptions): UseFormReturn<ProductFormValues> => {
    const { product, contentBuffer } = options || {};
    const lastLoadedIdRef = useRef<string | null>(null);
    const lastSyncedAtRef = useRef<string | null>(null);
    const hasLoadedBufferRef = useRef<boolean>(false);

    const methods = useForm<ProductFormValues>({
        resolver: zodResolver(ProductFormSchema) as any,
        defaultValues: DEFAULT_FORM_VALUES,
        mode: "onChange",
    });

    // Sync form from loaded product
    useEffect(() => {
        if (!product) return;

        const isNewProduct = lastLoadedIdRef.current !== product.id;
        // Detect if product data was re-synced (critical for fixing stale data after sync)
        const isDataUpdated = product.last_synced_at && lastSyncedAtRef.current !== product.last_synced_at;
        // If contentBuffer just arrived (was not loaded, now is)
        const isBufferFresh = !!contentBuffer && !hasLoadedBufferRef.current;

        // Skip only if nothing changed (same product, same sync version, buffer already loaded)
        if (!isNewProduct && !isDataUpdated && !isBufferFresh) return;

        // Update refs
        lastLoadedIdRef.current = product.id;
        lastSyncedAtRef.current = product.last_synced_at || null;
        hasLoadedBufferRef.current = !!contentBuffer;

        const initialValues = calculateInitialFormValues(product, contentBuffer);

        methods.reset(initialValues, {
            keepDefaultValues: false,
            keepDirty: false,
        });

    }, [product, contentBuffer, methods]);

    return methods;
};

// Re-export pour compatibilité
export type { ProductFormValues };
