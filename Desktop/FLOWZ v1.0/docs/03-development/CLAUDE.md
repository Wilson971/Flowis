# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FLOWZ v1.0 is a Next.js 16 SaaS application for AI-powered e-commerce content management. Core features include FloWriter (AI blog generator with SSE streaming), multi-platform sync (WooCommerce/Shopify), product description optimization, and SEO analysis.

## Development Commands

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

All commands run from root directory (they proxy to `my-app/` via npm --prefix).

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Styling**: Tailwind CSS v4 (CSS-first with @theme)
- **UI**: shadcn/ui (New York style), Radix primitives
- **State**: TanStack Query (server state), React Hook Form + Zod (forms)
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
├── hooks/                  # Domain-specific hooks (blog/, products/, sync/)
├── lib/
│   ├── supabase/           # Browser & server clients
│   ├── design-system/      # FLOWZ DS tokens & styles
│   └── ai/                 # Google GenAI config
├── schemas/                # Zod validation (flowriter.ts, article-editor.ts)
├── types/                  # TypeScript interfaces
└── contexts/               # Auth, Theme, Store, Sidebar contexts
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

```typescript
import { styles, motionTokens } from '@/lib/design-system'

// Cards: styles.card.base / elevated / glass / interactive
// Badges: cn(styles.badge.base, styles.badge.success, styles.badge.md)
// Motion: motionTokens.variants.fadeIn / slideUp / staggerContainer
```

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

All Supabase tables use RLS policies checking `auth.uid()` against `user_id`.

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

Required in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key
- `GEMINI_API_KEY` - Google GenAI API key
- `VITE_GEMINI_API_KEY` - Client-side Gemini key

## Important Files

- `my-app/src/app/api/flowriter/stream/route.ts` - Main AI generation endpoint
- `my-app/src/schemas/flowriter.ts` - Zod schemas with security validation
- `my-app/src/lib/design-system/` - FLOWZ design tokens
- `my-app/src/hooks/blog/` - Blog/article CRUD and AI actions
- `my-app/src/components/article-editor/` - TipTap editor with AI features
