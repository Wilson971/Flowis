# Design: SEO Keyword Research — Service Layer + Usage Tracking

**Date:** 2026-03-13
**Status:** Approved

## Context

Le module `features/seo/` a été créé avec le data layer (types, client DataForSEO, hooks, API route, migration SQL). Cette itération restructure l'architecture pour :
- Extraire la logique métier dans un service layer réutilisable
- Ajouter le tracking d'usage (coût DataForSEO par requête)
- Valider les credentials DataForSEO au niveau service

## Decisions

- **Quotas** : tracking coût seulement (pas de hard limit) — le cache 24h + rate limit contrôlent les coûts
- **Copilot** : intégration prévue mais pas dans cette itération
- **FloWriter** : idem, le service layer facilitera l'intégration future
- **Validation env vars** : au niveau service, message d'erreur clair, pas de health check API

## Architecture

```
Consommateurs (API route, futur FloWriter, futur Copilot)
        │
        ▼
┌─────────────────────────┐
│  lib/services/           │
│  seo-research.ts         │  ← Service layer (orchestrateur)
│  - validateCredentials() │
│  - researchKeywords()    │     Cache check → DataForSEO → Insert cache → Track usage
└────────┬────────────────┘
         │
    ┌────┴─────┐
    ▼          ▼
DataForSEO   usage-tracker
 client       trackAiUsage()
```

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `lib/services/seo-research.ts` | Nouveau — service layer |
| `app/api/seo/keywords/route.ts` | Refactor — thin controller |
| `features/seo/lib/dataforseo-client.ts` | Ajout validation credentials |
| `lib/api/usage-tracker.ts` | Ajouter `"seo"` au type feature |

## Service API

```typescript
researchKeywords(
  supabase: SupabaseClient,
  tenantId: string,
  params: { seed, location_code, language_code, include_related }
) → Promise<KeywordResearchResponse>
```

Flow:
1. Valide credentials DataForSEO (throw si manquants)
2. Check cache `keyword_research` (24h TTL)
3. Si miss : DataForSEO suggestions + related en parallèle
4. Insert cache
5. Track usage `trackAiUsage({ feature: 'seo', action: 'keyword_research', costUsd })`
6. Return response

## Coût DataForSEO

~$0.004/requête suggestions + ~$0.004 related = **~$0.008 par recherche complète**.

## Route API simplifiée

```
POST /api/seo/keywords
  → Auth → Rate limit (10/min) → Zod validation
  → seoResearchService.researchKeywords(supabase, userId, params)
  → JSON response
```
