/**
 * Product Types
 *
 * Type definitions for product data structure
 * Compatible with WooCommerce, Shopify, and other e-commerce platforms
 */

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  position?: number;
}

export interface ProductCategory {
  id: string | number;
  name: string;
  slug?: string;
}

// ============================================================================
// WOOCOMMERCE JSONB STRUCTURE (from WOOCOMMERCE_SYNC_DATA_STRUCTURE.md)
// ============================================================================

interface WooVariantImage {
  id: number;
  src: string;
  name?: string;
  alt?: string;
}

interface WooDimensions {
  length?: string;
  width?: string;
  height?: string;
}

interface WooVariantAttribute {
  id: number;
  name: string;
  option: string;
}

interface WooVariantMetaData {
  id?: number;
  key: string;
  value: any;
}

export interface WooVariant {
  // Core Identifiers
  id: number;
  sku?: string;
  permalink?: string;

  // Pricing & Sales
  regular_price?: string;
  sale_price?: string;
  price?: string;
  on_sale?: boolean;
  date_on_sale_from?: string | null;
  date_on_sale_to?: string | null;

  // Stock & Inventory
  manage_stock?: boolean | 'parent';
  stock_quantity?: number | null;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
  backorders?: 'no' | 'notify' | 'yes';
  backorders_allowed?: boolean;
  backordered?: boolean;
  low_stock_amount?: number | null;

  // Physical Properties
  weight?: string;
  dimensions?: WooDimensions;
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
  image?: WooVariantImage | null;

  // Attributes (Selection)
  attributes?: WooVariantAttribute[];
  title?: string;

  // Meta Data (Custom Fields)
  meta_data?: WooVariantMetaData[];
}

interface WooProductImage {
  id: number;
  src: string;
  name?: string;
  alt?: string;
  date_created?: string;
  date_modified?: string;
}

interface WooProductAttribute {
  id: number;
  name: string;
  options: string[];
  visible?: boolean;
  variation?: boolean;
  position?: number;
}

interface WooProductMetaData {
  id?: number;
  key: string;
  value: any;
}

// ============================================================================
// PRODUCT METADATA (Full JSONB Structure)
// ============================================================================

export interface ProductMetadata {
  // Core Identity & Status
  slug?: string;
  status?: 'publish' | 'draft' | 'pending' | 'private';
  sku?: string;
  permalink?: string;
  type?: 'simple' | 'variable' | 'grouped' | 'external';
  featured?: boolean;
  catalog_visibility?: 'visible' | 'catalog' | 'search' | 'hidden';
  date_created?: string;
  date_modified?: string;

  // Categories & Tags
  categories?: ProductCategory[];
  tags?: string[];
  handle?: string; // Shopify handle

  // Pricing & Sales
  price_html?: string;
  on_sale?: boolean;
  date_on_sale_from?: string | null;
  date_on_sale_to?: string | null;
  tax_status?: string;
  tax_class?: string;

  // Inventory & Logistics
  stock_status?: string;
  manage_stock?: boolean;
  backorders?: string;
  backorders_allowed?: boolean;
  backordered?: boolean;
  sold_individually?: boolean;
  weight?: string;
  dimensions?: WooDimensions;
  shipping_required?: boolean;
  shipping_taxable?: boolean;
  shipping_class?: string;
  shipping_class_id?: number;

  // Digital Products
  virtual?: boolean;
  downloadable?: boolean;
  downloads?: Array<{ id: string; name: string; file: string }>;
  download_limit?: number;
  download_expiry?: number;

  // Links & Organization
  external_url?: string;
  button_text?: string;
  menu_order?: number;
  purchase_note?: string;
  parent_id?: number;
  related_ids?: number[];
  upsell_ids?: number[];
  cross_sell_ids?: number[];
  grouped_products?: number[];

  // Reviews
  reviews_allowed?: boolean;
  average_rating?: string;
  rating_count?: number;
  total_sales?: number;

  // VARIATIONS (Full JSONB Array) - Critical for Variable Products
  variants?: WooVariant[];
  variations_ids?: number[];
  variations_count?: number;

  // IMAGES (Full JSONB Array)
  images?: WooProductImage[];

  // ATTRIBUTES (Full JSONB Array with options)
  attributes?: WooProductAttribute[];
  default_attributes?: Array<{ id: number; name: string; option: string }>;

  // META DATA (Custom Fields from WooCommerce)
  meta_data?: WooProductMetaData[];

  // SEO
  seo_source?: string;
  seo_title?: string;
  seo_description?: string;

  // Platform-specific
  woo_status?: string;
  product_type?: string;

  // Allow additional fields
  [key: string]: any;
}

export interface StudioJob {
  id: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface ProductSeoAnalysis {
  overall_score: number;
  analyzed_at: string;
  title_score?: number;
  description_score?: number;
  meta_score?: number;
}

export interface ProductSerpAnalysis {
  id: string;
  keyword_position: number;
  status: string;
  analyzed_at: string;
  keyword?: string;
  search_volume?: number;
  competition?: string;
}

// ContentData is defined in types/productContent.ts (single source of truth)
import type { ContentData } from './productContent';
export type { ContentData };

export interface Product {
  id: string;
  title: string;
  platform: string;
  platform_product_id: string;
  image_url?: string;
  price?: number;
  stock?: number;
  sku?: string;
  product_type?: string;
  imported_at: string;
  created_at?: string;
  updated_at?: string;

  // Metadata
  metadata?: ProductMetadata;

  // AI Generated Content
  draft_generated_content?: ContentData | null;
  working_content?: ContentData;

  // Content Management
  dirty_fields_content?: string[];
  editorial_lock?: Record<string, boolean>;
  ai_enhanced?: boolean;

  // Sync Status
  last_synced_at?: string;
  sync_source?: 'webhook' | 'push' | 'manual';
  sync_conflict_count?: number;

  // Relations
  studio_jobs?: StudioJob[];
  product_seo_analysis?: ProductSeoAnalysis;
  product_serp_analysis?: ProductSerpAnalysis[];

  // Additional platform-specific fields
  [key: string]: any;
}

export interface ProductStats {
  total: number;
  optimized: number;
  notOptimized: number;
  withDrafts: number;
  needsSync: number;
}

export interface UnsyncedProductsData {
  total: number;
  products: Product[];
}

// Batch Generation Types
export interface ContentTypes {
  title?: boolean;
  short_description?: boolean;
  description?: boolean;
  seo_title?: boolean;
  meta_description?: boolean;
  sku?: boolean;
  alt_text?: boolean;
}

export interface BatchGenerationSettings {
  provider: 'gemini' | 'openai';
  model: string;
  tone: string;
  language: string;
  global_config: boolean;
  word_limits?: {
    title?: number;
    short_description?: number;
    description?: number;
    seo_title?: number;
    meta_description?: number;
  };
  structure_options?: {
    h2_titles?: boolean;
    benefits_list?: boolean;
    benefits_count?: number;
    specs_table?: boolean;
    cta?: boolean;
  };
  image_analysis?: boolean;
  transform_mode?: 'optimize' | 'rewrite' | 'enhance';
  respect_editorial_lock?: boolean;
  force_regenerate?: boolean;
  serp_enrichment?: {
    enabled: boolean;
    provider: 'serpapi';
    country: string;
    language: string;
    use_in_generation: boolean;
  };
}

export interface BatchGenerationRequest {
  product_ids: string[];
  content_types: ContentTypes;
  settings: BatchGenerationSettings;
  store_id: string;
}

export interface BatchJob {
  id: string;
  tenant_id: string;
  store_id?: string;
  content_types: Record<string, boolean>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'partial';
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface BatchJobItem {
  id: string;
  batch_job_id: string;
  product_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
  products?: Product;
}
