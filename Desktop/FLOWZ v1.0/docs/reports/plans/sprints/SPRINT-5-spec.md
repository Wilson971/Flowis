# SPRINT 5 — SEO & Google Search Console
**Durée:** 5 jours | **Phase:** 3 — Advanced Features | **Prérequis:** Sprint 4

---

## Objectif

Pipeline SEO complet avec scoring real-time dans l'éditeur + intégration GSC complète (indexation automatique, inspection, queue).

---

## Feature 25 — SEO Analysis Real-Time

### État actuel

**DÉJÀ FAIT** : `lib/seo/analyzer.ts` (857 lignes) contient le moteur complet :

**Moteur de scoring produit (`calculateProductSeoScore()`)** :
- 11 critères avec poids (total base: 13.0 + bonus: 3.0)
- `scoreTextField()` : Scoring adaptatif basé sur 4 seuils (min, idealMin, idealMax, max)
- `scoreSlug()` : Validation format + word count (2-5 idéal)
- `scoreImages()/scoreAltText()` : Count + coverage %
- `scoreKeywordPresence()` : Matrice de présence (title, meta, description, slug)
- `scoreCTA()` : Détection 24 verbes d'action FR
- `scoreGscTrafficSignal()` : log10(impressions) × 25 + position bonus

**Hooks existants** :
- `useSeoAnalysis.ts` : `useProductSeoScore(productId)`, `useSeoStats(storeId)`
- `useProductSeoStatus.ts` : Stub retournant `{isPending: false}`
- Colonne `products.seo_score` (SMALLINT) avec index partiel

**Types complets** : `ProductSeoInput`, `ProductSeoResult`, `ProductSeoCriterion`, `SeoIssue`

### Direction de développement

**Le scoring engine est complet. Créer le composant de feedback live :**

```typescript
// features/products/components/edit/seo-tab/SeoLiveScoreWidget.tsx
interface SeoLiveScoreWidgetProps {
  control: Control<ProductFormValues>;
  focusKeyword?: string;
  gscData?: GscKeywordData[];
}

// Behaviour :
// 1. useWatch() sur tous les champs du form (title, description, meta_title, etc.)
// 2. useMemo(() => calculateProductSeoScore(input), [watched_fields])
// 3. Affiche : score global (jauge circulaire) + score par critère (barres)
// 4. Issues triées par severity (critical > warning > info)
// 5. Re-calcul instantané à chaque keystroke (debounce 300ms)
```

**Architecture du widget :**
```
SeoLiveScoreWidget
├── SeoScoreCircle (jauge 0-100 avec couleur par level)
├── SeoCriteriaList (11 critères avec barres + score)
│   ├── SeoCriterionRow (label + bar + score + expand)
│   └── SeoIssuesList (issues par critère, expandable)
└── SeoQuickFixes (top 3 recommandations triées par impact)
```

### Fichiers à créer

| Fichier | LOC | Priorité |
|---------|-----|----------|
| `features/products/components/edit/seo-tab/SeoLiveScoreWidget.tsx` | ~200 | HAUTE |
| `features/products/components/edit/seo-tab/SeoScoreCircle.tsx` | ~60 | HAUTE |
| `features/products/components/edit/seo-tab/SeoCriteriaList.tsx` | ~120 | HAUTE |

### Critère de sortie
- [x] Scoring engine 11 critères fonctionnel
- [ ] Widget live dans l'éditeur produit (onglet SEO)
- [ ] Score recalculé à chaque modification de champ
- [ ] Issues triées par severity

---

## Feature 26 — SEO Field Recommendations

### État actuel

**NON IMPLÉMENTÉ** : Pas de composant `SeoFieldRecommendations` trouvé.

### Direction de développement

```typescript
// features/products/components/edit/seo-tab/SeoFieldRecommendations.tsx
interface SeoFieldRecommendationsProps {
  fieldName: SeoFieldType;
  currentValue: string;
  score: number;
  issues: SeoIssue[];
}

// Affiche pour CHAQUE champ SEO :
// 1. Score actuel (badge coloré)
// 2. Longueur actuelle vs idéale (ex: "45/60 caractères — idéal: 50-60")
// 3. Issues spécifiques au champ avec recommandations
// 4. Bouton "Générer avec IA" → trigger AI suggestion pour ce champ
// 5. Preview SERP (titre + meta description simulés)

// Thresholds (from constants.ts) :
const THRESHOLDS = {
  meta_title:        { min: 30, idealMin: 50, idealMax: 60, max: 70 },
  meta_description:  { min: 80, idealMin: 130, idealMax: 160, max: 170 },
  title:             { min: 10, idealMin: 30, idealMax: 60, max: 80 },
  short_description: { min: 50, idealMin: 100, idealMax: 200, max: 300 },
  description:       { min: 200, idealMin: 400, idealMax: 800, max: 5000 },
};
```

**SERP Preview** :
```typescript
// SerpPreview.tsx — Simulation résultat Google
interface SerpPreviewProps {
  title: string;     // meta_title ou title (56 chars max affiché)
  url: string;       // slug formaté en URL
  description: string; // meta_description (160 chars max)
}
// Rendu : card imitant un résultat Google (titre bleu, URL verte, description grise)
// Troncature visuelle si trop long (ellipsis)
```

### Fichiers à créer

| Fichier | LOC | Priorité |
|---------|-----|----------|
| `features/products/components/edit/seo-tab/SeoFieldRecommendations.tsx` | ~150 | HAUTE |
| `features/products/components/edit/seo-tab/SerpPreview.tsx` | ~80 | HAUTE |
| `features/products/components/edit/seo-tab/CharCountIndicator.tsx` | ~40 | MOYENNE |

### Critère de sortie
- [ ] Recommandations contextuelles par champ
- [ ] Counter caractères avec zone idéale colorée
- [ ] SERP Preview sous meta_title + meta_description
- [ ] Bouton AI suggestion par champ

---

## Feature 27 — SERP Analysis Complet

### État actuel

- `ProductSerpAnalysis` type existe (keyword_position, status, keyword, search_volume)
- `useProductSerpStatus.ts` : Stub retournant `isPending: false`
- Relation `product_serp_analysis` dans le query `useProduct()`
- `SerpEnrichmentSheet.tsx` existe dans features comparison

### Direction de développement

**Enrichir le SERP analysis avec données réelles :**

```typescript
// hooks/products/useSerpAnalysis.ts — Enrichir le hook existant
export function useSerpAnalysis(productId: string) {
  return useQuery({
    queryKey: ['serp-analysis', productId],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('product_serp_analysis')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(10);
      return data;
    },
    staleTime: STALE_TIMES.DETAIL,
  });
}

// API route pour trigger SERP analysis
// POST /api/seo/serp-analysis
// Body: { product_id, keywords: string[] }
// Process: Call SerpAPI → store results → update product_serp_analysis
```

### Critère de sortie
- [ ] Hook SERP analysis avec données réelles
- [ ] Position tracking pour les mots-clés ciblés
- [ ] Historique des positions (graphique)

---

## Features 28-31 — GSC Integration Stack

### État actuel

**COMPLET** : L'intégration GSC est entièrement implémentée :

#### Schema (Feature 28) — FAIT
- 8 tables GSC : `gsc_connections`, `gsc_keywords`, `gsc_sitemap_urls`, `gsc_indexation_status`, `gsc_indexation_queue`, `gsc_indexation_settings`, `gsc_indexation_history`, `gsc_country_stats`, `gsc_device_stats`
- Toutes avec RLS `tenant_id = auth.uid()`
- Types ENUM : `gsc_indexation_verdict`, `gsc_queue_status`

#### API Backend (Feature 29) — FAIT
- 18 routes dans `app/api/gsc/` :
  - OAuth : `/oauth/authorize`, `/oauth/callback`
  - Data : `/sites`, `/sync`, `/dashboard`, `/keywords`, `/keywords-explorer`
  - Indexation : `/indexation/overview`, `/indexation/urls`, `/indexation/queue`, `/indexation/submit`, `/indexation/inspect`, `/indexation/settings`
  - Analytics : `/position-tracking`, `/pages-products`, `/opportunities`, `/sitemap`

#### Hooks (Feature 30) — FAIT
- 13 hooks dans `hooks/integrations/` :
  - `useGscConnection`, `useGscDashboard`, `useGscKeywords`, `useGscKeywordsExplorer`
  - `useGscIndexation`, `useGscIndexationQueue`, `useGscIndexationSettings`
  - `useGscOpportunities`, `useGscPagesProducts`, `useGscPositionTracking`
  - `useGscSitemap`, `useWebhooks`

#### UI (Feature 31) — FAIT
- 15+ composants dans `features/gsc/components/` :
  - `GscDashboardPage`, `GscSeoPage`, `GscTabbedData`, `GscKpiCards`
  - `GscPerformanceChart`, `GscIndexationTab`, `GscIndexationUrlList`
  - `GscIndexationQueueTab`, `GscKeywordsExplorerTab`, `GscOpportunitesTab`
  - `GscPositionTrackingTab`, `GscAutoIndexSettings`, `GscIndexationFilters`

#### Edge Function Cron — FAIT
- `gsc-indexation-cron/index.ts` (469 lignes) : Toutes les 2h
  - Sitemap parsing + change detection (MD5 hash)
  - Auto-queue new/updated URLs
  - URL submission to Google (200/jour quota)
  - URL inspection batch (2000/jour)
  - Daily history snapshot

### Direction de développement

**Les features 28-31 sont COMPLÈTES. Améliorations possibles :**

1. **Alerting** — Notification quand des URLs passent de `indexed` → `not_indexed`
2. **Product linking** — Associer les URLs GSC aux produits FLOWZ automatiquement
3. **Keyword suggestions** — Proposer des mots-clés GSC comme `focus_keyword` pour les produits

### Critère de sortie
- [x] Schema 8 tables GSC
- [x] 18 API routes
- [x] 13 hooks
- [x] 15+ composants UI
- [x] Cron indexation toutes les 2h

---

## Récapitulatif Sprint 5

| # | Feature | Effort réel | Status actuel |
|---|---------|-------------|---------------|
| 25 | SEO analysis real-time | 1.5j | PARTIEL — engine OK, widget live à créer |
| 26 | SEO field recommendations | 1j | À faire — composants à créer |
| 27 | SERP analysis complet | 1j | PARTIEL — enrichir avec données réelles |
| 28 | GSC schema + types | 0j | **FAIT** |
| 29 | GSC API backend | 0j | **FAIT** |
| 30 | GSC hooks | 0j | **FAIT** |
| 31 | GSC UI | 0j | **FAIT** |

**Effort réel ajusté : ~3.5 jours** (Features 25-27 uniquement)
