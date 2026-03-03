# SPRINT 6 — Dashboard & Analytics
**Durée:** 4 jours | **Phase:** 3 — Advanced Features | **Prérequis:** Sprint 5

---

## Objectif

Dashboard complet avec KPIs, trends, insights, et quick actions.

---

## Feature 32 — KPI Cards Système

### État actuel

**DÉJÀ FAIT** : Composants dashboard existants dans `components/dashboard/` :
- `OverviewDashboard.tsx` — Container principal
- `KPICardsGrid.tsx` — Grid 3 cartes
- `NorthStarKPICard.tsx` — Carte SEO health
- `GscIndexationStatusCard.tsx` — Stats indexation
- `BlogContentCard.tsx` — Metrics blog
- `GscTrafficOverviewCard.tsx` — Traffic KPIs
- `GscFastOpportunitiesCard.tsx` — Top opportunités
- `ProgressRing.tsx` — Indicateur circulaire
- `ActivityTimeline.tsx` — Feed activité
- `QuickActionsCard.tsx` — Boutons CTA
- `GenerateSelectionModal.tsx` — Modal génération

### Direction de développement

**Les composants existent.** Enrichissements :

1. **Trend indicators** — Comparer M vs M-1 avec flèche up/down et pourcentage
2. **Sparkline charts** — Mini graphes inline dans les KPI cards
3. **Animation d'entrée** — staggerContainer pour les 3 cartes

```typescript
// components/dashboard/TrendIndicator.tsx
interface TrendIndicatorProps {
  current: number;
  previous: number | null; // null = pas de donnée M-1
  format?: 'percent' | 'number' | 'score';
}

// Rendu :
// ↑ +12.5%  (vert si positive)
// ↓ -3.2%   (rouge si négative)
// ─ 0%      (neutre si stable)
// "—"       (gris si previous = null)
```

### Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `components/dashboard/TrendIndicator.tsx` | CRÉER |
| `components/dashboard/SparklineChart.tsx` | CRÉER |
| `components/dashboard/NorthStarKPICard.tsx` | MODIFIER — ajouter trend + sparkline |

### Critère de sortie
- [x] 3 KPI cards avec données
- [ ] Trend M vs M-1 sur chaque card
- [ ] Sparkline inline (30 jours)

---

## Feature 33 — Dashboard KPIs Data

### État actuel

**DÉJÀ FAIT** :
- `useDashboardKPIs.ts` (147 lignes) — Appelle RPC `get_dashboard_stats(p_store_id)`
- `useCatalogCoverage.ts` — Appelle RPC `get_catalog_coverage(p_store_id)`
- Types complets dans `types/dashboard.ts` (142 lignes) :
  - `DashboardKPIs` : seoHealth, productContentGenerated, catalogCoverage, blogStats
  - `DashboardContext` : selectedShop, connectionStatus, shopStats

**RPC Functions** :
- `get_dashboard_stats()` : Returns 13 metrics including `seo_avg_score_prev_month`, `ai_optimized_prev_month`
- `get_catalog_coverage()` : Returns total/optimized/percent/generatedThisMonth

**KPI Snapshot Cron** : `kpi-snapshot-cron/index.ts` (256 lignes) — Daily à 00:05 UTC
- 5 metrics : `seo_avg_score`, `ai_optimized_products`, `total_products`, `published_blog_posts`, `total_blog_posts`
- Upsert dans `kpi_snapshots` (UNIQUE: tenant_id + store_id + date + metric_name)

### Direction de développement

**Le data layer est complet.** Enrichissements :

1. **Historical data hook** — Pour alimenter les sparklines
```typescript
// hooks/dashboard/useKpiHistory.ts
export function useKpiHistory(storeId: string | null, metricName: string, days: number = 30) {
  return useQuery({
    queryKey: ['kpi-history', storeId, metricName, days],
    queryFn: async () => {
      const supabase = createClient();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const { data } = await supabase
        .from('kpi_snapshots')
        .select('snapshot_date, metric_value')
        .eq('metric_name', metricName)
        .gte('snapshot_date', fromDate.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: true });

      return data?.map(d => ({ date: d.snapshot_date, value: Number(d.metric_value) })) ?? [];
    },
    staleTime: STALE_TIMES.ARCHIVE,
  });
}
```

2. **Per-field breakdown** — Coverage par type de champ (title, description, seo_title...)

### Fichiers à créer

| Fichier | LOC | Priorité |
|---------|-----|----------|
| `hooks/dashboard/useKpiHistory.ts` | ~40 | HAUTE |

### Critère de sortie
- [x] RPC get_dashboard_stats fonctionne
- [x] KPI snapshots daily cron
- [ ] Hook historique pour sparklines (30j)

---

## Feature 34 — Charts & Trends

### État actuel

- `ProgressRing.tsx` existe (indicateur circulaire)
- Pas de graphiques line/area/bar trouvés

### Direction de développement

**Choisir une librairie de charts légère :**

**Option recommandée : Recharts** (déjà dans l'écosystème React, ~50KB gzipped)

```typescript
// components/dashboard/TrendsChart.tsx
interface TrendsChartProps {
  data: { date: string; value: number }[];
  title: string;
  color?: string; // default: var(--primary)
  height?: number; // default: 200
  showArea?: boolean;
}

// Rendu : LineChart avec area fill, responsive
// X-axis : dates (format DD/MM)
// Y-axis : values avec auto-scaling
// Tooltip : date + valeur exacte
// Skeleton loading state
```

```typescript
// components/dashboard/MiniChart.tsx (sparkline inline)
interface MiniChartProps {
  data: number[]; // just values, no dates
  width?: number;  // default: 80
  height?: number; // default: 32
  color?: string;
}

// Rendu : SVG path simple (pas de axes, pas de labels)
// Utilisé inline dans les KPI cards
```

### Fichiers à créer

| Fichier | LOC | Priorité |
|---------|-----|----------|
| `components/dashboard/TrendsChart.tsx` | ~120 | HAUTE |
| `components/dashboard/MiniChart.tsx` | ~50 | HAUTE |
| `components/dashboard/SeoTrendCard.tsx` | ~80 | MOYENNE |

### Critère de sortie
- [ ] TrendsChart avec area chart sur 30j
- [ ] MiniChart sparkline dans KPI cards
- [ ] Au moins 2 métriques avec graphes historiques

---

## Feature 35 — Performance Insights

### État actuel

**NON IMPLÉMENTÉ** : Pas de composant `PerformanceInsights` trouvé.

### Direction de développement

```typescript
// components/dashboard/PerformanceInsights.tsx
interface Insight {
  id: string;
  type: 'opportunity' | 'warning' | 'achievement';
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
  priority: number; // 1-5
}

// Génère des insights basés sur les KPIs :
// - "15 produits n'ont pas de méta-description" → opportunity
// - "Score SEO moyen en baisse de 5 points" → warning
// - "80% de votre catalogue est optimisé IA" → achievement
// - "3 URLs ont perdu leur indexation" → warning

function generateInsights(kpis: DashboardKPIs, gscData?: GscDashboardData): Insight[] {
  const insights: Insight[] = [];

  // SEO opportunities
  if (kpis.seoHealth.criticalCount > 0) {
    insights.push({
      type: 'warning',
      title: `${kpis.seoHealth.criticalCount} produits avec score SEO critique`,
      action: { label: 'Voir les produits', href: '/app/products?seo_score=critical' },
    });
  }

  // Coverage achievements
  if (kpis.catalogCoveragePercent >= 80) {
    insights.push({
      type: 'achievement',
      title: `${kpis.catalogCoveragePercent}% du catalogue optimisé`,
    });
  }

  return insights.sort((a, b) => a.priority - b.priority).slice(0, 5);
}
```

### Fichiers à créer

| Fichier | LOC | Priorité |
|---------|-----|----------|
| `components/dashboard/PerformanceInsights.tsx` | ~150 | MOYENNE |
| `lib/dashboard/generate-insights.ts` | ~100 | MOYENNE |

### Critère de sortie
- [ ] 3-5 insights générés automatiquement
- [ ] Actions cliquables (liens vers pages concernées)
- [ ] Classement par priorité

---

## Feature 36 — SEO/SERP Progress Widgets

### État actuel

- `NorthStarKPICard.tsx` affiche déjà le score SEO moyen
- `GscIndexationStatusCard.tsx` affiche les stats indexation
- Pas de barre de progression dédiée "SEO analysis progress"

### Direction de développement

```typescript
// components/dashboard/SeoAnalysisProgressCard.tsx
// Affiche : X/Y produits analysés (barre de progression)
// Computed : total_products vs analyzed_products_count (from KPIs)
// CTA : "Lancer l'analyse SEO" si progress < 100%
```

### Critère de sortie
- [ ] Card progress pour SEO analysis
- [ ] Card progress pour SERP analysis

---

## Feature 37 — Quick Actions Dashboard

### État actuel

**DÉJÀ FAIT** :
- `QuickActionsCard.tsx` existe
- `GenerateSelectionModal.tsx` existe

### Direction de développement

**Enrichir avec plus d'actions :**
- "Synchroniser maintenant" → trigger sync pour le store actif
- "Générer le contenu" → ouvre modal batch generation
- "Voir les conflits" → filtre produits avec conflits
- "Indexer les nouvelles pages" → trigger GSC queue processing

### Critère de sortie
- [x] Quick actions card existe
- [ ] 4+ actions fonctionnelles depuis le dashboard

---

## Récapitulatif Sprint 6

| # | Feature | Effort réel | Status actuel |
|---|---------|-------------|---------------|
| 32 | KPI cards système | 0.5j | PARTIEL — trend indicator + sparkline à ajouter |
| 33 | Dashboard KPIs data | 0.5j | FAIT — hook historique à créer |
| 34 | Charts & trends | 1.5j | À faire — TrendsChart + MiniChart |
| 35 | Performance insights | 1j | À faire — composant + générateur |
| 36 | SEO/SERP progress widgets | 0.5j | PARTIEL — progress cards à ajouter |
| 37 | Quick actions dashboard | 0.25j | FAIT — enrichir les actions |

**Effort réel ajusté : ~4.25 jours**
