# Plan d'Implementation - GSC Indexation

## Analyse Critique

### Point d'attention : Google Indexing API
L'API Google Indexing est **officiellement limitee** aux pages contenant du structured data `JobPosting` ou `BroadcastEvent`. Foudroyer et d'autres outils l'utilisent pour des URLs generiques (ca fonctionne en pratique pour declencher un crawl), mais c'est techniquement hors scope officiel Google.

**Decision recommandee :** Implementer quand meme (comme Foudroyer), mais :
- Avertir l'utilisateur dans l'UI que c'est une "demande d'indexation" (pas une garantie)
- Utiliser l'URL Inspection API (100% legitimate) pour le suivi du statut
- Prevoir un fallback gracieux si Google restreint les quotas

### Quotas API
| API | Limite | Impact |
|-----|--------|--------|
| URL Inspection | 2,000/jour/site | Verification de statut en batch — queue necessaire pour sites > 2000 URLs |
| Indexing API | 200/jour/projet | Soumission limitee — file d'attente obligatoire |
| Batch Indexing | 100 URLs/requete | Optimiser avec des batch multipart |

### Scopes OAuth a ajouter
Actuellement : `webmasters.readonly` + `userinfo.email`
A ajouter : `https://www.googleapis.com/auth/indexing` + `https://www.googleapis.com/auth/webmasters` (read-write, remplace readonly)

**Impact :** Les utilisateurs devront re-autoriser leur connexion GSC pour obtenir les nouveaux scopes.

---

## Decoupage en 5 Features Atomiques

### Feature 1 : Schema Supabase + Types
**Priorite : BLOQUANTE — tout le reste en depend**

#### Tables a creer (migration `20260222400001_create_gsc_indexation.sql`)

**`gsc_sitemap_urls`** — Cache des URLs decouvertes via sitemap + FLOWZ
```sql
CREATE TABLE gsc_sitemap_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES gsc_sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('sitemap', 'product', 'blog', 'manual')),
  source_id UUID,                    -- FK vers products.id ou blog_posts.id si applicable
  lastmod TIMESTAMPTZ,               -- <lastmod> du sitemap XML
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,    -- false si disparu du sitemap
  UNIQUE (site_id, url)
);
-- RLS: tenant_id = auth.uid()
-- Index: (site_id, is_active), (tenant_id)
```

**`gsc_indexation_status`** — Statut d'indexation par URL (resultat URL Inspection API)
```sql
CREATE TYPE gsc_indexation_verdict AS ENUM (
  'indexed', 'not_indexed', 'crawled_not_indexed',
  'discovered_not_indexed', 'noindex', 'blocked_robots',
  'error', 'unknown'
);

CREATE TABLE gsc_indexation_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sitemap_url_id UUID NOT NULL REFERENCES gsc_sitemap_urls(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES gsc_sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  verdict gsc_indexation_verdict DEFAULT 'unknown',
  coverage_state TEXT,               -- Raw Google coverageState string
  last_crawl_time TIMESTAMPTZ,
  crawled_as TEXT,                    -- 'DESKTOP' | 'MOBILE'
  robots_txt_state TEXT,             -- 'ALLOWED' | 'DISALLOWED'
  indexing_state TEXT,               -- 'INDEXING_ALLOWED' | 'BLOCKED_BY_META_TAG' etc.
  page_fetch_state TEXT,             -- 'SUCCESSFUL' | 'NOT_FOUND' etc.
  google_canonical TEXT,
  inspected_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (site_id, url)
);
-- RLS: tenant_id = auth.uid()
-- Index: (site_id, verdict), (tenant_id), (inspected_at)
```

**`gsc_indexation_queue`** — File d'attente de soumission (Indexing API)
```sql
CREATE TYPE gsc_queue_status AS ENUM (
  'pending', 'submitted', 'failed', 'quota_exceeded'
);

CREATE TABLE gsc_indexation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES gsc_sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('URL_UPDATED', 'URL_DELETED')),
  status gsc_queue_status DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (site_id, url, action)
);
-- RLS: tenant_id = auth.uid()
-- Index: (site_id, status), (tenant_id)
```

**`gsc_indexation_settings`** — Config auto-indexation par site
```sql
CREATE TABLE gsc_indexation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES gsc_sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_index_new BOOLEAN DEFAULT false,
  auto_index_updated BOOLEAN DEFAULT false,
  last_sitemap_hash TEXT,            -- MD5 du sitemap pour detecter les changements
  last_sitemap_check_at TIMESTAMPTZ,
  daily_quota_used INTEGER DEFAULT 0,
  daily_quota_reset_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (site_id)
);
-- RLS: tenant_id = auth.uid()
```

**`gsc_indexation_history`** — Historique journalier pour le graphique
```sql
CREATE TABLE gsc_indexation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES gsc_sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,
  total_urls INTEGER DEFAULT 0,
  indexed INTEGER DEFAULT 0,
  not_indexed INTEGER DEFAULT 0,
  crawled_not_indexed INTEGER DEFAULT 0,
  discovered_not_indexed INTEGER DEFAULT 0,
  noindex INTEGER DEFAULT 0,
  blocked_robots INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  unknown INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (site_id, stat_date)
);
-- RLS: tenant_id = auth.uid()
```

#### RPCs a creer

**`get_gsc_indexation_overview`** — Stats pour le dashboard indexation
```sql
-- Params: p_tenant_id UUID, p_site_id UUID
-- Returns: { total, indexed, not_indexed, crawled_not_indexed, discovered_not_indexed,
--            noindex, blocked_robots, errors, unknown, history: [{date, indexed, not_indexed}] }
```

**`get_gsc_indexation_urls`** — Liste paginee avec filtres
```sql
-- Params: p_tenant_id, p_site_id, p_verdict (optional), p_search (optional),
--         p_url_filter_rule (optional), p_url_filter_value (optional),
--         p_limit, p_offset, p_source (optional)
-- Returns: { urls: [...], total }
```

**`get_gsc_queue_stats`** — Stats file d'attente
```sql
-- Params: p_tenant_id, p_site_id
-- Returns: { total_submitted, pending, submitted, failed, daily_quota_used, daily_quota_limit }
```

#### Types TypeScript a ajouter (`my-app/src/lib/gsc/types.ts`)

```typescript
// Verdicts d'indexation
type GscIndexationVerdict =
  | 'indexed' | 'not_indexed' | 'crawled_not_indexed'
  | 'discovered_not_indexed' | 'noindex' | 'blocked_robots'
  | 'error' | 'unknown'

// URL avec statut d'indexation (vue combinee)
interface GscIndexationUrl {
  id: string
  url: string
  source: 'sitemap' | 'product' | 'blog' | 'manual'
  source_id: string | null
  verdict: GscIndexationVerdict
  coverage_state: string | null
  last_crawl_time: string | null
  inspected_at: string | null
  lastmod: string | null
  is_active: boolean
}

// Reponse overview
interface GscIndexationOverview {
  total: number
  indexed: number
  not_indexed: number
  crawled_not_indexed: number
  discovered_not_indexed: number
  noindex: number
  blocked_robots: number
  errors: number
  unknown: number
  history: Array<{ date: string; indexed: number; not_indexed: number }>
}

// Stats queue
interface GscQueueStats {
  total_submitted: number
  pending: number
  submitted: number
  failed: number
  daily_quota_used: number
  daily_quota_limit: number
}

// Settings auto-indexation
interface GscIndexationSettings {
  auto_index_new: boolean
  auto_index_updated: boolean
}

// Sitemap entry parsed
interface GscSitemapEntry {
  url: string
  lastmod: string | null
}
```

#### Fichiers
| Fichier | Action |
|---------|--------|
| `supabase/migrations/20260222400001_create_gsc_indexation.sql` | Creer |
| `my-app/src/lib/gsc/types.ts` | Modifier (ajouter les types ci-dessus) |

---

### Feature 2 : API Backend (Routes + Client Google)
**Depend de : Feature 1**

#### 2a. Modifier le scope OAuth

**Fichier :** `my-app/src/app/api/gsc/oauth/authorize/route.ts`

Changer les scopes :
```typescript
const scopes = [
    'https://www.googleapis.com/auth/webmasters',       // read-write (remplace readonly)
    'https://www.googleapis.com/auth/indexing',          // Indexing API
    'https://www.googleapis.com/auth/userinfo.email',
];
```

#### 2b. Ajouter fonctions au client GSC

**Fichier :** `my-app/src/lib/gsc/client.ts`

```typescript
// Parse un sitemap XML (gere sitemapindex recursif)
async function parseSitemap(siteUrl: string): Promise<GscSitemapEntry[]>

// URL Inspection API — inspecte une URL
async function inspectUrl(
  accessToken: string,
  inspectionUrl: string,
  siteUrl: string
): Promise<UrlInspectionResult>

// Indexing API — soumet une URL
async function submitUrlForIndexing(
  accessToken: string,
  url: string,
  type: 'URL_UPDATED' | 'URL_DELETED'
): Promise<UrlNotificationMetadata>

// Indexing API — batch (max 100 URLs)
async function submitUrlsBatch(
  accessToken: string,
  urls: Array<{ url: string; type: 'URL_UPDATED' | 'URL_DELETED' }>
): Promise<BatchResult[]>

// Mapper la reponse URL Inspection vers notre verdict
function mapInspectionToVerdict(result: UrlInspectionResult): GscIndexationVerdict
```

**Logique de mapping `mapInspectionToVerdict` :**
| Signal | Verdict FLOWZ |
|--------|---------------|
| `verdict == 'PASS'` | `'indexed'` |
| `verdict == 'NEUTRAL'` + coverageState contient "Crawled" | `'crawled_not_indexed'` |
| `verdict == 'NEUTRAL'` + coverageState contient "Discovered" | `'discovered_not_indexed'` |
| `indexingState == 'BLOCKED_BY_META_TAG'` ou `'BLOCKED_BY_HTTP_HEADER'` | `'noindex'` |
| `robotsTxtState == 'DISALLOWED'` | `'blocked_robots'` |
| `verdict == 'FAIL'` | `'error'` |
| `verdict == 'NEUTRAL'` (autre) | `'not_indexed'` |
| Sinon | `'unknown'` |

#### 2c. Routes API

**`POST /api/gsc/sitemap`** — Fetch + parse sitemap, upsert dans `gsc_sitemap_urls`
```
Body: { siteId: string }
Response: { urls: GscSitemapEntry[], total: number, new: number, removed: number }
```
- Fetch le sitemap XML du site (derive de `gsc_sites.site_url` + `/sitemap.xml`)
- Gerer les sitemap index (recursif)
- Enrichir avec les URLs produits/blog de la base FLOWZ (JOIN sur products.permalink et blog_posts.slug)
- Upsert dans `gsc_sitemap_urls`, marquer `is_active = false` les URLs disparues

**`POST /api/gsc/indexation/inspect`** — Verifier le statut d'indexation
```
Body: { siteId: string, urls?: string[] }  // si urls vide = batch toutes les URLs
Response: { inspected: number, results: GscIndexationUrl[] }
```
- Respecter le quota (2000/jour) — verifier `gsc_indexation_settings.daily_quota_used`
- Prioriser : URLs jamais inspectees > URLs les plus anciennes
- Upsert dans `gsc_indexation_status`
- Mettre a jour `gsc_indexation_history` pour la date du jour

**`POST /api/gsc/indexation/submit`** — Soumettre des URLs pour indexation
```
Body: { siteId: string, urls: string[] }
Response: { submitted: number, queued: number, quota_remaining: number }
```
- Verifier le quota (200/jour)
- Si <= quota restant : soumettre directement via Indexing API
- Si > quota : inserer dans `gsc_indexation_queue` avec status `pending`
- Utiliser batch multipart si > 1 URL

**`GET /api/gsc/indexation/overview`** — Dashboard stats
```
Query: ?siteId=xxx
Response: GscIndexationOverview
```
- Appelle le RPC `get_gsc_indexation_overview`

**`GET /api/gsc/indexation/urls`** — Liste paginee
```
Query: ?siteId=xxx&page=1&perPage=50&verdict=indexed&search=produit&filterRule=contains&filterValue=/produit/
Response: { urls: GscIndexationUrl[], total: number }
```
- Appelle le RPC `get_gsc_indexation_urls`

**`GET /api/gsc/indexation/queue`** — Stats queue
```
Query: ?siteId=xxx
Response: GscQueueStats
```

**`PUT /api/gsc/indexation/settings`** — Modifier les settings auto-indexation
```
Body: { siteId: string, auto_index_new: boolean, auto_index_updated: boolean }
Response: GscIndexationSettings
```

#### Fichiers
| Fichier | Action |
|---------|--------|
| `my-app/src/app/api/gsc/oauth/authorize/route.ts` | Modifier (scopes) |
| `my-app/src/lib/gsc/client.ts` | Modifier (ajouter 5 fonctions) |
| `my-app/src/app/api/gsc/sitemap/route.ts` | Creer |
| `my-app/src/app/api/gsc/indexation/inspect/route.ts` | Creer |
| `my-app/src/app/api/gsc/indexation/submit/route.ts` | Creer |
| `my-app/src/app/api/gsc/indexation/overview/route.ts` | Creer |
| `my-app/src/app/api/gsc/indexation/urls/route.ts` | Creer |
| `my-app/src/app/api/gsc/indexation/queue/route.ts` | Creer |
| `my-app/src/app/api/gsc/indexation/settings/route.ts` | Creer |

---

### Feature 3 : Hooks TanStack Query
**Depend de : Feature 2**

#### `useGscSitemap.ts`
```typescript
export function useGscSitemap(siteId: string | null) {
  // Query: fetch sitemap URLs (read from DB cache)
  // Mutation: refreshSitemap() → POST /api/gsc/sitemap
  // Returns: { urls, total, isLoading, refreshSitemap, isRefreshing }
}
// QueryKey: ["gsc-sitemap", siteId]
```

#### `useGscIndexation.ts`
```typescript
export function useGscIndexation(siteId: string | null, options?: {
  page?: number, perPage?: number, verdict?: GscIndexationVerdict,
  search?: string, filterRule?: string, filterValue?: string
}) {
  // Query overview: GET /api/gsc/indexation/overview
  // Query urls: GET /api/gsc/indexation/urls (paginated)
  // Mutation inspect: POST /api/gsc/indexation/inspect
  // Mutation submit: POST /api/gsc/indexation/submit
  // Returns: { overview, urls, total, isLoading, inspect, isInspecting, submit, isSubmitting }
}
// QueryKeys: ["gsc-indexation-overview", siteId], ["gsc-indexation-urls", siteId, ...params]
```

#### `useGscIndexationQueue.ts`
```typescript
export function useGscIndexationQueue(siteId: string | null) {
  // Query: GET /api/gsc/indexation/queue
  // Returns: { stats: GscQueueStats, isLoading }
}
// QueryKey: ["gsc-indexation-queue", siteId]
```

#### `useGscIndexationSettings.ts`
```typescript
export function useGscIndexationSettings(siteId: string | null) {
  // Query: GET /api/gsc/indexation/settings (from gsc_indexation_settings)
  // Mutation: updateSettings → PUT /api/gsc/indexation/settings
  // Returns: { settings, isLoading, updateSettings, isUpdating }
}
// QueryKey: ["gsc-indexation-settings", siteId]
```

#### Fichiers
| Fichier | Action |
|---------|--------|
| `my-app/src/hooks/integrations/useGscSitemap.ts` | Creer |
| `my-app/src/hooks/integrations/useGscIndexation.ts` | Creer |
| `my-app/src/hooks/integrations/useGscIndexationQueue.ts` | Creer |
| `my-app/src/hooks/integrations/useGscIndexationSettings.ts` | Creer |

---

### Feature 4 : Composants UI
**Depend de : Feature 3**

#### Architecture des composants

```
GscSeoPage.tsx (MODIFIER — remplacer PlaceholderTab indexation)
  └── GscIndexationTab.tsx (CREER — orchestrateur principal)
        ├── GscIndexationToolbar.tsx (CREER)
        │     ├── Bouton "Actualiser sitemap"
        │     ├── Bouton settings auto-indexation → ouvre GscAutoIndexSettings
        │     └── Bouton "Ajouter des pages manuellement"
        ├── Tabs internes : "Pages du sitemap" | "Pages en attente"
        │
        ├── [Tab: Pages du sitemap]
        │     ├── GscIndexationChart.tsx (CREER — barres empilees Recharts)
        │     ├── GscIndexationStatusBar.tsx (CREER — barre proportionnelle)
        │     ├── GscIndexationFilters.tsx (CREER — recherche + filtre avance)
        │     └── GscIndexationUrlList.tsx (CREER — liste paginee)
        │           └── GscIndexationUrlRow.tsx (CREER — ligne individuelle)
        │
        └── [Tab: Pages en attente]
              └── GscIndexationQueueTab.tsx (CREER)
                    ├── 3 KPI cards (soumises, en attente, total)
                    ├── Chart soumissions au fil du temps
                    └── Liste des URLs en queue

GscAutoIndexSettings.tsx (CREER — Dialog/modal parametres)
```

#### Details des composants cles

**`GscIndexationTab.tsx`** — Composant principal
- Recoit `siteId` en prop
- Utilise `useGscIndexation`, `useGscSitemap`, `useGscIndexationQueue`
- State local : `activeSubTab` ('sitemap' | 'queue'), filtres, pagination
- Layout : Toolbar > SubTabs > Content

**`GscIndexationChart.tsx`** — Graphique historique (Recharts)
- Barres empilees : vert (indexe) + gris (non indexe)
- Periode : 30 derniers jours
- Donnees : `overview.history`
- Utilise Recharts `<BarChart>` + `<Bar stackId="a">` (comme `GscPerformanceChart`)
- Hauteur fixe ~200px

**`GscIndexationStatusBar.tsx`** — Barre de distribution
- Full-width horizontal bar avec segments proportionnels
- Chaque segment = un verdict avec sa couleur
- Tooltip au hover montrant le count + %
- Couleurs :
  - `indexed` → emerald/green (CSS var `--chart-2` ou `text-success`)
  - `not_indexed` → red (`text-destructive`)
  - `crawled_not_indexed` → orange (`text-warning`)
  - `discovered_not_indexed` → amber
  - `noindex` → slate/gris
  - `blocked_robots` → slate/gris
  - `error` → red fonce
  - `unknown` → gris clair

**`GscIndexationFilters.tsx`** — Zone de recherche + filtres avances
- Input "Filtrer par nom" (search debounced 300ms)
- Bouton "Rechercher" (refresh)
- Bouton filtre (entonnoir) → toggle panneau avance
- Panneau avance :
  - Select regle : contient / ne contient pas / commence par / se termine par
  - Input valeur
  - Bouton "Filtrer"
  - Bouton "Indexer X pages" (soumission en masse des URLs filtrees)

**`GscIndexationUrlList.tsx`** — Liste paginee
- Table ou liste virtuelle
- Par ligne :
  - Dot colore (verdict)
  - URL path (relative, tronquee si longue)
  - Icone lien externe (ouvre la page)
  - Bouton eclair (soumettre pour indexation)
- Pagination en bas (< 1 2 3 4 >), 50 URLs/page
- Skeleton loading pendant fetch

**`GscAutoIndexSettings.tsx`** — Modal parametres
- Dialog shadcn/ui
- 2 switches :
  - "Indexer les nouvelles pages automatiquement"
  - "Indexer les pages mises a jour"
- Boutons Fermer / Enregistrer
- Utilise `useGscIndexationSettings`

**`GscIndexationQueueTab.tsx`** — Onglet file d'attente
- 3 KPI cards en haut : soumises, en attente, total (avec %)
- Chart barres des soumissions quotidiennes
- Liste des URLs soumises avec timestamp + statut (check vert / horloge / erreur)

#### Fichiers
| Fichier | Action |
|---------|--------|
| `my-app/src/features/gsc/components/GscSeoPage.tsx` | Modifier |
| `my-app/src/features/gsc/components/GscIndexationTab.tsx` | Creer |
| `my-app/src/features/gsc/components/GscIndexationToolbar.tsx` | Creer |
| `my-app/src/features/gsc/components/GscIndexationChart.tsx` | Creer |
| `my-app/src/features/gsc/components/GscIndexationStatusBar.tsx` | Creer |
| `my-app/src/features/gsc/components/GscIndexationFilters.tsx` | Creer |
| `my-app/src/features/gsc/components/GscIndexationUrlList.tsx` | Creer |
| `my-app/src/features/gsc/components/GscIndexationUrlRow.tsx` | Creer |
| `my-app/src/features/gsc/components/GscIndexationQueueTab.tsx` | Creer |
| `my-app/src/features/gsc/components/GscAutoIndexSettings.tsx` | Creer |

---

### Feature 5 : Edge Function Cron (Auto-indexation)
**Depend de : Features 1 + 2**

#### `supabase/functions/gsc-indexation-cron/index.ts`

Declenchee toutes les 2h via pg_cron.

**Workflow :**
1. Lister tous les `gsc_indexation_settings` avec `auto_index_new = true` OU `auto_index_updated = true`
2. Pour chaque site :
   a. Fetch le sitemap XML
   b. Calculer le hash MD5 → comparer avec `last_sitemap_hash`
   c. Si change :
      - Detecter les nouvelles URLs (pas dans `gsc_sitemap_urls`)
      - Detecter les URLs modifiees (`lastmod` change)
      - Si `auto_index_new` → inserer les nouvelles dans `gsc_indexation_queue`
      - Si `auto_index_updated` → inserer les modifiees dans `gsc_indexation_queue`
   d. Traiter la queue (`status = 'pending'`) :
      - Verifier le quota restant (200 - `daily_quota_used`)
      - Soumettre en batch via Indexing API (max 100/batch)
      - Mettre a jour les statuts dans la queue
      - Reset `daily_quota_used` si `daily_quota_reset_at < today`
3. Batch URL Inspection pour les URLs jamais inspectees ou > 7 jours
   - Max 200 inspections par run (pour rester dans le quota de 2000/jour)
   - Upsert dans `gsc_indexation_status`
4. Snapshot `gsc_indexation_history` pour la date du jour

#### Migration cron
```sql
-- 20260222400002_schedule_gsc_indexation_cron.sql
SELECT cron.schedule(
  'gsc-indexation-2h',
  '15 */2 * * *',  -- toutes les 2h a :15
  $$ SELECT net.http_post(...) $$
);
```

#### Fichiers
| Fichier | Action |
|---------|--------|
| `supabase/functions/gsc-indexation-cron/index.ts` | Creer |
| `supabase/migrations/20260222400002_schedule_gsc_indexation_cron.sql` | Creer |

---

## Ordre d'implementation

```
Feature 1 (Schema + Types)
    │
    ├──→ Feature 2 (API Backend)
    │         │
    │         └──→ Feature 3 (Hooks)
    │                   │
    │                   └──→ Feature 4 (UI)
    │
    └──→ Feature 5 (Edge Function Cron)
```

**Sequence d'agents recommandee :**
1. `/flowz-supabase` → Feature 1 (migration + types)
2. `/flowz-frontend` → Features 2 + 3 (API routes + client + hooks)
3. `/flowz-frontend` → Feature 4 (composants UI)
4. `/flowz-supabase` → Feature 5 (edge function + cron migration)
5. `/flowz-ds-enforce` → Audit conformite design system sur Feature 4

## Resume des fichiers (27 total)

| # | Fichier | Action | Feature |
|---|---------|--------|---------|
| 1 | `supabase/migrations/20260222400001_create_gsc_indexation.sql` | Creer | F1 |
| 2 | `my-app/src/lib/gsc/types.ts` | Modifier | F1 |
| 3 | `my-app/src/app/api/gsc/oauth/authorize/route.ts` | Modifier | F2 |
| 4 | `my-app/src/lib/gsc/client.ts` | Modifier | F2 |
| 5 | `my-app/src/app/api/gsc/sitemap/route.ts` | Creer | F2 |
| 6 | `my-app/src/app/api/gsc/indexation/inspect/route.ts` | Creer | F2 |
| 7 | `my-app/src/app/api/gsc/indexation/submit/route.ts` | Creer | F2 |
| 8 | `my-app/src/app/api/gsc/indexation/overview/route.ts` | Creer | F2 |
| 9 | `my-app/src/app/api/gsc/indexation/urls/route.ts` | Creer | F2 |
| 10 | `my-app/src/app/api/gsc/indexation/queue/route.ts` | Creer | F2 |
| 11 | `my-app/src/app/api/gsc/indexation/settings/route.ts` | Creer | F2 |
| 12 | `my-app/src/hooks/integrations/useGscSitemap.ts` | Creer | F3 |
| 13 | `my-app/src/hooks/integrations/useGscIndexation.ts` | Creer | F3 |
| 14 | `my-app/src/hooks/integrations/useGscIndexationQueue.ts` | Creer | F3 |
| 15 | `my-app/src/hooks/integrations/useGscIndexationSettings.ts` | Creer | F3 |
| 16 | `my-app/src/features/gsc/components/GscSeoPage.tsx` | Modifier | F4 |
| 17 | `my-app/src/features/gsc/components/GscIndexationTab.tsx` | Creer | F4 |
| 18 | `my-app/src/features/gsc/components/GscIndexationToolbar.tsx` | Creer | F4 |
| 19 | `my-app/src/features/gsc/components/GscIndexationChart.tsx` | Creer | F4 |
| 20 | `my-app/src/features/gsc/components/GscIndexationStatusBar.tsx` | Creer | F4 |
| 21 | `my-app/src/features/gsc/components/GscIndexationFilters.tsx` | Creer | F4 |
| 22 | `my-app/src/features/gsc/components/GscIndexationUrlList.tsx` | Creer | F4 |
| 23 | `my-app/src/features/gsc/components/GscIndexationUrlRow.tsx` | Creer | F4 |
| 24 | `my-app/src/features/gsc/components/GscIndexationQueueTab.tsx` | Creer | F4 |
| 25 | `my-app/src/features/gsc/components/GscAutoIndexSettings.tsx` | Creer | F4 |
| 26 | `supabase/functions/gsc-indexation-cron/index.ts` | Creer | F5 |
| 27 | `supabase/migrations/20260222400002_schedule_gsc_indexation_cron.sql` | Creer | F5 |
