/**
 * Product Form Schema - Source of Truth
 * Toutes les définitions de champs passent par ce fichier.
 * Ajouter un champ ici le rend automatiquement disponible partout.
 */
import { z } from "zod";

// Constante centralisée — seule source de vérité pour le type produit par défaut.
// Utilisée dans le schema, les defaults, la résolution form et la sauvegarde.
export const PRODUCT_TYPE_DEFAULT = "simple" as const;

// Schéma pour un attribut produit (utilisé pour les produits variables)
const ProductAttributeSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1, "Le nom de l'attribut est requis"),
    options: z.array(z.string()).default([]),
    visible: z.boolean().default(true),
    variation: z.boolean().default(false),
    position: z.number().optional(),
});

// Schéma pour une image produit
const ProductImageSchema = z.object({
    id: z.union([z.string(), z.number()]),
    src: z.string(),
    name: z.string().optional().default(""),
    alt: z.string().optional().default(""),
    order: z.number().optional(),
    isPrimary: z.boolean().optional().default(false),
});

// Schéma principal du formulaire produit
export const ProductFormSchema = z.object({
    // ===== INFORMATIONS DE BASE =====
    title: z.string().min(1, "Le titre est requis"),
    sku: z.string().optional().nullable(),
    global_unique_id: z.string().optional().nullable(), // Identifiant unique global
    short_description: z.string().optional().default(""),
    description: z.string().optional().default(""),
    permalink: z.string().optional().nullable(), // URL complète (readonly from sync)

    // ===== TARIFICATION & PROMOTIONS =====
    regular_price: z.union([z.number(), z.string()]).optional().nullable(),
    sale_price: z.union([z.number(), z.string()]).optional().nullable(),
    on_sale: z.boolean().optional().default(false),
    date_on_sale_from: z.string().optional().nullable(), // Date début promo (ISO 8601)
    date_on_sale_to: z.string().optional().nullable(), // Date fin promo (ISO 8601)

    // ===== INVENTAIRE =====
    stock: z.union([z.number(), z.string()]).optional().nullable(),
    stock_status: z.enum(["instock", "outofstock", "onbackorder"]).optional().default("instock"),
    manage_stock: z.boolean().default(false),
    backorders: z.enum(["no", "notify", "yes"]).optional().default("no"),
    low_stock_amount: z.union([z.number(), z.string()]).optional().nullable(),

    // ===== SEO =====
    meta_title: z.string().optional().default(""),
    meta_description: z.string().optional().default(""),
    focus_keyword: z.string().optional().default(""),
    slug: z.string().optional().default(""),

    // ===== ORGANISATION =====
    // FIX: No .optional() or .default() — zodResolver corrupts .default() fields
    // to "" asynchronously after reset(), overwriting the correct value.
    // Default is handled by DEFAULT_FORM_VALUES and calculateInitialFormValues().
    product_type: z.string(),
    brand: z.string().optional().default(""),
    status: z.string().optional().default("draft"),
    featured: z.boolean().optional().default(false), // Produit mis en avant
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]), // Tags produit

    // ===== MÉDIAS =====
    images: z.array(ProductImageSchema).default([]),

    // ===== LOGISTIQUE & DIMENSIONS =====
    weight: z.string().optional().default(""),
    dimensions_length: z.string().optional().default(""),
    dimensions_width: z.string().optional().default(""),
    dimensions_height: z.string().optional().default(""),
    shipping_class: z.string().optional().default(""),

    // ===== FISCALITÉ (WooCommerce) =====
    tax_status: z.enum(["taxable", "shipping", "none"]).optional().default("taxable"),
    tax_class: z.string().optional().default(""),

    // ===== VISIBILITÉ & TYPE =====
    catalog_visibility: z.enum(["visible", "catalog", "search", "hidden"]).optional().default("visible"),
    virtual: z.boolean().optional().default(false),
    downloadable: z.boolean().optional().default(false),
    purchasable: z.boolean().optional().default(true),

    // ===== PRODUITS EXTERNES =====
    external_url: z.string().optional().nullable(),
    button_text: z.string().optional().nullable(),

    // ===== AUTRES OPTIONS =====
    sold_individually: z.boolean().optional().default(false), // Vente à l'unité uniquement
    purchase_note: z.string().optional().default(""), // Note post-achat
    menu_order: z.number().optional().default(0), // Ordre d'affichage
    reviews_allowed: z.boolean().optional().default(true),

    // ===== AVIS (Readonly from sync) =====
    average_rating: z.string().optional().nullable(),
    rating_count: z.number().optional().nullable(),
    total_sales: z.number().optional().nullable(),

    // ===== PRODUITS LIÉS (IDs) =====
    upsell_ids: z.array(z.number()).default([]),
    cross_sell_ids: z.array(z.number()).default([]),
    related_ids: z.array(z.number()).default([]),

    // ===== ATTRIBUTS (produits variables) =====
    attributes: z.array(ProductAttributeSchema).default([]),
});

// Type TypeScript dérivé automatiquement du schéma
export type ProductFormValues = z.infer<typeof ProductFormSchema>;

// Type pour une image
export type ProductImage = z.infer<typeof ProductImageSchema>;

// Type pour un attribut produit
export type ProductAttribute = z.infer<typeof ProductAttributeSchema>;

// Liste des champs comparables (dérivée automatiquement des clés du schéma)
// Utilisé pour la détection de changements
export const PRODUCT_FORM_FIELDS = Object.keys(ProductFormSchema.shape) as (keyof ProductFormValues)[];

// Champs qui nécessitent une normalisation HTML
export const HTML_FIELDS: (keyof ProductFormValues)[] = ["description", "short_description"];

// Champs numériques (prix, stock)
export const NUMERIC_FIELDS: (keyof ProductFormValues)[] = ["regular_price", "sale_price", "stock"];

// Valeurs par défaut pour initialisation
export const DEFAULT_FORM_VALUES: ProductFormValues = {
    // Informations de base
    title: "",
    // FIX: Use "" instead of null for fields registered via register() on <Input>.
    // Prevents isDirty false positive from null→"" DOM conversion.
    sku: "",
    global_unique_id: "",
    short_description: "",
    description: "",
    permalink: null, // readonly — not registered on <Input>

    // Tarification & Promotions
    regular_price: "",
    sale_price: "",
    on_sale: false,
    date_on_sale_from: "",
    date_on_sale_to: "",

    // Inventaire
    stock: "",
    stock_status: "instock",
    manage_stock: false,
    backorders: "no",
    low_stock_amount: "",

    // SEO
    meta_title: "",
    meta_description: "",
    focus_keyword: "",
    slug: "",

    // Organisation
    product_type: PRODUCT_TYPE_DEFAULT,
    brand: "",
    status: "draft",
    featured: false,
    categories: [],
    tags: [],

    // Médias
    images: [],

    // Logistique
    weight: "",
    dimensions_length: "",
    dimensions_width: "",
    dimensions_height: "",
    shipping_class: "",

    // Fiscalité
    tax_status: "taxable",
    tax_class: "",

    // Visibilité
    catalog_visibility: "visible",
    virtual: false,
    downloadable: false,
    purchasable: true,

    // Produits externes
    external_url: "",
    button_text: "",

    // Autres options
    sold_individually: false,
    purchase_note: "",
    menu_order: 0,
    reviews_allowed: true,

    // Avis (readonly)
    average_rating: null,
    rating_count: null,
    total_sales: null,

    // Produits liés
    upsell_ids: [],
    cross_sell_ids: [],
    related_ids: [],

    // Attributs
    attributes: [],
};
