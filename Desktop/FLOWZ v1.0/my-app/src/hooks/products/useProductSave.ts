/**
 * useProductSave - Hook pour sauvegarder un produit avec gestion des dirty fields
 *
 * Version 2.1 - Avec auto-sync vers WooCommerce après sauvegarde
 * - Fix: computeDirtyFields compare TOUS les champs (price, stock, categories, etc.)
 * - Fix: useAutoSaveProduct memory leak avec proper cleanup
 * - Fix: Comparaison stable des arrays (tri avant comparaison)
 */

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { ContentData } from '@/types/productContent';
import { useAutoSync } from '@/hooks/sync/usePushToStore';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductFormData {
    // Basic info
    title?: string;
    description?: string;
    short_description?: string;
    sku?: string;
    slug?: string;
    status?: 'publish' | 'draft' | 'pending' | 'private';
    global_unique_id?: string;

    // Pricing
    price?: number;
    regular_price?: number;
    sale_price?: number;
    on_sale?: boolean;
    date_on_sale_from?: string | null;
    date_on_sale_to?: string | null;

    // Stock
    stock?: number;
    manage_stock?: boolean;
    stock_status?: 'instock' | 'outofstock' | 'onbackorder';
    backorders?: 'no' | 'notify' | 'yes';
    low_stock_amount?: number | null;

    // Physical
    weight?: number;
    dimensions?: {
        length: string;
        width: string;
        height: string;
    };

    // Tax & Shipping
    tax_status?: 'taxable' | 'shipping' | 'none';
    tax_class?: string;
    shipping_class?: string;

    // SEO
    seo?: {
        title?: string;
        description?: string;
        focus_keyword?: string;
    };

    // Categories, Tags & Images
    categories?: Array<{ id?: string; name: string; slug?: string }>;
    tags?: string[];
    images?: Array<{ id?: string | number; src: string; alt?: string; position?: number }>;

    // Metadata
    vendor?: string;
    product_type?: string;
    catalog_visibility?: 'visible' | 'catalog' | 'search' | 'hidden';
    virtual?: boolean;
    downloadable?: boolean;
    purchasable?: boolean;
    featured?: boolean;
    attributes?: unknown[];

    // Options
    sold_individually?: boolean;
    reviews_allowed?: boolean;
    menu_order?: number;
    purchase_note?: string;

    // External products
    external_url?: string | null;
    button_text?: string | null;

    // Linked products
    upsell_ids?: number[];
    cross_sell_ids?: number[];
    related_ids?: number[];
}

// ============================================================================
// HELPERS - Simplified dirty fields computation (v3)
// ============================================================================

/** Normalize any value to a comparable string. Treats null/undefined/empty as '' */
function norm(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v ? '1' : '0';
    if (typeof v === 'number') return isNaN(v) ? '' : String(v);
    if (typeof v === 'string') return v.trim();
    return JSON.stringify(v);
}

/** Normalize an array by extracting a key from each item, then sort for stable comparison */
function normArray(arr: unknown[] | null | undefined, extract: (item: any) => string): string {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return '';
    return arr.map(extract).filter(Boolean).sort().join('|');
}

/** Compare two numeric values (handles string "10" vs number 10, null vs undefined) */
function sameNum(a: unknown, b: unknown): boolean {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    return Number(a) === Number(b);
}

/**
 * Compute dirty fields between working_content and store_snapshot_content.
 * Simplified v3: normalized comparison, no false positives from format differences.
 */
function computeDirtyFields(
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
        if (norm(working[f]) !== norm(snapshot[f])) dirty.push(f);
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

    // --- SEO (nested, compare individual subfields) ---
    if (norm(working.seo?.title) !== norm(snapshot.seo?.title)) dirty.push('seo.title');
    if (norm(working.seo?.description) !== norm(snapshot.seo?.description)) dirty.push('seo.description');

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

    // --- Images: compare by src only (ignore id format, position, alt differences) ---
    const imgKey = (i: any) => i?.src || '';
    if (normArray(working.images, imgKey) !== normArray(snapshot.images, imgKey)) {
        dirty.push('images');
    }

    // --- Linked products ---
    const idKey = (x: any) => String(x);
    if (normArray(working.upsell_ids, idKey) !== normArray(snapshot.upsell_ids, idKey)) dirty.push('upsell_ids');
    if (normArray(working.cross_sell_ids, idKey) !== normArray(snapshot.cross_sell_ids, idKey)) dirty.push('cross_sell_ids');
    if (normArray(working.related_ids, idKey) !== normArray(snapshot.related_ids, idKey)) dirty.push('related_ids');

    return dirty;
}

// ============================================================================
// HOOKS
// ============================================================================

interface UseProductSaveOptions {
    autoSync?: boolean; // Auto-push to WooCommerce after save
}

/**
 * Hook pour sauvegarder un produit
 * @param options.autoSync - Si true, pousse automatiquement vers WooCommerce après sauvegarde
 */
export function useProductSave(options: UseProductSaveOptions = {}) {
    const { autoSync = true } = options;
    const queryClient = useQueryClient();
    const supabase = createClient();
    const { triggerAutoSync, isAutoSyncing } = useAutoSync('product');

    const mutation = useMutation({
        mutationFn: async ({
            productId,
            data: formData,
        }: {
            productId: string;
            data: ProductFormData;
        }) => {
            // Récupérer le produit actuel (inclure metadata pour merge)
            const { data: currentProduct, error: fetchError } = await supabase
                .from('products')
                .select('store_snapshot_content, working_content, metadata')
                .eq('id', productId)
                .single();

            if (fetchError) throw fetchError;

            const currentWorking = (currentProduct.working_content as ContentData) || {};
            const snapshot = currentProduct.store_snapshot_content as ContentData;

            // Construire le nouveau working_content
            const newWorkingContent: ContentData = {
                ...currentWorking,
                // Basic info
                title: formData.title ?? currentWorking.title,
                description: formData.description ?? currentWorking.description,
                short_description: formData.short_description ?? currentWorking.short_description,
                sku: formData.sku ?? currentWorking.sku,
                slug: formData.slug ?? currentWorking.slug,
                status: formData.status ?? currentWorking.status,
                vendor: formData.vendor ?? currentWorking.vendor,
                product_type: formData.product_type ?? currentWorking.product_type,
                global_unique_id: formData.global_unique_id ?? currentWorking.global_unique_id,

                // Pricing
                price: formData.price ?? currentWorking.price,
                regular_price: formData.regular_price ?? currentWorking.regular_price,
                sale_price: formData.sale_price ?? currentWorking.sale_price,
                on_sale: formData.on_sale ?? currentWorking.on_sale,
                date_on_sale_from: formData.date_on_sale_from ?? currentWorking.date_on_sale_from,
                date_on_sale_to: formData.date_on_sale_to ?? currentWorking.date_on_sale_to,

                // Stock
                stock: formData.stock ?? currentWorking.stock,
                manage_stock: formData.manage_stock ?? currentWorking.manage_stock,
                backorders: formData.backorders ?? currentWorking.backorders,
                low_stock_amount: formData.low_stock_amount ?? currentWorking.low_stock_amount,

                // Physical & Shipping
                weight: formData.weight ?? currentWorking.weight,
                dimensions: formData.dimensions ?? currentWorking.dimensions,
                tax_status: formData.tax_status ?? currentWorking.tax_status,
                tax_class: formData.tax_class ?? currentWorking.tax_class,
                shipping_class: formData.shipping_class ?? currentWorking.shipping_class,

                // Visibility & Type
                catalog_visibility: formData.catalog_visibility ?? currentWorking.catalog_visibility,
                virtual: formData.virtual ?? currentWorking.virtual,
                downloadable: formData.downloadable ?? currentWorking.downloadable,
                purchasable: formData.purchasable ?? currentWorking.purchasable,
                featured: formData.featured ?? currentWorking.featured,

                // Options
                sold_individually: formData.sold_individually ?? currentWorking.sold_individually,
                reviews_allowed: formData.reviews_allowed ?? currentWorking.reviews_allowed,
                menu_order: formData.menu_order ?? currentWorking.menu_order,
                purchase_note: formData.purchase_note ?? currentWorking.purchase_note,

                // External products
                external_url: formData.external_url ?? currentWorking.external_url,
                button_text: formData.button_text ?? currentWorking.button_text,

                // SEO
                seo: formData.seo ? {
                    ...currentWorking.seo,
                    ...formData.seo,
                } : currentWorking.seo,

                // Taxonomies & Media
                categories: formData.categories ?? currentWorking.categories,
                tags: formData.tags ?? currentWorking.tags,
                images: formData.images ?? currentWorking.images,
                attributes: formData.attributes as ContentData['attributes'] ?? currentWorking.attributes,

                // Linked products
                upsell_ids: formData.upsell_ids ?? currentWorking.upsell_ids,
                cross_sell_ids: formData.cross_sell_ids ?? currentWorking.cross_sell_ids,
                related_ids: formData.related_ids ?? currentWorking.related_ids,
            };

            // Calculer les dirty fields
            const dirtyFields = computeDirtyFields(newWorkingContent, snapshot);

            // Préparer les données pour la table products
            // IMPORTANT: Merge metadata avec l'existant pour ne pas perdre les données WooCommerce
            const existingMetadata = (currentProduct.metadata as Record<string, unknown>) || {};
            const productUpdate: Record<string, unknown> = {
                title: formData.title,
                price: formData.regular_price ?? formData.price,
                stock: formData.stock,
                sku: formData.sku,
                working_content: newWorkingContent,
                dirty_fields_content: dirtyFields,
                working_content_updated_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                metadata: {
                    ...existingMetadata,
                    // Basic
                    status: formData.status,
                    handle: formData.slug,
                    slug: formData.slug,

                    // Pricing
                    regular_price: formData.regular_price,
                    sale_price: formData.sale_price,
                    on_sale: formData.on_sale,
                    date_on_sale_from: formData.date_on_sale_from,
                    date_on_sale_to: formData.date_on_sale_to,

                    // Stock
                    backorders: formData.backorders,
                    low_stock_amount: formData.low_stock_amount,

                    // Taxonomies
                    categories: formData.categories,
                    tags: formData.tags,
                    images: formData.images,
                    product_type: formData.product_type,
                    brand: formData.vendor,

                    // Physical
                    weight: formData.weight,
                    dimensions: formData.dimensions,
                    shipping_class: formData.shipping_class,
                    tax_status: formData.tax_status,
                    tax_class: formData.tax_class,

                    // Visibility
                    visibility: formData.catalog_visibility,
                    is_virtual: formData.virtual,
                    is_downloadable: formData.downloadable,
                    purchasable: formData.purchasable,
                    featured: formData.featured,

                    // Options
                    sold_individually: formData.sold_individually,
                    reviews_allowed: formData.reviews_allowed,
                    menu_order: formData.menu_order,
                    purchase_note: formData.purchase_note,

                    // External
                    external_url: formData.external_url,
                    button_text: formData.button_text,

                    // Linked products
                    upsell_ids: formData.upsell_ids,
                    cross_sell_ids: formData.cross_sell_ids,
                    related_ids: formData.related_ids,
                },
            };

            // Mettre à jour
            const { data, error } = await supabase
                .from('products')
                .update(productUpdate)
                .eq('id', productId)
                .select()
                .single();

            if (error) throw error;
            return { product: data, dirtyFields };
        },
        onSuccess: async (result, variables) => {
            const { dirtyFields } = result;

            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product-content', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product-stats'] });

            if (dirtyFields.length > 0) {
                toast.success('Produit sauvegardé', {
                    description: autoSync
                        ? 'Synchronisation vers la boutique en cours...'
                        : `${dirtyFields.length} champ(s) modifié(s). Synchronisez pour publier.`,
                });

                // Auto-sync to WooCommerce if enabled and there are changes
                if (autoSync) {
                    await triggerAutoSync(variables.productId);
                }
            } else {
                toast.success('Produit sauvegardé');
            }
        },
        onError: (error: Error) => {
            toast.error('Erreur de sauvegarde', { description: error.message });
        },
    });

    return {
        ...mutation,
        isAutoSyncing,
        isSaving: mutation.isPending || isAutoSyncing,
    };
}

/**
 * Hook pour sauvegarde automatique (debounced)
 * Version 2.1 - Fix memory leak avec useRef et useEffect cleanup
 */
export function useAutoSaveProduct() {
    const saveProduct = useProductSave({ autoSync: false }); // Pas d'auto-sync pour auto-save
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = React.useRef(true);

    // Cleanup on unmount
    React.useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, []);

    const debouncedSave = React.useCallback((productId: string, data: ProductFormData, delay = 2000) => {
        // Cancel previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            // Only save if component is still mounted
            if (isMountedRef.current) {
                saveProduct.mutate({ productId, data });
            }
            timeoutRef.current = null;
        }, delay);
    }, [saveProduct]);

    const cancelAutoSave = React.useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const flushAutoSave = React.useCallback(async (productId: string, data: ProductFormData) => {
        // Cancel pending auto-save and save immediately
        cancelAutoSave();
        if (isMountedRef.current) {
            return saveProduct.mutateAsync({ productId, data });
        }
    }, [saveProduct, cancelAutoSave]);

    return {
        ...saveProduct,
        debouncedSave,
        cancelAutoSave,
        flushAutoSave,
        hasPendingAutoSave: timeoutRef.current !== null,
    };
}

/**
 * Hook pour mise à jour partielle rapide
 */
export function useQuickUpdateProduct() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({
            productId,
            field,
            value,
        }: {
            productId: string;
            field: keyof ProductFormData;
            value: unknown;
        }) => {
            // Récupérer et mettre à jour le working_content
            const { data: product } = await supabase
                .from('products')
                .select('working_content, store_snapshot_content')
                .eq('id', productId)
                .single();

            const working = (product?.working_content || {}) as ContentData;
            const snapshot = product?.store_snapshot_content as ContentData;

            const updatedWorking = { ...working, [field]: value };
            const dirtyFields = computeDirtyFields(updatedWorking, snapshot);

            const { error } = await supabase
                .from('products')
                .update({
                    working_content: updatedWorking,
                    dirty_fields_content: dirtyFields,
                    working_content_updated_at: new Date().toISOString(),
                })
                .eq('id', productId);

            if (error) throw error;
            return { field, value };
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product-content', variables.productId] });
        },
    });
}
