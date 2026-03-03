# Structure des Sprints — FLOWZ v1.0 Roadmap Complète
**Date:** 2026-03-03
**Scope:** 52 micro-features réparties en 8 sprints (6 semaines)
**Basé sur:** Architecture analysis, Remediation plan, Features comparison, Specs existantes

---

## Vue d'ensemble

```
PHASE 1 — FONDATIONS          (Sprints 1-2)   Semaines 1-2
PHASE 2 — CORE FEATURES       (Sprints 3-4)   Semaines 2-3
PHASE 3 — ADVANCED FEATURES   (Sprints 5-6)   Semaines 3-4
PHASE 4 — POLISH & SCALE      (Sprints 7-8)   Semaines 5-6
```

### Dépendances entre sprints

```
Sprint 1 (Remédiation) ──────────────────────────────────────┐
   │                                                          │
Sprint 2 (TypeScript + Infra) ────┐                          │
   │                               │                          │
Sprint 3 (Sync Avancée) ──────────┤                          │
   │                               │                          │
Sprint 4 (Products Avancés) ──────┤                          │
   │                               ▼                          │
Sprint 5 (SEO + GSC) ─────► Sprint 6 (Dashboard) ◄──────────┘
   │                               │
Sprint 7 (Blog + Catégories) ─────┤
   │                               │
Sprint 8 (Profil + Polish) ───────┘
```

---

## Sprint 1 — Remédiation & Quick Wins (3 jours)
**Objectif:** Éliminer la dette technique critique avant de construire

| # | Micro-feature | Effort | Impact | Fichiers clés |
|---|---------------|--------|--------|---------------|
| 1 | **Prompt injection patterns consolidés** | 0.5j | HIGH | `lib/ai/prompt-safety.ts` (nouveau), 3 endpoints |
| 2 | **Console.log purge client-side** | 1j | MEDIUM | ~76 occurrences dans hooks/components/features |
| 3 | **Landing page lazy loading** | 0.5j | MEDIUM | `app/(landing)/page.tsx` → `next/dynamic` pour 6 composants |
| 4 | **staleTime standardisation** | 0.5j | MEDIUM | `lib/query-config.ts` (nouveau), ~44 hooks à aligner |
| 5 | **Catch blocks vides → error handling** | 0.5j | MEDIUM | 12 catch blocks dans hooks/composants |

**Critères de sortie:**
- [ ] 0 console.log client-side (ESLint rule `no-console`)
- [ ] 20+ prompt injection patterns dans `prompt-safety.ts`
- [ ] 6 constantes staleTime utilisées partout
- [ ] 0 catch blocks vides

---

## Sprint 2 — TypeScript & Infrastructure (4 jours)
**Objectif:** Types solides + infra pour les features à venir

| # | Micro-feature | Effort | Impact | Fichiers clés |
|---|---------------|--------|--------|---------------|
| 6 | **Interfaces JSONB typées** (ProductMetadata, WorkingContent, DraftContent) | 1j | HIGH | `types/product-content.ts` (nouveau) |
| 7 | **Supprimer les `as any`** (35 → 0) | 2j | HIGH | `useProductSave.ts`, `ProductsListContent.tsx`, `productHelpers.ts` |
| 8 | **ArticleWithMetadata interface** | 0.5j | MEDIUM | `types/article.ts`, `useArticleEditorForm.ts` |
| 9 | **Pagination serveur** — Hook + filtres Supabase | 1j | HIGH | `hooks/products/useProducts.ts` → offset/limit/count |
| 10 | **Pagination serveur** — UI + prefetch page suivante | 0.5j | HIGH | `ProductsPagination.tsx`, `ProductsListContent.tsx` |

**Critères de sortie:**
- [ ] 0 occurrences `as any` dans le codebase
- [ ] Pagination serveur fonctionne avec 500+ produits
- [ ] Tous les champs JSONB typés

**Dépendances:** Sprint 1 (prompt-safety utilisé par les endpoints)

---

## Sprint 3 — Sync Avancée & Stores (5 jours)
**Objectif:** Système de synchronisation production-ready

| # | Micro-feature | Effort | Impact | Fichiers clés |
|---|---------------|--------|--------|---------------|
| 11 | **Store lifecycle hooks** (disconnect, reconnect, delete) | 1j | HIGH | `hooks/stores/useDisconnectStore.ts`, `useReconnectStore.ts`, `useScheduleStoreDeletion.ts` |
| 12 | **Store settings UI** (StoreSyncSettings, StoreCredentialsTab) | 1j | HIGH | `components/stores/StoreSyncSettings.tsx`, `StoreCredentialsTab.tsx` |
| 13 | **Store heartbeat système** | 0.5j | HIGH | `supabase/functions/store-heartbeat/index.ts`, `hooks/stores/useStoreHeartbeat.ts` |
| 14 | **Sync state machine v2** — ajout phases manquantes | 0.5j | HIGH | `features/sync/machine.ts` → ajouter states recovery/retry |
| 15 | **Sync progress realtime** — manifest tracking | 0.5j | HIGH | `hooks/sync/useManifestProgress.ts`, `useSyncCompletion.ts` |
| 16 | **Sync reports & history** | 0.5j | MEDIUM | `hooks/sync/useSyncReports.ts`, `components/sync/SyncDashboard.tsx` |
| 17 | **Conflict detection** — contenu local vs distant | 1j | HIGH | `hooks/products/useConflictDetection.ts`, `ConflictResolutionDialog.tsx` |

**Critères de sortie:**
- [ ] Full store lifecycle (connect → sync → disconnect → delete)
- [ ] Heartbeat détecte les stores inaccessibles
- [ ] Conflict resolution fonctionne pour tous les champs

**Dépendances:** Sprint 2 (types JSONB nécessaires pour conflict detection)

---

## Sprint 4 — Products Avancés (5 jours)
**Objectif:** Éditeur de produit complet + batch operations

| # | Micro-feature | Effort | Impact | Fichiers clés |
|---|---------------|--------|--------|---------------|
| 18 | **Split god hooks** — useProductSave → 3 hooks | 1j | MEDIUM | `useProductSave.ts` → `useProductDraftMerge.ts`, `useProductSeoCompute.ts` |
| 19 | **ProductEditorProvider** — context au lieu de prop drilling | 1j | MEDIUM | `features/products/context/ProductEditorProvider.tsx` |
| 20 | **Product categories management** | 1j | HIGH | `hooks/products/useProductCategories.ts`, `ProductsCategoryFilter.tsx` |
| 21 | **Batch job monitoring** — progress, status, recovery | 0.5j | HIGH | `hooks/products/useBatchJobStatus.ts`, `useBatchProgress.ts`, `useJobRecovery.ts` |
| 22 | **Draft management UI** — preview, comparison, approve | 0.5j | HIGH | `DraftPreviewDialog.tsx`, `DraftContentComparison.tsx`, `ConfirmDraftOverwriteDialog.tsx` |
| 23 | **Editorial lock manager** | 0.5j | MEDIUM | `EditorialLockManager.tsx`, lock/unlock par champ |
| 24 | **Revert to original** | 0.5j | MEDIUM | `hooks/products/useRevertToOriginal.ts` → reset working_content vers metadata |

**Critères de sortie:**
- [ ] 0 god hooks > 300 lignes
- [ ] Batch operations avec progress visuel
- [ ] Draft accept/reject/compare fonctionne
- [ ] Lock par champ opérationnel

**Dépendances:** Sprint 2 (interfaces typées), Sprint 3 (sync pour push après edit)

---

## Sprint 5 — SEO & Google Search Console (5 jours)
**Objectif:** Pipeline SEO complet + indexation automatique

| # | Micro-feature | Effort | Impact | Fichiers clés |
|---|---------------|--------|--------|---------------|
| 25 | **SEO analysis real-time** — scoring live dans l'éditeur | 0.5j | HIGH | `hooks/products/useSeoAnalysisRealtime.ts` → calcul à chaque keystroke |
| 26 | **SEO field recommendations** — suggestions contextuelles | 0.5j | HIGH | `SeoFieldRecommendations.tsx` → suggestions par champ |
| 27 | **SERP analysis complet** — position tracking + keywords | 1j | HIGH | `hooks/products/useSerpAnalysis.ts`, `useSerpAnalysisJob.ts`, `SerpEnrichmentSheet.tsx` |
| 28 | **GSC schema + types** | 0.5j | BLOQUANT | Migration `gsc_sitemap_urls`, `gsc_indexation_status`, `gsc_indexation_queue` |
| 29 | **GSC API backend** — inspection, submission, queue | 1j | HIGH | `app/api/gsc/indexation/*` (5 routes) |
| 30 | **GSC hooks** — useGscIndexation, useGscQueue, useGscKeywords | 0.5j | HIGH | `hooks/gsc/useGscIndexation.ts`, `useGscQueue.ts` |
| 31 | **GSC UI** — IndexationOverview, URLList, QueuePanel | 1j | HIGH | `features/gsc/components/IndexationOverview.tsx`, `URLStatusList.tsx` |

**Critères de sortie:**
- [ ] Score SEO real-time visible dans l'éditeur produit
- [ ] SERP tracking fonctionnel avec historique
- [ ] GSC indexation automatique (cron 2h)
- [ ] Dashboard indexation avec verdicts

**Dépendances:** Sprint 4 (product editor pour SEO panel)

---

## Sprint 6 — Dashboard & Analytics (4 jours)
**Objectif:** Dashboard complet avec KPIs, trends, et insights

| # | Micro-feature | Effort | Impact | Fichiers clés |
|---|---------------|--------|--------|---------------|
| 32 | **KPI cards système** — composants réutilisables | 0.5j | HIGH | `components/dashboard/KPICard.tsx`, `MetricCard.tsx`, `TrendIndicator.tsx` |
| 33 | **Dashboard KPIs data** — hooks + kpi-snapshot-cron | 1j | HIGH | `hooks/dashboard/useDashboardKPIs.ts`, `supabase/functions/kpi-snapshot-cron/` |
| 34 | **Charts & trends** — MiniChart, TrendsChart, sparklines | 1j | HIGH | `components/dashboard/MiniChart.tsx`, `TrendsChart.tsx` |
| 35 | **Performance insights** — AI recommendations | 0.5j | MEDIUM | `components/dashboard/PerformanceInsights.tsx` |
| 36 | **SEO/SERP progress widgets** — barre de progression analytics | 0.5j | MEDIUM | `SeoAnalysisProgress.tsx`, `SerpAnalysisProgress.tsx` |
| 37 | **Quick actions dashboard** — Optimize, Generate, Sync depuis le dashboard | 0.5j | MEDIUM | `OptimizationModal.tsx`, `GenerateSelectionModal.tsx` |

**Critères de sortie:**
- [ ] Dashboard avec 6+ KPI cards animées
- [ ] Trend charts avec données historiques (30j)
- [ ] Quick actions fonctionnelles depuis le dashboard
- [ ] Empty states pour nouveaux utilisateurs

**Dépendances:** Sprint 5 (SEO data pour les widgets), Sprint 3 (sync data pour KPIs)

---

## Sprint 7 — Blog & Catégories (5 jours)
**Objectif:** Module blog complet + gestion des catégories

| # | Micro-feature | Effort | Impact | Fichiers clés |
|---|---------------|--------|--------|---------------|
| 38 | **Blog hooks complets** — useBlogArticles, useBlogSerpAnalysis | 0.5j | HIGH | `hooks/blog/useBlogArticles.ts`, `useBlogSerpAnalysis.ts` |
| 39 | **Article auto-save** — debounced + version history | 0.5j | MEDIUM | `hooks/blog/useArticleAutoSave.ts`, `useArticleVersioning.ts` |
| 40 | **Split useArticleEditorForm** → 2-3 hooks | 0.5j | MEDIUM | `useArticleEditorForm.ts` → `useArticleAutoSave.ts`, `useArticleVersioning.ts` |
| 41 | **Blog sync WooCommerce/Shopify** | 1j | HIGH | `supabase/functions/woo-blog-sync/`, `shopify-blog-sync/` |
| 42 | **Catégories module** — CRUD + tree view | 1j | HIGH | `hooks/products/useProductCategories.ts`, `CategoryTreeView.tsx`, `CategoriesTable.tsx` |
| 43 | **Catégories sync** — WooCommerce/Shopify | 0.5j | HIGH | `supabase/functions/woo-categories-sync/` |
| 44 | **Scheduled publications** — programmation d'articles | 1j | MEDIUM | `hooks/blog/useScheduledPublications.ts`, UI calendar picker |

**Critères de sortie:**
- [ ] CRUD articles avec auto-save + versioning
- [ ] Sync bidirectionnelle blog vers WooCommerce
- [ ] Arbre de catégories navigable + sync
- [ ] Programmation de publication fonctionnelle

**Dépendances:** Sprint 3 (sync infrastructure), Sprint 4 (product editor patterns réutilisés)

---

## Sprint 8 — Profil, Notifications & Polish (5 jours)
**Objectif:** Expérience utilisateur complète + finitions

| # | Micro-feature | Effort | Impact | Fichiers clés |
|---|---------------|--------|--------|---------------|
| 45 | **Profil utilisateur** — sections (General, AI, Billing, Security) | 1.5j | MEDIUM | `components/profile/ProfileGeneralSection.tsx`, `ProfileAISection.tsx`, `ProfileSecuritySection.tsx` |
| 46 | **Notifications center** — panel + realtime + email digests | 1j | MEDIUM | `hooks/notifications/useNotifications.ts` (enrichir), `NotificationsCenter.tsx` |
| 47 | **Unsaved changes protection** — beforeunload + navigation guard | 0.5j | MEDIUM | `hooks/useUnsavedChangesProtection.ts` |
| 48 | **Global search** — recherche cross-module (products, articles, categories) | 0.5j | MEDIUM | `hooks/useGlobalSearch.ts`, `components/layout/GlobalSearch.tsx` |
| 49 | **Stale closures fix** — useRef pour callbacks instables | 0.5j | LOW | 3 hooks avec closures stale |
| 50 | **VariationGrid keys fix** — key={name} au lieu de key={idx} | 0.25j | LOW | `VariationGrid.tsx` |
| 51 | **Inline callbacks memoization** — useCallback dans FilterPills & co | 0.25j | LOW | `FilterPills.tsx`, composants similaires |
| 52 | **Optimistic locking articles** — même pattern que products | 0.5j | MEDIUM | `useArticleEditorForm.ts` → check `updated_at` |

**Critères de sortie:**
- [ ] Profil utilisateur complet avec 4+ sections
- [ ] Notifications realtime + centre de notification
- [ ] Protection perte de données (navigation guard)
- [ ] Recherche globale fonctionnelle
- [ ] 0 issues de performance connues

**Dépendances:** Sprint 7 (articles pour optimistic locking)

---

## Calendrier détaillé

```
Semaine 1 ─────────────────────────────────────────────
│ Sprint 1: Remédiation & Quick Wins          [3 jours]
│  ├─ #1  Prompt injection consolidé          [0.5j]
│  ├─ #2  Console.log purge                   [1j]
│  ├─ #3  Landing lazy loading                [0.5j]
│  ├─ #4  staleTime standardisation           [0.5j]
│  └─ #5  Catch blocks → error handling       [0.5j]
│
│ Sprint 2: TypeScript & Infra (début)        [2 jours]
│  ├─ #6  Interfaces JSONB typées             [1j]
│  └─ #7  Supprimer as any (début)            [1j]

Semaine 2 ─────────────────────────────────────────────
│ Sprint 2: TypeScript & Infra (fin)          [2 jours]
│  ├─ #7  Supprimer as any (fin)              [1j]
│  ├─ #8  ArticleWithMetadata interface       [0.5j]
│  └─ #9  Pagination serveur — hook           [1j]
│  └─ #10 Pagination serveur — UI             [0.5j]
│
│ Sprint 3: Sync Avancée (début)              [3 jours]
│  ├─ #11 Store lifecycle hooks               [1j]
│  ├─ #12 Store settings UI                   [1j]
│  └─ #13 Store heartbeat                     [0.5j]

Semaine 3 ─────────────────────────────────────────────
│ Sprint 3: Sync Avancée (fin)                [2 jours]
│  ├─ #14 Sync state machine v2               [0.5j]
│  ├─ #15 Sync progress realtime              [0.5j]
│  ├─ #16 Sync reports & history              [0.5j]
│  └─ #17 Conflict detection                  [1j]
│
│ Sprint 4: Products Avancés (début)          [3 jours]
│  ├─ #18 Split god hooks                     [1j]
│  ├─ #19 ProductEditorProvider               [1j]
│  └─ #20 Product categories                  [1j]

Semaine 4 ─────────────────────────────────────────────
│ Sprint 4: Products Avancés (fin)            [2 jours]
│  ├─ #21 Batch job monitoring                [0.5j]
│  ├─ #22 Draft management UI                 [0.5j]
│  ├─ #23 Editorial lock manager              [0.5j]
│  └─ #24 Revert to original                  [0.5j]
│
│ Sprint 5: SEO & GSC (début)                 [3 jours]
│  ├─ #25 SEO analysis real-time              [0.5j]
│  ├─ #26 SEO field recommendations           [0.5j]
│  ├─ #27 SERP analysis complet               [1j]
│  └─ #28 GSC schema + types                  [0.5j]

Semaine 5 ─────────────────────────────────────────────
│ Sprint 5: SEO & GSC (fin)                   [2 jours]
│  ├─ #29 GSC API backend                     [1j]
│  ├─ #30 GSC hooks                           [0.5j]
│  └─ #31 GSC UI                              [1j]
│
│ Sprint 6: Dashboard & Analytics             [4 jours]
│  ├─ #32 KPI cards système                   [0.5j]
│  ├─ #33 Dashboard KPIs data                 [1j]
│  ├─ #34 Charts & trends                     [1j]
│  ├─ #35 Performance insights                [0.5j]
│  ├─ #36 SEO/SERP progress widgets           [0.5j]
│  └─ #37 Quick actions dashboard             [0.5j]

Semaine 6 ─────────────────────────────────────────────
│ Sprint 7: Blog & Catégories                 [5 jours]
│  ├─ #38 Blog hooks complets                 [0.5j]
│  ├─ #39 Article auto-save                   [0.5j]
│  ├─ #40 Split useArticleEditorForm          [0.5j]
│  ├─ #41 Blog sync WooCommerce/Shopify       [1j]
│  ├─ #42 Catégories module                   [1j]
│  ├─ #43 Catégories sync                     [0.5j]
│  └─ #44 Scheduled publications              [1j]
│
│ Sprint 8: Profil, Notifications & Polish    [5 jours]
│  ├─ #45 Profil utilisateur                  [1.5j]
│  ├─ #46 Notifications center                [1j]
│  ├─ #47 Unsaved changes protection          [0.5j]
│  ├─ #48 Global search                       [0.5j]
│  ├─ #49 Stale closures fix                  [0.5j]
│  ├─ #50 VariationGrid keys fix              [0.25j]
│  ├─ #51 Inline callbacks memoization        [0.25j]
│  └─ #52 Optimistic locking articles         [0.5j]
```

---

## Récapitulatif par phase

| Phase | Sprints | Durée | Features | Focus |
|-------|---------|-------|----------|-------|
| **1. Fondations** | 1-2 | 7 jours | #1-10 | Dettes techniques, types, pagination |
| **2. Core Features** | 3-4 | 10 jours | #11-24 | Sync, stores, products avancés |
| **3. Advanced Features** | 5-6 | 9 jours | #25-37 | SEO, GSC, dashboard analytics |
| **4. Polish & Scale** | 7-8 | 10 jours | #38-52 | Blog, catégories, profil, perf |
| **TOTAL** | 8 | **36 jours** | **52** | Full production readiness |

---

## Métriques de succès globales

| Métrique | Avant | Après Sprint 8 | Vérification |
|----------|-------|----------------|--------------|
| `as any` | 35 | 0 | `grep "as any" src/ \| wc -l` |
| Console.log (client) | ~76 | 0 | ESLint `no-console` rule |
| God hooks >300L | 4 | 0 | `wc -l` per hook |
| Prompt patterns | 9 | 20+ | Count in `prompt-safety.ts` |
| staleTime values | ~6 variantes | 6 standards | `grep staleTime` |
| Catch vides | 12 | 0 | Code review |
| Bundle landing | ~250KB | <180KB | `next build --analyze` |
| Pagination | 200 max | Illimité | Test 500+ produits |
| Pages app | 4 | 12+ | Route count |
| Hooks | ~24 | 60+ | Hook file count |
| Edge Functions | 3 | 15+ | Function count |
| DS violations | ~150 | <20 | DS audit |

---

## Risques et mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Types Supabase auto-gen désynchronisés | Haute | Moyen | Générer les types après chaque migration |
| GSC OAuth scopes breaking change | Moyenne | Haute | Re-auth flow + migration douce |
| Batch AI timeouts sur gros catalogues | Moyenne | Haute | Chunked processing déjà en place |
| RLS performance sur tables larges | Basse | Haute | Index sur `tenant_id` + `store_id` |
| Conflits de merge (hooks refactoring) | Moyenne | Moyen | Feature branches isolées par sprint |

---

## Conventions de branches

```
Sprint 1: feature/sprint-1-remediation
Sprint 2: feature/sprint-2-typescript-infra
Sprint 3: feature/sprint-3-sync-stores
Sprint 4: feature/sprint-4-products-advanced
Sprint 5: feature/sprint-5-seo-gsc
Sprint 6: feature/sprint-6-dashboard
Sprint 7: feature/sprint-7-blog-categories
Sprint 8: feature/sprint-8-profile-polish
```

Chaque sprint merge dans `develop` via PR avec code review.

---

*Généré le: 2026-03-03*
*Base: Architecture analysis + Remediation plan + Features comparison*
