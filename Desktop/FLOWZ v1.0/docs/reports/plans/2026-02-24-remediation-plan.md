# Plan de Remédiation — Issues Restantes
**Date:** 2026-02-24
**Scope:** 5 HIGH différés + 30 MEDIUM + 7 LOW
**Effort estimé:** ~15-20 jours

---

## Analyse préalable

### État des lieux

| Catégorie | Total | Fixé | Reste |
|-----------|-------|------|-------|
| CRITICAL | 7 | 7 | 0 |
| HIGH | 17 | 12 | 5 |
| MEDIUM | 30 | 0 | 30 |
| LOW | 7 | 0 | 7 |

### Dépendances entre issues

```
H10 (as any) ──► H12 (god hooks) ──► H16 (prop drilling)
                                  ──► H13 (stale closures)
H7 (pagination) ──► standalone (pas de dépendance)
H11 (catch vides) ──► standalone
Console.log purge ──► standalone
Prompt injection ──► standalone
Landing lazy ──► standalone
```

**Conclusion** : la plupart des issues sont indépendantes. Le refactoring des god hooks (H12) dépend de H10 (types propres d'abord).

---

## Sprint 1 — Quick Wins (2-3 jours)

### 1.1 Prompt injection patterns manquants
**Effort:** 0.5 jour | **Impact:** HIGH (sécurité)

**Constat :** 9 patterns actuels dans flowriter + photo-studio. Il manque :
- Role switching : `pretend to be`, `impersonate`, `role override`
- Context manipulation : `forget everything`, `clear context`, `reset prompt`
- Continuation attacks : `continue above`, `from now on`
- Code execution : `eval(`, `exec(`

**Fichiers :**
- `my-app/src/app/api/flowriter/stream/route.ts:248-258`
- `my-app/src/app/api/photo-studio/generate/route.ts:114-129`
- `my-app/src/app/api/batch-generation/stream/route.ts` (aucune validation — ajouter)

**Action :** Créer `lib/ai/prompt-safety.ts` (shared), importer dans les 3 endpoints.

---

### 1.2 Landing page lazy loading
**Effort:** 0.5 jour | **Impact:** MEDIUM (bundle -50-80KB)

**Constat :** 10 composants landing importés statiquement via barrel export. Aucun `dynamic()`.

**Composants à lazy-load (below the fold) :**
- `DashboardPreview`
- `MarketIntelligence`
- `Features`
- `Testimonials`
- `Pricing`
- `Footer`

**Garder en statique (above the fold) :** `Navbar`, `HeroSection`

**Action :** `next/dynamic` avec `{ ssr: false }` + skeleton loaders.

---

### 1.3 Console.log purge (client-side)
**Effort:** 1 jour | **Impact:** MEDIUM (sécurité + perf)

**Constat :** 136 appels total. Répartition :
- API routes (~60) → **garder** (server-side debugging)
- Hooks (~30) → **supprimer** sauf erreurs critiques
- Components (~8) → **supprimer** tout
- Features (~38) → **supprimer** sauf erreurs critiques

**Stratégie :**
1. Supprimer tous les `console.log()` client-side
2. Remplacer les `console.error()` critiques par un logger structuré ou toast
3. Garder les `console.error()` côté API routes
4. Ajouter une règle ESLint `no-console: ["warn", { allow: ["error", "warn"] }]`

---

### 1.4 staleTime standardisation
**Effort:** 0.5 jour | **Impact:** MEDIUM (cohérence cache)

**Constat actuel (incohérent) :**
| Valeur | Occurrences | Contexte |
|--------|-------------|----------|
| 1000 (1s) | 5 | Polling dedup |
| 30000 (30s) | 10 | Listes produits |
| 60000 (1m) | 15 | Stats, historique |
| 300000 (5m) | 12 | Articles, templates |
| 600000 (10m) | 2 | WordPress sync |

**Convention à adopter :**
```typescript
// lib/query-config.ts
export const STALE_TIMES = {
  POLLING: 1_000,        // Dedup pour polling actif
  REALTIME: 5_000,       // Données quasi temps-réel (sync status)
  LIST: 30_000,          // Listes de produits/articles
  DETAIL: 60_000,        // Détail d'un item
  STATIC: 5 * 60_000,   // Données rarement modifiées (stores, catégories, templates)
  ARCHIVE: 10 * 60_000, // Données historiques (sync logs)
} as const;
```

**Action :** Créer le fichier de config + remplacer toutes les valeurs hardcodées.

---

## Sprint 2 — TypeScript & Error Handling (3-4 jours)

### 2.1 Supprimer les `as any` (35 occurrences)
**Effort:** 2-3 jours | **Impact:** HIGH (type safety)

**Analyse des cas :**

#### Groupe A — Metadata/Working Content (15 casts)
**Fichiers :** `useProductSave.ts`, `productHelpers.ts`, `ProductsListContent.tsx`

**Cause racine :** Les colonnes JSONB `metadata`, `working_content`, `draft_generated_content` sont typées `any` dans les types Supabase.

**Solution :** Créer des interfaces typées :
```typescript
// types/product-content.ts
interface ProductMetadata {
  categories?: Array<{ id: number; name: string }>;
  attributes?: Array<{ name: string; options: string[] }>;
  images?: Array<{ id: number; src: string; alt: string }>;
  tags?: Array<{ id: number; name: string }>;
  short_description?: string;
  description?: string;
  // ...
}

interface WorkingContent {
  title?: string;
  description?: string;
  short_description?: string;
  seo?: { title?: string; description?: string; focus_keyword?: string };
  images?: Array<{ id: number; src: string; alt: string }>;
  product_type?: string;
  permalink?: string;
  slug?: string;
}
```

**Fichiers à modifier :**
- `types/product.ts` — ajouter les interfaces
- `useProductSave.ts` — 11 casts à remplacer
- `ProductsListContent.tsx` — 5 casts à remplacer
- `productHelpers.ts` — 3 casts à remplacer

#### Groupe B — Article Metadata (8 casts)
**Fichier :** `useArticleEditorForm.ts`

**Cause racine :** L'objet `article` retourné par Supabase a des champs custom non typés.

**Solution :** Créer `ArticleWithMetadata` interface.

#### Groupe C — Divers (12 casts)
**Fichiers :** `batch-generation/stream/route.ts`, `useProductVariations.ts`, GSC, UI

**Solution :** Type guards + interfaces dédiées au cas par cas.

---

### 2.2 Catch blocks — stratégie d'erreur
**Effort:** 1 jour | **Impact:** MEDIUM (observabilité)

**Constat :** 12 catch blocks qui avalent les erreurs silencieusement.

**Stratégie par contexte :**

| Contexte | Action |
|----------|--------|
| Hook mutation (save, push) | `toast.error()` + `console.error()` |
| Hook query (fetch) | Laisser TanStack Query gérer (retry + error state) |
| Composant UI (drag, localStorage) | `console.warn()` silencieux |
| API route | `console.error()` structuré + réponse HTTP appropriée |

**Fichiers prioritaires :**
1. `useVariationImages.ts:57` — catch vide → `console.warn`
2. `useLocalStorage.ts:20,29` — catch vide → fallback + `console.warn`
3. `WooConnectionCard.tsx:160` — catch vide → `toast.error()`
4. `MorphSurfaceDock.tsx:169,230` — catch vide → `console.warn`

---

## Sprint 3 — Pagination Server-Side (3-4 jours)

### 3.1 Implémenter la pagination serveur
**Effort:** 3-4 jours | **Impact:** HIGH (fonctionnel)

**Constat actuel :**
- `useProducts()` retourne max 200 produits (hardcoded)
- `ProductsListContent.tsx` pagine côté client (état local `page`, `pageSize`)
- `ProductsPagination` UI existe déjà
- Les filtres s'appliquent côté client sur les 200 produits

**Plan d'implémentation :**

#### Étape 1 — Hook avec offset/limit
```typescript
export function useProducts(storeId?: string, page = 1, pageSize = 50) {
  return useQuery({
    queryKey: ['products', storeId, page, pageSize],
    queryFn: async () => {
      const offset = (page - 1) * pageSize;
      const { data, count, error } = await supabase
        .from('products')
        .select(LIST_COLUMNS, { count: 'exact' })
        .eq('store_id', storeId)
        .order('imported_at', { ascending: false })
        .range(offset, offset + pageSize - 1);
      return { products: data, totalCount: count };
    },
  });
}
```

#### Étape 2 — Filtres côté serveur
Déplacer les filtres (status, product_type, ai_enhanced) dans la query Supabase au lieu du client-side filter.

#### Étape 3 — UI pagination
Adapter `ProductsPagination` pour recevoir `totalCount` du serveur et piloter `page` via URL params ou state.

#### Étape 4 — Prefetch page suivante
```typescript
queryClient.prefetchQuery({
  queryKey: ['products', storeId, page + 1, pageSize],
  queryFn: ...
});
```

**Risques :**
- Les filtres client-side actuels (recherche texte, catégorie) devront migrer côté serveur
- Le tri multi-colonnes peut nécessiter des index Supabase
- Les stats (`useProductStats`) devront aussi tenir compte des filtres

---

## Sprint 4 — Refactoring Architectural (5-7 jours)

### 4.1 Splitter les God Hooks (H12)
**Effort:** 3-5 jours | **Impact:** MEDIUM (maintenabilité)

#### useProductSave.ts (603 lignes → 3 hooks)

| Nouveau hook | Responsabilité | Lignes estimées |
|--------------|---------------|-----------------|
| `useProductSave` | Save operation + optimistic locking | ~200 |
| `useProductDraftMerge` | Merge working_content + draft | ~100 |
| `useProductSeoCompute` | Calcul SEO score après save | ~80 |

Le dirty field computation est déjà extrait dans `computeDirtyFields.ts`.

#### useArticleEditorForm.ts (463 lignes → 2-3 hooks)

| Nouveau hook | Responsabilité | Lignes estimées |
|--------------|---------------|-----------------|
| `useArticleEditorForm` | Form binding + validation | ~200 |
| `useArticleAutoSave` | Debounced auto-save logic | ~100 |
| `useArticleVersioning` | Version creation + history | ~100 |

---

### 4.2 ProductEditorProvider (H16)
**Effort:** 1-2 jours | **Impact:** MEDIUM (prop drilling)

**Constat :** `ProductEditorContainer.tsx` (524 lignes) initialise 12+ hooks et drill les props vers les enfants.

**Solution :**
```typescript
// features/products/context/ProductEditorProvider.tsx
const ProductEditorContext = createContext<{
  product: Product;
  form: UseFormReturn<ProductFormValues>;
  actions: { save, discard, push };
  status: { isDirty, isSaving, lastSaved };
}>(...);
```

Les composants enfants (`PricingCard`, `ProductMediaTab`, `ProductVariationsTab`) consomment via `useProductEditor()` au lieu de props.

---

### 4.3 Stale Closures (H13)
**Effort:** 1 jour | **Impact:** LOW (edge case bugs)

**Constat :** 3 callbacks avec closures potentiellement stale.

**Solution :** Remplacer par `useRef` pour les valeurs qui changent :
```typescript
const actionsRef = useRef(actions);
actionsRef.current = actions;

const handleKeyboardSave = useCallback(() => {
  if (!actionsRef.current.isSaving) {
    actionsRef.current.save();
  }
}, []); // Stable reference
```

---

## Sprint 5 — Optimisations Bundle & Perf (2 jours)

### 5.1 Optimistic locking articles
**Effort:** 0.5 jour

**Constat :** `useProductSave` a déjà l'optimistic locking (via `updated_at` check). **Manque sur les articles.**

**Action :** Répliquer le pattern dans `useArticleEditorForm.ts`.

---

### 5.2 VariationGrid keys (MEDIUM)
**Effort:** 0.5 jour

**Action :** Remplacer `key={idx}` par `key={name}` dans `VariationGrid.tsx`.

---

### 5.3 Inline callbacks (MEDIUM)
**Effort:** 0.5 jour

**Action :** Ajouter `useCallback` dans `FilterPills.tsx` et composants similaires.

---

## Calendrier recommandé

```
Semaine 1 ──────────────────────────────────
│ Sprint 1: Quick Wins (2-3j)
│  ├─ 1.1 Prompt injection patterns     [0.5j]
│  ├─ 1.2 Landing lazy loading          [0.5j]
│  ├─ 1.3 Console.log purge             [1j]
│  └─ 1.4 staleTime standardisation     [0.5j]
│
│ Sprint 2: TypeScript (début)
│  └─ 2.1 Types JSONB (interfaces)      [1j]

Semaine 2 ──────────────────────────────────
│ Sprint 2: TypeScript (suite)
│  ├─ 2.1 Remplacer as any              [2j]
│  └─ 2.2 Catch blocks                  [1j]
│
│ Sprint 3: Pagination (début)
│  └─ 3.1 Hook serveur + filtres        [2j]

Semaine 3 ──────────────────────────────────
│ Sprint 3: Pagination (fin)
│  └─ 3.1 UI + prefetch                 [1-2j]
│
│ Sprint 4: Refactoring (début)
│  ├─ 4.1 Split useProductSave          [2j]
│  └─ 4.2 ProductEditorProvider         [1j]

Semaine 4 ──────────────────────────────────
│ Sprint 4: Refactoring (fin)
│  ├─ 4.1 Split useArticleEditorForm    [2j]
│  └─ 4.3 Stale closures               [1j]
│
│ Sprint 5: Perf
│  ├─ 5.1 Optimistic locking articles   [0.5j]
│  ├─ 5.2 VariationGrid keys            [0.5j]
│  └─ 5.3 Inline callbacks              [0.5j]
```

**Total: ~18 jours de dev sur 4 semaines**

---

## Métriques de succès

| Métrique | Avant | Cible | Vérification |
|----------|-------|-------|-------------|
| `as any` | 35 | 0 | `grep "as any" src/ \| wc -l` |
| console.log (client) | ~76 | 0 | ESLint no-console rule |
| Bundle landing | ~250KB | <180KB | `next build` analyze |
| Pagination | 200 max | illimité | Test avec 500+ produits |
| Catch vides | 12 | 0 | Code review |
| God hooks >300L | 4 | 0 | `wc -l` per hook |
| Prompt patterns | 9 | 20+ | Count in prompt-safety.ts |
| staleTime values | ~6 différents | 6 standardisés | grep staleTime |
