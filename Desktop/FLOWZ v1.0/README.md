# FLOWZ v1.0

AI-powered e-commerce content management SaaS. Generate blog articles, optimize product descriptions, manage AI product photography, and sync across platforms.

## Features

- **FloWriter** - AI blog generator with 6-step wizard and SSE streaming (Gemini 2.0 Flash)
- **Photo Studio** - AI product photography: background removal, scene generation, multi-angle views, batch processing
- **Product Editor** - Rich product management with SEO scoring, pricing, variations, and AI-assisted descriptions
- **Multi-platform Sync** - WooCommerce & Shopify bidirectional sync with conflict resolution
- **SEO Analysis** - Real-time SEO scoring, SERP previews, and field-level recommendations
- **Dashboard** - Unified overview with activity feed, stats, and store health monitoring

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| Styling | Tailwind CSS v4 + shadcn/ui (New York) |
| State | TanStack Query + React Hook Form + Zod v4 |
| Database | Supabase (PostgreSQL + RLS) |
| AI | Google GenAI (Gemini 2.0 Flash) |
| Editor | TipTap v3 |
| Animations | Framer Motion |

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase project (with migrations applied)
- Google GenAI API key

### Installation

```bash
git clone <repo-url>
cd "FLOWZ v1.0"
npm install
```

### Environment Variables

Create `my-app/.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

### Database Setup

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### Development

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
npm run lint     # ESLint
```

## Project Structure

```
my-app/src/
├── app/                    # Next.js App Router (pages + API)
├── components/             # Shared UI components (shadcn/ui, layout, editor)
├── features/               # Feature modules (photo-studio, products, seo)
├── hooks/                  # Domain hooks (blog, products, sync, stores)
├── lib/                    # Supabase clients, design system, AI config
├── schemas/                # Zod validation schemas
├── types/                  # TypeScript interfaces
└── contexts/               # React contexts (Auth, Theme, Store)

supabase/
└── migrations/             # SQL migrations with RLS policies
```

## Design System

FLOWZ uses a centralized design system at `my-app/src/lib/design-system/`. All UI code must follow `CONVENTIONS.md`:

- Semantic colors only (no hardcoded hex/rgb)
- Design tokens for spacing, radius, shadows, z-index
- `motionTokens` for all Framer Motion animations
- shadcn/ui components as building blocks

## License

Private - All rights reserved.
