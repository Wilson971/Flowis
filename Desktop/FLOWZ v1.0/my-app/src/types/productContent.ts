/**
 * Types pour le système triple-buffer de contenu produit
 * Ported from legacy project
 */

export interface CategoryItem {
    id?: string;
    name: string;
    slug?: string;
}

export interface ImageItem {
    id?: string | number;
    src: string;
    alt?: string;
    position?: number;
}

/**
 * Type pour les images dans le formulaire d'édition
 */
export interface FormImageItem {
    id: number | string;
    src: string;
    name: string;
    alt: string;
}

export interface SeoData {
    title?: string;
    description?: string;
    keywords?: string[];
    og_image?: string;
    canonical_url?: string;
    // Enriched SEO (Yoast/RankMath)
    focus_keyword?: string;
    seo_score?: number | string;
    seo_source?: 'yoast' | 'rankmath' | 'ecocombo' | 'manual' | 'native';
}

export interface CommercialStats {
    total_sales: number;
    revenue: number;
    net_revenue: number;
    order_count: number;
}

export interface ProductAttribute {
    id: number;
    name: string;
    position: number;
    visible: boolean;
    variation: boolean;
    options: string[];
}

export interface ProductDimensions {
    length: string;
    width: string;
    height: string;
}

/**
 * Structure du contenu éditorial d'un produit
 * Aligné avec WooCommerce API v3 et le formulaire d'édition
 */
export interface ContentData {
    // ===== INFORMATIONS DE BASE =====
    title: string;
    description?: string;
    short_description?: string;
    sku?: string;
    slug?: string;
    vendor?: string;
    product_type?: string;
    global_unique_id?: string;

    // ===== TAXONOMIES =====
    tags?: string[];
    categories?: CategoryItem[];

    // ===== MÉDIAS =====
    image_url?: string;
    images?: ImageItem[];

    // ===== SEO =====
    seo?: SeoData;

    // ===== TARIFICATION =====
    price?: number;
    regular_price?: number;
    sale_price?: number;
    on_sale?: boolean;
    date_on_sale_from?: string | null;
    date_on_sale_to?: string | null;

    // ===== STOCK & INVENTAIRE =====
    stock?: number;
    stock_status?: "instock" | "outofstock" | "onbackorder";
    manage_stock?: boolean;
    backorders?: "no" | "notify" | "yes";
    low_stock_amount?: number | null;

    // ===== STATUT & VISIBILITÉ =====
    status?: "publish" | "draft" | "pending" | "private";
    catalog_visibility?: "visible" | "catalog" | "search" | "hidden";
    featured?: boolean;
    purchasable?: boolean;
    virtual?: boolean;
    downloadable?: boolean;

    // ===== PHYSIQUE & EXPÉDITION =====
    weight?: number;
    dimensions?: ProductDimensions;
    shipping_class?: string;
    shipping_class_id?: number | null;

    // ===== FISCALITÉ =====
    tax_status?: "taxable" | "shipping" | "none";
    tax_class?: string;

    // ===== OPTIONS =====
    sold_individually?: boolean;
    reviews_allowed?: boolean;
    menu_order?: number;
    purchase_note?: string;

    // ===== PRODUIT EXTERNE =====
    external_url?: string | null;
    button_text?: string | null;

    // ===== PRODUITS LIÉS =====
    upsell_ids?: number[];
    cross_sell_ids?: number[];
    related_ids?: number[];

    // ===== ATTRIBUTS & VARIATIONS =====
    attributes?: ProductAttribute[];
    variations?: any[]; // To be typed strictly later if needed

    // ===== STATISTIQUES (lecture seule) =====
    commercial_stats?: CommercialStats;
    total_sales?: number;
    average_rating?: string;
    rating_count?: number;

    // ===== INTÉGRATION EXTERNE =====
    external_ids?: {
        woocommerce?: number;
    };

    // ===== ACF FIELDS =====
    _acf_?: any;
}

/**
 * Triple-buffer complet pour le contenu produit
 */
export interface ProductContentBuffer {
    store_snapshot_content: ContentData;
    working_content: ContentData;
    draft_generated_content?: ContentData | null;
    dirty_fields_content: string[];
    store_content_updated_at: string;
    working_content_updated_at: string;
}

/**
 * Statut du contenu produit
 */
export type ContentStatus =
    | 'SYNCED'              // Aucune modification
    | 'PENDING_APPROVAL'    // Brouillon IA en attente
    | 'READY_TO_SYNC'       // Modifications locales prêtes à publier
    | 'CONFLICT';           // Conflit entre boutique et local

/**
 * Révision pour l'undo
 */
export interface ProductRevision {
    id: string;
    product_id: string;
    scope: string; // 'content' | 'variant:<variant_id>'
    before_data: ContentData | null;
    after_data: ContentData | null;
    created_at: string;
}
