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
import { z } from 'zod';
import type { ContentData } from '@/types/productContent';
import { PRODUCT_TYPE_DEFAULT } from '@/features/products/schemas/product-schema';
import { useAutoSync } from '@/hooks/sync/usePushToStore';
import { computeDirtyFields } from './computeDirtyFields';
import { calculateProductSeoScore } from '@/lib/seo/analyzer';

// ============================================================================
// ERRORS
// ============================================================================

/** Thrown when the product was modified by another source between read and write */
export class StaleDataError extends Error {
    constructor() {
        super('Le produit a été modifié par une autre source. Veuillez rafraîchir et réessayer.');
        this.name = 'StaleDataError';
    }
}

/** Thrown when a SKU already exists in the same store (product or variation) */
export class DuplicateSkuError extends Error {
    public readonly sku: string;
    public readonly conflictTitle: string;
    constructor(sku: string, conflictTitle: string) {
        super(`Le SKU "${sku}" est déjà utilisé par "${conflictTitle}". Veuillez choisir un SKU unique.`);
        this.name = 'DuplicateSkuError';
        this.sku = sku;
        this.conflictTitle = conflictTitle;
    }
}

// ============================================================================
// TYPES
// ============================================================================

export interface ProductSavePayload {
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

/**
 * Lightweight Zod schema for save payload validation.
 * Guards against malformed data reaching the DB (e.g. from auto-save or programmatic calls).
 * Only validates structural integrity — field-level business rules live in ProductFormSchema.
 */
const SavePayloadSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    short_description: z.string().optional(),
    regular_price: z.number().optional(),
    sale_price: z.number().optional(),
    price: z.number().optional(),
    stock: z.number().optional(),
    sku: z.string().optional(),
    slug: z.string().optional(),
    status: z.enum(['publish', 'draft', 'pending', 'private']).optional(),
    product_type: z.string().optional(),
    global_unique_id: z.string().optional(),
    on_sale: z.boolean().optional(),
    date_on_sale_from: z.string().nullable().optional(),
    date_on_sale_to: z.string().nullable().optional(),
    manage_stock: z.boolean().optional(),
    stock_status: z.enum(['instock', 'outofstock', 'onbackorder']).optional(),
    backorders: z.enum(['no', 'notify', 'yes']).optional(),
    low_stock_amount: z.number().nullable().optional(),
    weight: z.number().optional(),
    dimensions: z.object({
        length: z.string(),
        width: z.string(),
        height: z.string(),
    }).optional(),
    tax_status: z.enum(['taxable', 'shipping', 'none']).optional(),
    tax_class: z.string().optional(),
    shipping_class: z.string().optional(),
    seo: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        focus_keyword: z.string().optional(),
    }).optional(),
    categories: z.array(z.any()).optional(),
    tags: z.array(z.string()).optional(),
    images: z.array(z.any()).optional(),
    vendor: z.string().optional(),
    catalog_visibility: z.enum(['visible', 'catalog', 'search', 'hidden']).optional(),
    virtual: z.boolean().optional(),
    downloadable: z.boolean().optional(),
    purchasable: z.boolean().optional(),
    featured: z.boolean().optional(),
    attributes: z.array(z.any()).optional(),
    sold_individually: z.boolean().optional(),
    reviews_allowed: z.boolean().optional(),
    menu_order: z.number().optional(),
    purchase_note: z.string().optional(),
    external_url: z.string().nullable().optional(),
    button_text: z.string().nullable().optional(),
    upsell_ids: z.array(z.number()).optional(),
    cross_sell_ids: z.array(z.number()).optional(),
    related_ids: z.array(z.number()).optional(),
}).strict(); // Reject unknown fields to prevent injection

// ============================================================================
// SKU UNIQUENESS CHECK
// ============================================================================

/**
 * Check if a SKU is already used by another product or variation in the same store.
 * Throws DuplicateSkuError with the conflicting item's title if a duplicate is found.
 */
async function checkSkuUniqueness(
    supabase: ReturnType<typeof createClient>,
    storeId: string,
    sku: string,
    excludeProductId: string
): Promise<void> {
    // Check products table (exclude current product)
    const { data: conflictProduct } = await supabase
        .from('products')
        .select('id, title')
        .eq('store_id', storeId)
        .eq('sku', sku)
        .neq('id', excludeProductId)
        .limit(1)
        .maybeSingle();

    if (conflictProduct) {
        throw new DuplicateSkuError(sku, conflictProduct.title || `Produit #${conflictProduct.id.slice(0, 8)}`);
    }

    // Check product_variations table (exclude variations of the current product —
    // WooCommerce allows a product and its own variations to share the same SKU)
    const { data: conflictVariation } = await supabase
        .from('product_variations')
        .select('id, sku, parent_product_external_id')
        .eq('store_id', storeId)
        .eq('sku', sku)
        .neq('product_id', excludeProductId)
        .limit(1)
        .maybeSingle();

    if (conflictVariation) {
        throw new DuplicateSkuError(sku, `Variation (parent #${conflictVariation.parent_product_external_id})`);
    }
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
            data: ProductSavePayload;
        }) => {
            // Validate save payload before writing to DB
            const validation = SavePayloadSchema.safeParse(formData);
            if (!validation.success) {
                const issues = validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
                throw new Error(`Données invalides: ${issues}`);
            }

            // Récupérer le produit actuel (inclure metadata pour merge + updated_at for optimistic locking)
            const { data: currentProduct, error: fetchError } = await supabase
                .from('products')
                .select('store_id, store_snapshot_content, working_content, metadata, updated_at')
                .eq('id', productId)
                .single();

            if (fetchError) throw fetchError;

            const currentWorking = (currentProduct.working_content as ContentData) || {};
            const snapshot = currentProduct.store_snapshot_content as ContentData;
            let resolvedProductType =
                (formData.product_type && formData.product_type.length > 0) ? formData.product_type
                : (currentWorking.product_type && (currentWorking.product_type as string).length > 0) ? currentWorking.product_type as string
                : ((currentWorking as any).type && ((currentWorking as any).type as string).length > 0) ? (currentWorking as any).type as string
                : PRODUCT_TYPE_DEFAULT;

            // Build new working_content by merging formData over currentWorking.
            // For each field: use formData value if provided (non-null), else keep current.
            const MERGE_FIELDS = [
                'title', 'description', 'short_description', 'sku', 'slug', 'status',
                'vendor', 'global_unique_id',
                'price', 'regular_price', 'sale_price', 'on_sale',
                'date_on_sale_from', 'date_on_sale_to',
                'stock', 'manage_stock', 'backorders', 'low_stock_amount',
                'weight', 'dimensions', 'tax_status', 'tax_class', 'shipping_class',
                'catalog_visibility', 'virtual', 'downloadable', 'purchasable', 'featured',
                'sold_individually', 'reviews_allowed', 'menu_order', 'purchase_note',
                'external_url', 'button_text',
                'categories', 'tags', 'images', 'attributes',
                'upsell_ids', 'cross_sell_ids', 'related_ids',
            ] as const;

            const newWorkingContent: ContentData = { ...currentWorking, product_type: resolvedProductType };
            for (const field of MERGE_FIELDS) {
                const formVal = (formData as any)[field];
                if (formVal !== undefined && formVal !== null) {
                    (newWorkingContent as any)[field] = formVal;
                }
            }
            // SEO is nested — merge subfields
            if (formData.seo) {
                newWorkingContent.seo = { ...currentWorking.seo, ...formData.seo };
            }

            // Calculer les dirty fields
            const dirtyFields = computeDirtyFields(newWorkingContent, snapshot);

            // FIX: Preserve snapshot format for NON-dirty fields.
            // The form normalizes data (strips dates from images, converts category ids
            // to strings, strips slug from attributes). When saving, this creates format
            // drift between working_content and store_snapshot_content. By copying snapshot
            // values for unchanged fields, we prevent false positive dirty fields on next load.
            if (snapshot) {
                const snapshotPreservableFields = [
                    'images', 'categories', 'attributes', 'tags',
                    'upsell_ids', 'cross_sell_ids', 'related_ids',
                ] as const;
                for (const field of snapshotPreservableFields) {
                    if (!dirtyFields.includes(field) && snapshot[field] != null) {
                        (newWorkingContent as any)[field] = snapshot[field];
                    }
                }
                // Also preserve product_type from snapshot if not dirty
                if (!dirtyFields.includes('product_type') && snapshot.product_type) {
                    newWorkingContent.product_type = snapshot.product_type;
                    resolvedProductType = snapshot.product_type as string;
                }
            }

            // Build metadata by merging form data over existing (preserves WooCommerce data).
            // Tuple format: [metadataKey, formDataKey] — renamed fields are explicit.
            const META_FIELD_MAP: [string, string][] = [
                ['status', 'status'], ['handle', 'slug'], ['slug', 'slug'],
                ['regular_price', 'regular_price'], ['sale_price', 'sale_price'],
                ['on_sale', 'on_sale'], ['date_on_sale_from', 'date_on_sale_from'],
                ['date_on_sale_to', 'date_on_sale_to'],
                ['backorders', 'backorders'], ['low_stock_amount', 'low_stock_amount'],
                ['categories', 'categories'], ['tags', 'tags'], ['images', 'images'],
                ['brand', 'vendor'],
                ['weight', 'weight'], ['dimensions', 'dimensions'],
                ['shipping_class', 'shipping_class'], ['tax_status', 'tax_status'],
                ['tax_class', 'tax_class'],
                ['visibility', 'catalog_visibility'],
                ['is_virtual', 'virtual'], ['is_downloadable', 'downloadable'],
                ['purchasable', 'purchasable'], ['featured', 'featured'],
                ['sold_individually', 'sold_individually'], ['reviews_allowed', 'reviews_allowed'],
                ['menu_order', 'menu_order'], ['purchase_note', 'purchase_note'],
                ['external_url', 'external_url'], ['button_text', 'button_text'],
                ['upsell_ids', 'upsell_ids'], ['cross_sell_ids', 'cross_sell_ids'],
                ['related_ids', 'related_ids'],
            ];

            const existingMetadata = (currentProduct.metadata as Record<string, unknown>) || {};
            const mergedMetadata: Record<string, unknown> = {
                ...existingMetadata,
                type: resolvedProductType,
                product_type: resolvedProductType,
            };
            for (const [metaKey, formKey] of META_FIELD_MAP) {
                mergedMetadata[metaKey] = (formData as any)[formKey];
            }

            // SKU uniqueness check (before writing to DB)
            const skuToSave = formData.sku?.trim();
            if (skuToSave && currentProduct.store_id) {
                await checkSkuUniqueness(supabase, currentProduct.store_id, skuToSave, productId);
            }

            // Calculate SEO score for persistence
            const seoResult = calculateProductSeoScore({
                title: (newWorkingContent as any).title ?? formData.title ?? '',
                short_description: (newWorkingContent as any).short_description ?? formData.short_description ?? '',
                description: (newWorkingContent as any).description ?? formData.description ?? '',
                meta_title: (newWorkingContent as any).seo?.title ?? formData.seo?.title ?? '',
                meta_description: (newWorkingContent as any).seo?.description ?? formData.seo?.description ?? '',
                slug: (newWorkingContent as any).slug ?? formData.slug ?? '',
                images: Array.isArray((newWorkingContent as any).images)
                    ? (newWorkingContent as any).images.map((img: any) => ({ src: img.src, alt: img.alt }))
                    : [],
                focus_keyword: (newWorkingContent as any).seo?.focus_keyword ?? formData.seo?.focus_keyword,
            });

            const now = new Date().toISOString();
            const productUpdate: Record<string, unknown> = {
                title: formData.title,
                price: formData.regular_price ?? formData.price,
                stock: formData.stock,
                sku: formData.sku,
                product_type: resolvedProductType,
                working_content: newWorkingContent,
                dirty_fields_content: dirtyFields,
                working_content_updated_at: now,
                updated_at: now,
                metadata: mergedMetadata,
                seo_score: seoResult.overall,
            };

            // Optimistic locking: only update if row hasn't changed since we read it.
            const fetchedUpdatedAt = currentProduct.updated_at;
            let { data, error } = await supabase
                .from('products')
                .update(productUpdate)
                .eq('id', productId)
                .eq('updated_at', fetchedUpdatedAt)
                .select();

            // If update fails because seo_score column doesn't exist yet
            // (migration not applied), retry without it.
            if (error && error.message?.includes('seo_score')) {
                delete productUpdate.seo_score;
                const retry = await supabase
                    .from('products')
                    .update(productUpdate)
                    .eq('id', productId)
                    .eq('updated_at', fetchedUpdatedAt)
                    .select();
                data = retry.data;
                error = retry.error;
            }

            if (error) throw error;

            // If 0 rows returned, the product was modified between our SELECT and UPDATE
            if (!data || data.length === 0) {
                throw new StaleDataError();
            }

            return { product: data[0], dirtyFields };
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
        onError: (error: Error, variables) => {
            if (error instanceof StaleDataError) {
                // Refetch product data so the user sees the latest version
                queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
                queryClient.invalidateQueries({ queryKey: ['product-content', variables.productId] });
                toast.warning('Données modifiées', {
                    description: 'Le produit a été modifié depuis votre dernière lecture. Les données ont été rechargées.',
                    duration: 8000,
                });
            } else if (error instanceof DuplicateSkuError) {
                toast.error('SKU dupliqué', {
                    description: error.message,
                    duration: 8000,
                });
            } else {
                toast.error('Erreur de sauvegarde', { description: error.message });
            }
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

    // FIX B2: Stabilize mutate/mutateAsync via refs so useCallback deps don't change
    // every render. Without this, debouncedSave is recreated every cycle, breaking debounce.
    const mutateRef = React.useRef(saveProduct.mutate);
    const mutateAsyncRef = React.useRef(saveProduct.mutateAsync);
    React.useEffect(() => {
        mutateRef.current = saveProduct.mutate;
        mutateAsyncRef.current = saveProduct.mutateAsync;
    });

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

    const debouncedSave = React.useCallback((productId: string, data: ProductSavePayload, delay = 2000) => {
        // Cancel previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            // Only save if component is still mounted and no save is already in-flight
            if (isMountedRef.current && !saveProduct.isPending) {
                mutateRef.current({ productId, data });
            }
            timeoutRef.current = null;
        }, delay);
    }, [saveProduct.isPending]); // Re-create when isPending changes

    const cancelAutoSave = React.useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const flushAutoSave = React.useCallback(async (productId: string, data: ProductSavePayload) => {
        // Cancel pending auto-save and save immediately
        cancelAutoSave();
        if (isMountedRef.current) {
            return mutateAsyncRef.current({ productId, data });
        }
    }, [cancelAutoSave]); // Stable: cancelAutoSave has no deps

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
            field: keyof ProductSavePayload;
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

            // Defense-in-depth: scope update to authenticated user's tenant
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Authentication required');

            const { error } = await supabase
                .from('products')
                .update({
                    working_content: updatedWorking,
                    dirty_fields_content: dirtyFields,
                    working_content_updated_at: new Date().toISOString(),
                })
                .eq('id', productId)
                .eq('tenant_id', user.id);

            if (error) throw error;
            return { field, value };
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product-content', variables.productId] });
        },
    });
}
