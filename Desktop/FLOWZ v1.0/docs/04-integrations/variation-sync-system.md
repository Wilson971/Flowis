# Variation Sync System — Architecture & Flux

> Documentation technique du systeme de gestion et synchronisation des variations produit entre FLOWZ et WooCommerce.

## Vue d'ensemble

```
FLOWZ UI (Variation Studio)
    |
    v
useVariationManager (state local)
    |
    v
product_variations (Supabase DB, dirty tracking)
    |
    v
push-to-store Edge Function
    |
    v
WooCommerce REST API v3 (Batch endpoint)
```

---

## 1. Structure des donnees

### Table `product_variations`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | PK interne Supabase |
| `store_id` | uuid | FK vers `stores` |
| `product_id` | uuid | FK vers `products` |
| `external_id` | text | ID WooCommerce (ex: "2018") ou local (ex: "local_abc123") |
| `parent_product_external_id` | text | ID WC du produit parent (ex: "2003") |
| `attributes` | jsonb | `[{id, name, slug, option}]` |
| `image` | jsonb | `{id, src, name, alt}` |
| `sku`, `regular_price`, `sale_price` | text/numeric | Champs editables |
| `stock_quantity`, `stock_status`, `manage_stock` | mixed | Gestion du stock |
| `is_dirty` | boolean | Indique si la variation a des changements non pushes |
| `dirty_action` | text | `created` / `updated` / `deleted` |
| `original_data` | jsonb | Snapshot avant modification (pour diff) |

### Interface `EditableVariation` (frontend)

```typescript
interface EditableVariation {
    _localId: string;        // ID local unique (nanoid)
    _status: "synced" | "new" | "modified" | "deleted";
    externalId: string;      // ID WooCommerce ou vide
    attributes: VariationAttribute[];
    sku: string;
    regularPrice: string;
    salePrice: string;
    stockQuantity: number | null;
    // ... autres champs
}
```

### Interface `VariationAttribute`

```typescript
interface VariationAttribute {
    id?: number;    // 0 pour attributs locaux, >0 pour taxonomies WC
    name: string;   // Ex: "Couleur"
    slug?: string;  // Ex: "couleur" (requis pour le matching WC)
    option: string; // Ex: "Blanc Nacre"
}
```

---

## 2. Flux de creation de variations

### Etape 1 : Definition des attributs (onglet Attributs)

L'utilisateur definit les attributs du produit variable dans l'onglet Attributs du Variation Studio :

```
Couleur (variation=true) : Blanc Nacre, Bleu Nacre, Jaune
Taille (variation=true)  : S, M, L
```

Les attributs sont stockes dans le formulaire produit via React Hook Form (`watch("attributes")`).

### Etape 2 : Generation du produit cartesien

Clic sur **Generer** dans l'onglet Grille :

```typescript
// useVariationManager.ts — generateFromAttributes()
const variationAttrs = attributes.filter(a => a.variation && a.options?.length > 0);

// Metadata pour chaque attribut (id, name, slug)
const attrMeta = variationAttrs.map(a => ({
    id: a.id ?? 0,
    name: a.name,
    slug: a.name.toLowerCase().replace(/\s+/g, "-"),
}));

// Produit cartesien
const combos = cartesian(variationAttrs.map(a => a.options));
// Ex: [["Blanc Nacre","S"], ["Blanc Nacre","M"], ...]

// Chaque combo devient une EditableVariation
for (const combo of combos) {
    const attrs = combo.map((option, i) => ({
        id: attrMeta[i].id,
        name: attrMeta[i].name,
        slug: attrMeta[i].slug,
        option,
    }));
    // Deduplication: skip si une variation avec les memes attributs existe deja
    variations.push({
        _localId: nanoid(),
        _status: "new",
        externalId: "",
        attributes: attrs,
        // ... defaults
    });
}
```

### Etape 3 : Sauvegarde en base (Enregistrer)

`useVariationManager.save()` categorise les variations :

| Categorie | Critere | Action DB |
|-----------|---------|-----------|
| `toCreate` | `_status === "new"` et pas d'`externalId` | INSERT avec `dirty_action: "created"` |
| `toMigrateFromMetadata` | `_status === "new"` avec `externalId` (vient des metadata) | UPSERT avec `dirty_action: "updated"` |
| `toUpdate` | `_status === "modified"` | UPDATE avec `dirty_action: "updated"` |
| `toDelete` | `_status === "deleted"` | UPDATE `dirty_action: "deleted"` |

Toutes les operations mettent `is_dirty: true`.

### Etape 4 : Push vers WooCommerce (Publier)

`push-to-store` Edge Function :

```
1. Fetch dirty variations:
   SELECT * FROM product_variations
   WHERE store_id = X AND parent_product_external_id = Y AND is_dirty = true

2. Build batch payload:
   - dirty_action = "created" → batch.create[]
   - dirty_action = "updated" + external_id numerique → batch.update[]
   - dirty_action = "updated" + external_id "local_*" → batch.create[] (local jamais synce)
   - dirty_action = "deleted" + external_id numerique → batch.delete[]
   - dirty_action = "deleted" + external_id "local_*" → suppression DB directe

3. POST /wp-json/wc/v3/products/{id}/variations/batch
   Body: { create: [...], update: [...], delete: [...] }

4. Post-push cleanup:
   - Created: UPDATE external_id = WC response ID, is_dirty = false
   - Updated: UPDATE is_dirty = false
   - Deleted: DELETE FROM product_variations
   - Erreurs: log + toast, variation reste dirty
```

---

## 3. Modification du nom d'attribut (cascade)

Quand l'utilisateur renomme une option d'attribut (ex: "Blanc B" → "Blanc Nacre"), la modification doit se propager a toutes les variations qui utilisent cette option.

### Flux

```
Onglet Attributs: rename "Blanc B" → "Blanc Nacre"
    |
    v
handleRenameOption(attrName="Couleur", oldValue="Blanc B", newValue="Blanc Nacre")
    |
    v
Pour chaque variation:
    si attributes contient {name: "Couleur", option: "Blanc B"}
    alors: {...attr, option: "Blanc Nacre"}  // spread preserve id, slug
    et: _status = "modified"
```

### Code (ProductVariationsTab.tsx)

```typescript
const handleRenameOption = (attrName: string, oldValue: string, newValue: string) => {
    if (!variationManager) return;
    const updated = variationManager.variations.map((v) => ({
        ...v,
        attributes: v.attributes.map((a) =>
            a.name === attrName && a.option === oldValue
                ? { ...a, option: newValue }  // preserves a.id and a.slug
                : a
        ),
        _status: v.attributes.some(a => a.name === attrName && a.option === oldValue)
            ? ("modified" as const)
            : v._status,
    }));
    variationManager.setVariations(updated);
};
```

### Points importants

- Le `spread { ...a, option: newValue }` preserve `id` et `slug` de l'attribut, essentiels pour le matching WC
- La modification en cascade est instantanee (state local), pas de requete DB
- Les variations modifiees sont marquees `_status: "modified"` pour le dirty tracking
- Le rename met aussi a jour les options de l'attribut parent dans le formulaire

### Suppression d'option (cascade)

Quand une option est supprimee, les variations qui l'utilisent sont marquees `_status: "deleted"` :

```typescript
const handleRemoveOption = (attrName: string, removedOption: string) => {
    const updated = variationManager.variations.map((v) => {
        if (v.attributes.some(a => a.name === attrName && a.option === removedOption)) {
            return { ...v, _status: "deleted" as const };
        }
        return v;
    });
    variationManager.setVariations(updated);
};
```

---

## 4. Format des attributs WooCommerce

### Variation (enfant)

```json
{
    "attributes": [
        { "id": 0, "name": "Couleur", "option": "Blanc Nacre" }
    ]
}
```

- `option` (singulier) : une seule valeur par attribut
- `id: 0` : attribut local (custom product attribute)
- `id: > 0` : attribut global (taxonomy WC)

### Produit parent

```json
{
    "attributes": [
        {
            "id": 0,
            "name": "Couleur",
            "options": ["Blanc Nacre", "Bleu Nacre", "Jaune"],
            "variation": true,
            "visible": true
        }
    ]
}
```

- `options` (pluriel, array) : toutes les valeurs possibles
- `variation: true` : utilise pour les variations

---

## 5. Gestion des images

### Cas d'upload local (Supabase Storage)

Quand l'utilisateur upload une image dans la grille de variations :
1. L'image est stockee dans Supabase Storage : `product-images/{productId}/variations/{timestamp}.png`
2. Un `image.id` = timestamp est genere localement (ex: `1772740629654`)
3. Ce n'est PAS un ID WC valide

### Logique de push (buildVariationPayload)

```typescript
const imgId = Number(img.id);
const isValidWcId = imgId > 0 && imgId < 10_000_000;

if (isValidWcId) {
    // Existant dans la media library WC
    payload.image = { id: imgId };
} else if (img.src) {
    // URL externe — WC va sideload l'image
    payload.image = { src: img.src, name: img.name, alt: img.alt };
}
```

WooCommerce telecharge l'image depuis l'URL Supabase et la stocke dans sa propre media library.

---

## 6. Dirty tracking & timestamp conflict

### Probleme resolu

Le `push-to-store` verifie si le produit a un conflit de timestamp (`date_modified` WC > `working_content_updated_at` local). Si oui, le produit etait **entierement skippe**, y compris ses variations.

### Solution

Meme quand le produit est skippe par timestamp, les variations dirty sont toujours pushees :

```typescript
if (!timestampCheck.shouldPush) {
    // Skip product content, but STILL push dirty variations
    if (isVariable) {
        variationResult = await pushDirtyVariations(...);
    }
    results.push({ skipped: !hasVariationChanges, variations: variationResult });
    continue;
}
```

### Pourquoi le conflit se produit

1. Premier push : met a jour `metadata.date_modified = now()` (ex: 21:07:57)
2. L'utilisateur modifie une variation (pas le contenu produit)
3. `working_content_updated_at` reste a 21:00:48 (pas de changement produit)
4. Deuxieme push : `date_modified` (21:07:57) > `working_content_updated_at` (21:00:48)
5. `shouldPush = false` → variations ignorees

---

## 7. Detection des parentAttributeOptions

Le composant `VariationRow` affiche des `<Select>` dropdowns pour les attributs, alimentes par `parentAttributeOptions` (Map des options disponibles pour chaque attribut).

### Probleme resolu

`React Hook Form.watch("attributes")` retourne parfois la meme reference array avec des contenus mutes, ce qui ne declenche pas le recalcul du `useMemo`.

### Solution

```typescript
const attributeOptionsKey = JSON.stringify(
    attributes.filter(a => a.variation).map(a => [a.name, a.options])
);

const parentAttributeOptions = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const attr of attributes) {
        if (attr.variation && attr.options?.length > 0) {
            map.set(attr.name, attr.options);
        }
    }
    return map;
}, [attributeOptionsKey]); // serialized dependency
```

---

## 8. Fichiers cles

| Fichier | Role |
|---------|------|
| `features/products/hooks/useVariationManager.ts` | State local, CRUD, generation, save en DB |
| `features/products/components/edit/ProductVariationsTab.tsx` | Orchestrateur UI (2 onglets: Grille/Attributs), cascade rename/remove |
| `features/products/components/edit/variation-grid/VariationRow.tsx` | Ligne editable dans la grille |
| `hooks/products/useProductVariations.ts` | Fetch DB + conversion AppVariation |
| `supabase/functions/push-to-store/index.ts` | `pushDirtyVariations()` + `buildVariationPayload()` |

---

## 9. Erreurs connues et solutions

| Erreur | Cause | Solution |
|--------|-------|----------|
| "ID d'image non valide" | `image.id` = timestamp Supabase | Envoyer `src` au lieu de `id` si > 10M |
| Variation reste dirty apres push | Timestamp conflict skip les variations | Push variations meme si produit skippe |
| Dropdown attribut ne se met pas a jour | `watch()` meme reference | `JSON.stringify` comme dep key du `useMemo` |
| Variation dupliquee sur WC | Auto-generation remplace les vraies variations | Auto-gen desactivee, variations viennent de DB/metadata |
| Attribut non matche sur WC | `id` et `slug` manquants | Inclus dans `generateFromAttributes` |
