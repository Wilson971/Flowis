# Audit Code Mort - FLOWZ v1.0

**Date:** 2026-02-17
**Branche:** `feature/flowriter-v2`
**Scope:** `my-app/src/` (505 fichiers, 17 837 lignes)
**Auteur:** Claude Code (Opus 4.6)

---

## Sommaire Executif

| Categorie | Items trouves | Lignes estimees | Severite |
|-----------|:------------:|:---------------:|:--------:|
| Composants inutilises | 20 | ~2 500 | CRITICAL |
| Hooks morts | 14+ fonctions | ~1 200 | HIGH |
| Types/Schemas morts | 40+ exports | ~800 | MEDIUM |
| Fichiers/Exports orphelins | 12 | ~600 | MEDIUM |
| Dependencies npm inutilisees | 3-4 | N/A | LOW |
| Code duplique | 8 patterns | ~1 300 | HIGH |
| **TOTAL** | **~100 items** | **~6 400 lignes** | |

**Impact potentiel du nettoyage:** ~6 400 lignes de code mort a supprimer, soit **~36% de la codebase**.

---

## 1. COMPOSANTS INUTILISES (20 fichiers)

### 1.1 Dashboard - Widgets orphelins (10)

| Fichier | Lignes | Statut |
|---------|:------:|:------:|
| `components/dashboard/ActivityFeed.tsx` | ~80 | DEAD |
| `components/dashboard/SyncHealthWidget.tsx` | ~60 | DEAD |
| `components/dashboard/CatalogCoverageCard.tsx` | ~70 | DEAD |
| `components/dashboard/SEOHealthCard.tsx` | ~65 | DEAD |
| `components/dashboard/AnimatedCard.tsx` | ~50 | DEAD |
| `components/dashboard/QuickActionsCard.tsx` | ~55 | DEAD |
| `components/dashboard/BlogContentCard.tsx` | ~60 | DEAD |
| `components/dashboard/TimeSavedCard.tsx` | ~70 | DEAD |
| `components/dashboard/ActivityTimeline.tsx` | ~80 | DEAD |
| `components/dashboard/NorthStarKPICard.tsx` | ~65 | DEAD |

> Ces widgets ont ete proteges mais jamais integres dans `OverviewDashboard.tsx`.

### 1.2 SEO - Composants stub/orphelins (2)

| Fichier | Lignes | Statut |
|---------|:------:|:------:|
| `components/seo/SeoHealthIndicator.tsx` | ~40 | DEAD |
| `components/products/SeoFieldRecommendations.tsx` | ~60 | DEAD |

### 1.3 Photo Studio - Composants non cables (3)

| Fichier | Lignes | Statut |
|---------|:------:|:------:|
| `features/photo-studio/components/SmartTagsEditor.tsx` | ~120 | DEAD (export only) |
| `features/photo-studio/components/PhotoStudioListCompact.tsx` | ~90 | DEAD (export only) |
| `features/photo-studio/components/BatchBrandingPanel.tsx` | ~80 | DEAD (export only) |

### 1.4 Dashboard Feature - Composants orphelins (3)

| Fichier | Lignes | Statut |
|---------|:------:|:------:|
| `features/dashboard/components/DataInspector.tsx` | ~100 | DEAD |
| `features/dashboard/components/ErrorLogPanel.tsx` | ~80 | DEAD |
| `features/dashboard/components/SyncActivityWidget.tsx` | ~70 | DEAD |

### 1.5 Autres (2)

| Fichier | Lignes | Statut |
|---------|:------:|:------:|
| `components/blog/BlogList.tsx` | ~100 | DEAD |
| `components/variations/VariationsGrid.tsx` | ~80 | DEAD |

---

## 2. HOOKS MORTS (14+ fonctions)

### 2.1 Fichiers hook entierement morts (4 fichiers)

| Fichier | Exports | Consommateurs |
|---------|---------|:------------:|
| `hooks/products/useStorageCleanup.tsx` | `useStorageCleanup`, `useStorageStats` | 0 |
| `hooks/blog/useBlogGeneration.ts` | `useBlogGeneration` | 0 |
| `hooks/common/useGscAuth.ts` | `useGscAuth`, `useGscConnection`, `useGscStartAuth`, `useGscRefresh`, `useGscDisconnect` | 0 |
| `features/dashboard/hooks/useDashboardData.ts` | `useDashboardData` | 0 |

### 2.2 Exports de hooks jamais consommes (10 fonctions)

Depuis `hooks/products/index.ts` - re-exportes mais 0 consommateurs :

| Hook | Fichier source | Statut |
|------|---------------|:------:|
| `useProductSeoScore` | `useSeoAnalysis.ts` | DEAD |
| `useBatchSeoAnalysis` | `useSeoAnalysis.ts` | DEAD |
| `useRunSeoAnalysis` | `useSeoAnalysis.ts` | DEAD |
| `useQuickUpdateProduct` | `useProductSave.ts` | DEAD |
| `useProductFullRealtime` | `useProductRealtime.ts` | DEAD |
| `useSeoAnalysisRealtime` | `useProductRealtime.ts` | DEAD |
| `useStudioJobsRealtime` | `useProductRealtime.ts` | DEAD |
| `useBatchJobStatus` | `useBatchProgress.ts` | DEAD |
| `useActiveJobs` | `useBatchProgress.ts` | DEAD |
| `useBatchJobDetails` | `useBatchProgress.ts` | DEAD |

### 2.3 Hooks stub (implementations vides)

| Fichier | Contenu |
|---------|---------|
| `hooks/products/useProductSeoStatus.ts` | Retourne des valeurs hardcodees (8 lignes) |
| `hooks/products/useProductSerpStatus.ts` | Retourne des valeurs hardcodees (8 lignes) |
| `hooks/products/useSerpAnalysis.ts` | Retourne des valeurs hardcodees (6 lignes) |

---

## 3. TYPES & SCHEMAS MORTS (~40 exports)

### 3.1 Fichier entierement mort

| Fichier | Exports morts | Details |
|---------|:------------:|---------|
| `types/imageGeneration.ts` | 4 | `ModularContentType`, `ModularGenerationSettings`, `ModularBatchRequest`, `ModularBatchResponse` |
| `lib/toast.ts` | 7 | `showSuccess`, `showError`, `showWarning`, `showInfo`, `showLoading`, `showAIComplete`, `dismissToast` - **0 imports** |

### 3.2 Types partiellement morts

| Fichier | Exports morts | Exports vivants |
|---------|:------------:|:--------------:|
| `types/woocommerce.ts` | 7 (`DeepDataSEO`, `DeepDataCommercial`, `DeepDataVariation`, `WooCommerceImage`, `WooCommerceDimensions`, `WooCommerceAttribute`, `WooCommerceSEOMetadata`) | 1 (`WooCommerceProductSource`) |
| `types/product.ts` | 8 (`WooProductImage`, `WooProductAttribute`, `WooProductMetaData`, `WooVariantImage`, `WooDimensions`, `WooVariantAttribute`, `WooVariantMetaData`, `WooVariant`) | ~10 (Product, ProductStats, etc.) |
| `types/sync.ts` | 8 (`SyncState`, `SyncStateTransition`, `SyncActionsState`, `SyncResultSchema`, `SyncResponseSchema`, `toUIStatus`, `canPauseJob`, `canResumeJob`, `canCancelJob`) | ~5 |
| `types/store.ts` | 3 (`HeartbeatResult`, `HeartbeatResponse`, `HeartbeatLog`) | ~5 |
| `types/productContent.ts` | 3 (`FormImageItem`, `ProductRevision`, `ContentStatus`) | ~8 |
| `types/dashboard.ts` | 10 (`ConnectionStatus`, `ConnectionHealth`, `UseConnectionHealthReturn`, `formatTimeSaved`, `formatMoneySaved`, `calculateMoneySaved`, `formatRelativeTime`, `calculateTimeSaved`, `TIME_WEIGHTS`, `DEFAULT_HOURLY_RATE`) | ~3 |
| `types/descriptionStructure.ts` | 5 (`AnchorStyle`, `LinkingOptions`, `DEFAULT_LINKING_OPTIONS`, `ANCHOR_STYLE_LABELS`, `ANCHOR_STYLE_DESCRIPTIONS`) | ~5 |

### 3.3 Lib utilities mortes

| Fichier | Exports morts |
|---------|--------------|
| `lib/notifications.ts` | 4/5 fonctions mortes (`createApprovalNotification`, `createSyncNotification`, `createBatchNotification`, `createArticleNotification`) |
| `lib/productHelpers.ts` | 4 exports (`computeDirtyFieldsContent`, `cleanDraftContent`, `MANAGED_DRAFT_FIELDS`, `ORPHAN_DRAFT_FIELDS`) |
| `lib/woocommerceMapper.ts` | 1 (`mapWooCommerceToContentData` - jamais importe) |
| `schemas/flowriter.ts` | 4 validators (`canProceedFromTopic`, `canProceedFromOutline`, `canProceedFromConfig`, `canFinalize`) |

---

## 4. FICHIERS & ROUTES ORPHELINS

### 4.1 Pages orphelines (non liees dans la navigation)

| Route | Fichier | Probleme |
|-------|---------|----------|
| `/app/dashboard` | `app/dashboard/page.tsx` | Doublon de `/app/overview`, aucun lien vers cette page |
| `/app/products/example` | `app/app/products/example/page.tsx` | Page de demo, aucun lien |
| `/app/blog/ai-writer` | `app/app/blog/ai-writer/page.tsx` | Doublon de `/app/blog/flowriter` |

### 4.2 Fichier CSS backup

| Fichier | Statut |
|---------|--------|
| `styles/tokens/gm3-semantic-tokens.css.backup` | Backup, a supprimer |

---

## 5. DEPENDENCIES NPM INUTILISEES

### Confirmees inutilisees (3)

| Package | Version | Taille | Raison |
|---------|---------|--------|--------|
| `@tailwindcss/typography` | v0.5.19 | ~25KB | Aucun import dans le code source |
| `react-datasheet-grid` | v4.11.5 | ~180KB | Aucun import dans le code source |
| `tailwindcss-animate` | v1.0.7 | ~10KB | Tailwind v4 a des animations natives |

### Suspecte (1)

| Package | Version | Raison |
|---------|---------|--------|
| `recharts` | v3.7.0 | 1 seul fichier (`chart-tooltip.tsx`) - composant wrapper jamais utilise |

**Commande de nettoyage :**
```bash
cd my-app && npm remove @tailwindcss/typography tailwindcss-animate react-datasheet-grid
```

---

## 6. CODE DUPLIQUE (~1 300 lignes)

### 6.1 HIGH - ProductsTable vs ProductsTableModern (~500 lignes)

| Aspect | ProductsTable.tsx | ProductsTableModern.tsx |
|--------|:-----------------:|:----------------------:|
| Lignes | 672 | 764 |
| Interface Product | Identique | Identique |
| ProductRowActions | ~90% identique | +animations |
| Column definitions | Identique | +styling |

**Action :** Fusionner en un seul composant avec prop `variant="classic" | "modern"`.

### 6.2 MEDIUM - ContentData duplique

- `types/product.ts` : version minimale (8 props)
- `types/productContent.ts` : version complete (90+ props)

**Action :** Consolider dans `productContent.ts`, re-exporter depuis `product.ts`.

### 6.3 MEDIUM - SEO hooks dupliques

- `hooks/products/useSeoGlobalScore.ts` : Supabase RPC brut
- `hooks/analytics/useSeoStats.ts` : TanStack Query

**Action :** Unifier avec TanStack Query.

### 6.4 LOW - FIELD_LABELS dupliques

- `lib/productHelpers.ts` (14 champs)
- `lib/seo/constants.ts` (9 champs)

**Action :** Creer `lib/constants/fieldLabels.ts`.

---

## 7. PLAN D'ACTION

### Phase 1 - Quick Wins (Impact immediat) — EXECUTEE

| Action | Fichiers | Lignes supprimees | Statut |
|--------|:--------:|:-----------------:|:------:|
| Supprimer 5 widgets dashboard orphelins | 5 | ~325 | DONE |
| Supprimer `lib/toast.ts` | 1 | 47 | DONE |
| ~~Supprimer `types/imageGeneration.ts`~~ | ~~1~~ | ~~60~~ | FAUX POSITIF (7+ imports actifs) |
| Supprimer 4 fichiers hooks morts | 4 | ~300 | DONE |
| ~~Supprimer 3 hooks stub vides~~ | ~~3~~ | ~~22~~ | FAUX POSITIF (importes par ProductsTable) |
| ~~`npm remove` @tailwindcss/typography~~ | 0 | 0 | FAUX POSITIF (10 fichiers `prose`) |
| `npm remove` react-datasheet-grid, tailwindcss-animate | 0 | 0 (node_modules) | DONE |
| **Sous-total effectif** | **10** | **~672** | **BUILD OK** |

> **Faux positifs corriges :**
> - `types/imageGeneration.ts` : 7+ fichiers importent `ModularGenerationSettings` (batch generation, AI prompts)
> - 5 widgets dashboard (QuickActions, Blog, TimeSaved, Timeline, NorthStar) : importes par `KPICardsGrid.tsx`
> - 3 hooks stub (useProductSeoStatus, useProductSerpStatus, useSerpAnalysis) : importes par `ProductsTable.tsx`
> - `@tailwindcss/typography` : 10 fichiers utilisent les classes `prose`

### Phase 2 - Nettoyage cible — EXECUTEE

| Action | Fichiers | Lignes supprimees | Statut |
|--------|:--------:|:-----------------:|:------:|
| Supprimer 3 composants Photo Studio morts + barrel cleanup | 3 | ~290 | DONE |
| Supprimer 3 composants dashboard feature morts | 3 | ~250 | DONE |
| Supprimer 4 composants SEO/blog/variations morts | 4 | ~280 | DONE |
| Supprimer `lib/woocommerceMapper.ts` (entier) | 1 | ~50 | DONE |
| Supprimer 3 routes orphelines (/dashboard, /products/example, /blog/ai-writer) | 3 | ~150 | DONE |
| Supprimer CSS backup (`gm3-semantic-tokens.css.backup`) | 1 | ~320 | DONE |
| Nettoyer 10 exports morts dans `hooks/products/index.ts` | 1 | ~10 | DONE |
| Supprimer 3 fonctions mortes dans `lib/notifications.ts` | 1 | ~120 | DONE |
| Supprimer 3 exports morts dans `lib/productHelpers.ts` | 1 | ~60 | DONE |
| Nettoyer types morts: descriptionStructure.ts (5), dashboard.ts (9), sync.ts (7+), productContent.ts (2) | 4 | ~280 | DONE |
| Un-export types internes: product.ts (7), woocommerce.ts (7) | 2 | 0 (scope only) | DONE |
| ~~Nettoyer types/store.ts~~ | ~~1~~ | ~~0~~ | FAUX POSITIF (all 3 active) |
| ~~Supprimer schemas/flowriter.ts validators~~ | ~~1~~ | ~~0~~ | FAUX POSITIF (used in tests) |
| **Sous-total effectif** | **24 fichiers touches** | **~1 810** | **BUILD OK** |

### Phase 3 - Refactoring deduplication — EXECUTEE

| Action | Complexite | Lignes gagnees | Statut |
|--------|:----------:|:--------------:|:------:|
| Supprimer ProductsTable.tsx (0 imports, Modern est le seul utilise) | LOW | ~672 | DONE |
| Consolider ContentData types (product.ts re-exporte productContent.ts) | LOW | ~20 | DONE |
| Fix useDraftActions.ts local ContentData -> import | LOW | ~10 | DONE |
| Supprimer analytics/useSeoStats.ts (0 imports) | LOW | ~46 | DONE |
| Supprimer useSeoStats export du barrel index.ts | LOW | ~1 | DONE |
| Unifier FIELD_LABELS: productHelpers (source unique) + SyncPill + SyncStatusCard | LOW | ~40 | DONE |
| **Sous-total effectif** | | **~789** | **BUILD OK** |

---

## 8. METRIQUES FINALES

| Metrique | Avant audit | Phase 1 | Phase 2 | Phase 3 | Total supprime |
|----------|:-----------:|:-------:|:-------:|:-------:|:--------------:|
| Fichiers supprimes | 505 | -10 | -15 | -2 | **27 fichiers** |
| Lignes supprimees | 17 837 | ~672 | ~1 810 | ~789 | **~3 271 lignes** |
| Exports morts nettoyes | ~100 | 0 | ~35 | ~12 | **~47 exports** |
| Types un-exportes | 0 | 0 | 14 | 0 | **14 types** |
| Packages npm retires | 3 | 2 | 0 | 0 | **2 packages** |

> **Note:** L'audit initial estimait ~6 400 lignes de code mort (~36%).
> Apres verification rigoureuse avec double-check des imports, **~3 271 lignes ont ete effectivement supprimees (~18%)**.
> La difference est due a ~15 faux positifs detectes lors de l'execution (types/fichiers qui semblaient morts mais avaient des consommateurs actifs).

---

*Rapport genere et execute par Claude Code (Opus 4.6) - 3 phases completees, build OK*
