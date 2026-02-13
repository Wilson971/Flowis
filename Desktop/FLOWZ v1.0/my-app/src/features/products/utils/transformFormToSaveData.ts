import type { ProductFormData } from "@/hooks/products/useProductSave";
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
// TRANSFORM
// ============================================================================

/**
 * Transform ProductFormValues (react-hook-form) to ProductFormData (save payload).
 *
 * This mapping is shared between:
 * - Manual save (useProductActions.handleSave)
 * - Auto-save (useAutoSaveProduct)
 *
 * Resolves category external_ids from availableCategories when provided.
 */
export function transformFormToSaveData(
    data: ProductFormValues,
    availableCategories?: AvailableCategory[]
): ProductFormData {
    return {
        // Basic info
        title: data.title,
        description: data.description,
        short_description: data.short_description,
        sku: data.sku ?? undefined,
        slug: data.slug,
        status: data.status as any,
        global_unique_id: data.global_unique_id ?? undefined,

        // Pricing
        regular_price: data.regular_price ? Number(data.regular_price) : undefined,
        sale_price: data.sale_price ? Number(data.sale_price) : undefined,
        on_sale: data.on_sale,
        date_on_sale_from: data.date_on_sale_from,
        date_on_sale_to: data.date_on_sale_to,

        // Stock
        stock: data.stock ? Number(data.stock) : undefined,
        manage_stock: data.manage_stock,
        stock_status: data.stock_status,
        backorders: data.backorders,
        low_stock_amount: data.low_stock_amount ? Number(data.low_stock_amount) : null,

        // Physical
        weight: data.weight ? Number(data.weight) : undefined,
        dimensions:
            data.dimensions_length || data.dimensions_width || data.dimensions_height
                ? {
                      length: data.dimensions_length || "",
                      width: data.dimensions_width || "",
                      height: data.dimensions_height || "",
                  }
                : undefined,

        // Tax & Shipping
        tax_status: data.tax_status,
        tax_class: data.tax_class,
        shipping_class: data.shipping_class,

        // SEO
        seo: {
            title: data.meta_title,
            description: data.meta_description,
        },

        // Taxonomies
        categories: data.categories?.map((cat) => {
            const name = typeof cat === "string" ? cat : ((cat as any)?.name ?? String(cat));
            const found = availableCategories?.find((ac) => ac.name === name);
            if (found) {
                return { id: String(Number(found.external_id)), name: found.name, slug: found.slug };
            }
            return { name };
        }),
        tags: data.tags,
        images: data.images,

        // Type & Visibility
        vendor: data.brand,
        product_type: data.product_type || "simple",
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
        external_url: data.external_url,
        button_text: data.button_text,

        // Linked products
        upsell_ids: data.upsell_ids,
        cross_sell_ids: data.cross_sell_ids,
        related_ids: data.related_ids,

        // Attributes (for variable products)
        attributes: data.attributes?.map((attr) => ({
            ...(attr.id ? { id: attr.id } : {}),
            name: attr.name,
            options: attr.options,
            visible: attr.visible,
            variation: attr.variation,
        })),
    };
}
