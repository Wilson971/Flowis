# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FLOWZ v1.0 is a Next.js 16 SaaS application for AI-powered e-commerce content management. Core features include FloWriter (AI blog generator with SSE streaming), Photo Studio (AI product photography with batch processing), multi-platform sync (WooCommerce/Shopify), product description optimization, and SEO analysis.

## Development Commands

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

All commands run from root directory (they proxy to `my-app/` via npm --prefix).

### Supabase Commands

```bash
supabase link --project-ref YOUR_PROJECT_REF  # Link to remote project
supabase db push                               # Apply migrations to remote
supabase functions deploy <name>               # Deploy edge function
supabase gen types typescript --local > types/supabase.ts  # Generate types
```

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Styling**: Tailwind CSS v4 (CSS-first with @theme)
- **UI**: shadcn/ui (New York style), Radix primitives
- **State**: TanStack Query (server state), React Hook Form + Zod v4 (forms)
- **Database**: Supabase (PostgreSQL with RLS)
- **AI**: Google GenAI (@google/genai) - Gemini 2.0 Flash
- **Editor**: TipTap v3 for rich text
- **Animations**: Framer Motion

## Architecture

### Directory Structure

```
my-app/src/
├── app/                    # Next.js App Router
│   ├── api/flowriter/      # SSE streaming endpoint for AI generation
│   ├── app/                # Protected routes (/app/*)
│   │   ├── blog/           # Blog management + FloWriter wizard
│   │   ├── products/       # Product CRUD + batch AI
│   │   └── overview/       # Dashboard
│   └── login/              # Auth pages
├── components/
│   ├── ui/                 # 40+ shadcn/ui components
│   ├── article-editor/     # TipTap editor with AI actions
│   ├── blog-ai/            # FloWriter wizard steps
│   └── layout/             # Sidebar, header, navigation
├── features/
│   ├── photo-studio/       # AI product photography
│   │   ├── components/     # PhotoStudioPage, StudioBatchPanel, BatchProgress...
│   │   ├── hooks/          # useStudioJobs, useBatchStudioJobs
│   │   ├── constants/      # Scene presets
│   │   └── types/          # StudioJobStatus, BatchAction
│   ├── products/           # Product editor feature module
│   └── seo-analysis/       # SEO scoring & recommendations
├── hooks/                  # Domain-specific hooks (blog/, products/, sync/)
├── lib/
│   ├── supabase/           # Browser & server clients
│   ├── design-system/      # FLOWZ DS tokens & styles
│   └── ai/                 # Google GenAI config
├── schemas/                # Zod validation (flowriter.ts, article-editor.ts)
├── types/                  # TypeScript interfaces
└── contexts/               # Auth, Theme, Store, Sidebar contexts

supabase/
└── migrations/             # SQL migrations with RLS policies
```

### Data Flow

```
Component → Custom Hook → TanStack Query → Supabase Client → RLS-protected DB
```

### AI Generation Flow (FloWriter)

```
Client POST /api/flowriter/stream → Zod validation → Prompt construction →
Google GenAI.generateContentStream() → SSE chunks → Client receives real-time progress
```

## Key Patterns

### Supabase Clients

```typescript
// Client-side (browser)
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// Server-side (API routes, server components)
import { createClient } from '@/lib/supabase/server'
```

### Forms with Validation

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { articleEditorSchema } from '@/schemas/article-editor'

const form = useForm({
  resolver: zodResolver(articleEditorSchema),
  defaultValues: { ... }
})
```

### TanStack Query

```typescript
// Queries use consistent keys
const { data, isLoading } = useQuery({
  queryKey: ['blog-posts', { page, status }],
  queryFn: fetchPosts,
  staleTime: 60_000
})

// Mutations invalidate related queries
const mutation = useMutation({
  mutationFn: updateProduct,
  onSuccess: () => queryClient.invalidateQueries(['products'])
})
```

### FLOWZ Design System

**CRITICAL: All UI code MUST follow `my-app/src/lib/design-system/CONVENTIONS.md`.**

```typescript
import { cn } from '@/lib/utils'
import { styles, motionTokens, typographyTokens } from '@/lib/design-system'

// Cards: styles.card.base / elevated / glass / interactive / lift
// Text: styles.text.h1 / h2 / h3 / h4 / body / bodyMuted / label
// Layout: styles.layout.gridCols3 / flexBetween / pageContainer
// Badges: cn(styles.badge.base, styles.badge.success, styles.badge.md)
// Motion: motionTokens.variants.fadeIn / slideUp / staggerContainer
// Transitions: motionTokens.transitions.default / fast / slow / spring
```

### Design System Rules (ENFORCED)

1. **NO hardcoded colors** - Use CSS variables only (`text-foreground`, `bg-card`, `text-primary`)
2. **NO arbitrary text sizes** - Use `styles.text.*` or `typographyTokens.scale.*`
3. **NO local Framer Motion variants** - Use `motionTokens.variants.*`
4. **NO hardcoded durations** - Use `motionTokens.transitions.*`
5. **NO import from `@/lib/motion`** - Legacy file, use `@/lib/design-system`
6. **NO `p-5`** - Use `p-4` (compact) or `p-6` (standard)
7. **NO `rounded-md`** - Use `rounded-lg` (buttons/inputs) or `rounded-xl` (cards)
8. **ALWAYS use `cn()`** for combining classes
9. **ALWAYS use shadcn/ui** components (Card, Button, Badge, etc.)

### Class Utilities

```typescript
import { cn } from '@/lib/utils'  // clsx + tailwind-merge
```

## Security Patterns

### Prompt Injection Prevention

FloWriter validates all user input for injection patterns:

```typescript
// Both client (schemas/flowriter.ts) and server (api/flowriter/stream/route.ts)
const SUSPICIOUS_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/i,
  /system\s*prompt:/i,
  // ...10+ patterns
]
```

### Row Level Security

All Supabase tables use RLS policies checking `auth.uid()` against `tenant_id` (NOT `user_id`). This is the standard column name across the schema.

## API Routes

### FloWriter SSE Endpoint

`POST /api/flowriter/stream` - Streaming article generation

- Runtime: Node.js with 5-minute timeout
- Retry: Exponential backoff (3 attempts)
- Events: `connected`, `progress`, `chunk`, `complete`, `error`, `heartbeat`
- Token tracking with cost estimation

Request body:
```typescript
{
  topic: string,
  title: string,
  outline: OutlineItem[],
  config: {
    style: 'Journalistique' | 'Académique' | 'Tutorial' | 'Storytelling' | 'Blog Lifestyle',
    tone: 'Expert' | 'Narratif' | 'Minimaliste' | 'Inspirant' | 'Conversationnel',
    persona: 'beginner' | 'intermediate' | 'expert',
    targetWordCount: number,
    language: 'fr' | 'en' | ...
  }
}
```

## Component Guidelines

### Use Client Directive

All interactive components need `"use client"` at the top. Server components are default.

### Navigation

Use Next.js navigation exclusively:
```typescript
import { useRouter } from 'next/navigation'
import Link from 'next/link'

router.push(`/app/blog/editor/${articleId}`)
```

### TipTap v3

- BubbleMenu is not available as React component in v3
- Use conditional toolbars instead of floating menus
- Import extensions from their packages

## Environment Variables

Required in `.env.local` (within `my-app/`):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key
- `GEMINI_API_KEY` - Google GenAI API key (server-side only)

## Supabase

Migrations are in `supabase/migrations/`. Key tables:
- `blog_posts` - Articles with editor_state JSON
- `products` - Product catalog with variations
- `sync_queue` - WooCommerce/Shopify sync jobs
- `profiles` - User profiles linked to auth.users
- `stores` - Connected e-commerce stores with platform credentials
- `article_sync_logs` - Sync history per platform
- `scheduled_publications` - Scheduled publishing jobs
- `studio_jobs` - Photo Studio AI jobs (per product). Columns: `tenant_id`, `product_id`, `batch_id` (FK to `batch_jobs.id`), `action` (enum `studio_action`), `status`, `input_urls`, `output_urls`, `preset_json`, `error_message`
- `batch_jobs` - Parent table for batch operations. Columns: `tenant_id`, `content_types` (jsonb), `settings` (jsonb), `status`, `total_items`, `processed_items`, `successful_items`, `failed_items`

**Important schema notes:**
- All RLS tables use `tenant_id` (NOT `user_id`) for the ownership column
- `studio_jobs.batch_id` has FK constraint to `batch_jobs.id` - parent row must exist before inserting jobs
- `studio_action` enum values: `remove_bg`, `replace_bg`, `enhance`, `generate_angles`, `generate_scene`, `replace_bg_white`, `replace_bg_studio`, `replace_bg_marble`, `replace_bg_wood`, `enhance_light`, `enhance_color`, `harmonize`, `magic_edit`

To apply migrations: `supabase db push`

## Important Files

- `my-app/src/app/api/flowriter/stream/route.ts` - Main AI generation endpoint
- `my-app/src/schemas/flowriter.ts` - Zod schemas with security validation
- `my-app/src/lib/design-system/` - FLOWZ design tokens
- `my-app/src/hooks/blog/` - Blog/article CRUD and AI actions
- `my-app/src/components/article-editor/` - TipTap editor with AI features
- `my-app/src/features/photo-studio/` - Photo Studio feature module
- `my-app/src/features/photo-studio/hooks/useStudioJobs.ts` - Single job CRUD + polling
- `my-app/src/features/photo-studio/hooks/useBatchStudioJobs.ts` - Batch job creation + progress polling

## Hooks Organization

Hooks are organized by domain in `my-app/src/hooks/`:
- `blog/` - useBlogArticle, useFlowriterState, useAIEditorActions, useArticleSync
- `products/` - useProduct, useProductContent, useBatchGeneration, useSeoAnalysis
- `stores/` - useStores, useStoreHeartbeat, useStoreSyncSettings
- `sync/` - useSyncManager, useSyncProgress, useUnifiedSync
- `analytics/` - useDashboardStats, useRecentActivity

Feature-scoped hooks in `my-app/src/features/`:
- `photo-studio/hooks/` - useStudioJobs (per-product polling), useBatchStudioJobs (batch creation + progress)
- `products/hooks/` - useProductEditor, useProductForm

## Article Editor Workflow

Two distinct flows for blog content:
1. **FloWriter** (`/app/blog/flowriter`) - 6-step AI wizard for generating articles
2. **Standalone Editor** (`/app/blog/editor/:id`) - Manual editing with contextual AI actions

FloWriter generates drafts → User edits in Standalone Editor → Publish/Schedule

## Photo Studio Workflow

AI-powered product photography with batch processing:

```
Product selection → Choose action (remove_bg, replace_bg, enhance, generate_angles, generate_scene)
→ Optional preset selection → Create batch_jobs parent row → Insert studio_jobs per product
→ Poll progress every 3s → Completion notification → Retry failed jobs
```

Key components:
- `PhotoStudioPage` - Main page with product grid + selection
- `StudioBatchPanel` - Bottom action bar for batch configuration
- `BatchStudioProgressPanel` - Real-time progress with per-job status

## Design Conventions (MANDATORY)

**Full reference: `my-app/src/lib/design-system/CONVENTIONS.md`**

### Quick Reference

```
SPACING: p-4 (compact) | p-6 (standard) | gap-2 (tight) | gap-4 (default) | space-y-6 (sections)
RADIUS:  rounded-lg (buttons/inputs) | rounded-xl (cards) | rounded-2xl (modals) | rounded-full (badges)
SHADOWS: shadow-sm | shadow-md | shadow-lg | shadow-xl | shadow-glow-sm
Z-INDEX: z-10 (elevated) | z-20 (dropdown) | z-30 (sticky) | z-40 (overlay) | z-50 (modal)

MOTION ENTRY:
  Page content   -> motionTokens.variants.slideUp
  Lists/Grids    -> motionTokens.variants.staggerContainer + staggerItem
  Modals         -> motionTokens.variants.modal + backdrop
  Tooltips       -> motionTokens.variants.tooltip
  Interactive    -> motionTokens.variants.tap / hoverLift / hoverScale

TRANSITIONS:
  Default (300ms) -> motionTokens.transitions.default
  Fast (200ms)    -> motionTokens.transitions.fast
  Slow (400ms)    -> motionTokens.transitions.slow
  Spring          -> motionTokens.transitions.spring
```

### CSS vs Framer Motion Decision

- **CSS (Tailwind)**: hover states, color transitions, spinners, skeleton loaders
- **Framer Motion**: enter/exit animations, staggered lists, scroll-triggered, page transitions, drag

## Documentation

Additional documentation is in `docs/`:
- `docs/03-development/GETTING_STARTED.md` - Setup guide
- `docs/05-design-system/FLOWZ_DESIGN_MASTER.md` - Design system reference
- `docs/06-specs/CDC-BlogEditor-AI-Sync.md` - Article Editor specifications
- `my-app/src/lib/design-system/CONVENTIONS.md` - **UI/UX/Motion Design Conventions**
