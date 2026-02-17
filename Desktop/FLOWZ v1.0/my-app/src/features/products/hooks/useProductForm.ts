"use client";

import React from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import { Product } from "@/types/product";
import {
    ProductFormSchema,
    ProductFormValues,
    DEFAULT_FORM_VALUES,
    PRODUCT_TYPE_DEFAULT,
} from "../schemas/product-schema";

// ============================================================================
// TYPES
// ============================================================================

interface UseProductFormOptions {
    product?: Product | null;
    /** Ref set to true during undo/redo operations to prevent form re-sync */
    isRestoringRef?: React.RefObject<boolean>;
}

// ============================================================================
// HELPERS
// working_content is the canonical source (populated by WC sync, updated by saves).
// Fallback to product.* columns only for top-level fields that may not be in wc.
// ============================================================================

/** Map category/tag objects to string names */
function mapToNames(items: unknown[] | undefined | null): string[] {
    if (!items || !Array.isArray(items)) return [];
    return items.map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'name' in item) return (item as { name: string }).name;
        return String(item);
    }).filter(Boolean);
}

/** Convert images from any source to form format */
function mapToFormImages(
    images: unknown[] | undefined | null,
    fallbackUrl: string | null | undefined
): { id: string | number; src: string; name: string; alt: string; order: number; isPrimary: boolean }[] {
    const source = images as any[] | null;
    if (source?.length) {
        return source.map((img, idx) => ({
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
): ProductFormValues {
    if (!product) return DEFAULT_FORM_VALUES;

    // working_content = single source of truth (populated by sync, updated by saves)
    const wc = (product.working_content || {}) as Record<string, any>;

    return {
        // Basic info — fallback to product.* columns for top-level fields
        title: wc.title ?? product.title ?? "",
        sku: wc.sku ?? product.sku ?? "",
        global_unique_id: wc.global_unique_id ?? "",
        short_description: wc.short_description ?? "",
        description: wc.description ?? "",
        permalink: wc.permalink ?? (product.metadata as any)?.permalink ?? null,

        // Pricing
        regular_price: wc.regular_price ?? product.regular_price ?? product.price ?? "",
        sale_price: wc.sale_price ?? product.sale_price ?? "",
        on_sale: wc.on_sale ?? false,
        date_on_sale_from: wc.date_on_sale_from ?? "",
        date_on_sale_to: wc.date_on_sale_to ?? "",

        // Stock
        stock: wc.stock ?? product.stock ?? "",
        stock_status: (wc.stock_status ?? "instock") as "instock" | "outofstock" | "onbackorder",
        manage_stock: wc.manage_stock ?? false,
        backorders: (wc.backorders ?? "no") as "no" | "notify" | "yes",
        low_stock_amount: wc.low_stock_amount ?? "",

        // SEO
        meta_title: wc.seo?.title ?? "",
        meta_description: wc.seo?.description ?? "",
        focus_keyword: wc.seo?.focus_keyword ?? "",
        slug: wc.slug ?? "",

        // Organisation — check both "product_type" and "type" keys (WC uses "type")
        product_type: wc.product_type || wc.type || (product.product_type as string) || PRODUCT_TYPE_DEFAULT,
        brand: wc.vendor ?? "",
        status: (wc.status ?? "draft"),
        featured: wc.featured ?? false,
        categories: mapToNames(wc.categories),
        tags: mapToNames(wc.tags),

        // Media
        images: mapToFormImages(wc.images, product.image_url),

        // Logistics
        weight: wc.weight != null ? String(wc.weight) : "",
        dimensions_length: wc.dimensions?.length ?? "",
        dimensions_width: wc.dimensions?.width ?? "",
        dimensions_height: wc.dimensions?.height ?? "",
        shipping_class: wc.shipping_class ?? "",

        // Tax
        tax_status: (wc.tax_status ?? "taxable") as "taxable" | "shipping" | "none",
        tax_class: wc.tax_class ?? "",

        // Visibility
        catalog_visibility: wc.catalog_visibility ?? "visible",
        virtual: wc.virtual ?? false,
        downloadable: wc.downloadable ?? false,
        purchasable: wc.purchasable ?? true,

        // External
        external_url: wc.external_url ?? "",
        button_text: wc.button_text ?? "",

        // Options
        sold_individually: wc.sold_individually ?? false,
        purchase_note: wc.purchase_note ?? "",
        menu_order: wc.menu_order ?? 0,
        reviews_allowed: wc.reviews_allowed ?? true,

        // Reviews (readonly)
        average_rating: wc.average_rating ?? null,
        rating_count: wc.rating_count ?? null,
        total_sales: wc.total_sales ?? null,

        // Linked products
        upsell_ids: wc.upsell_ids ?? [],
        cross_sell_ids: wc.cross_sell_ids ?? [],
        related_ids: wc.related_ids ?? [],

        // Attributes
        attributes: (wc.attributes ?? []).map((attr: any) => ({
            id: attr.id ?? 0,
            name: attr.name || '',
            options: Array.isArray(attr.options) ? [...new Set(attr.options)] : [],
            visible: attr.visible ?? true,
            variation: attr.variation ?? false,
            position: attr.position ?? 0,
        })),
    };
}

// ============================================================================
// HOOK
// ============================================================================

export const useProductForm = (options?: UseProductFormOptions): UseFormReturn<ProductFormValues> => {
    const { product, isRestoringRef } = options || {};

    // Compute form values from product data.
    // Returns DEFAULT_FORM_VALUES when product is not yet loaded.
    const computedValues = useMemo(() => {
        if (!product) return DEFAULT_FORM_VALUES;
        return calculateInitialFormValues(product);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product?.id, product?.last_synced_at]);

    const methods = useForm<ProductFormValues>({
        resolver: zodResolver(ProductFormSchema) as any,
        defaultValues: DEFAULT_FORM_VALUES,
        // IMPORTANT: "onTouched" prevents zodResolver from running async validation
        // on reset(). With "onChange", Zod v4's .optional().default() fields get
        // corrupted to "" by the resolver's async result overwriting reset values.
        // "onTouched" only validates after user interaction, preserving reset data.
        mode: "onTouched",
    });

    // Sync product data → form via reset().
    // reset() updates BOTH form values AND defaultValues, so isDirty
    // correctly reflects only user changes (not loaded data vs empty defaults).
    // Uses a stable key to detect when product data actually changes:
    //   - First load: key goes from "|" to "productId|syncedAt"
    //   - Re-sync from WooCommerce: last_synced_at changes → key changes
    //   - Normal refetch (no data change): key stays same → no reset
    const productKey = `${product?.id ?? ""}|${product?.last_synced_at ?? ""}`;
    const prevKeyRef = useRef<string>("|");
    const stabilizeTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!product) return;
        if (isRestoringRef?.current) return;
        if (productKey === prevKeyRef.current) return;

        prevKeyRef.current = productKey;
        methods.reset(computedValues);

        // FIX: Controlled components (TipTap editors) normalize values after reset
        // (e.g. "" → "<p></p>", whitespace normalization, HTML wrapping).
        // This makes formState.isDirty true even though the user hasn't changed anything.
        // After a short delay for editors to stabilize, re-sync defaultValues with
        // the current (normalized) values to clear false dirty state.
        if (stabilizeTimerRef.current) clearTimeout(stabilizeTimerRef.current);
        stabilizeTimerRef.current = setTimeout(() => {
            const currentValues = methods.getValues();
            let wasCorrupted = false;

            // FIX: product_type gets asynchronously corrupted to "" after reset().
            // This happens because zodResolver's async validation overwrites form values.
            // Restore the correct value from computed source before re-resetting.
            if (!currentValues.product_type && computedValues.product_type) {
                currentValues.product_type = computedValues.product_type;
                wasCorrupted = true;
            }

            const { isDirty, touchedFields } = methods.formState;
            const userHasTouched = Object.keys(touchedFields).length > 0;
            if ((isDirty || wasCorrupted) && !userHasTouched) {
                // No user interaction — isDirty is from component normalization
                // or product_type was corrupted. Re-reset to align defaultValues.
                methods.reset(currentValues);
            }
        }, 500);

        return () => {
            if (stabilizeTimerRef.current) clearTimeout(stabilizeTimerRef.current);
        };
    }, [productKey, computedValues, product, methods, isRestoringRef]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (stabilizeTimerRef.current) clearTimeout(stabilizeTimerRef.current);
        };
    }, []);

    return methods;
};

// Re-export pour compatibilité
export type { ProductFormValues };
