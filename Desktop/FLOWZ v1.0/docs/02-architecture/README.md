# Architecture FLOWZ v1.0

## Vue d'ensemble

FLOWZ est une application SaaS Next.js 16 (App Router) avec React 19, deployee sur Vercel avec un backend Supabase (PostgreSQL + RLS).

```
Browser
  |
  v
Next.js App Router (src/app/)
  |
  +-- Pages / Layouts (RSC + Client Components)
  |     |
  |     v
  +-- Feature Modules (src/features/)
  |     |-- photo-studio/   -> AI product photography
  |     |-- products/        -> Product editor + variations
  |     |-- dashboard/       -> Overview & KPIs
  |     +-- seo-analysis/    -> SEO scoring
  |
  +-- Shared Components (src/components/)
  |     |-- ui/              -> shadcn/ui primitives (40+)
  |     |-- article-editor/  -> TipTap v3 rich editor
  |     |-- blog-ai/         -> FloWriter wizard
  |     +-- layout/          -> Sidebar, header, nav
  |
  +-- Custom Hooks (src/hooks/)
  |     |-- blog/            -> Article CRUD & AI
  |     |-- products/        -> Product queries & mutations
  |     |-- stores/          -> Store management
  |     |-- sync/            -> Multi-platform sync
  |     +-- dashboard/       -> Dashboard KPIs
  |
  +-- Libraries (src/lib/)
        |-- supabase/        -> Client & Server Supabase clients
        |-- design-system/   -> FLOWZ design tokens & conventions
        +-- ai/              -> Google GenAI configuration
```

## Data Flow

```
Component --> Custom Hook --> TanStack Query --> Supabase Client --> RLS-protected DB
                                  |
                                  v
                          Cache + Optimistic Updates
```

## AI Generation Flow (FloWriter)

```
Client POST /api/flowriter/stream
  --> Zod validation (anti-injection)
  --> Prompt construction
  --> Google GenAI.generateContentStream()
  --> SSE chunks
  --> Client receives real-time progress
```

## Modules de fonctionnalites

| Module | Chemin | Description |
|--------|--------|-------------|
| FloWriter | `src/app/app/blog/flowriter/` | Wizard AI 6 etapes pour articles |
| Article Editor | `src/components/article-editor/` | Editeur TipTap avec actions AI |
| Product Editor | `src/features/products/` | Edition produit avec variations |
| Photo Studio | `src/features/photo-studio/` | Photographie AI en batch |
| SEO Analysis | `src/features/seo-analysis/` | Scoring SEO & recommandations |
| Multi-platform Sync | `src/hooks/sync/` | Sync WooCommerce / Shopify |
| Dashboard | `src/features/dashboard/` | Vue d'ensemble & KPIs |

## Decisions architecturales (ADRs)

### ADR-001: Next.js App Router (vs Pages Router)
- **Decision:** App Router avec React Server Components
- **Raison:** Support natif du streaming SSE, layouts imbriques, loading states

### ADR-002: TanStack Query (vs SWR)
- **Decision:** TanStack Query v5 pour la gestion d'etat serveur
- **Raison:** Mutations optimistes, invalidation fine, devtools, staleTime configurable

### ADR-003: Supabase RLS avec tenant_id
- **Decision:** Row Level Security sur `tenant_id` (pas `user_id`)
- **Raison:** Support multi-tenant, isolation des donnees par organisation

### ADR-004: Feature Modules Pattern
- **Decision:** Modules auto-contenus dans `src/features/` avec components/, hooks/, types/, utils/
- **Raison:** Colocation du code lie, imports clairs, testabilite isolee

### ADR-005: Design System Tokens
- **Decision:** Tokens centralises dans `src/lib/design-system/` avec conventions strictes
- **Raison:** Coherence UI, pas de valeurs hardcodees, theming automatique

## Securite

- **Prompt Injection:** Validation Zod avec patterns suspects (client + serveur)
- **RLS:** Toutes les tables Supabase protegees par `auth.uid() = tenant_id`
- **Environment:** Cles API server-side uniquement (`GEMINI_API_KEY`)
- **Input Sanitization:** Schemas Zod sur tous les endpoints API
