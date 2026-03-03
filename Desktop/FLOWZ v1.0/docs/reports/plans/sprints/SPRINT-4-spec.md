# SPRINT 4 — Products Avancés
**Durée:** 5 jours | **Phase:** 2 — Core Features | **Prérequis:** Sprint 2, Sprint 3

---

## Objectif

Éditeur produit complet avec hooks split, context provider, draft management UI, et editorial locks.

---

## Feature 18 — Split God Hooks

### État actuel

`useProductSave.ts` fait **481 lignes** avec 5 responsabilités distinctes :
1. Error classes (StaleDataError, DuplicateSkuError) — lignes 1-42
2. Payload types & Zod schema — lignes 48-182
3. SKU uniqueness check — lignes 192-226
4. Save mutation (form → DB) — lignes 240-350
5. onSuccess/onError handlers — lignes 350-481

### Direction de développement

**Extraire 2 modules autonomes. Garder `useProductSave` comme orchestrateur.**

#### 1. Extraire `lib/products/product-save-schema.ts`

```typescript
// Déplacer depuis useProductSave.ts lignes 48-226 :
export interface ProductSavePayload { ... }  // 40+ fields
export const SavePayloadSchema = z.object({ ... });
export class StaleDataError extends Error { ... }
export class DuplicateSkuError extends Error { ... }
export async function checkSkuUniqueness(sku: string, productId: string, storeId: string): Promise<void>
```

#### 2. Extraire `hooks/products/useAutoSyncTrigger.ts`

```typescript
// Déplacer la logique auto-sync post-save
export function useAutoSyncTrigger() {
  const { mutateAsync: syncProduct } = useSyncProduct();

  return useCallback(async (productId: string, dirtyFields: string[]) => {
    if (dirtyFields.length > 0) {
      await syncProduct({ productIds: [productId] });
    }
  }, [syncProduct]);
}
```

#### 3. `useProductSave` restant (~200 lignes)

```typescript
import { SavePayloadSchema, checkSkuUniqueness, StaleDataError } from '@/lib/products/product-save-schema';
import { useAutoSyncTrigger } from './useAutoSyncTrigger';

export function useProductSave(productId: string) {
  const triggerAutoSync = useAutoSyncTrigger();

  return useMutation({
    mutationFn: async (payload) => {
      // 1. Validate
      // 2. Check SKU
      // 3. Compute dirty fields
      // 4. Update DB
    },
    onSuccess: async (data) => {
      await triggerAutoSync(productId, data.dirtyFields);
      // Invalidate queries
    },
  });
}
```

### Fichiers à modifier/créer

| Fichier | Action | LOC |
|---------|--------|-----|
| `lib/products/product-save-schema.ts` | CRÉER (extraire de useProductSave) | ~180 |
| `hooks/products/useAutoSyncTrigger.ts` | CRÉER (extraire de useProductSave) | ~50 |
| `hooks/products/useProductSave.ts` | MODIFIER (simplifier) | ~200 |

### Critère de sortie
- [ ] `useProductSave.ts` < 250 lignes
- [ ] Schema + validation dans fichier séparé
- [ ] Auto-sync dans hook séparé
- [ ] Tests existants passent toujours

---

## Feature 19 — ProductEditorProvider (Context)

### État actuel

`ProductEditorContainer.tsx` (456 lignes) initialise **13 hooks** et drill 20+ props :

```
Hooks initialisés : useSelectedStore, useProduct, useProductForm, useWatch,
useCategories, useProductActions, usePushSingleProduct, useConflictDetection,
useDirtyVariationsCount, useSeoAnalysis, useProductContent, useProductVersionManager,
useDraftActions
```

**3 refs** coordonnées manuellement : `isRestoringRef`, `variationSaveRef`, `userModifiedFieldsRef`

### Direction de développement

**Créer un ProductEditorProvider qui centralise les hooks et expose via context.**

```typescript
// features/products/context/ProductEditorContext.tsx

interface ProductEditorContextValue {
  // Data
  product: Product;
  contentBuffer: ProductContentBuffer;
  categories: Category[];
  conflictData: ConflictData | null;

  // Form
  form: UseFormReturn<ProductFormValues>;

  // State
  isDirty: boolean;
  isSaving: boolean;
  hasDraft: boolean;
  dirtyFieldsContent: string[];

  // Actions
  save: (payload: ProductSavePayload) => Promise<void>;
  push: () => Promise<void>;
  discard: () => void;
  acceptDraft: (field: string) => Promise<void>;
  rejectDraft: (field: string) => Promise<void>;

  // Refs (stable)
  variationSaveRef: MutableRefObject<(() => Promise<void>) | null>;
  userModifiedFieldsRef: MutableRefObject<Set<string>>;
}

const ProductEditorContext = createContext<ProductEditorContextValue | null>(null);

export function useProductEditor() {
  const ctx = useContext(ProductEditorContext);
  if (!ctx) throw new Error('useProductEditor must be used within ProductEditorProvider');
  return ctx;
}
```

**Migration progressive :**
1. Créer le Provider avec les hooks existants
2. Wrapper `ProductEditorContainer` avec le Provider
3. Progressivement remplacer les props par `useProductEditor()` dans les children
4. Ne PAS tout migrer d'un coup — migrer composant par composant

### Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `features/products/context/ProductEditorContext.tsx` | CRÉER |
| `features/products/components/ProductEditorContainer.tsx` | MODIFIER — wrapper avec Provider |
| `features/products/components/edit/ProductGeneralTab.tsx` | MODIFIER — utiliser useProductEditor() |
| `features/products/components/edit/ProductSeoTab.tsx` | MODIFIER — utiliser useProductEditor() |

### Critère de sortie
- [ ] Provider créé et fonctionnel
- [ ] Au moins 3 composants enfants utilisent `useProductEditor()`
- [ ] 0 régression fonctionnelle

---

## Feature 20 — Product Categories Management

### État actuel

**DÉJÀ FAIT** : `useProductCategories.ts` (300+ lignes) avec :
- `useCategories(storeId)` — Fetch toutes les catégories
- `useCategoryTree(storeId)` — Arbre hiérarchique avec `buildCategoryTree()` + `flattenTree()`
- `useCategory(categoryId)` — Single
- `useCategoryStats(storeId)` — Stats (count, product_count, empty)
- `useProductCategories(productId)` — Catégories du produit
- `useUpdateProductCategories()` — Mutation
- `useSyncCategories()` — Sync edge function

**Type `Category`** : id, store_id, external_id, name, slug, parent_id, description, image_url, product_count, menu_order, platform

**Type `CategoryTree`** : extends Category + children[], level, path

### Direction de développement

**Les hooks sont complets. Créer les composants UI manquants :**

```
components/categories/
├── CategoryTreeView.tsx          ← CRÉER (rendu arbre expandable)
├── CategoryPicker.tsx            ← CRÉER (picker pour product editor)
├── CategoryBadges.tsx            ← CRÉER (badges dans product list)
└── CategoryStatsCard.tsx         ← CRÉER (stats pour dashboard)
```

#### CategoryTreeView.tsx — Spec

```typescript
interface CategoryTreeViewProps {
  storeId: string;
  selectedIds?: string[];
  onSelect?: (categoryId: string) => void;
  mode?: 'view' | 'select' | 'multi-select';
}

// Rendu :
// - Arbre expandable/collapsible (indent par level)
// - Badge product_count pour chaque catégorie
// - Checkbox en mode multi-select
// - Highlight de la sélection active
// - Skeleton loading state
```

### Critère de sortie
- [x] Hooks categories CRUD complets
- [ ] CategoryTreeView avec expand/collapse
- [ ] CategoryPicker intégré dans ProductEditor

---

## Feature 21 — Batch Job Monitoring

### État actuel

**DÉJÀ FAIT** :
- `useBatchProgress.ts` — Progress tracking avec `staleTime: STALE_TIMES.POLLING`
- `useBatchGeneration.ts` — SSE streaming avec progress events
- `useBatchJobItems()` dans `useProducts.ts` — Items par job avec refetchInterval 2s

### Direction de développement

**Les hooks existent. Enrichir le monitoring :**

1. **Recovery hook** — `useJobRecovery` pour reprendre un job interrompu
2. **Toast-based status** — Notification automatique quand batch terminé
3. **Dead letter inspection** — UI pour voir les items en échec

```typescript
// hooks/products/useJobRecovery.ts
export function useJobRecovery(batchJobId: string) {
  return useMutation({
    mutationFn: async () => {
      // 1. Fetch failed items
      // 2. Reset status to 'pending'
      // 3. Trigger re-processing
    }
  });
}
```

### Critère de sortie
- [x] Batch progress fonctionne avec polling
- [ ] Recovery des items failed
- [ ] Toast notification batch complete

---

## Feature 22 — Draft Management UI

### État actuel

**PARTIELLEMENT FAIT** :
- `useDraftActions.ts` (232 lignes) — `useAcceptDraft()`, `useRejectDraft()`, `useRegenerateDraft()`
- `ProductEditorContainer.tsx` calcule `hasDraft`, `remainingProposals`
- `getRemainingProposals()` compare draft vs working_content

### Direction de développement

**Créer les composants de review UI :**

#### DraftReviewBanner.tsx

```typescript
// Bannière fixe en haut de l'éditeur quand hasDraft=true
interface DraftReviewBannerProps {
  remainingCount: number;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

// Affiche : "X propositions IA en attente" + boutons Accept All / Reject All
// Animation : slide-down avec motionTokens.variants.slideUp
```

#### DraftFieldComparison.tsx

```typescript
// Comparaison côte à côte d'un champ
interface DraftFieldComparisonProps {
  fieldName: string;
  currentValue: string;
  draftValue: string;
  onAccept: () => void;
  onReject: () => void;
}

// Layout : 2 colonnes (Current | Proposed)
// Diff highlighting : texte ajouté en vert, supprimé en rouge
// Boutons : Accept (check) / Reject (x) / Edit before accept
```

### Fichiers à créer

| Fichier | LOC | Priorité |
|---------|-----|----------|
| `features/products/components/edit/DraftReviewBanner.tsx` | ~80 | HAUTE |
| `features/products/components/edit/DraftFieldComparison.tsx` | ~120 | HAUTE |
| `features/products/components/edit/DraftReviewPanel.tsx` | ~150 | MOYENNE |

### Critère de sortie
- [x] Accept/Reject par champ fonctionne
- [ ] Banner visible quand draft disponible
- [ ] Comparaison côte à côte
- [ ] Accept All / Reject All

---

## Feature 23 — Editorial Lock Manager

### État actuel

**PARTIELLEMENT FAIT** :
- `editorial_lock?: Record<string, boolean>` dans `Product` type
- `respect_editorial_lock: true` dans `DEFAULT_GENERATION_SETTINGS` de `useDraftActions.ts`
- `userModifiedFieldsRef` dans `ProductEditorContainer.tsx` track les champs modifiés manuellement

### Direction de développement

**Créer un composant visuel de lock par champ :**

```typescript
// features/products/components/edit/FieldLockToggle.tsx
interface FieldLockToggleProps {
  fieldName: string;
  isLocked: boolean;
  onToggle: (fieldName: string, locked: boolean) => void;
}

// Icône cadenas (Lock/Unlock) à côté de chaque champ éditable
// Tooltip : "Verrouillé : l'IA ne modifiera pas ce champ"
// Persiste en DB via editorial_lock JSONB
```

### Critère de sortie
- [x] editorial_lock respecté par la batch generation
- [ ] Toggle visuel dans l'éditeur produit
- [ ] Persistance DB du lock state

---

## Feature 24 — Revert to Original

### État actuel

**NON IMPLÉMENTÉ** : Pas de hook `useRevertToOriginal` trouvé.

### Direction de développement

```typescript
// hooks/products/useRevertToOriginal.ts
export function useRevertToOriginal(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fields?: string[]) => {
      const supabase = createClient();

      if (fields) {
        // Revert specific fields : copier store_snapshot_content[field] → working_content[field]
        // Remove fields from dirty_fields_content
      } else {
        // Full revert : working_content = store_snapshot_content, dirty_fields_content = []
        await supabase
          .from('products')
          .update({
            working_content: null, // Reset to null = use metadata fallback
            dirty_fields_content: [],
            draft_generated_content: null,
            working_content_updated_at: new Date().toISOString(),
          })
          .eq('id', productId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-content', productId] });
      toast.success('Contenu restauré à l\'original');
    },
  });
}
```

**Confirmation dialog requis** : `ConfirmRevertDialog.tsx` avec warning que les modifications seront perdues.

### Fichiers à créer

| Fichier | LOC | Priorité |
|---------|-----|----------|
| `hooks/products/useRevertToOriginal.ts` | ~80 | HAUTE |
| `features/products/components/edit/ConfirmRevertDialog.tsx` | ~60 | HAUTE |

### Critère de sortie
- [ ] Revert complet (tous les champs) fonctionne
- [ ] Revert partiel (champs spécifiques) fonctionne
- [ ] Confirmation dialog avant revert
- [ ] working_content = null après full revert

---

## Récapitulatif Sprint 4

| # | Feature | Effort réel | Status actuel |
|---|---------|-------------|---------------|
| 18 | Split god hooks | 1.5j | À faire — extraire schema + auto-sync |
| 19 | ProductEditorProvider | 1.5j | À faire — context + migration progressive |
| 20 | Product categories management | 0.5j | PARTIEL — hooks OK, UI à créer |
| 21 | Batch job monitoring | 0.5j | PARTIEL — recovery hook à créer |
| 22 | Draft management UI | 1j | PARTIEL — banner + comparison à créer |
| 23 | Editorial lock manager | 0.25j | PARTIEL — toggle UI à créer |
| 24 | Revert to original | 0.5j | À faire — hook + dialog |

**Effort réel ajusté : ~5.75 jours**
