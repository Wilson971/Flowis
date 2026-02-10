import { WooCommerceProductSource } from "../types/woocommerce";
import { ContentData, SeoData } from "../types/productContent";

/**
 * Maps a raw WooCommerce product (from EcoCombo Connector) to our internal ContentData format.
 * Ensures all enriched data (SEO, Stats, etc.) is preserved.
 */
export function mapWooCommerceToContentData(source: WooCommerceProductSource): ContentData {

    // 1. Basic Fields
    const content: ContentData = {
        title: source.name,
        description: source.description,
        short_description: source.short_description,
        sku: source.sku,
        slug: source.slug,

        // Numeric conversions
        price: parseFloat(source.price) || 0,
        regular_price: (source.regular_price !== '' && source.regular_price !== null) ? parseFloat(source.regular_price) : null as any,
        sale_price: (source.sale_price !== '' && source.sale_price !== null) ? parseFloat(source.sale_price) : null as any,
        weight: (source.weight !== '' && source.weight !== null) ? parseFloat(source.weight) : null as any,
        stock: source.stock_quantity ?? 0,
        manage_stock: source.manage_stock,

        // Status & Taxonomy
        status: source.status,
        tax_status: source.tax_status,
        tax_class: source.tax_class,
        shipping_class: source.shipping_class,

        external_ids: {
            woocommerce: source.id
        }
    };

    // 2. Images
    if (source.images && Array.isArray(source.images)) {
        content.images = source.images.map(img => ({
            id: img.id,
            src: img.src,
            alt: img.alt,
            position: 0 // WC API doesn't always send position in simple view, but we preserve order
        }));
        // Set main image from first image if available
        if (content.images && content.images.length > 0) {
            content.image_url = content.images[0].src;
        }
    }

    // 3. Categories
    if (source.categories && Array.isArray(source.categories)) {
        content.categories = source.categories.map(cat => ({
            id: String(cat.id),
            name: cat.name,
            slug: cat.slug
        }));
    }

    // 4. Dimensions
    if (source.dimensions) {
        content.dimensions = {
            length: source.dimensions.length,
            width: source.dimensions.width,
            height: source.dimensions.height
        };
    }

    // 5. Attributes
    if (source.attributes && Array.isArray(source.attributes)) {
        content.attributes = source.attributes.map(attr => ({
            id: attr.id,
            name: attr.name,
            position: attr.position,
            visible: attr.visible,
            variation: attr.variation,
            options: attr.options
        }));
    }

    // 6. Enriched SEO (Deep Data)
    // We prioritize Yoast -> RankMath -> Native
    const seo: SeoData = {
        title: source._wpSeoData?.yoast?.title || source._wpSeoData?.rankmath?.title || "",
        description: source._wpSeoData?.yoast?.description || source._wpSeoData?.rankmath?.description || "",
        // Determine source
        seo_source: source._wpSeoData?.yoast ? 'yoast' : (source._wpSeoData?.rankmath ? 'rankmath' : 'native'),
        // Advanced fields
        focus_keyword: source._wpSeoData?.yoast?.focuskw || source._wpSeoData?.rankmath?.focuskw || undefined,
        seo_score: source._wpSeoData?.yoast?.score || source._wpSeoData?.rankmath?.score || undefined
    };
    content.seo = seo;

    // 7. Commercial Stats (Deep Data)
    if (source._commercialData) {
        content.commercial_stats = {
            total_sales: source._commercialData.total_sales,
            revenue: source._commercialData.revenue,
            net_revenue: source._commercialData.net_revenue,
            order_count: source._commercialData.order_count
        };
    } else {
        // Fallback if not enriched but available in standard
        content.commercial_stats = {
            total_sales: source.total_sales || 0,
            revenue: 0,
            net_revenue: 0,
            order_count: 0
        };
    }

    // 8. Variations (Deep Data)
    if (source._variationsDetailed) {
        content.variations = source._variationsDetailed;
    }

    return content;
}
