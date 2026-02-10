# WooCommerce Synchronization Data Structure

This document outlines the data structure used when synchronizing products between this application and WooCommerce (Sync Worker -> Supabase Metadata).

## Overview

The synchronization worker updates the `metadata` column in the `products` table after every successful sync. 
This ensures that the local database always holds the most recent "truth" from the WooCommerce API.

## JSONB Structure (`metadata`)

```json
{
  "slug": "product-slug-url",
  "status": "publish",
  "sku": "product-sku",
  
  // ============================================
  // VARIATIONS
  // ============================================
  "variants": [
    {
      // --- Core Identifiers ---
      "id": 123456,                    // Real WooCommerce Variation ID (Integer)
      "sku": "VAR-SKU-001",
      "permalink": "https://store.com/product/...", // Direct link

      // --- Pricing & Sales ---
      "regular_price": "29.99",
      "sale_price": "19.99",           // Empty string if no sale
      "price": "19.99",                // Current active price
      "on_sale": true,                 // Computed boolean
      "date_on_sale_from": null,       // ISO Date
      "date_on_sale_to": null,         // ISO Date

      // --- Stock & Inventory ---
      "manage_stock": true,
      "stock_quantity": 50,
      "stock_status": "instock",       // instock | outofstock | onbackorder
      "backorders": "no",              // no | notify | yes
      "backorders_allowed": false,
      "backordered": false,
      "low_stock_amount": null,

      // --- Physical Properties ---
      "weight": "0.5",
      "dimensions": {
        "length": "10",
        "width": "5",
        "height": "2"
      },
      "shipping_class": "small-items", // Slug
      "shipping_class_id": 12,

      // --- Status & Visibility ---
      "status": "publish",             // publish | private | pending | draft
      "purchasable": true,
      "menu_order": 0,

      // --- Tax & Financial ---
      "tax_status": "taxable",
      "tax_class": "",                 // Empty = Standard

      // --- Virtual / Downloadable ---
      "virtual": false,
      "downloadable": false,
      "downloads": [],                 // Array of file objects
      "download_limit": -1,            // -1 = Unlimited
      "download_expiry": -1,           // -1 = Unlimited

      // --- Content ---
      "description": "<p>Specific description for this variation...</p>",
      "image": {
        "id": 9876,
        "src": "https://store.com/wp-content/uploads/...",
        "name": "image-name",
        "alt": "Alt text"
      },

      // --- Attributes (Selection) ---
      "attributes": [
        {
          "id": 1,                     // 0 for custom attributes
          "name": "Color",
          "option": "Red"
        }
      ],
      "title": "Red - Large",          // Auto-generated title

      // --- Meta Data (Custom Fields) ---
      "meta_data": [
        {
          "id": 4567,
          "key": "custom_field_key",
          "value": "custom_value"
        }
      ]
    }
  ],

  // ============================================
  // PARENT PRODUCT IMAGES
  // ============================================
  "images": [
    {
      "id": 9876,
      "src": "https://store.com/wp-content/uploads/...",
      "name": "main-image",
      "alt": "Main Image Alt"
    }
  ],

  // ============================================
  // PARENT ATTRIBUTES (Definitions)
  // ============================================
  "attributes": [
    {
      "id": 1,
      "name": "Color",
      "options": ["Red", "Blue", "Green"],
      "visible": true,
      "variation": true,
      "position": 0
    }
  ]
}
```

## Supported Fields List

The synchronization process now captures **ALL** standard WooCommerce product fields, including but not limited to:

### 1. Core Identity & Status
- `id`, `slug`, `permalink`, `sku`
- `status` (publish, draft, etc.)
- `type` (simple, variable, etc.)
- `featured`, `catalog_visibility`
- `date_created`, `date_modified`

### 2. Pricing & Sales
- `price`, `regular_price`, `sale_price`
- `on_sale` (Boolean)
- `date_on_sale_from`, `date_on_sale_to` (ISO & GMT)
- `price_html`
- `tax_status`, `tax_class`

### 3. Inventory & Logistics
- `stock_quantity`, `manage_stock`, `stock_status`
- `backorders`, `backorders_allowed`, `backordered`
- `sold_individually`
- `weight`, `dimensions`
- `shipping_required`, `shipping_taxable`, `shipping_class`

### 4. Digital Products
- `virtual`, `downloadable`
- `downloads` (Files list)
- `download_limit`, `download_expiry`

### 5. Links & Organization
- `external_url`, `button_text`
- `menu_order`, `purchase_note`
- `parent_id`
- `categories`, `tags`
- `related_ids`, `upsell_ids`, `cross_sell_ids`

### 6. Meta Data (Custom Fields)
- `meta_data`: The complete, raw array of custom fields from WooCommerce is now preserved in `metadata.meta_data`. This includes third-party plugin data (e.g., ACFs, custom tabs).

### 7. Reviews
- `reviews_allowed`
- `average_rating`, `rating_count`
- `_reviews`: Detailed review data (if fetched)

## 7. Synchronization Logic (Anti-Duplicate Shield)

To prevent duplicate variations and "ghost" data, the synchronization process now implements a strict cleanup strategy:

1. **Source of Truth**: The Local Database (Supabase) is the single source of truth for variations.
2. **Comparison**: During sync, the worker compares:
   - **Local Variations**: The list of variations sent in `metadata.variants`.
   - **Remote Variations**: The list of variations returned by WooCommerce.
3. **Filtering & Deletion**:
   - Matches are updated (PUT).
   - New local variations are created (POST).
   - **Obsolete Variations**: Any variation present on WooCommerce but **missing** from the local payload is automatically added to a `delete` batch request.

This ensures that deleting a variation locally also removes it from WooCommerce upon the next sync.
