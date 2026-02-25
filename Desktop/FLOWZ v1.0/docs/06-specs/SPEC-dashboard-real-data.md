# SPEC — Dashboard Real Data Implementation

> **Date:** 2026-02-24
> **Scope:** Éliminer toutes les données mockées/hardcodées du dashboard et brancher sur des sources réelles.
> **Priorité:** HIGH — Le dashboard est la page d'accueil, toute donnée fausse = perte de confiance utilisateur.

---

## Audit : État Actuel des Données

| Composant | Source | Statut | Problèmes |
|-----------|--------|--------|-----------|
| Score SEO global | `useSeoGlobalScore` → `products.seo_score` | ✅ Réel | Score biaisé (seuls les produits analysés manuellement) |
| SEO Breakdown (Titres/Desc/Images/Tech) | `SeoScoreHero` fallback | ❌ **Mocké** | Calcul `score * 0.25` — aucune donnée réelle par catégorie |
| SEO criticalCount/warningCount/goodCount | `useSeoGlobalScore` | ✅ Réel | Calculé client-side depuis `products.seo_score` |
| SEO previousMonthChange | `useSeoGlobalScore` | ❌ **Hardcodé 0** | `// TODO: implement with kpi_snapshots` |
| SEO avg dans `get_dashboard_stats` | RPC → `product_seo_analysis` | ⚠️ **Désynchronisé** | Lit `product_seo_analysis.overall_score` (legacy), pas `products.seo_score` |
| seoHealth dans useDashboardKPIs | Hook mapping | ❌ **Hardcodé** | `criticalCount: 0, warningCount: 0, goodCount: 0, topIssue: null` |
| productFieldsBreakdown | Hook mapping | ❌ **Fake** | Tous les champs = `aiOptimized` (même valeur partout) |
| Couverture catalogue | `useCatalogCoverage` → RPC | ✅ Réel | OK |
| Trafic organique (GSC) | `useGscDashboard` → RPC | ✅ Réel | OK |
| Indexation (GSC) | `useGscIndexation` → RPC | ✅ Réel | OK |
| Opportunités rapides (GSC) | `useGscOpportunities` → RPC | ❌ **Cassé** | RPC `get_gsc_opportunities` n'existe dans aucune migration |
| Blog stats | `get_dashboard_stats` → `blog_articles` | ✅ Réel | OK |
| Connection health | `stores.status` + `stores.last_synced_at` | ✅ Réel | OK |
| Activity feed | `useRecentActivity` → `sync_jobs` | ⚠️ Partiel | Ne montre que les sync — pas de génération IA ni éditions produits |
| KPI trends M-1 | `kpi_snapshots` table | ⚠️ Dépend du cron | Table existe, mais le cron Edge Function doit être déployé |
| Action Center priorités | `ActionCenter` props | ⚠️ Partiel | `opportunitiesCount` toujours passé à `0` (non branché sur GSC) |

---

## Plan d'Implémentation — 7 Chantiers

### Chantier 1 : SEO Score Breakdown Réel

**Objectif :** Remplacer le fallback `score * 0.25` par un vrai breakdown par catégorie.

**Approche :** Le moteur SEO (`lib/seo/analyzer.ts`) calcule déjà 11 critères pondérés. On peut les regrouper en 4 catégories :

| Catégorie Dashboard | Critères SEO (de `PRODUCT_SEO_WEIGHTS`) | Poids total |
|---|---|---|
| **Titres** | `meta_title` (2.5) + `title` (2.0) | 4.5 |
| **Descriptions** | `meta_description` (2.5) + `short_description` (1.5) + `description` (1.5) | 5.5 |
| **Images** | `images` (1.0) + `alt_text` (1.0) | 2.0 |
| **Technique** | `slug` (1.0) + `keyword_presence` (1.5, bonus) + `cta_detection` (0.5, bonus) + `gsc_traffic_signal` (1.0, bonus) | 4.0 |

**Tâches :**

#### 1.1 — Nouvelle colonne `products.seo_breakdown`

```sql
-- Migration: add_seo_breakdown_column
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_breakdown jsonb DEFAULT NULL;

COMMENT ON COLUMN products.seo_breakdown IS
  'SEO score breakdown {titles: 0-25, descriptions: 0-25, images: 0-25, technical: 0-25}';
```

#### 1.2 — Mettre à jour le moteur SEO

**Fichier :** `lib/seo/analyzer.ts`

Ajouter une fonction `computeSeoBreakdown(criteria: ProductSeoCriterion[]): SeoBreakdown` :

```typescript
export interface SeoBreakdown {
  titles: number;       // 0-25
  descriptions: number; // 0-25
  images: number;       // 0-25
  technical: number;    // 0-25
}

const CATEGORY_MAP: Record<string, keyof SeoBreakdown> = {
  meta_title: 'titles',
  title: 'titles',
  meta_description: 'descriptions',
  short_description: 'descriptions',
  description: 'descriptions',
  images: 'images',
  alt_text: 'images',
  slug: 'technical',
  keyword_presence: 'technical',
  cta_detection: 'technical',
  gsc_traffic_signal: 'technical',
};

export function computeSeoBreakdown(criteria: ProductSeoCriterion[]): SeoBreakdown {
  const categoryScores: Record<keyof SeoBreakdown, { totalWeight: number; weightedScore: number }> = {
    titles: { totalWeight: 0, weightedScore: 0 },
    descriptions: { totalWeight: 0, weightedScore: 0 },
    images: { totalWeight: 0, weightedScore: 0 },
    technical: { totalWeight: 0, weightedScore: 0 },
  };

  for (const c of criteria) {
    const cat = CATEGORY_MAP[c.key];
    if (!cat) continue;
    categoryScores[cat].totalWeight += c.weight;
    categoryScores[cat].weightedScore += (c.score / 100) * c.weight;
  }

  // Normalize each category to /25
  const normalize = (cat: keyof SeoBreakdown): number => {
    const { totalWeight, weightedScore } = categoryScores[cat];
    if (totalWeight === 0) return 0;
    return Math.round((weightedScore / totalWeight) * 25);
  };

  return {
    titles: normalize('titles'),
    descriptions: normalize('descriptions'),
    images: normalize('images'),
    technical: normalize('technical'),
  };
}
```

#### 1.3 — Persister le breakdown au save produit

**Fichier :** `hooks/products/useProductSave.ts` (ou équivalent)

Quand le score SEO est calculé et sauvegardé dans `products.seo_score`, également sauvegarder le breakdown :

```typescript
await supabase
  .from('products')
  .update({
    seo_score: result.overall,
    seo_breakdown: computeSeoBreakdown(result.criteria),
  })
  .eq('id', productId);
```

#### 1.4 — Agréger le breakdown global

**Fichier :** `hooks/products/useSeoGlobalScore.ts`

Modifier la query pour récupérer aussi `seo_breakdown` :

```typescript
const { data: products } = await supabase
  .from('products')
  .select('seo_score, seo_breakdown')
  .eq('store_id', storeId!);

// Aggregate breakdowns
const breakdowns = products.filter(p => p.seo_breakdown);
const avgBreakdown: SeoBreakdown = {
  titles: Math.round(breakdowns.reduce((s, p) => s + (p.seo_breakdown?.titles ?? 0), 0) / (breakdowns.length || 1)),
  descriptions: Math.round(breakdowns.reduce((s, p) => s + (p.seo_breakdown?.descriptions ?? 0), 0) / (breakdowns.length || 1)),
  images: Math.round(breakdowns.reduce((s, p) => s + (p.seo_breakdown?.images ?? 0), 0) / (breakdowns.length || 1)),
  technical: Math.round(breakdowns.reduce((s, p) => s + (p.seo_breakdown?.technical ?? 0), 0) / (breakdowns.length || 1)),
};
```

Retourner `breakdown` dans `SeoGlobalScoreData`.

#### 1.5 — Brancher dans SeoScoreHero

**Fichier :** `components/dashboard/SeoScoreHero.tsx`

Remplacer le fallback par la prop `breakdown` de `useSeoGlobalScore` :

```typescript
// Dans KPICardsGrid :
<SeoScoreHero
  score={seoScore}
  breakdown={seoData?.breakdown}  // ← données réelles
  ...
/>
```

**Effort estimé :** 1 migration + 4 fichiers modifiés

---

### Chantier 2 : Corriger `get_dashboard_stats` — SEO depuis `products.seo_score`

**Problème :** La RPC lit `product_seo_analysis.overall_score` (table legacy) au lieu de `products.seo_score` (colonne actuelle).

**Tâches :**

#### 2.1 — Migration : mettre à jour la RPC

```sql
-- Migration: fix_dashboard_stats_seo_source
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_store_id uuid DEFAULT NULL)
RETURNS TABLE(/* même signature */)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  RETURN QUERY SELECT
    -- ... (garder les autres champs identiques)

    -- FIX: analyzed_products_count depuis products.seo_score (pas product_seo_analysis)
    (SELECT count(*)
     FROM products p
     WHERE (p_store_id IS NULL OR p.store_id = p_store_id)
       AND p.seo_score IS NOT NULL)::bigint,

    -- FIX: seo_avg_score depuis products.seo_score (pas product_seo_analysis)
    COALESCE(
      (SELECT AVG(p.seo_score)
       FROM products p
       WHERE (p_store_id IS NULL OR p.store_id = p_store_id)
         AND p.seo_score IS NOT NULL),
      0
    ),

    -- ... reste inchangé
  ;
END;
$function$;
```

#### 2.2 — Supprimer les hardcoded zeros dans `useDashboardKPIs`

Utiliser les données de `useSeoGlobalScore` (déjà appelé dans `KPICardsGrid`) au lieu de dupliquer avec des zeros :

```typescript
// Supprimer les faux seoHealth dans useDashboardKPIs
// Les composants utilisent déjà useSeoGlobalScore directement
```

**Effort estimé :** 1 migration + 1 fichier modifié

---

### Chantier 3 : KPI Trends M-1 (previousMonthChange)

**Problème :** `useSeoGlobalScore.previousMonthChange` est hardcodé à `0`. Le `kpi_snapshots` table existe mais n'est pas alimentée.

**Tâches :**

#### 3.1 — Créer l'Edge Function cron de snapshot

**Fichier :** `supabase/functions/kpi-snapshot-cron/index.ts`

```typescript
// Cron quotidien (via pg_cron ou Supabase Scheduled Functions)
// Pour chaque tenant/store :
//   INSERT INTO kpi_snapshots (tenant_id, store_id, metric_name, metric_value)
//   VALUES
//     (tid, sid, 'seo_avg_score', AVG(seo_score) FROM products),
//     (tid, sid, 'ai_optimized_products', COUNT(*) FROM products WHERE working_content IS NOT NULL),
//     (tid, sid, 'total_products', COUNT(*) FROM products),
//     (tid, sid, 'published_blog_posts', COUNT(*) FROM blog_articles WHERE status = 'publish')
//   ON CONFLICT (tenant_id, COALESCE(store_id, '...'), snapshot_date, metric_name)
//   DO UPDATE SET metric_value = EXCLUDED.metric_value;
```

**Alternative plus simple — RPC appelé par le client :**

```sql
-- Migration: create_upsert_daily_snapshot
CREATE OR REPLACE FUNCTION public.upsert_daily_snapshot(p_store_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_tid uuid := auth.uid();
  v_seo numeric;
  v_ai  bigint;
  v_total bigint;
  v_pub  bigint;
BEGIN
  -- Compute current metrics
  SELECT AVG(seo_score), count(*) FILTER (WHERE working_content IS NOT NULL), count(*)
  INTO v_seo, v_ai, v_total
  FROM products
  WHERE (p_store_id IS NULL OR store_id = p_store_id);

  SELECT count(*) INTO v_pub
  FROM blog_articles
  WHERE (p_store_id IS NULL OR store_id = p_store_id)
    AND status IN ('publish', 'published') AND archived = false;

  -- Upsert snapshots for today
  INSERT INTO kpi_snapshots (tenant_id, store_id, metric_name, metric_value, snapshot_date)
  VALUES
    (v_tid, p_store_id, 'seo_avg_score', COALESCE(v_seo, 0), CURRENT_DATE),
    (v_tid, p_store_id, 'ai_optimized_products', v_ai, CURRENT_DATE),
    (v_tid, p_store_id, 'total_products', v_total, CURRENT_DATE),
    (v_tid, p_store_id, 'published_blog_posts', v_pub, CURRENT_DATE)
  ON CONFLICT (tenant_id, COALESCE(store_id, '00000000-0000-0000-0000-000000000000'::uuid), snapshot_date, metric_name)
  DO UPDATE SET metric_value = EXCLUDED.metric_value;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.upsert_daily_snapshot(uuid) TO authenticated;
```

#### 3.2 — Appeler la RPC snapshot à chaque visite dashboard

**Fichier :** `hooks/dashboard/useDashboardKPIs.ts`

Ajouter un `useEffect` qui appelle `upsert_daily_snapshot` une fois par session/jour :

```typescript
// After successful fetch of dashboard stats:
useEffect(() => {
  if (!effectiveStoreId || isLoading) return;
  const key = `snapshot-${effectiveStoreId}-${new Date().toISOString().slice(0, 10)}`;
  if (sessionStorage.getItem(key)) return;
  supabase.rpc('upsert_daily_snapshot', { p_store_id: effectiveStoreId })
    .then(() => sessionStorage.setItem(key, '1'));
}, [effectiveStoreId, isLoading]);
```

#### 3.3 — Implémenter previousMonthChange dans `useSeoGlobalScore`

```typescript
// Fetch M-1 snapshot
const { data: snapshot } = await supabase
  .from('kpi_snapshots')
  .select('metric_value')
  .eq('store_id', storeId!)
  .eq('metric_name', 'seo_avg_score')
  .gte('snapshot_date', prevMonthStart)
  .lte('snapshot_date', prevMonthEnd)
  .order('snapshot_date', { ascending: false })
  .limit(1)
  .single();

const previousMonthChange = snapshot?.metric_value != null
  ? Math.round(averageScore - Number(snapshot.metric_value))
  : 0;
```

**Effort estimé :** 1 migration + 1 Edge Function (optionnel) + 2 fichiers modifiés

---

### Chantier 4 : RPC `get_gsc_opportunities` Manquante

**Problème :** L'API route `/api/gsc/opportunities` appelle une RPC qui n'existe pas → 500 systématique. La card "Opportunités Rapides" ne charge jamais de données réelles.

**Tâches :**

#### 4.1 — Migration : créer la RPC

```sql
-- Migration: create_gsc_opportunities_rpc
CREATE OR REPLACE FUNCTION public.get_gsc_opportunities(
    p_tenant_id uuid,
    p_site_id uuid,
    p_date_range text DEFAULT 'last_28_days'
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_result jsonb;
  v_avg_ctr numeric;
BEGIN
  -- Average CTR for this site
  SELECT AVG(k.ctr) INTO v_avg_ctr
  FROM gsc_keywords k
  WHERE k.site_id = p_site_id
    AND k.tenant_id = p_tenant_id
    AND k.date_range = p_date_range;

  SELECT jsonb_build_object(
    'quick_wins', COALESCE((
      SELECT jsonb_agg(row_to_json(q))
      FROM (
        SELECT query, page_url, clicks, impressions, ctr, position
        FROM gsc_keywords
        WHERE site_id = p_site_id AND tenant_id = p_tenant_id
          AND date_range = p_date_range
          AND position BETWEEN 8 AND 20
          AND impressions > 10
        ORDER BY impressions DESC
        LIMIT 10
      ) q
    ), '[]'::jsonb),
    'low_ctr', COALESCE((
      SELECT jsonb_agg(row_to_json(q))
      FROM (
        SELECT query, page_url, clicks, impressions, ctr, position
        FROM gsc_keywords
        WHERE site_id = p_site_id AND tenant_id = p_tenant_id
          AND date_range = p_date_range
          AND position <= 10
          AND ctr < COALESCE(v_avg_ctr, 0.03)
          AND impressions > 50
        ORDER BY impressions DESC
        LIMIT 10
      ) q
    ), '[]'::jsonb),
    'no_clicks', COALESCE((
      SELECT jsonb_agg(row_to_json(q))
      FROM (
        SELECT query, page_url, clicks, impressions, ctr, position
        FROM gsc_keywords
        WHERE site_id = p_site_id AND tenant_id = p_tenant_id
          AND date_range = p_date_range
          AND clicks = 0
          AND impressions > 100
        ORDER BY impressions DESC
        LIMIT 10
      ) q
    ), '[]'::jsonb),
    'cannibalization', COALESCE((
      SELECT jsonb_agg(row_to_json(c))
      FROM (
        SELECT query, count(DISTINCT page_url) as page_count,
               sum(impressions) as total_impressions,
               jsonb_agg(jsonb_build_object(
                 'page_url', page_url, 'position', position,
                 'clicks', clicks, 'impressions', impressions
               )) as pages
        FROM gsc_keywords
        WHERE site_id = p_site_id AND tenant_id = p_tenant_id
          AND date_range = p_date_range
        GROUP BY query
        HAVING count(DISTINCT page_url) > 1
        ORDER BY sum(impressions) DESC
        LIMIT 5
      ) c
    ), '[]'::jsonb),
    'avg_ctr', COALESCE(v_avg_ctr, 0)
  ) INTO v_result;

  RETURN v_result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_gsc_opportunities(uuid, uuid, text) TO authenticated;
```

**Effort estimé :** 1 migration

---

### Chantier 5 : Activity Feed Enrichi

**Problème :** `useRecentActivity` ne montre que les `sync_jobs`. Pas d'événements de génération IA, de publication d'articles, ou de modifications produits.

**Tâches :**

#### 5.1 — Créer une table `activity_log` unifiée

```sql
-- Migration: create_activity_log
CREATE TABLE IF NOT EXISTS public.activity_log (
    id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id   uuid        NOT NULL,
    store_id    uuid        REFERENCES public.stores(id) ON DELETE SET NULL,
    type        text        NOT NULL, -- 'sync' | 'generation' | 'publication' | 'product_edit' | 'seo_analysis' | 'photo_studio'
    title       text        NOT NULL,
    description text,
    status      text        NOT NULL DEFAULT 'info', -- 'success' | 'warning' | 'error' | 'info'
    metadata    jsonb       DEFAULT '{}',
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX activity_log_tenant_idx ON activity_log (tenant_id, created_at DESC);
CREATE INDEX activity_log_store_idx ON activity_log (store_id, created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_log_select_own" ON activity_log
    FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "activity_log_insert_own" ON activity_log
    FOR INSERT WITH CHECK (tenant_id = auth.uid());
```

#### 5.2 — Écrire dans `activity_log` depuis les hooks existants

Ajouter des insertions dans :

| Action | Fichier | Insertion |
|--------|---------|-----------|
| Sync terminé | `hooks/sync/useSyncJob.ts` (onSuccess) | `type: 'sync', status: 'success'` |
| Sync échoué | idem (onError) | `type: 'sync', status: 'error'` |
| Article publié | `hooks/blog/useBlogPost.ts` (publish mutation) | `type: 'publication', status: 'success'` |
| Génération IA | `hooks/products/useBatchGeneration.ts` (onComplete) | `type: 'generation', status: 'success'` |
| FloWriter terminé | `hooks/blog/useBlogGeneration.ts` (onComplete) | `type: 'generation', status: 'success'` |
| Photo Studio batch | `features/photo-studio/hooks/useBatchStudioJobs.ts` | `type: 'photo_studio', status: 'success'` |

**Pattern d'insertion :**

```typescript
// Utility function
async function logActivity(params: {
  type: string;
  title: string;
  description?: string;
  status?: string;
  storeId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createClient();
  await supabase.from('activity_log').insert({
    type: params.type,
    title: params.title,
    description: params.description,
    status: params.status ?? 'info',
    store_id: params.storeId,
    metadata: params.metadata ?? {},
  });
}
```

#### 5.3 — Modifier `useRecentActivity` pour lire `activity_log`

```typescript
// Priorité : activity_log si elle existe, sinon fallback sur sync_jobs
const { data: activities } = await supabase
  .from('activity_log')
  .select('*')
  .eq('store_id', storeId)
  .order('created_at', { ascending: false })
  .limit(limit);
```

#### 5.4 — Groupement intelligent dans `ActivityTimeline`

Ajouter un groupement côté client pour les événements répétitifs :

```typescript
// Si 4 syncs consécutives avec 0 items → "4 syncs partielles (0 changements)"
function groupActivities(items: ActivityItem[]): GroupedActivity[] {
  // Group consecutive items of same type/description
}
```

**Effort estimé :** 1 migration + 1 util + 5-6 hooks modifiés + 2 composants modifiés

---

### Chantier 6 : Action Center — Brancher les données réelles

**Problème :** `opportunitiesCount` est passé en dur à `0`.

**Tâches :**

#### 6.1 — Passer les données GSC opportunities dans `KPICardsGrid`

```typescript
// Dans KPICardsGrid, ajouter :
const { data: opportunities } = useGscOpportunities(effectiveSiteId, "last_28_days");

<ActionCenter
  isDisconnected={isDisconnected}
  draftsCount={draftsCount}
  seoScore={seoScore}
  opportunitiesCount={opportunities?.quick_wins?.length ?? 0}  // ← données réelles
  productsWithoutDescription={productsWithoutDesc}
/>
```

#### 6.2 — Calculer `productsWithoutDescription`

```typescript
// Nouveau calcul dans KPICardsGrid ou via useCatalogCoverage
const productsWithoutDesc = (coverageData?.total ?? 0) - (coverageData?.optimized ?? 0);
```

**Effort estimé :** 1 fichier modifié (+ dépend du Chantier 4 pour les opportunities)

---

### Chantier 7 : Batch SEO Analysis — Combler le biais de score

**Problème :** `products.seo_score` n'est peuplé que pour les produits ouverts manuellement dans l'éditeur. Le score global est biaisé.

**Tâches :**

#### 7.1 — RPC de calcul SEO batch côté serveur

Comme le moteur SEO est client-side, il y a deux options :

**Option A — API route batch (recommandée) :**

Créer `POST /api/seo/batch-analyze` qui :
1. Récupère les produits sans `seo_score` (ou score datant de > 7 jours)
2. Pour chaque produit, exécute `calculateProductSeoScore()` côté serveur (le même engine)
3. Écrit `seo_score` + `seo_breakdown` en bulk

```typescript
// api/seo/batch-analyze/route.ts
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('id, title, metadata, working_content')
    .is('seo_score', null)
    .limit(50);

  for (const product of products ?? []) {
    const input = buildProductSeoInput(product);
    const result = calculateProductSeoScore(input);
    const breakdown = computeSeoBreakdown(result.criteria);

    await supabase.from('products').update({
      seo_score: result.overall,
      seo_breakdown: breakdown,
    }).eq('id', product.id);
  }

  return NextResponse.json({ analyzed: products?.length ?? 0 });
}
```

**Option B — Trigger PostgreSQL :**

Trigger `AFTER INSERT OR UPDATE` sur `products.working_content` qui recalcule le score. Plus complexe car le moteur est en TypeScript, pas en SQL.

#### 7.2 — Déclencher le batch depuis le dashboard

Dans `OverviewDashboard`, déclencher une analyse batch silencieuse si > 50% des produits n'ont pas de score :

```typescript
useEffect(() => {
  const unscored = (coverageData?.total ?? 0) - (seoData?.analyzedProductsCount ?? 0);
  const ratio = coverageData?.total ? unscored / coverageData.total : 0;
  if (ratio > 0.5) {
    fetch('/api/seo/batch-analyze', { method: 'POST' });
  }
}, [coverageData, seoData]);
```

**Effort estimé :** 1 API route + adaptation du moteur SEO pour Node.js + 1 fichier modifié

---

## Résumé des Livrables

| # | Chantier | Migrations | Fichiers modifiés | Effort |
|---|----------|-----------|-------------------|--------|
| 1 | SEO Breakdown réel | 1 (`add seo_breakdown`) | 4 (analyzer, save hook, global score hook, SeoScoreHero) | M |
| 2 | Fix `get_dashboard_stats` source SEO | 1 (`fix RPC`) | 1 (useDashboardKPIs cleanup) | S |
| 3 | KPI Trends M-1 | 1 (`upsert_daily_snapshot`) | 2 (useDashboardKPIs, useSeoGlobalScore) | M |
| 4 | RPC `get_gsc_opportunities` | 1 (create RPC) | 0 | S |
| 5 | Activity Feed enrichi | 1 (`activity_log`) | 7 (util + hooks + composant) | L |
| 6 | Action Center données réelles | 0 | 1 (KPICardsGrid) | XS |
| 7 | Batch SEO Analysis | 0 | 2 (API route + dashboard trigger) | M |

**Total : 5 migrations SQL, ~17 fichiers modifiés, 1 nouvelle API route**

---

## Ordre d'Exécution Recommandé

```
Phase 1 — Quick wins (pas de migration complexe)
├── Chantier 2 : Fix source SEO dans RPC          [30 min]
├── Chantier 4 : Créer RPC get_gsc_opportunities   [30 min]
└── Chantier 6 : Brancher Action Center             [15 min]

Phase 2 — Scoring complet
├── Chantier 1 : SEO Breakdown réel                 [2h]
└── Chantier 7 : Batch SEO Analysis                 [2h]

Phase 3 — Trends & Activity
├── Chantier 3 : KPI Trends M-1                     [1h30]
└── Chantier 5 : Activity Feed enrichi              [3h]
```

---

## Critères de Validation

- [ ] Le score SEO hero affiche un breakdown calculé depuis les données réelles (pas `score * 0.25`)
- [ ] `get_dashboard_stats` lit `products.seo_score`, pas `product_seo_analysis`
- [ ] La card "Opportunités Rapides" charge sans erreur 500
- [ ] Le trend M-1 affiche une valeur non-zero après 1 jour de snapshot
- [ ] L'Activity Feed montre au moins 3 types d'événements (sync + generation + publication)
- [ ] L'Action Center affiche le vrai nombre d'opportunités GSC
- [ ] Plus de 80% des produits ont un `seo_score` calculé (batch analysis)
- [ ] Aucune valeur hardcodée à `0` ou fallback `score * 0.25` ne subsiste
