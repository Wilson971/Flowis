# Product Variations — Implementation Reference

> **Date:** 2026-03-03
> **Status:** STABLE — Ne pas modifier sans comprendre le flow complet
> **Scope:** CRUD variations + Push vers WooCommerce

---

## Vue d'ensemble

Le flow variations permet de créer, modifier et supprimer des variations produit dans Supabase, puis de les synchroniser vers WooCommerce via l'edge function `push-to-store`.

```
UI (ProductVariationsTab)
  → useVariationManager (state machine CRUD)
    → Supabase product_variations (dirty tracking)
      → push-to-store edge function
        → WooCommerce REST API v3 /variations/batch
```

---

## Fichiers critiques

| Fichier | Rôle | ATTENTION |
|---------|------|-----------|
| `my-app/src/features/products/hooks/useVariationManager.ts` | State machine CRUD + save mutation | Ne PAS ajouter `workspace_id` — la table n'a pas cette colonne |
| `supabase/functions/push-to-store/index.ts` | Edge function sync WooCommerce | `buildVariationPayload` est conforme WC v3 — vérifier la doc avant tout changement |
| `my-app/src/hooks/sync/usePushToStore.ts` | Hook frontend push + toasts variations | `PushResult.variations` transmet les résultats variation |
| `my-app/src/features/products/components/edit/ProductVariationsTab.tsx` | UI + pattern `onRegisterSave` | Le save est déclenché par le parent via ref callback |
| `my-app/src/hooks/products/useProductVariations.ts` | Fetch DB + fallback metadata | Fallback `product.metadata.variants` si pas de lignes en DB |

---

## Architecture du save

### 1. Catégorisation des variations

```typescript
toCreate    = variations.filter(v => v._status === 'new')
toMigrate   = variations.filter(v => !v.dbId && (v._status === 'synced' || v._status === 'modified'))
toUpdate    = variations.filter(v => v._status === 'modified' && v.dbId)
toDelete    = variations.filter(v => v._status === 'deleted' && v.dbId)
```

### 2. Opérations DB

| Action | dirty_action | is_dirty | Détail |
|--------|-------------|----------|--------|
| INSERT (new) | `'created'` | `true` | Nouvelle variation locale |
| INSERT (migrate) | `'created'` si modified | `true/false` | Migration depuis metadata |
| UPDATE | `'updated'` | `true` | Modification existante |
| UPDATE (delete) | `'deleted'` | `true` | Soft-delete pour sync WC |

### 3. Validation SKU

Avant tout INSERT/UPDATE, le hook vérifie l'unicité SKU :
- Cross-table vs `products` (exclut le parent)
- Cross-table vs `product_variations` (exclut les variations du même produit)

---

## Architecture du push (WooCommerce)

### pushDirtyVariations

```
1. Fetch variations WHERE is_dirty = true
2. Catégoriser par dirty_action: created / updated / deleted
3. buildVariationPayload() pour chaque variation
4. POST /wp-json/wc/v3/products/{id}/variations/batch
   Body: { create: [...], update: [...], delete: [...] }
5. Post-push cleanup:
   - created → update external_id avec l'ID WC retourné
   - updated → clear is_dirty + dirty_action
   - deleted → hard DELETE de la DB
6. Return VariationPushResult { created, updated, deleted, error? }
```

### buildVariationPayload — Champs WC v3

25 champs writable + meta_data, tous conformes à la spec officielle :

| Catégorie | Champs |
|-----------|--------|
| Pricing | `regular_price`, `sale_price`, `date_on_sale_from`, `date_on_sale_to` |
| Identification | `sku`, `global_unique_id`, `description`, `status` |
| Stock | `manage_stock` (bool OU "parent"), `stock_quantity`, `stock_status`, `backorders` |
| Tax | `tax_status`, `tax_class` |
| Type | `virtual`, `downloadable`, `downloads`, `download_limit`, `download_expiry` |
| Physical | `weight`, `dimensions` ({length,width,height}), `shipping_class` |
| Order | `menu_order` |
| Attributes | `attributes` ([{id?, name, option}]) |
| Image | `image` ({id} existante OU {src, name, alt} sideload) |
| Meta | `meta_data` ([{id?, key, value}]) |

> **IMPORTANT:** Le champ `name` est READ-ONLY dans WC v3. Le nom est auto-généré depuis le produit parent + attributs.

---

## Pattern onRegisterSave

Le `ProductVariationsTab` enregistre sa fonction de save auprès du parent `ProductEditorContainer` via un callback ref :

```typescript
// ProductVariationsTab
useEffect(() => {
    onRegisterSave?.(async () => {
        if (managerRef.current.hasUnsavedChanges) {
            await managerRef.current.saveVariations();
        }
    });
}, [onRegisterSave]);

// ProductEditorContainer
const variationSaveRef = useRef<(() => Promise<void>) | null>(null);
// ... dans handleSave:
await variationSaveRef.current?.();
```

**Ne PAS changer ce pattern** — il garantit que les variations sont sauvegardées AVANT le push.

---

## Table product_variations — Schema

```sql
-- Colonnes principales
id                          UUID PRIMARY KEY
store_id                    UUID NOT NULL (FK → stores.id)
product_id                  UUID (FK → products.id)
external_id                 TEXT NOT NULL (ID WooCommerce)
parent_product_external_id  TEXT NOT NULL

-- Pricing
sku, price, regular_price, sale_price, on_sale

-- Stock
stock_status, stock_quantity, manage_stock

-- Physical
weight, dimensions (JSONB)

-- Content
attributes (JSONB), image (JSONB), description, status

-- Extended (Phase 1)
global_unique_id, backorders, tax_status, tax_class
date_on_sale_from, date_on_sale_to

-- Extended (Phase 2 — sync only, pas d'UI)
shipping_class, download_limit, download_expiry
downloads (JSONB), menu_order, variation_meta_data (JSONB)
low_stock_amount

-- Dirty tracking
is_dirty        BOOLEAN DEFAULT FALSE
dirty_action    TEXT ('created' | 'updated' | 'deleted' | NULL)

-- Meta
original_data   JSONB
created_at, updated_at
```

### RLS Policies (appliquées 2026-03-03)

```sql
-- SELECT/INSERT/UPDATE/DELETE via store_id → stores.tenant_id = auth.uid()
-- PAS de workspace_id — cette colonne est legacy et nullable
```

---

## Bugs corrigés (2026-03-03)

### Bug 1 — INSERT échoue silencieusement
- **Cause:** `workspace_id` dans le INSERT mais colonne inexistante dans le schema attendu
- **Fix:** Supprimé `workspace_id` + query `workspace_members` de `useVariationManager.ts`

### Bug 2 — RLS bloque INSERT/UPDATE/DELETE
- **Cause:** Policies en DB vérifiaient `workspace_id` (ancien système), le code envoie `store_id`
- **Fix:** Migration RLS → policies basées sur `store_id` + `stores.tenant_id`

### Bug 3 — Push variations silencieux (erreurs avalées)
- **Cause:** `pushDirtyVariations` retournait `void`, 3 points de sortie silencieux
- **Fix:** Retourne `VariationPushResult`, propagé dans `PushResult.variations`, toasts dédiés

### Bug 4 — buildVariationPayload non-conforme WC v3
- **Cause:** Champs manquants (`virtual`, `downloadable`, `global_unique_id`), types incorrects (`manage_stock`, `image`)
- **Fix:** Réécriture complète, 25 champs + meta_data, vérifié 3x contre la doc officielle

---

## Règles de non-régression

1. **Ne JAMAIS ajouter `workspace_id`** dans les INSERT/UPDATE de `product_variations`
2. **Ne JAMAIS modifier `buildVariationPayload`** sans vérifier la doc WC v3
3. **Ne JAMAIS retourner `void`** depuis `pushDirtyVariations` — toujours `VariationPushResult`
4. **Ne JAMAIS supprimer le pattern `onRegisterSave`** — il synchronise le save parent/enfant
5. **Toujours marquer `is_dirty: true`** lors de tout changement en DB
6. **Toujours vérifier les SKU** avant INSERT (cross-table uniqueness)
7. **Les policies RLS utilisent `store_id`** — pas `workspace_id`
