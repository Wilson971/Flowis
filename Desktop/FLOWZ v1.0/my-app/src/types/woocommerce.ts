export interface WooCommerceImage {
    id: number;
    src: string;
    name: string;
    alt: string;
}

export interface WooCommerceDimensions {
    length: string;
    width: string;
    height: string;
}

export interface WooCommerceAttribute {
    id: number;
    name: string;
    option: string;
}

export interface WooCommerceSEOMetadata {
    title: string | null;
    description: string | null;
    focuskw?: string | null;
    score?: number | string | null;
}

export interface DeepDataSEO {
    yoast: WooCommerceSEOMetadata | null;
    rankmath: WooCommerceSEOMetadata | null;
}

export interface DeepDataCommercial {
    total_sales: number;
    revenue: number;
    net_revenue: number;
    order_count: number;
}

// Complete WooCommerce Variation Type
export interface WooVariation {
    // Core Identifiers
    id: number;
    sku: string;
    permalink?: string;

    // Pricing & Sales
    price: string;
    regular_price: string;
    sale_price: string;
    on_sale?: boolean;
    date_on_sale_from?: string | null;
    date_on_sale_to?: string | null;

    // Stock & Inventory
    manage_stock: boolean | 'parent';
    stock_quantity: number | null;
    stock_status: 'instock' | 'outofstock' | 'onbackorder';
    backorders?: 'no' | 'notify' | 'yes';
    backorders_allowed?: boolean;
    backordered?: boolean;
    low_stock_amount?: number | null;

    // Physical Properties
    weight: string;
    dimensions: WooCommerceDimensions;
    shipping_class?: string;
    shipping_class_id?: number;

    // Status & Visibility
    status?: 'publish' | 'private' | 'pending' | 'draft';
    purchasable?: boolean;
    menu_order?: number;

    // Tax & Financial
    tax_status?: 'taxable' | 'shipping' | 'none';
    tax_class?: string;

    // Virtual / Downloadable
    virtual?: boolean;
    downloadable?: boolean;
    downloads?: Array<{ id: string; name: string; file: string }>;
    download_limit?: number;
    download_expiry?: number;

    // Content
    description?: string;
    image: WooCommerceImage | null;

    // Attributes (Selection)
    attributes: WooCommerceAttribute[];

    // Meta Data
    meta_data?: Array<{ id?: number; key: string; value: any }>;

    // Timestamps
    date_created: string;
    date_created_gmt: string;
    date_modified: string;
    date_modified_gmt: string;
}

export type DeepDataVariation = WooVariation;

/**
 * The complete shape of a Product object received from EcoCombo Connector.
 * Includes standard WC fields + Deep Data extensions.
 */
export interface WooCommerceProductSource {
    // --- Standard WC Fields ---
    id: number;
    name: string;
    slug: string;
    permalink: string;
    date_created: string;
    date_created_gmt: string;
    date_modified: string;
    date_modified_gmt: string;
    type: "simple" | "variable" | "grouped" | "external";
    status: "publish" | "draft" | "pending" | "private";
    featured: boolean;
    catalog_visibility: "visible" | "catalog" | "search" | "hidden";
    description: string;
    short_description: string;
    sku: string;
    price: string;
    regular_price: string;
    sale_price: string;
    date_on_sale_from: string | null;
    date_on_sale_from_gmt: string | null;
    date_on_sale_to: string | null;
    date_on_sale_to_gmt: string | null;
    price_html: string;
    on_sale: boolean;
    purchasable: boolean;
    total_sales: number;
    virtual: boolean;
    downloadable: boolean;
    downloads: any[];
    download_limit: number;
    download_expiry: number;
    external_url: string;
    button_text: string;
    tax_status: "taxable" | "shipping" | "none";
    tax_class: string;
    manage_stock: boolean;
    stock_quantity: number | null;
    stock_status: "instock" | "outofstock" | "onbackorder";
    backorders: "no" | "notify" | "yes";
    backorders_allowed: boolean;
    backordered: boolean;
    sold_individually: boolean;
    weight: string;
    dimensions: WooCommerceDimensions;
    shipping_required: boolean;
    shipping_taxable: boolean;
    shipping_class: string;
    shipping_class_id: number;
    reviews_allowed: boolean;
    average_rating: string;
    rating_count: number;
    related_ids: number[];
    upsell_ids: number[];
    cross_sell_ids: number[];
    parent_id: number;
    purchase_note: string;
    categories: { id: number; name: string; slug: string }[];
    tags: { id: number; name: string; slug: string }[];
    images: WooCommerceImage[];
    attributes: {
        id: number;
        name: string;
        position: number;
        visible: boolean;
        variation: boolean;
        options: string[];
    }[];
    default_attributes: { id: number; name: string; option: string }[];
    variations: number[]; // IDs only in standard API
    grouped_products: number[];
    menu_order: number;
    meta_data: { id: number; key: string; value: any }[];

    // --- Deep Data Extensions (Injected by EcoCombo_Connector) ---
    _wpSeoData?: DeepDataSEO;
    _commercialData?: DeepDataCommercial;
    _variationsDetailed?: DeepDataVariation[];

    // ACF Fields (Dynamic keys)
    [key: `_acf_${string}`]: any;

    _links?: {
        self: { href: string }[];
        collection: { href: string }[];
        [key: string]: any;
    };
}
