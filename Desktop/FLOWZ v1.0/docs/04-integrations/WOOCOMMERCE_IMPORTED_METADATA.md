# WooCommerce - Métadonnées Importées

> Documentation des métadonnées importées lors de la synchronisation WooCommerce vers EcoCombo Sync.
>
> Dernière mise à jour : 2026-01-11

## Vue d'ensemble

La synchronisation WooCommerce importe l'intégralité des données produit, catégorie et article de blog disponibles via l'API REST WooCommerce/WordPress. Ces données sont stockées dans le champ JSONB `metadata` de chaque table.

---

## Table des matières

- [Produits](#produits)
- [Catégories](#catégories)
- [Articles de Blog](#articles-de-blog)
- [Colonnes Dédiées vs Metadata](#colonnes-dédiées-vs-metadata)
- [Accès aux Données](#accès-aux-données)

---

## Produits

### Table : `products`

Les métadonnées produit sont stockées dans `products.metadata` (JSONB).

#### Identification

| Clé | Type | Description |
|-----|------|-------------|
| `id` | number | ID WooCommerce du produit |
| `name` | string | Nom du produit |
| `slug` | string | Slug URL |
| `sku` | string | Référence SKU |
| `global_unique_id` | string | Identifiant unique global |
| `permalink` | string | URL complète du produit |
| `parent_id` | number | ID du produit parent (pour variations) |

#### Type & Statut

| Clé | Type | Valeurs | Description |
|-----|------|---------|-------------|
| `type` | string | `simple`, `variable`, `grouped`, `external` | Type de produit |
| `status` | string | `publish`, `draft`, `pending`, `private` | Statut de publication |
| `catalog_visibility` | string | `visible`, `catalog`, `search`, `hidden` | Visibilité catalogue |
| `featured` | boolean | - | Produit mis en avant |
| `virtual` | boolean | - | Produit virtuel (pas d'expédition) |
| `downloadable` | boolean | - | Produit téléchargeable |
| `purchasable` | boolean | - | Peut être acheté |
| `has_options` | boolean | - | A des options/variations |

#### Prix

| Clé | Type | Description |
|-----|------|-------------|
| `price` | string | Prix actuel (vente ou régulier) |
| `regular_price` | string | Prix régulier |
| `sale_price` | string | Prix soldé |
| `price_html` | string | HTML formaté du prix |
| `on_sale` | boolean | En promotion |
| `date_on_sale_from` | string | Date début promo (ISO 8601) |
| `date_on_sale_to` | string | Date fin promo (ISO 8601) |

#### Stock

| Clé | Type | Description |
|-----|------|-------------|
| `stock_status` | string | `instock`, `outofstock`, `onbackorder` |
| `stock_quantity` | number/null | Quantité en stock |
| `manage_stock` | boolean | Gestion de stock activée |
| `backorders` | string | `no`, `notify`, `yes` |
| `backordered` | boolean | Actuellement en backorder |
| `backorders_allowed` | boolean | Backorders autorisés |
| `low_stock_amount` | number/null | Seuil d'alerte stock bas |

#### SEO (Yoast)

| Clé | Type | Description |
|-----|------|-------------|
| `seo.title` | string | Meta title SEO |
| `seo.description` | string | Meta description SEO |
| `seo.plugin` | string | Plugin SEO utilisé (`yoast`) |
| `seo.description_source` | string | Source de la description |
| `yoast_head` | string | HTML complet des meta tags Yoast |
| `yoast_head_json` | object | Données Yoast structurées en JSON |

#### Images

```json
{
  "images": [
    {
      "id": 9129,
      "src": "https://example.com/wp-content/uploads/image.webp",
      "alt": "Texte alternatif",
      "name": "nom-fichier.webp",
      "date_created": "2025-08-12T17:00:51",
      "date_modified": "2025-08-12T17:00:51",
      "date_created_gmt": "2025-08-12T15:00:51",
      "date_modified_gmt": "2025-08-12T15:00:51"
    }
  ]
}
```

#### Attributs

```json
{
  "attributes": [
    {
      "id": 0,
      "name": "Couleur",
      "slug": "couleur",
      "options": ["Rouge", "Bleu", "Vert"],
      "visible": true,
      "position": 0,
      "variation": true
    }
  ]
}
```

#### Variations

| Clé | Type | Description |
|-----|------|-------------|
| `variations` | number[] | Liste des IDs de variations |
| `variations_detailed` | object[] | Détails complets des variations |
| `variants` | object[] | Alias pour variations |
| `default_attributes` | object[] | Attributs par défaut sélectionnés |

#### Taxonomies

```json
{
  "categories": [
    {
      "id": 261,
      "name": "Virtual Cockpit",
      "slug": "virtual-cockpit",
      "count": 8,
      "parent": null,
      "display": "default"
    }
  ],
  "tags": ["tag1", "tag2"],
  "brands": []
}
```

#### Produits Liés

| Clé | Type | Description |
|-----|------|-------------|
| `related_ids` | number[] | IDs des produits similaires |
| `related_products` | object[] | Détails des produits similaires |
| `upsell_ids` | number[] | IDs des produits upsell |
| `upsell_products` | object[] | Détails des produits upsell |
| `cross_sell_ids` | number[] | IDs des produits cross-sell |
| `cross_sell_products` | object[] | Détails des produits cross-sell |
| `grouped_products` | number[] | IDs des produits groupés |

#### Expédition

| Clé | Type | Description |
|-----|------|-------------|
| `weight` | string | Poids (unité définie dans WooCommerce) |
| `dimensions` | object | `{ length, width, height }` |
| `shipping_class` | string | Classe d'expédition |
| `shipping_class_id` | number | ID de la classe d'expédition |
| `shipping_required` | boolean | Nécessite une expédition |
| `shipping_taxable` | boolean | Taxable à l'expédition |

#### Fiscalité

| Clé | Type | Description |
|-----|------|-------------|
| `tax_status` | string | `taxable`, `shipping`, `none` |
| `tax_class` | string | Classe de taxe |

#### Téléchargements

```json
{
  "downloads": [
    {
      "id": "abc123",
      "name": "Manuel PDF",
      "file": "https://example.com/downloads/manual.pdf"
    }
  ],
  "download_limit": -1,
  "download_expiry": -1
}
```

#### Avis Clients

| Clé | Type | Description |
|-----|------|-------------|
| `reviews` | object[] | Liste des avis |
| `reviews_allowed` | boolean | Avis autorisés |
| `average_rating` | string | Note moyenne (ex: "4.50") |
| `rating_count` | number | Nombre d'avis |
| `review_summary` | object | Résumé des avis |

```json
{
  "review_summary": {
    "total_reviews": 12,
    "average_rating": 4.5,
    "verified_reviews": 8,
    "rating_distribution": {
      "5": 6,
      "4": 4,
      "3": 2,
      "2": 0,
      "1": 0
    }
  }
}
```

#### Dates

| Clé | Type | Description |
|-----|------|-------------|
| `date_created` | string | Date de création (ISO 8601) |
| `date_created_gmt` | string | Date de création UTC |
| `date_modified` | string | Date de modification |
| `date_modified_gmt` | string | Date de modification UTC |

#### Données Enrichies (EcoCombo)

| Clé | Type | Description |
|-----|------|-------------|
| `sku_data` | object | Données SKU structurées |
| `structured_meta` | object | Métadonnées structurées |

```json
{
  "sku_data": {
    "primary_sku": "PROD-001",
    "has_variations": true,
    "variation_count": 5
  },
  "structured_meta": {
    "thumbnail_id": 9129,
    "image_gallery_ids": [9130, 9131],
    "custom_fields": {},
    "product_version": null,
    "review_count": null,
    "rating_count_by_star": null
  }
}
```

#### Autres

| Clé | Type | Description |
|-----|------|-------------|
| `menu_order` | number | Ordre d'affichage |
| `purchase_note` | string | Note post-achat |
| `button_text` | string | Texte du bouton (externe) |
| `external_url` | string | URL externe |
| `sold_individually` | boolean | Vente à l'unité uniquement |
| `total_sales` | number | Nombre total de ventes |

---

## Catégories

### Table : `categories`

Les métadonnées catégorie sont stockées dans `categories.metadata` (JSONB).

#### Structure Complète

```json
{
  "id": 232,
  "name": "Audi A4 / S4 / RS4",
  "slug": "audi-a4-s4-rs4",
  "parent": 0,
  "description": "",
  "display": "default",
  "menu_order": 0,
  "count": 15,
  "image": {
    "id": 1234,
    "src": "https://example.com/category-image.jpg",
    "alt": "Audi A4"
  },
  "_links": {
    "self": [{ "href": "https://example.com/wp-json/wc/v3/products/categories/232" }],
    "collection": [{ "href": "https://example.com/wp-json/wc/v3/products/categories" }]
  }
}
```

#### SEO Yoast (Catégories)

Les catégories incluent les données SEO complètes de Yoast :

```json
{
  "yoast_head": "<!-- HTML des meta tags -->",
  "yoast_head_json": {
    "title": "Audi A4 / S4 / RS4 | KARKUSTOMS",
    "description": "Parcourez nos Audi A4...",
    "canonical": "https://example.com/categorie-produit/audi-a4/",
    "robots": {
      "index": "index",
      "follow": "follow",
      "max-snippet": "max-snippet:-1",
      "max-image-preview": "max-image-preview:large"
    },
    "og_locale": "fr_FR",
    "og_type": "article",
    "og_title": "Audi A4 / S4 / RS4 | KARKUSTOMS",
    "og_description": "Parcourez nos Audi A4...",
    "og_url": "https://example.com/categorie-produit/audi-a4/",
    "og_site_name": "KARKUSTOMS",
    "twitter_card": "summary_large_image",
    "schema": {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": "https://example.com/categorie-produit/audi-a4/",
          "name": "Audi A4 / S4 / RS4 | KARKUSTOMS",
          "description": "...",
          "breadcrumb": { "@id": "...#breadcrumb" }
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://example.com/" },
            { "@type": "ListItem", "position": 2, "name": "Audi A4 / S4 / RS4" }
          ]
        },
        {
          "@type": "Organization",
          "name": "KARKUSTOMS",
          "logo": { ... },
          "email": "contact@example.com",
          "telephone": "0766657116"
        }
      ]
    }
  }
}
```

---

## Articles de Blog

### Table : `blog_articles`

Les articles WordPress sont importés dans la table `blog_articles`.

#### Colonnes Principales

| Colonne | Type | Description |
|---------|------|-------------|
| `wordpress_post_id` | string | ID WordPress |
| `title` | string | Titre de l'article |
| `content` | text | Contenu HTML |
| `excerpt` | text | Extrait |
| `status` | string | `published`, `draft`, `scheduled` |
| `author` | string | Nom de l'auteur |
| `published_at` | timestamp | Date de publication |
| `featured_image_url` | string | URL image mise en avant |
| `slug` | string | Slug URL |
| `link` | string | URL complète |

#### Métadonnées (`metadata`)

```json
{
  "id": 123,
  "date": "2025-01-10T12:00:00",
  "date_gmt": "2025-01-10T11:00:00",
  "modified": "2025-01-11T10:00:00",
  "modified_gmt": "2025-01-11T09:00:00",
  "type": "post",
  "format": "standard",
  "comment_status": "open",
  "ping_status": "closed",
  "sticky": false,
  "template": "",
  "categories": [1, 5, 12],
  "tags": [3, 7],
  "_embedded": {
    "author": [{ "id": 1, "name": "Admin" }],
    "wp:featuredmedia": [{ "source_url": "https://..." }],
    "wp:term": [
      [{ "id": 1, "name": "Actualités", "taxonomy": "category" }],
      [{ "id": 3, "name": "SEO", "taxonomy": "post_tag" }]
    ]
  }
}
```

---

## Colonnes Dédiées vs Metadata

### Philosophie de Stockage

EcoCombo Sync utilise une approche hybride :

1. **Colonnes dédiées** : Données fréquemment requêtées et indexées
2. **JSONB `metadata`** : Données complètes pour référence et fonctionnalités avancées

### Mapping Produits

| Donnée | Colonne Dédiée | Dans Metadata |
|--------|----------------|---------------|
| Titre | `title` | `metadata.name` |
| Prix | `price`, `regular_price`, `sale_price` | `metadata.price`, etc. |
| SKU | `sku` | `metadata.sku` |
| Stock | `stock`, `stock_status` | `metadata.stock_quantity`, etc. |
| Description | `description`, `short_description` | `metadata.description`, etc. |
| Images | `image_url`, `media_gallery` | `metadata.images` |
| Catégories | `taxonomies_detailed` | `metadata.categories` |
| SEO | `seo_data` | `metadata.seo`, `metadata.yoast_head_json` |

### Mapping Catégories

| Donnée | Colonne Dédiée | Dans Metadata |
|--------|----------------|---------------|
| Nom | `name` | `metadata.name` |
| Slug | `slug` | `metadata.slug` |
| Description | `description` | `metadata.description` |
| Parent | `parent_external_id` | `metadata.parent` |
| Nombre produits | `product_count` | `metadata.count` |
| Image | `image_url` | `metadata.image` |

---

## Accès aux Données

### Requêtes SQL Utiles

#### Extraire les données SEO Yoast d'un produit

```sql
SELECT
  title,
  metadata->'seo'->>'title' as seo_title,
  metadata->'seo'->>'description' as seo_description,
  metadata->'yoast_head_json'->'robots' as robots
FROM products
WHERE store_id = 'your-store-id';
```

#### Lister les produits avec leurs catégories

```sql
SELECT
  title,
  jsonb_array_elements(metadata->'categories')->>'name' as category_name
FROM products
WHERE store_id = 'your-store-id';
```

#### Trouver les produits en promotion

```sql
SELECT title,
  metadata->>'regular_price' as regular_price,
  metadata->>'sale_price' as sale_price
FROM products
WHERE metadata->>'on_sale' = 'true'
  AND store_id = 'your-store-id';
```

#### Extraire le schema.org des catégories

```sql
SELECT
  name,
  metadata->'yoast_head_json'->'schema'->'@graph' as schema_graph
FROM categories
WHERE store_id = 'your-store-id';
```

### Accès TypeScript (Frontend)

```typescript
// Types pour les métadonnées produit
interface ProductMetadata {
  id: number;
  name: string;
  type: 'simple' | 'variable' | 'grouped' | 'external';
  seo?: {
    title: string;
    description: string;
    plugin: string;
  };
  images: Array<{
    id: number;
    src: string;
    alt: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  // ... etc
}

// Accès via Supabase
const { data } = await supabase
  .from('products')
  .select('title, metadata')
  .eq('store_id', storeId)
  .single();

const metadata = data.metadata as ProductMetadata;
console.log(metadata.seo?.title);
```

---

## Notes Importantes

1. **Données originales préservées** : Le champ `metadata` contient la réponse API WooCommerce originale, permettant de récupérer toute donnée même si elle n'est pas mappée vers une colonne dédiée.

2. **Synchronisation bidirectionnelle** : Lors du push vers WooCommerce, les données sont reconstruites depuis les colonnes dédiées ET le metadata pour assurer la cohérence.

3. **Performances** : Pour les requêtes fréquentes, utilisez les colonnes dédiées (indexées). Réservez les requêtes JSONB pour les cas spécifiques.

4. **SEO Yoast** : Les données SEO sont disponibles dans deux formats :
   - `metadata.seo` : Format simplifié EcoCombo
   - `metadata.yoast_head_json` : Format complet Yoast avec schema.org

---

## Voir Aussi

- [Architecture de Synchronisation](../../../deep-dive-synchronization-architecture.md)
- [Structure des Données WooCommerce](./WOOCOMMERCE_SYNC_DATA_STRUCTURE.md)
- [Guide d'Intégration WooCommerce](./README.md)
