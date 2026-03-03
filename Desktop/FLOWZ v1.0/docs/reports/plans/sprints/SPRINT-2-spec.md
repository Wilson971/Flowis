# SPRINT 2 — TypeScript & Infrastructure
**Durée:** 4 jours | **Phase:** 1 — Fondations | **Prérequis:** Sprint 1

---

## Objectif

Types solides pour tout le codebase + pagination serveur validée. Élimine tous les `as any` et pose les fondations TypeScript pour les sprints suivants.

---

## Feature 6 — Interfaces JSONB Typées

### État actuel

**DÉJÀ FAIT** : Les interfaces `ProductMetadata`, `ContentData`, `ProductContentBuffer` existent déjà dans :
- `types/product.ts` (388 lignes) — `ProductMetadata` avec 70+ champs typés
- `types/productContent.ts` (166 lignes) — `ContentData`, `ProductContentBuffer`, `ContentStatus`
- `types/product-content.ts` (87 lignes) — Re-exports + `ArticleCustomFields`, `BlogArticleSyncFields`

### Direction de développement

**Aucune action requise.** Les interfaces JSONB sont complètes et utilisées par les hooks existants.

### Critère de sortie
- [x] `ProductMetadata` typé avec 70+ champs
- [x] `ContentData` avec 40+ champs
- [x] `ProductContentBuffer` triple-buffer typé

---

## Feature 7 — Supprimer les `as any` (40 → 0)

### État actuel

**40 occurrences** réparties en 8 groupes :

| Groupe | Fichiers | Count | Cause racine |
|--------|----------|-------|--------------|
| Profile JSONB | `ProfilePreferencesSection`, `ProfileAISection`, `ProfileGeneralSection` | 6 | `profile?.preferences` non typé |
| Product form/editor | `ProductSeoTab`, `useProductForm`, `ProductEditorHeader`, `ProductRowActions` | 7 | `.handle`, `.permalink`, form resolver |
| Blog/AI | `FlowriterAssistant`, `useBlogAI`, `useAIEditorActions`, `useArticleEditorForm` | 6 | Action types, form resolver |
| Settings | `WorkspacePlansSection`, `StoreGeneralSection` | 3 | Plan usage JSONB, store metadata |
| Photo Studio | `PresetGrid`, `PhotoStudioTable`, `PhotoStudioCard` | 3 | `.studio_jobs` relation non typé |
| API routes | `gsc/sitemap`, `gsc/indexation`, `gsc/sync` | 3 | Site with nested connections |
| Tests | `flowriter.test.ts` | 3 | Partial test config objects |
| Divers | `ErrorBoundary`, `button-magic`, `EditorWithAI`, `useArticleEditProvider`, `useProductVersions`, `SyncHistoryCard`, `transformFormToSaveData`, `gsc/auth-helpers` | 9 | Cas individuels |

### Direction de développement

**Traiter par groupe, du plus impactant au moins impactant.**

#### Groupe 1 — Profile JSONB (6 casts)

```typescript
// types/profile.ts (à enrichir)
interface ProfilePreferences {
  notifications?: {
    email?: boolean;
    push?: boolean;
  };
  appearance?: {
    brand_theme?: string;
    radius?: string;
    theme?: 'light' | 'dark' | 'system';
  };
  ai_defaults?: {
    tone?: string;
    style?: string;
    language?: string;
    model?: string;
  };
}

interface UserProfile {
  // ... existing fields
  preferences?: ProfilePreferences;
  language?: 'fr' | 'en' | 'es' | 'de';
}
```

**Fichiers :**
| Fichier | Ligne | Remplacement |
|---------|-------|-------------|
| `ProfilePreferencesSection.tsx` | 21 | `(profile?.preferences as ProfilePreferences)?.notifications?.appearance` → type guard |
| `ProfilePreferencesSection.tsx` | 34 | `setBrandTheme(newBrandTheme as any)` → typer la state |
| `ProfileAISection.tsx` | 38, 50 | `(profile?.preferences as ProfilePreferences)?.ai_defaults` |
| `ProfileGeneralSection.tsx` | 56, 72 | `(profile.language as 'fr' \| 'en')` → utiliser `UserProfile['language']` |

#### Groupe 2 — Product form/editor (7 casts)

```typescript
// Ajouter `handle` et `permalink` au type Product
interface Product {
  // ... existing
  handle?: string;      // Shopify handle
}
```

**Fichiers :**
| Fichier | Ligne | Remplacement |
|---------|-------|-------------|
| `ProductRowActions.tsx` | 63 | `(product as any).handle` → `product.handle` (après ajout au type) |
| `ProductEditorHeader.tsx` | 80 | `(product as any).handle` → `product.handle` |
| `useProductForm.ts` | 46 | `images as any[]` → `images as ImageItem[]` |
| `useProductForm.ts` | 78 | `(product.metadata as any)?.permalink` → `product.metadata?.permalink` (déjà dans ProductMetadata) |
| `useProductForm.ts` | 176 | `zodResolver(...) as any` → typer le schema correctement |
| `ProductSeoTab.tsx` | 122, 220 | `useWatch({ name: "permalink" as any })` → ajouter `permalink` au form schema |
| `transformFormToSaveData.ts` | 91-92 | `(cat as any)?.id` → `(cat as ProductCategory)?.id` |

#### Groupe 3 — Blog/AI (6 casts)

```typescript
// types/blog-ai.ts — Typer les actions AI
type AIBlockType = 'expand' | 'summarize' | 'rephrase' | 'translate' | 'tone' | 'continue';
type AIEditorAction = 'rewrite' | 'expand' | 'shorten' | 'improve' | 'translate';
```

**Fichiers :**
| Fichier | Ligne | Remplacement |
|---------|-------|-------------|
| `FlowriterAssistant.tsx` | 156 | `phase as any` → typer FlowriterPhase union |
| `useBlogAI.ts` | 301 | `blockType as any` → typer AIBlockType |
| `useAIEditorActions.ts` | 106, 178 | `action as any` → typer AIEditorAction |
| `useArticleEditorForm.ts` | 155 | `zodResolver(schema) as any` → typer le resolver |

#### Groupe 4 — Divers (reste)

Traiter au cas par cas : `ErrorBoundary` (Sentry global), `button-magic` (link props spread), API routes (site type), tests (Partial<Config>).

### Critère de sortie
- [ ] `grep -rn "as any" src/ --include="*.ts" --include="*.tsx" | wc -l` → 0
- [ ] `npm run build` passe sans erreurs
- [ ] Tests existants passent toujours

---

## Feature 8 — ArticleWithMetadata Interface

### État actuel

**DÉJÀ FAIT** : `types/product-content.ts` contient déjà `BlogArticleSyncFields`, `ArticleCustomFields`, `ArticleSeoData`, `ArticleTaxonomies`, `ArticleAuthor`.

### Direction de développement

Vérifier que `useArticleEditorForm.ts` utilise ces types au lieu de `as any`. Si le resolver cast persiste (ligne 155), résoudre avec un type guard sur le schéma Zod.

### Critère de sortie
- [ ] 0 `as any` dans `useArticleEditorForm.ts`

---

## Feature 9-10 — Pagination Serveur

### État actuel

**DÉJÀ FAIT** : La pagination serveur est implémentée :
- `useProducts()` utilise `count: 'exact'` + `.range(from, to)` avec offset/limit
- `applyServerFilters()` gère 11 types de filtres côté Supabase
- `ProductsPagination.tsx` offre navigation first/prev/next/last + sélecteur page size (10/20/30/40/50/100)
- `ProductsListContent.tsx` intègre `useTableFilters()` (URL state) + debounced search

### Direction de développement

**Aucune action requise.** La pagination serveur est complète et fonctionnelle.

**Améliorations optionnelles (non-bloquantes) :**
1. Prefetch page suivante via `queryClient.prefetchQuery()`
2. Ajouter curseur-based pagination pour les gros catalogues (>10K produits)

### Critère de sortie
- [x] Pagination serveur avec `count: 'exact'` + `.range()`
- [x] 11 filtres serveur fonctionnels
- [x] UI pagination avec page size sélecteur

---

## Récapitulatif Sprint 2

| # | Feature | Effort réel | Status actuel |
|---|---------|-------------|---------------|
| 6 | Interfaces JSONB typées | 0j | **FAIT** |
| 7 | Supprimer `as any` (40) | 3j | À faire — 40 occurrences en 8 groupes |
| 8 | ArticleWithMetadata | 0.25j | Quasi-fait — 1 resolver cast |
| 9 | Pagination serveur — hook | 0j | **FAIT** |
| 10 | Pagination serveur — UI | 0j | **FAIT** |

**Effort réel ajusté : ~3.25 jours** (principalement Feature 7)
