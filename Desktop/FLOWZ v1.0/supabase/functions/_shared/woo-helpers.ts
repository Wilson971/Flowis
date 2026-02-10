import { WooCommerceProduct, WooCommerceVariation, WooCommerceReview } from "./types/woo.ts";
export type { WooCommerceProduct, WooCommerceVariation, WooCommerceReview };

// ==========================================
// Interfaces
// ==========================================

export interface WooCommerceCategory {
    id: number;
    name: string;
    slug: string;
    description?: string;
    image?: {
        id: number;
        src: string;
        name: string;
        alt: string;
    } | null;
    parent?: number;
    count?: number;
    display?: string;
    menu_order?: number;
    // SEO Yoast
    yoast_head?: string;
    yoast_head_json?: {
        title?: string;
        description?: string;
        canonical?: string;
        robots?: Record<string, string>;
        og_locale?: string;
        og_type?: string;
        og_title?: string;
        og_description?: string;
        og_url?: string;
        og_site_name?: string;
        twitter_card?: string;
        schema?: any;
    };
    _links?: Record<string, any[]>;
}

// Transform category to full metadata structure
export function transformWooCommerceCategory(
    category: WooCommerceCategory,
    storeId: string
): Record<string, any> {
    // Build comprehensive metadata according to WOOCOMMERCE_IMPORTED_METADATA.md
    const metadata: Record<string, any> = {
        // Core data
        id: category.id,
        name: category.name,
        slug: category.slug,
        parent: category.parent || 0,
        description: category.description || "",
        display: category.display || "default",
        menu_order: category.menu_order || 0,
        count: category.count || 0,

        // Image (full object)
        image: category.image ? {
            id: category.image.id,
            src: category.image.src,
            name: category.image.name || null,
            alt: category.image.alt || ""
        } : null,

        // SEO Yoast (full objects)
        yoast_head: category.yoast_head || null,
        yoast_head_json: category.yoast_head_json || null,

        // Links
        _links: category._links || null
    };

    return {
        store_id: storeId,
        external_id: String(category.id),
        platform: "woocommerce",
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        parent_external_id: category.parent ? String(category.parent) : null,
        image_url: category.image?.src || null,
        product_count: category.count || 0,
        metadata: metadata,
        updated_at: new Date().toISOString()
    };
}

export interface WooCommerceTag {
    id: number;
    name: string;
    slug: string;
    description?: string;
    count?: number;
}

export interface ProductSummary {
    id: number;
    name: string;
    price: string;
    image_url: string | null;
    slug: string;
}

// ==========================================
// Utils
// ==========================================

export function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

export function extractCleanExcerpt(html: string | null | undefined, maxLength = 160): string | null {
    if (!html) return null;
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) return null;
    if (text.length <= maxLength) return text;
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

// ==========================================
// Transformations
// ==========================================

export function transformWooCommerceProduct(
    wooProduct: WooCommerceProduct & {
        _wpSeoData?: { yoast?: any; rankmath?: any };
        _variationsDetailed?: WooCommerceVariation[];
        _reviews?: WooCommerceReview[];
        _relatedProducts?: Map<number, ProductSummary>;
    },
    storeId: string,
    tenantId: string,
    seoPlugin: "yoast" | "rankmath" | "none",
    categoriesCache?: Map<number, WooCommerceCategory>,
    tagsCache?: Map<number, WooCommerceTag>
) {
    let seoTitle: string | null = null;
    let seoDescription: string | null = null;
    let seoDescriptionSource: string = "none";

    const wpSeoData = wooProduct._wpSeoData;

    // SEO Logic
    if (wpSeoData?.yoast?.description?.trim()) {
        seoDescription = wpSeoData.yoast.description.trim();
        seoDescriptionSource = "yoast";
    } else if (wpSeoData?.rankmath?.description?.trim()) {
        seoDescription = wpSeoData.rankmath.description.trim();
        seoDescriptionSource = "rankmath";
    } else if (wooProduct.meta_data) {
        const yoastDesc = wooProduct.meta_data.find((m: any) => m.key === "_yoast_wpseo_metadesc");
        const rankMathDesc = wooProduct.meta_data.find((m: any) => m.key === "rank_math_description");
        const aioseoDesc = wooProduct.meta_data.find((m: any) => m.key === "_aioseo_description");

        if (yoastDesc?.value?.trim()) {
            seoDescription = yoastDesc.value.trim();
            seoDescriptionSource = "yoast";
        } else if (rankMathDesc?.value?.trim()) {
            seoDescription = rankMathDesc.value.trim();
            seoDescriptionSource = "rankmath";
        } else if (aioseoDesc?.value?.trim()) {
            seoDescription = aioseoDesc.value.trim();
            seoDescriptionSource = "aioseo";
        }
    }

    // Fallback to excerpt
    if (!seoDescription && wooProduct.short_description) {
        seoDescription = extractCleanExcerpt(wooProduct.short_description);
        seoDescriptionSource = "excerpt";
    }

    // Transform images to full JSONB structure (per WOOCOMMERCE_IMPORTED_METADATA.md)
    const transformedImages = wooProduct.images?.map((img: any) => ({
        id: img.id,
        src: img.src,
        name: img.name || null,
        alt: img.alt || null,
        date_created: img.date_created || null,
        date_modified: img.date_modified || null,
        date_created_gmt: img.date_created_gmt || null,
        date_modified_gmt: img.date_modified_gmt || null
    })) || [];

    // Transform attributes to full JSONB structure with options (per WOOCOMMERCE_IMPORTED_METADATA.md)
    const transformedAttributes = wooProduct.attributes?.map((attr: any) => ({
        id: attr.id,
        name: attr.name,
        slug: attr.slug || null,
        options: attr.options || [],
        visible: attr.visible ?? true,
        variation: attr.variation ?? false,
        position: attr.position ?? 0
    })) || [];

    // Transform categories to full structure (per WOOCOMMERCE_IMPORTED_METADATA.md)
    const transformedCategories = wooProduct.categories?.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        count: c.count ?? null,
        parent: c.parent ?? null,
        display: c.display || null
    })) || [];

    // Transform tags to full structure
    const transformedTags = wooProduct.tags?.map((t: any) => ({
        id: t.id,
        name: t.name,
        slug: t.slug
    })) || [];

    // Transform variations if available (from _variationsDetailed)
    const transformedVariants = wooProduct._variationsDetailed?.map((v: WooCommerceVariation) => ({
        // Core Identifiers
        id: v.id,
        sku: v.sku || null,
        permalink: v.permalink || null,

        // Pricing & Sales
        regular_price: v.regular_price || null,
        sale_price: v.sale_price || null,
        price: v.price || null,
        on_sale: v.on_sale ?? false,
        date_on_sale_from: v.date_on_sale_from || null,
        date_on_sale_to: v.date_on_sale_to || null,

        // Stock & Inventory
        manage_stock: v.manage_stock ?? false,
        stock_quantity: v.stock_quantity,
        stock_status: v.stock_status || 'instock',
        backorders: v.backorders || 'no',
        backorders_allowed: v.backorders_allowed ?? false,
        backordered: v.backordered ?? false,
        low_stock_amount: v.low_stock_amount || null,

        // Physical Properties
        weight: v.weight || null,
        dimensions: v.dimensions || null,
        shipping_class: v.shipping_class || null,
        shipping_class_id: v.shipping_class_id || null,

        // Status & Visibility
        status: v.status || 'publish',
        purchasable: v.purchasable ?? true,
        menu_order: v.menu_order ?? 0,

        // Tax & Financial
        tax_status: v.tax_status || 'taxable',
        tax_class: v.tax_class || '',

        // Virtual / Downloadable
        virtual: v.virtual ?? false,
        downloadable: v.downloadable ?? false,
        downloads: v.downloads || [],
        download_limit: v.download_limit ?? -1,
        download_expiry: v.download_expiry ?? -1,

        // Content
        description: v.description || null,
        image: v.image ? {
            id: v.image.id,
            src: v.image.src,
            name: v.image.name || null,
            alt: v.image.alt || null
        } : null,

        // Attributes (Selection)
        attributes: v.attributes?.map((a: any) => ({
            id: a.id,
            name: a.name,
            option: a.option
        })) || [],

        // Meta Data (Custom Fields)
        meta_data: v.meta_data || []
    })) || [];

    // Build complete metadata JSONB according to WOOCOMMERCE_IMPORTED_METADATA.md
    const metadata = {
        // ===== IDENTIFICATION =====
        id: wooProduct.id,
        name: wooProduct.name,
        slug: wooProduct.slug,
        sku: wooProduct.sku,
        global_unique_id: (wooProduct as any).global_unique_id || null,
        permalink: wooProduct.permalink,
        parent_id: wooProduct.parent_id,

        // ===== TYPE & STATUS =====
        type: wooProduct.type,
        status: wooProduct.status,
        catalog_visibility: wooProduct.catalog_visibility,
        featured: wooProduct.featured,
        virtual: wooProduct.virtual,
        downloadable: wooProduct.downloadable,
        purchasable: (wooProduct as any).purchasable ?? true,
        has_options: (wooProduct as any).has_options ?? (wooProduct.type === 'variable'),

        // ===== PRICING =====
        price: wooProduct.price,
        regular_price: wooProduct.regular_price,
        sale_price: wooProduct.sale_price,
        price_html: wooProduct.price_html,
        on_sale: wooProduct.on_sale,
        date_on_sale_from: wooProduct.date_on_sale_from,
        date_on_sale_from_gmt: (wooProduct as any).date_on_sale_from_gmt || null,
        date_on_sale_to: wooProduct.date_on_sale_to,
        date_on_sale_to_gmt: (wooProduct as any).date_on_sale_to_gmt || null,

        // ===== STOCK =====
        stock_status: wooProduct.stock_status,
        stock_quantity: wooProduct.stock_quantity,
        manage_stock: wooProduct.manage_stock,
        backorders: wooProduct.backorders,
        backorders_allowed: wooProduct.backorders_allowed,
        backordered: wooProduct.backordered,
        low_stock_amount: (wooProduct as any).low_stock_amount || null,

        // ===== SEO (Yoast/RankMath) =====
        seo: {
            title: seoTitle || wooProduct.name,
            description: seoDescription,
            plugin: seoDescriptionSource !== 'none' && seoDescriptionSource !== 'excerpt' ? seoDescriptionSource : seoPlugin,
            description_source: seoDescriptionSource
        },
        yoast_head: (wooProduct as any).yoast_head || null,
        yoast_head_json: (wooProduct as any).yoast_head_json || null,

        // ===== IMAGES (Full Array) =====
        images: transformedImages,

        // ===== ATTRIBUTES (Full Array with options) =====
        attributes: transformedAttributes,
        default_attributes: wooProduct.default_attributes || [],

        // ===== VARIATIONS =====
        variations: wooProduct.variations || [],
        variations_detailed: transformedVariants,
        variants: transformedVariants, // Alias

        // ===== TAXONOMIES =====
        categories: transformedCategories,
        tags: transformedTags,
        brands: [], // Placeholder for brand taxonomy if exists

        // ===== RELATED PRODUCTS =====
        related_ids: wooProduct.related_ids || [],
        upsell_ids: wooProduct.upsell_ids || [],
        cross_sell_ids: wooProduct.cross_sell_ids || [],
        grouped_products: wooProduct.grouped_products || [],

        // ===== SHIPPING =====
        weight: wooProduct.weight,
        dimensions: wooProduct.dimensions,
        shipping_class: wooProduct.shipping_class,
        shipping_class_id: wooProduct.shipping_class_id,
        shipping_required: wooProduct.shipping_required,
        shipping_taxable: wooProduct.shipping_taxable,

        // ===== TAXES =====
        tax_status: wooProduct.tax_status,
        tax_class: wooProduct.tax_class,

        // ===== DOWNLOADS =====
        downloads: wooProduct.downloads || [],
        download_limit: wooProduct.download_limit,
        download_expiry: wooProduct.download_expiry,

        // ===== REVIEWS =====
        reviews_allowed: wooProduct.reviews_allowed,
        average_rating: wooProduct.average_rating,
        rating_count: wooProduct.rating_count,
        reviews: wooProduct._reviews || [],
        review_summary: wooProduct._reviews?.length ? {
            total_reviews: wooProduct._reviews.length,
            average_rating: parseFloat(wooProduct.average_rating || '0'),
            verified_reviews: wooProduct._reviews.filter((r: any) => r.verified).length,
            rating_distribution: wooProduct._reviews.reduce((acc: any, r: any) => {
                const rating = String(r.rating);
                acc[rating] = (acc[rating] || 0) + 1;
                return acc;
            }, { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 })
        } : null,

        // ===== DATES =====
        date_created: wooProduct.date_created,
        date_created_gmt: (wooProduct as any).date_created_gmt || null,
        date_modified: wooProduct.date_modified,
        date_modified_gmt: (wooProduct as any).date_modified_gmt || null,

        // ===== ENRICHED DATA (EcoCombo) =====
        sku_data: {
            primary_sku: wooProduct.sku || null,
            has_variations: wooProduct.type === 'variable',
            variation_count: wooProduct.variations?.length || 0
        },
        structured_meta: {
            thumbnail_id: transformedImages[0]?.id || null,
            image_gallery_ids: transformedImages.slice(1).map((img: any) => img.id),
            custom_fields: wooProduct.meta_data?.reduce((acc: any, m: any) => {
                if (!m.key.startsWith('_')) acc[m.key] = m.value;
                return acc;
            }, {}) || {},
            product_version: null,
            review_count: wooProduct.rating_count,
            rating_count_by_star: null
        },

        // ===== OTHER =====
        menu_order: wooProduct.menu_order,
        purchase_note: wooProduct.purchase_note,
        button_text: wooProduct.button_text,
        external_url: wooProduct.external_url,
        sold_individually: wooProduct.sold_individually,
        total_sales: wooProduct.total_sales,

        // ===== META DATA (Raw WooCommerce) =====
        meta_data: wooProduct.meta_data || []
    };

    // Build working_content and store_snapshot_content JSONB structures
    // These are used by the app's editor for local modifications
    // IMPORTANT: Include ALL fields that the product editor form uses
    const contentSnapshot = {
        // ===== CORE CONTENT =====
        title: wooProduct.name,
        slug: wooProduct.slug,
        description: wooProduct.description || "",
        short_description: wooProduct.short_description || "",

        // ===== IDENTIFICATION =====
        sku: wooProduct.sku || "",
        global_unique_id: (wooProduct as any).global_unique_id || "",
        vendor: "",

        // ===== PRICING =====
        regular_price: wooProduct.regular_price || "",
        sale_price: wooProduct.sale_price || "",
        on_sale: wooProduct.on_sale ?? false,
        date_on_sale_from: wooProduct.date_on_sale_from || null,
        date_on_sale_to: wooProduct.date_on_sale_to || null,

        // ===== STOCK & INVENTORY =====
        stock: wooProduct.stock_quantity,
        stock_status: wooProduct.stock_status || "instock",
        manage_stock: wooProduct.manage_stock ?? false,
        backorders: wooProduct.backorders || "no",
        low_stock_amount: (wooProduct as any).low_stock_amount || null,

        // ===== TYPE & STATUS =====
        product_type: wooProduct.type,
        status: wooProduct.status || "publish",
        catalog_visibility: wooProduct.catalog_visibility || "visible",
        featured: wooProduct.featured ?? false,
        virtual: wooProduct.virtual ?? false,
        downloadable: wooProduct.downloadable ?? false,
        purchasable: (wooProduct as any).purchasable ?? true,
        sold_individually: wooProduct.sold_individually ?? false,

        // ===== PHYSICAL PROPERTIES =====
        weight: wooProduct.weight || "",
        dimensions: wooProduct.dimensions || null,
        shipping_class: wooProduct.shipping_class || "",
        shipping_class_id: wooProduct.shipping_class_id || null,

        // ===== TAXES =====
        tax_status: wooProduct.tax_status || "taxable",
        tax_class: wooProduct.tax_class || "",

        // ===== IMAGES =====
        images: transformedImages,
        image_url: wooProduct.images?.[0]?.src || null,

        // ===== TAXONOMIES =====
        categories: transformedCategories,
        tags: transformedTags,

        // ===== ATTRIBUTES & VARIATIONS =====
        attributes: transformedAttributes,
        variations: transformedVariants,

        // ===== LINKED PRODUCTS =====
        related_ids: wooProduct.related_ids || [],
        upsell_ids: wooProduct.upsell_ids || [],
        cross_sell_ids: wooProduct.cross_sell_ids || [],

        // ===== REVIEWS =====
        reviews_allowed: wooProduct.reviews_allowed ?? true,

        // ===== ORDERING & DISPLAY =====
        menu_order: wooProduct.menu_order ?? 0,

        // ===== ADDITIONAL INFO =====
        purchase_note: wooProduct.purchase_note || "",
        button_text: wooProduct.button_text || "",
        external_url: wooProduct.external_url || "",
        total_sales: wooProduct.total_sales ?? 0,

        // ===== SEO =====
        seo: {
            title: seoTitle || wooProduct.name,
            description: seoDescription || "",
            plugin: seoDescriptionSource !== 'none' && seoDescriptionSource !== 'excerpt' ? seoDescriptionSource : seoPlugin
        }
    };

    return {
        tenant_id: tenantId,
        store_id: storeId,
        platform: "woocommerce",
        platform_product_id: wooProduct.id.toString(),
        title: wooProduct.name,
        slug: wooProduct.slug,
        description: wooProduct.description,
        short_description: wooProduct.short_description,
        price: parseFloat(wooProduct.price || "0"),
        regular_price: parseFloat(wooProduct.regular_price || "0"),
        sale_price: wooProduct.sale_price ? parseFloat(wooProduct.sale_price) : null,
        sku: wooProduct.sku,
        stock_status: wooProduct.stock_status,
        stock: wooProduct.stock_quantity,
        manage_stock: wooProduct.manage_stock,
        image_url: wooProduct.images?.[0]?.src || null,
        product_type: wooProduct.type,

        // Full metadata JSONB
        metadata,

        // Working content for local edits (initialized from WooCommerce data)
        working_content: contentSnapshot,

        // Store snapshot (original WooCommerce state for comparison)
        store_snapshot_content: contentSnapshot,

        // Timestamps for content tracking
        store_content_updated_at: new Date().toISOString(),
        working_content_updated_at: new Date().toISOString(),

        // SEO fields at root level for easy access
        seo_title: seoTitle || wooProduct.name,
        seo_description: seoDescription,
        last_synced_at: new Date().toISOString()
    };
}
