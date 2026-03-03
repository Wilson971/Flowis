# SPRINT 7 — Blog & Catégories
**Durée:** 5 jours | **Phase:** 4 — Polish & Scale | **Prérequis:** Sprint 3, Sprint 4

---

## Objectif

Module blog complet avec sync bidirectionnelle, auto-save, versioning, et gestion des catégories.

---

## Feature 38 — Blog Hooks Complets

### État actuel

**DÉJÀ FAIT** : 18 hooks dans `hooks/blog/` :

| Hook | Lignes | Status |
|------|--------|--------|
| `useArticleEditorForm.ts` | 239 | Complet |
| `useArticleSync.ts` | 594 | Complet (flowz, woocommerce, wordpress) |
| `useBlogArticles.ts` | 341 | Complet (list, stats, bulk ops) |
| `useArticleSchedules.ts` | 402 | Complet (publish/republish/unpublish/series) |
| `useArticleSave.ts` | 250 | Complet (draft/publish + auto-sync) |
| `useArticleAutoSave.ts` | 136 | Complet (debounced + version) |
| `useBlogArticle.ts` | 150+ | Complet (single CRUD) |
| `useAIEditorActions.ts` | 16K+ | Complet (toutes actions AI) |
| `useBlogAI.ts` | 10K+ | Complet (generate titles/outline/article/meta) |
| `useFlowriterState.ts` | 19K+ | Complet (wizard state machine) |
| `useFlowriterSync.ts` | 15K+ | Complet (backend sync auto-drafts) |
| `useArticleVersions.ts` | 12K+ | Complet (version history) |
| `useArticleTemplates.ts` | 14K+ | Complet (template CRUD) |
| `useWordPressSync.ts` | 14K+ | Complet (WP sync logs) |
| `useAIRateLimit.ts` | 4.6K+ | Complet (token tracking) |
| `useLivePreview.tsx` | 6.4K+ | Complet (preview rendering) |
| `useBlogPosts.ts` | 3.8K+ | Complet (legacy compat) |
| `index.ts` | — | Central export hub |

### Direction de développement

**Tous les hooks sont implémentés.** Aucune action requise pour cette feature.

### Critère de sortie
- [x] 18 hooks blog complets et exportés

---

## Feature 39 — Article Auto-Save

### État actuel

**DÉJÀ FAIT** : `useArticleAutoSave.ts` (136 lignes) :
- Debounced auto-save avec configurable interval
- Crée une version avant save (via `useArticleVersions`)
- Intégré dans `useArticleEditorForm` via composition

**Catch blocks vides** identifiés (Sprint 1, Feature 5) : lignes 90, 96

### Direction de développement

**Le hook est complet. Actions restantes :**
1. Fixer les catch blocks vides (lignes 90, 96)
2. Ajouter un indicateur visuel "Sauvegardé il y a X secondes" dans l'éditeur

```typescript
// Indicateur dans BlogEditor.tsx
// Affiche : "Sauvegarde automatique il y a 30s" (gris, discret)
// Pulse animation quand save en cours
// Toast si erreur de save
```

### Critère de sortie
- [x] Auto-save debounced fonctionne
- [x] Version créée avant save
- [ ] Catch blocks fixés
- [ ] Indicateur visuel last saved

---

## Feature 40 — Split useArticleEditorForm

### État actuel

`useArticleEditorForm.ts` fait **seulement 239 lignes** — c'est un hook bien structuré qui compose :
- `useArticleAutoSave()` (composition, pas duplication)
- `useArticleSave()` (composition)
- Form initialization avec `getDefaultValues()`
- Helper `generateSlugFromTitle()`

### Direction de développement

**Pas de split nécessaire.** Le hook fait 239 lignes (bien sous le seuil de 300L). Il utilise déjà le pattern composition (auto-save et save sont des hooks séparés composés).

**Action :** Résoudre le `as any` sur le zodResolver (ligne 155) — traité en Sprint 2, Feature 7.

### Critère de sortie
- [x] Hook < 300 lignes
- [x] Composition pattern (auto-save + save séparés)
- [ ] 0 `as any` (Sprint 2)

---

## Feature 41 — Blog Sync WooCommerce/Shopify

### État actuel

**DÉJÀ FAIT** :
- `useArticleSync.ts` (594 lignes) supporte 3 plateformes : `flowz`, `woocommerce`, `wordpress`
- Mutations : `publishMutation`, `scheduleMutation`, `cancelScheduleMutation`, `retrySyncMutation`, `unpublishMutation`
- `useWordPressSync.ts` (14K+ lignes) — Sync WordPress complète avec retry (3 attempts)
- Table `article_sync_logs` : article_id, platform, status, external_id, external_url
- API endpoint : `/api/sync/woocommerce/article`

### Direction de développement

**Le sync WooCommerce est complet. Pour Shopify :**

```typescript
// Ajouter support Shopify dans useArticleSync.ts
// 1. Détecter platform dans connectedPlatforms
// 2. Appeler /api/sync/shopify/article (API route à créer)
// 3. Shopify GraphQL mutation : blogArticleCreate / blogArticleUpdate
// 4. Stocker external_id dans article_sync_logs

// app/api/sync/shopify/article/route.ts — À CRÉER
// POST { article_id, store_id, action: 'create' | 'update' | 'delete' }
// → Shopify Admin API GraphQL
```

### Fichiers à créer

| Fichier | LOC | Priorité |
|---------|-----|----------|
| `app/api/sync/shopify/article/route.ts` | ~200 | MOYENNE |

### Critère de sortie
- [x] WooCommerce article sync fonctionne
- [ ] (Optionnel) Shopify article sync

---

## Feature 42 — Catégories Module

### État actuel

**Blog :** Catégorie unique par article (`category?: string`), pas de multi-catégories, pas de CRUD dédié.

**Products :** `useProductCategories.ts` (300+ lignes) complet avec :
- `useCategories(storeId)` — Liste toutes
- `useCategoryTree(storeId)` — Arbre hiérarchique
- `useUpdateProductCategories()` — Mutation
- `useSyncCategories()` — Sync edge function
- Types : `Category`, `CategoryTree`

### Direction de développement

**1. Page catégories (`/app/settings/categories`)**

```typescript
// app/app/settings/categories/page.tsx
// Layout : TreeView gauche + détail droite
// Actions : Sync depuis WooCommerce, voir product_count, filtrer

// Composants :
// - CategoryTreeView (Sprint 4 Feature 20)
// - CategoryDetailPanel (nom, slug, description, image, product_count)
// - CategorySyncButton (appelle useSyncCategories)
```

**2. Multi-catégories pour articles**

```typescript
// Migration : ALTER TABLE blog_articles
// ADD COLUMN categories TEXT[] DEFAULT '{}';
// (Garder category pour backward compat, ajouter categories array)

// Modifier useArticleEditorForm pour supporter categories[]
// Modifier ArticleForm schema avec z.array(z.string())
// UI : Multi-select chips dans l'éditeur
```

### Fichiers à créer

| Fichier | LOC | Priorité |
|---------|-----|----------|
| `app/app/settings/categories/page.tsx` | ~60 | HAUTE |
| `components/categories/CategoryDetailPanel.tsx` | ~120 | HAUTE |
| `components/categories/CategorySyncButton.tsx` | ~40 | MOYENNE |

### Critère de sortie
- [x] Hooks categories produits complets
- [ ] Page catégories avec TreeView
- [ ] (Optionnel) Multi-catégories articles

---

## Feature 43 — Catégories Sync

### État actuel

**DÉJÀ FAIT** : `useSyncCategories()` existe et appelle l'edge function `sync-categories`.

### Direction de développement

Vérifier que l'edge function `sync-categories` est déployée. Si non, créer une version simple :

```typescript
// supabase/functions/sync-categories/index.ts
// 1. Fetch WooCommerce categories via /wp-json/wc/v3/products/categories?per_page=100
// 2. Upsert dans categories table (external_id, name, slug, parent_external_id)
// 3. Résoudre parent_id à partir de parent_external_id
// 4. Return count synced
```

### Critère de sortie
- [x] Hook sync catégories existe
- [ ] Edge function sync-categories déployée et testée

---

## Feature 44 — Scheduled Publications

### État actuel

**DÉJÀ FAIT** : `useArticleSchedules.ts` (402 lignes) :
- Types : `publish`, `republish`, `unpublish`, `series`
- Status : `pending`, `processing`, `completed`, `failed`, `cancelled`
- Hooks : `useArticleSchedules`, `usePendingSchedules`, `useNextScheduledAction`, `useCreateArticleSchedule`, `useUpdateArticleSchedule`, `useCancelArticleSchedule`, `useDeleteArticleSchedule`, `useScheduleManager`

### Direction de développement

**Le hook est complet.** Besoin d'un composant calendar pour la programmation :

```typescript
// components/blog/ScheduleCalendarPicker.tsx
interface ScheduleCalendarPickerProps {
  articleId: string;
  currentSchedule?: ArticleSchedule;
  onSchedule: (datetime: Date, type: ScheduleType) => void;
}

// Rendu : Calendrier + time picker
// Options : Publier à date, Republier, Dépublier à date
// Validation : date future uniquement
// Timezone : affichage timezone utilisateur
```

### Critère de sortie
- [x] Hooks scheduling complets (CRUD)
- [ ] Calendar picker UI pour la programmation

---

## Récapitulatif Sprint 7

| # | Feature | Effort réel | Status actuel |
|---|---------|-------------|---------------|
| 38 | Blog hooks complets | 0j | **FAIT** (18 hooks) |
| 39 | Article auto-save | 0.25j | **FAIT** — fix catch blocks |
| 40 | Split useArticleEditorForm | 0j | **FAIT** (239L, déjà composé) |
| 41 | Blog sync WooCommerce/Shopify | 0.5j | WC **FAIT**, Shopify optionnel |
| 42 | Catégories module | 2j | PARTIEL — page + UI à créer |
| 43 | Catégories sync | 0.5j | PARTIEL — vérifier edge function |
| 44 | Scheduled publications | 0.5j | PARTIEL — calendar picker à créer |

**Effort réel ajusté : ~3.75 jours**
