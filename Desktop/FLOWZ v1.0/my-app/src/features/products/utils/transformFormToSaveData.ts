import type { ProductSavePayload } from "@/hooks/products/useProductSave";
import type { ProductFormValues } from "../schemas/product-schema";

// ============================================================================
// TYPES
// ============================================================================

export interface AvailableCategory {
    id: string;
    external_id: string;
    name: string;
    slug?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/** Convert form string/number to number, preserving 0. Returns fallback for null/undefined/"". */
function coerceNumber(v: string | number | null | undefined, fallback: undefined): number | undefined;
function coerceNumber(v: string | number | null | undefined, fallback: null): number | null;
function coerceNumber(v: string | number | null | undefined, fallback: null | undefined): number | null | undefined {
    if (v == null || v === "") return fallback;
    return Number(v);
}

/** Return non-empty string or undefined */
function nonEmpty(v: string | null | undefined): string | undefined {
    return v || undefined;
}

// ============================================================================
// TRANSFORM
// ============================================================================

/**
 * Transform ProductFormValues (react-hook-form) to ProductSavePayload (save payload).
 *
 * Shared between manual save and auto-save.
 * Resolves category external_ids from availableCategories when provided.
 */
export function transformFormToSaveData(
    data: ProductFormValues,
    availableCategories?: AvailableCategory[]
): ProductSavePayload {
    return {
        // Basic info
        title: data.title,
        description: data.description,
        short_description: data.short_description,
        sku: nonEmpty(data.sku),
        slug: data.slug,
        status: data.status as ProductSavePayload['status'],
        global_unique_id: nonEmpty(data.global_unique_id),

        // Pricing
        regular_price: coerceNumber(data.regular_price, undefined),
        sale_price: coerceNumber(data.sale_price, undefined),
        on_sale: data.on_sale,
        date_on_sale_from: data.date_on_sale_from || null,
        date_on_sale_to: data.date_on_sale_to || null,

        // Stock
        stock: coerceNumber(data.stock, undefined),
        manage_stock: data.manage_stock,
        stock_status: data.stock_status,
        backorders: data.backorders,
        low_stock_amount: coerceNumber(data.low_stock_amount, null),

        // Physical
        weight: coerceNumber(data.weight, undefined),
        dimensions:
            data.dimensions_length || data.dimensions_width || data.dimensions_height
                ? { length: data.dimensions_length || "", width: data.dimensions_width || "", height: data.dimensions_height || "" }
                : undefined,

        // Tax & Shipping
        tax_status: data.tax_status,
        tax_class: data.tax_class,
        shipping_class: data.shipping_class,

        // SEO
        seo: { title: data.meta_title, description: data.meta_description, focus_keyword: data.focus_keyword },

        // Taxonomies
        categories: data.categories?.map((cat) => {
            const name = typeof cat === "string" ? cat : (cat?.name ?? String(cat));
            const trimmedName = name.trim();
            // Match by ID first (stable), then fall back to trimmed name
            const found = availableCategories?.find((ac) =>
                (ac.id && ac.id === (cat as any)?.id) ||
                (ac.external_id && ac.external_id === (cat as any)?.external_id) ||
                ac.name.trim() === trimmedName
            );
            return found
                ? { id: String(Number(found.external_id)), name: found.name, slug: found.slug }
                : { name: trimmedName };
        }),
        tags: data.tags,
        images: data.images,

        // Type & Visibility
        vendor: data.brand,
        product_type: nonEmpty(data.product_type),
        catalog_visibility: data.catalog_visibility,
        virtual: data.virtual,
        downloadable: data.downloadable,
        purchasable: data.purchasable,
        featured: data.featured,

        // Options
        sold_individually: data.sold_individually,
        reviews_allowed: data.reviews_allowed,
        menu_order: data.menu_order,
        purchase_note: data.purchase_note,

        // External products
        external_url: nonEmpty(data.external_url),
        button_text: nonEmpty(data.button_text),

        // Linked products
        upsell_ids: data.upsell_ids,
        cross_sell_ids: data.cross_sell_ids,
        related_ids: data.related_ids,

        // Attributes
        attributes: data.attributes?.map((attr) => ({
            ...(attr.id ? { id: attr.id } : {}),
            name: attr.name,
            options: [...new Set(attr.options)],
            visible: attr.visible,
            variation: attr.variation,
        })),
    };
}
