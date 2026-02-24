/**
 * useProductVariations - Hook pour gérer les variations de produits WooCommerce
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductVariation {
    id: string;
    store_id: string;
    product_id: string | null;
    external_id: string;
    parent_product_external_id: string;
    platform: string;
    sku: string | null;
    price: number | null;
    regular_price: number | null;
    sale_price: number | null;
    on_sale: boolean;
    stock_status: 'instock' | 'outofstock' | 'onbackorder';
    stock_quantity: number | null;
    manage_stock: boolean;
    attributes: VariationAttribute[];
    image: VariationImage | null;
    weight: string | null;
    dimensions: { length: string; width: string; height: string } | null;
    description: string | null;
    virtual: boolean;
    downloadable: boolean;
    status: string;
    // Phase 1: Editable fields
    global_unique_id: string | null;
    backorders: string | null;
    tax_status: string | null;
    tax_class: string | null;
    date_on_sale_from: string | null;
    date_on_sale_to: string | null;
    // Phase 2: Sync-only fields
    shipping_class: string | null;
    download_limit: number | null;
    download_expiry: number | null;
    downloads: unknown[] | null;
    menu_order: number | null;
    variation_meta_data: unknown[] | null;
    low_stock_amount: number | null;
    // System fields
    is_dirty: boolean;
    dirty_action: string | null;
    original_data: Record<string, unknown> | null;
    synced_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface VariationAttribute {
    name: string;
    option: string;
}

export interface VariationImage {
    id: number;
    src: string;
    name: string;
    alt: string;
}

export interface AppVariation {
    id: string;
    title: string;
    woo_variation_id: number;
    sku: string;
    regular_price: string;
    sale_price: string;
    stock_quantity: number;
    manage_stock: boolean;
    stock_status: 'instock' | 'outofstock' | 'onbackorder';
    attributes: VariationAttribute[];
    selected_options: Record<string, string>;
    image_url: string | null;
    image?: VariationImage;
    weight?: string;
    dimensions?: { length: string; width: string; height: string };
    description?: string;
    status?: string;
    virtual?: boolean;
    downloadable?: boolean;
    // Phase 1 extended fields
    global_unique_id?: string;
    backorders?: string;
    tax_status?: string;
    tax_class?: string;
    date_on_sale_from?: string | null;
    date_on_sale_to?: string | null;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convert database variation to AppVariation format for the UI
 */
function dbToAppVariation(dbVar: ProductVariation): AppVariation {
    const safeAttributes = Array.isArray(dbVar.attributes) ? dbVar.attributes : [];

    const title = safeAttributes.length > 0
        ? safeAttributes.map(attr => attr.option).join(' / ')
        : `Variation #${dbVar.external_id}`;

    return {
        id: dbVar.external_id,
        title,
        woo_variation_id: parseInt(dbVar.external_id, 10) || 0,
        sku: dbVar.sku || '',
        regular_price: dbVar.regular_price?.toString() || '',
        sale_price: dbVar.sale_price?.toString() || '',
        stock_quantity: dbVar.stock_quantity ?? 0,
        manage_stock: dbVar.manage_stock,
        stock_status: dbVar.stock_status,
        attributes: safeAttributes,
        selected_options: safeAttributes.reduce((acc, attr) => {
            acc[attr.name] = attr.option;
            return acc;
        }, {} as Record<string, string>),
        image_url: dbVar.image?.src || null,
        image: dbVar.image || undefined,
        weight: dbVar.weight || undefined,
        dimensions: dbVar.dimensions || undefined,
        description: dbVar.description || undefined,
        status: dbVar.status || undefined,
        virtual: dbVar.virtual,
        downloadable: dbVar.downloadable,
        global_unique_id: dbVar.global_unique_id || undefined,
        backorders: dbVar.backorders || undefined,
        tax_status: dbVar.tax_status || undefined,
        tax_class: dbVar.tax_class || undefined,
        date_on_sale_from: dbVar.date_on_sale_from,
        date_on_sale_to: dbVar.date_on_sale_to,
    };
}

// ============================================================================
// HOOKS
// ============================================================================

interface UseProductVariationsOptions {
    productId?: string;
    storeId?: string;
    platformProductId?: string;
    enabled?: boolean;
    fallbackVariants?: unknown[];
}

/**
 * Hook pour récupérer les variations d'un produit
 */
export function useProductVariations({
    productId,
    storeId,
    platformProductId,
    enabled = true,
    fallbackVariants,
}: UseProductVariationsOptions) {
    const supabase = createClient();

    const variationsQuery = useQuery({
        queryKey: ['product-variations', productId, storeId, platformProductId],
        queryFn: async () => {
            if (!storeId || !platformProductId) return [];

            const { data, error } = await supabase
                .from('product_variations')
                .select('*')
                .eq('store_id', storeId)
                .eq('parent_product_external_id', platformProductId);

            if (error) throw error;
            return (data || []) as ProductVariation[];
        },
        enabled: enabled && !!storeId && !!platformProductId,
        staleTime: STALE_TIMES.STATIC,
    });

    // Convert to app variations
    let appVariations: AppVariation[] = [];

    if (variationsQuery.data && variationsQuery.data.length > 0) {
        appVariations = variationsQuery.data.map(dbToAppVariation);
    } else if (fallbackVariants && Array.isArray(fallbackVariants)) {
        // Fallback to metadata variants
        appVariations = fallbackVariants.map((v: unknown) => {
            const variant = v as Record<string, unknown>;
            const attrs = (variant.attributes || []) as VariationAttribute[];
            return {
                id: String(variant.id),
                title: attrs.map((a) => a.option).join(' / ') || `Variation #${variant.id}`,
                woo_variation_id: variant.id as number,
                sku: (variant.sku as string) || '',
                regular_price: (variant.regular_price as string) || '',
                sale_price: (variant.sale_price as string) || '',
                stock_quantity: (variant.stock_quantity as number) || 0,
                manage_stock: (variant.manage_stock as boolean) ?? true,
                stock_status: (variant.stock_status as 'instock' | 'outofstock' | 'onbackorder') || 'instock',
                attributes: attrs,
                selected_options: {},
                image_url: (variant.image as { src: string } | undefined)?.src || null,
                image: variant.image as VariationImage | undefined,
                weight: variant.weight as string | undefined,
                dimensions: variant.dimensions as { length: string; width: string; height: string } | undefined,
                description: variant.description as string | undefined,
                status: variant.status as string | undefined,
                virtual: variant.virtual as boolean | undefined,
                downloadable: variant.downloadable as boolean | undefined,
                global_unique_id: variant.global_unique_id as string | undefined,
                backorders: variant.backorders as string | undefined,
                tax_status: variant.tax_status as string | undefined,
                tax_class: variant.tax_class as string | undefined,
                date_on_sale_from: (variant.date_on_sale_from as string | null) ?? null,
                date_on_sale_to: (variant.date_on_sale_to as string | null) ?? null,
            };
        });
    }

    return {
        variations: variationsQuery.data || [],
        appVariations,
        isLoading: variationsQuery.isLoading,
        isFetching: variationsQuery.isFetching,
        error: variationsQuery.error,
        refetch: variationsQuery.refetch,
        hasVariations: appVariations.length > 0,
        variationsCount: appVariations.length,
    };
}

/**
 * Hook pour mettre à jour une variation
 */
export function useUpdateVariation() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({
            variationId,
            updates,
        }: {
            variationId: string;
            updates: Partial<ProductVariation>;
        }) => {
            const { data, error } = await supabase
                .from('product_variations')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', variationId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['product-variations'] });
            toast.success('Variation mise à jour');
        },
        onError: (error: Error) => {
            toast.error('Erreur', { description: error.message });
        },
    });
}

/**
 * Hook pour compter les variations dirty (non synchronisées)
 * Utilisé par ProductEditorContainer pour alimenter le SyncPill
 */
export function useDirtyVariationsCount(productId?: string, storeId?: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['dirty-variations-count', productId, storeId],
        queryFn: async () => {
            if (!productId || !storeId) return 0;

            const { count, error } = await supabase
                .from('product_variations')
                .select('*', { count: 'exact', head: true })
                .eq('product_id', productId)
                .eq('is_dirty', true);

            if (error) throw error;
            return count ?? 0;
        },
        enabled: !!productId && !!storeId,
        staleTime: STALE_TIMES.REALTIME, // refresh often enough for sync UX
    });
}

/**
 * Hook pour synchroniser les variations depuis WooCommerce
 */
export function useSyncProductVariations() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({
            storeId,
            productId,
        }: {
            storeId: string;
            productId: string;
        }) => {
            const { data, error } = await supabase.functions.invoke('sync-product-variations', {
                body: { store_id: storeId, product_id: productId },
            });

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['product-variations', variables.productId],
            });
            toast.success('Variations synchronisées');
        },
        onError: (error: Error) => {
            toast.error('Erreur de synchronisation', { description: error.message });
        },
    });
}
