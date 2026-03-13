# SEO Keyword Research — Service Layer + Usage Tracking

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extraire la logique métier de la route API vers un service layer réutilisable, ajouter le tracking d'usage DataForSEO, et valider les credentials au niveau service.

**Architecture:** Service layer (`lib/services/seo-research.ts`) orchestre cache check → DataForSEO client → insert cache → track usage. La route API devient un thin controller (auth + rate limit + validation + appel service). Le client DataForSEO ajoute une validation explicite des credentials.

**Tech Stack:** Next.js API routes, Supabase (server client), DataForSEO REST API, usage-tracker existant

---

### Task 1: Ajouter validation credentials au client DataForSEO

**Files:**
- Modify: `my-app/src/features/seo/lib/dataforseo-client.ts:18-25`

**Step 1: Ajouter une fonction de validation exportée**

Ajouter avant `getAuthHeader()` :

```typescript
/**
 * Validate that DataForSEO credentials are configured.
 * Throws a descriptive error if missing.
 */
export function validateDataForSeoCredentials(): void {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new Error(
      'DataForSEO non configuré : les variables DATAFORSEO_LOGIN et DATAFORSEO_PASSWORD sont requises dans .env.local'
    );
  }
}
```

**Step 2: Vérifier que le build passe**

Run: `npm run build --prefix my-app`
Expected: BUILD SUCCESS

**Step 3: Commit**

```bash
git add my-app/src/features/seo/lib/dataforseo-client.ts
git commit -m "feat(seo): add explicit credential validation to DataForSEO client"
```

---

### Task 2: Créer le service layer `seo-research.ts`

**Files:**
- Create: `my-app/src/lib/services/seo-research.ts`

**Step 1: Créer le service**

```typescript
/**
 * SEO Keyword Research Service
 *
 * Orchestrates: credential validation → cache check → DataForSEO API → cache insert → usage tracking.
 * Designed to be consumed by API routes and future integrations (FloWriter, Copilot).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  validateDataForSeoCredentials,
  getKeywordSuggestions,
  getRelatedKeywords,
} from '@/features/seo/lib/dataforseo-client';
import { trackAiUsage } from '@/lib/api/usage-tracker';
import type { KeywordResearchResponse } from '@/features/seo/types/keywords';

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/** Estimated cost per DataForSEO API call */
const COST_PER_SUGGESTIONS_CALL = 0.004;
const COST_PER_RELATED_CALL = 0.004;

// ============================================================================
// TYPES
// ============================================================================

export interface ResearchKeywordsParams {
  seed: string;
  location_code: number;
  language_code: string;
  include_related: boolean;
}

// ============================================================================
// SERVICE
// ============================================================================

/**
 * Research keywords for a given seed.
 * Checks 24h cache first, calls DataForSEO on miss, tracks usage.
 */
export async function researchKeywords(
  supabase: SupabaseClient,
  tenantId: string,
  params: ResearchKeywordsParams,
): Promise<KeywordResearchResponse> {
  const { seed, location_code, language_code, include_related } = params;

  // 1. Validate credentials
  validateDataForSeoCredentials();

  // 2. Check cache (24h TTL)
  const cacheThreshold = new Date(Date.now() - CACHE_TTL_MS).toISOString();
  const { data: cached } = await supabase
    .from('keyword_research')
    .select('id, results, related_results')
    .eq('tenant_id', tenantId)
    .eq('seed_keyword', seed.toLowerCase())
    .eq('language', language_code)
    .eq('location_code', location_code)
    .gte('created_at', cacheThreshold)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached) {
    return {
      seed,
      suggestions: cached.results as KeywordResearchResponse['suggestions'],
      related: cached.related_results as KeywordResearchResponse['related'],
      total_count:
        (cached.results as unknown[]).length +
        (cached.related_results as unknown[]).length,
      cached: true,
      research_id: cached.id,
    };
  }

  // 3. Call DataForSEO
  const [suggestions, related] = await Promise.all([
    getKeywordSuggestions(seed, location_code, language_code),
    include_related
      ? getRelatedKeywords(seed, location_code, language_code)
      : Promise.resolve([]),
  ]);

  // 4. Insert cache
  const { data: inserted, error: insertError } = await supabase
    .from('keyword_research')
    .insert({
      tenant_id: tenantId,
      seed_keyword: seed.toLowerCase(),
      results: suggestions,
      related_results: related,
      language: language_code,
      location_code,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('[seo-research] Cache insert error:', insertError.message);
  }

  // 5. Track usage (non-blocking)
  const costUsd =
    COST_PER_SUGGESTIONS_CALL +
    (include_related ? COST_PER_RELATED_CALL : 0);

  trackAiUsage(supabase, {
    tenantId,
    feature: 'seo',
    action: 'keyword_research',
    costUsd,
  }).catch((err) => {
    console.error('[seo-research] Usage tracking error:', err);
  });

  // 6. Return
  return {
    seed,
    suggestions,
    related,
    total_count: suggestions.length + related.length,
    cached: false,
    research_id: inserted?.id ?? '',
  };
}
```

**Step 2: Vérifier que le build passe**

Run: `npm run build --prefix my-app`
Expected: BUILD SUCCESS

**Step 3: Commit**

```bash
git add my-app/src/lib/services/seo-research.ts
git commit -m "feat(seo): add keyword research service layer with cache + usage tracking"
```

---

### Task 3: Refactorer la route API en thin controller

**Files:**
- Modify: `my-app/src/app/api/seo/keywords/route.ts` (remplacer tout le contenu)

**Step 1: Réécrire la route**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { keywordResearchRequestSchema } from '@/features/seo/types/keywords';
import { researchKeywords } from '@/lib/services/seo-research';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  // Auth
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Non authentifié.' } },
      { status: 401 },
    );
  }

  // Rate limit
  const { rateLimitOrNull, RATE_LIMIT_SEO_KEYWORDS } = await import('@/lib/rate-limit');
  const rlResponse = rateLimitOrNull(user.id, 'seo/keywords', RATE_LIMIT_SEO_KEYWORDS);
  if (rlResponse) return rlResponse;

  // Parse + validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: 'Corps invalide.' } },
      { status: 400 },
    );
  }

  const parsed = keywordResearchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Paramètres invalides.', details: parsed.error.issues } },
      { status: 400 },
    );
  }

  // Delegate to service
  try {
    const response = await researchKeywords(supabase, user.id, parsed.data);
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    // Credential config error → 503
    if (message.includes('non configuré')) {
      return NextResponse.json(
        { error: { code: 'SERVICE_UNAVAILABLE', message: 'Service SEO non configuré.' } },
        { status: 503 },
      );
    }

    // DataForSEO API error → 502
    console.error('[SEO Keywords] Service error:', message);
    return NextResponse.json(
      { error: { code: 'DATAFORSEO_ERROR', message: 'Échec de la recherche de mots-clés.' } },
      { status: 502 },
    );
  }
}
```

**Step 2: Vérifier que le build passe**

Run: `npm run build --prefix my-app`
Expected: BUILD SUCCESS

**Step 3: Commit**

```bash
git add my-app/src/app/api/seo/keywords/route.ts
git commit -m "refactor(seo): simplify API route to thin controller using service layer"
```

---

### Task 4: Exporter `validateDataForSeoCredentials` + mettre à jour barrel exports

**Files:**
- Modify: `my-app/src/features/seo/index.ts`

**Step 1: Ajouter l'export du service**

```typescript
// Types
export * from './types/keywords';

// Hooks
export * from './hooks';

// Lib (server-only utilities — import only in API routes / services)
export { validateDataForSeoCredentials } from './lib/dataforseo-client';
```

**Step 2: Vérifier que le build passe**

Run: `npm run build --prefix my-app`
Expected: BUILD SUCCESS

**Step 3: Commit**

```bash
git add my-app/src/features/seo/index.ts
git commit -m "chore(seo): update barrel exports with credential validation"
```

---

### Task 5: Appliquer la migration SQL

**Step 1: Appliquer la migration**

Run: `supabase db push`
Expected: Migration `20260313100001_keyword_research.sql` applied successfully

**Step 2: Vérifier les tables**

Run: `supabase db execute --sql "SELECT table_name FROM information_schema.tables WHERE table_name IN ('keyword_research', 'saved_keywords')"`
Expected: Both tables listed

**Step 3: Vérifier RLS**

Run: `supabase db execute --sql "SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('keyword_research', 'saved_keywords')"`
Expected: `keyword_research_tenant` and `saved_keywords_tenant` policies listed

---

### Task 6: Configurer les variables d'environnement

**Files:**
- Modify: `my-app/.env.local`

**Step 1: Ajouter les credentials DataForSEO**

Ajouter à la fin de `.env.local` :

```
# DataForSEO (keyword research)
DATAFORSEO_LOGIN=your_login_here
DATAFORSEO_PASSWORD=your_password_here
```

**Step 2: Vérifier que l'utilisateur a remplacé les placeholders**

L'utilisateur doit créer un compte sur https://app.dataforseo.com/ et récupérer ses credentials.

---

### Task 7: Vérification end-to-end

**Step 1: Démarrer le serveur de dev**

Run: `npm run dev`

**Step 2: Test sans auth (doit retourner 401)**

```bash
curl -X POST http://localhost:3000/api/seo/keywords \
  -H "Content-Type: application/json" \
  -d '{"seed": "chaussures running"}'
```

Expected: `{"error":{"code":"UNAUTHORIZED","message":"Non authentifié."}}`

**Step 3: Test credentials manquantes**

Temporairement vider `DATAFORSEO_LOGIN` dans `.env.local`, redémarrer, et tester avec auth.
Expected: `{"error":{"code":"SERVICE_UNAVAILABLE","message":"Service SEO non configuré."}}`

**Step 4: Test nominal avec credentials valides**

Avec les vrais credentials et un cookie de session valide, tester :
```bash
curl -X POST http://localhost:3000/api/seo/keywords \
  -H "Content-Type: application/json" \
  -H "Cookie: <session_cookie>" \
  -d '{"seed": "chaussures running"}'
```

Expected: JSON avec `suggestions[]`, `related[]`, `cached: false`

**Step 5: Test du cache**

Relancer la même requête.
Expected: Même résultats avec `cached: true`

**Step 6: Vérifier le tracking**

```sql
SELECT * FROM ai_usage WHERE feature = 'seo' ORDER BY created_at DESC LIMIT 5;
```

Expected: 1 entrée avec `action = 'keyword_research'`, `cost_usd ≈ 0.008`
