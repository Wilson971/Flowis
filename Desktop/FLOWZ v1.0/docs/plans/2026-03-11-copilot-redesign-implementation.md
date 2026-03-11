# Copilot IA FLOWZ — Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Unified Shell Copilot: Spotlight (Ctrl+K) + enriched Side Panel with rich cards + Proactive Orb with notifications, backed by Gemini 2.5 Pro SSE streaming and Supabase persistence.

**Architecture:** 3-mode frontend (Spotlight modal, Side Panel chat, Orbe proactif) sharing a unified CopilotProvider. Backend: SSE API route calling Gemini 2.5 Pro with function calling, notifications endpoint for proactive suggestions. Supabase tables for conversations, messages, settings, and memory. All UI follows FLOWZ design system conventions.

**Tech Stack:** Next.js 16 App Router, React 19, Google GenAI SDK (Gemini 2.5 Pro), Supabase (RLS), TanStack Query, Zod, SSE, Framer Motion, shadcn/ui, FLOWZ design system tokens

**Design doc:** `docs/plans/2026-03-11-copilot-redesign-design.md`
**Previous backend plan (reference):** `docs/plans/2026-03-11-copilot-ia-implementation.md`

---

## Phase 1: Database, Types & Schemas

### Task 1: Supabase Migration — Extended Copilot Tables

**Files:**
- Create: `supabase/migrations/20260311100000_create_copilot_full.sql`

**Step 1: Write the migration**

```sql
-- ============================================
-- Copilot conversations
-- ============================================
CREATE TABLE IF NOT EXISTS public.copilot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  title text,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ============================================
-- Copilot messages
-- ============================================
CREATE TABLE IF NOT EXISTS public.copilot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.copilot_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  tool_calls jsonb,
  feedback jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- Copilot settings (one row per tenant)
-- ============================================
CREATE TABLE IF NOT EXISTS public.copilot_settings (
  tenant_id uuid PRIMARY KEY,
  personality jsonb NOT NULL DEFAULT '{"style": "balanced", "tone": "friendly"}'::jsonb,
  autonomy jsonb NOT NULL DEFAULT '{"light": "auto", "medium": "confirm", "heavy": "confirm"}'::jsonb,
  notifications jsonb NOT NULL DEFAULT '{"enabled": true, "types": {"seo_critical": true, "drafts_forgotten": true, "gsc_performance": true, "sync_failed": true, "batch_complete": true, "products_unpublished": false}}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- Copilot memory
-- ============================================
CREATE TABLE IF NOT EXISTS public.copilot_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  content text NOT NULL,
  source text NOT NULL DEFAULT 'auto',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_copilot_conversations_tenant ON public.copilot_conversations(tenant_id, updated_at DESC);
CREATE INDEX idx_copilot_conversations_active ON public.copilot_conversations(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_copilot_messages_conversation ON public.copilot_messages(conversation_id, created_at ASC);
CREATE INDEX idx_copilot_memory_tenant ON public.copilot_memory(tenant_id);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_memory ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "copilot_conversations_select" ON public.copilot_conversations
  FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "copilot_conversations_insert" ON public.copilot_conversations
  FOR INSERT WITH CHECK (tenant_id = auth.uid());
CREATE POLICY "copilot_conversations_update" ON public.copilot_conversations
  FOR UPDATE USING (tenant_id = auth.uid());
CREATE POLICY "copilot_conversations_delete" ON public.copilot_conversations
  FOR DELETE USING (tenant_id = auth.uid());

-- Messages policies (via conversation ownership)
CREATE POLICY "copilot_messages_select" ON public.copilot_messages
  FOR SELECT USING (
    conversation_id IN (SELECT id FROM public.copilot_conversations WHERE tenant_id = auth.uid())
  );
CREATE POLICY "copilot_messages_insert" ON public.copilot_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM public.copilot_conversations WHERE tenant_id = auth.uid())
  );

-- Settings policies
CREATE POLICY "copilot_settings_select" ON public.copilot_settings
  FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "copilot_settings_insert" ON public.copilot_settings
  FOR INSERT WITH CHECK (tenant_id = auth.uid());
CREATE POLICY "copilot_settings_update" ON public.copilot_settings
  FOR UPDATE USING (tenant_id = auth.uid());

-- Memory policies
CREATE POLICY "copilot_memory_select" ON public.copilot_memory
  FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "copilot_memory_insert" ON public.copilot_memory
  FOR INSERT WITH CHECK (tenant_id = auth.uid());
CREATE POLICY "copilot_memory_delete" ON public.copilot_memory
  FOR DELETE USING (tenant_id = auth.uid());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_copilot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER copilot_conversations_updated_at
  BEFORE UPDATE ON public.copilot_conversations
  FOR EACH ROW EXECUTE FUNCTION update_copilot_updated_at();

CREATE TRIGGER copilot_settings_updated_at
  BEFORE UPDATE ON public.copilot_settings
  FOR EACH ROW EXECUTE FUNCTION update_copilot_updated_at();
```

**Step 2: Verify migration syntax**

Run: `supabase db push --dry-run` (if available) or review manually.

**Step 3: Commit**

```bash
git add supabase/migrations/20260311100000_create_copilot_full.sql
git commit -m "feat(copilot): add Supabase migration for conversations, messages, settings, memory"
```

---

### Task 2: TypeScript Types

**Files:**
- Create: `my-app/src/types/copilot.ts`

**Step 1: Write the types**

```typescript
// ============================================
// Database row types
// ============================================
export interface CopilotConversation {
  id: string
  tenant_id: string
  title: string | null
  summary: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CopilotMessage {
  id: string
  conversation_id: string
  role: "user" | "assistant" | "system"
  content: string
  tool_calls: ToolCallRecord[] | null
  feedback: MessageFeedback | null
  created_at: string
}

export interface CopilotSettings {
  tenant_id: string
  personality: PersonalitySettings
  autonomy: AutonomySettings
  notifications: NotificationSettings
  updated_at: string
}

export interface CopilotMemoryItem {
  id: string
  tenant_id: string
  content: string
  source: "auto" | "user" | "feedback"
  created_at: string
}

// ============================================
// Settings sub-types
// ============================================
export interface PersonalitySettings {
  style: "concise" | "balanced" | "detailed"
  tone: "formal" | "friendly"
}

export type AutonomyLevel = "auto" | "confirm"

export interface AutonomySettings {
  light: AutonomyLevel
  medium: AutonomyLevel
  heavy: AutonomyLevel
}

export interface NotificationSettings {
  enabled: boolean
  types: {
    seo_critical: boolean
    drafts_forgotten: boolean
    gsc_performance: boolean
    sync_failed: boolean
    batch_complete: boolean
    products_unpublished: boolean
  }
}

// ============================================
// Tool calling
// ============================================
export interface ToolCallRecord {
  name: string
  args: Record<string, unknown>
  result?: unknown
}

export interface MessageFeedback {
  rating: "up" | "down"
  comment?: string
}

// ============================================
// SSE Events
// ============================================
export type CopilotSSEEvent =
  | { type: "connected" }
  | { type: "chunk"; data: string }
  | { type: "tool_call"; data: { name: string; args: Record<string, unknown> } }
  | { type: "tool_result"; data: { name: string; result: unknown } }
  | { type: "complete"; data: { message_id: string; conversation_id: string } }
  | { type: "error"; data: { code: string; message: string } }
  | { type: "heartbeat" }

// ============================================
// Chat state (frontend)
// ============================================
export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  toolCalls?: ToolCallRecord[]
  feedback?: MessageFeedback
  isStreaming?: boolean
  isInterrupted?: boolean
}

// ============================================
// Spotlight
// ============================================
export type SpotlightCategory = "recent" | "navigation" | "action" | "copilot"

export interface SpotlightItem {
  id: string
  category: SpotlightCategory
  label: string
  description?: string
  icon: string
  path?: string
  action?: () => void | Promise<void>
}

// ============================================
// Notifications
// ============================================
export type NotificationType =
  | "seo_critical"
  | "drafts_forgotten"
  | "gsc_performance"
  | "sync_failed"
  | "batch_complete"
  | "products_unpublished"

export interface CopilotNotification {
  id: string
  type: NotificationType
  message: string
  priority: "normal" | "urgent"
  data?: Record<string, unknown>
}

// ============================================
// Response Cards
// ============================================
export type ResponseCardType =
  | "product"
  | "article"
  | "seo"
  | "kpi"
  | "batch_progress"
  | "comparison"

export interface ResponseCard {
  type: ResponseCardType
  data: Record<string, unknown>
}

// ============================================
// Slash Commands
// ============================================
export interface SlashCommand {
  name: string
  aliases: string[]
  description: string
  level: "light" | "medium" | "heavy"
  execute: (args: string) => string
}

// ============================================
// Action Levels (for autonomy)
// ============================================
export type ActionLevel = "light" | "medium" | "heavy" | "locked"
```

**Step 2: Commit**

```bash
git add my-app/src/types/copilot.ts
git commit -m "feat(copilot): add TypeScript types for conversations, messages, settings, cards, spotlight"
```

---

### Task 3: Zod Validation Schemas

**Files:**
- Create: `my-app/src/schemas/copilot.ts`

**Step 1: Write the schemas**

```typescript
import { z } from "zod"

// Reuse injection prevention from flowriter
const SUSPICIOUS_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/i,
  /system\s*prompt:/i,
  /you\s+are\s+now/i,
  /pretend\s+to\s+be/i,
  /act\s+as\s+(a\s+)?different/i,
  /reveal\s+(your|the)\s+(system|initial|original)/i,
  /forget\s+(all\s+)?(your|previous)/i,
  /override\s+(all\s+)?(safety|security|content)/i,
  /jailbreak/i,
  /DAN\s+mode/i,
]

const safeText = (maxLength: number, fieldName: string) =>
  z
    .string()
    .max(maxLength, `${fieldName} trop long (max ${maxLength} caracteres)`)
    .refine(
      (val) => !SUSPICIOUS_PATTERNS.some((p) => p.test(val)),
      { message: `Le champ ${fieldName} contient du contenu invalide` }
    )

// ============================================
// Chat input
// ============================================
export const copilotMessageSchema = z.object({
  content: safeText(2000, "message"),
  conversationId: z.string().uuid().optional(),
  context: z.object({
    page: z.string().max(100),
    pathname: z.string().max(200),
  }),
})

export type CopilotMessageInput = z.infer<typeof copilotMessageSchema>

// ============================================
// Settings
// ============================================
export const personalitySchema = z.object({
  style: z.enum(["concise", "balanced", "detailed"]),
  tone: z.enum(["formal", "friendly"]),
})

export const autonomySchema = z.object({
  light: z.enum(["auto", "confirm"]),
  medium: z.enum(["auto", "confirm"]),
  heavy: z.enum(["auto", "confirm"]),
})

export const notificationTypesSchema = z.object({
  seo_critical: z.boolean(),
  drafts_forgotten: z.boolean(),
  gsc_performance: z.boolean(),
  sync_failed: z.boolean(),
  batch_complete: z.boolean(),
  products_unpublished: z.boolean(),
})

export const copilotSettingsSchema = z.object({
  personality: personalitySchema,
  autonomy: autonomySchema,
  notifications: z.object({
    enabled: z.boolean(),
    types: notificationTypesSchema,
  }),
})

export type CopilotSettingsInput = z.infer<typeof copilotSettingsSchema>

// ============================================
// Feedback
// ============================================
export const feedbackSchema = z.object({
  messageId: z.string().uuid(),
  rating: z.enum(["up", "down"]),
  comment: z.string().max(500).optional(),
})

// ============================================
// Memory
// ============================================
export const memoryItemSchema = z.object({
  content: safeText(500, "memoire"),
})
```

**Step 2: Commit**

```bash
git add my-app/src/schemas/copilot.ts
git commit -m "feat(copilot): add Zod schemas with injection prevention for chat, settings, feedback, memory"
```

---

## Phase 2: Backend — SSE API & Notifications

### Task 4: Copilot SSE Streaming Endpoint

**Files:**
- Create: `my-app/src/app/api/copilot/stream/route.ts`

**Reference:** Follow exact same SSE pattern as `my-app/src/app/api/flowriter/stream/route.ts` — Node.js runtime, 5-min timeout, exponential backoff, error classification.

**Step 1: Write the endpoint**

```typescript
import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenAI } from "@google/genai"
import { copilotMessageSchema } from "@/schemas/copilot"
import { rateLimitOrNull } from "@/lib/rate-limit"
import { copilotTools, executeToolCall } from "./tools"
import { buildSystemPrompt } from "./system-prompt"

export const runtime = "nodejs"
export const maxDuration = 300

const RATE_LIMIT = { maxRequests: 15, windowMs: 60_000 }

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const rateLimited = rateLimitOrNull(user.id, "copilot-stream", RATE_LIMIT)
  if (rateLimited) return rateLimited

  const body = await req.json()
  const parsed = copilotMessageSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { content, conversationId, context } = parsed.data

  // Get or create conversation
  let convId = conversationId
  if (!convId) {
    const { data: conv } = await supabase
      .from("copilot_conversations")
      .insert({ tenant_id: user.id, title: content.slice(0, 80) })
      .select("id")
      .single()
    convId = conv!.id
  }

  // Save user message
  await supabase.from("copilot_messages").insert({
    conversation_id: convId,
    role: "user",
    content,
  })

  // Load history (last 30 messages)
  const { data: history } = await supabase
    .from("copilot_messages")
    .select("role, content, tool_calls")
    .eq("conversation_id", convId)
    .order("created_at", { ascending: true })
    .limit(30)

  // Load settings
  const { data: settings } = await supabase
    .from("copilot_settings")
    .select("personality, autonomy")
    .eq("tenant_id", user.id)
    .single()

  // Load memory
  const { data: memory } = await supabase
    .from("copilot_memory")
    .select("content")
    .eq("tenant_id", user.id)
    .limit(20)

  // Build messages for Gemini
  const systemPrompt = buildSystemPrompt({
    context,
    personality: settings?.personality ?? { style: "balanced", tone: "friendly" },
    memory: memory?.map((m) => m.content) ?? [],
  })

  const geminiMessages = (history ?? []).map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }))

  // SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data?: unknown) => {
        const payload = data !== undefined ? JSON.stringify(data) : ""
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${payload}\n\n`))
      }

      send("connected")

      // Heartbeat
      const heartbeat = setInterval(() => send("heartbeat"), 15_000)

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

        const response = await ai.models.generateContentStream({
          model: "gemini-2.5-pro",
          contents: geminiMessages,
          config: {
            systemInstruction: systemPrompt,
            tools: copilotTools,
          },
        })

        let fullText = ""
        const toolCallsRecords: Array<{ name: string; args: Record<string, unknown>; result?: unknown }> = []

        for await (const chunk of response) {
          // Handle tool calls
          if (chunk.functionCalls && chunk.functionCalls.length > 0) {
            for (const fc of chunk.functionCalls) {
              send("tool_call", { name: fc.name, args: fc.args })
              const result = await executeToolCall(fc.name, fc.args as Record<string, unknown>, user.id, supabase)
              toolCallsRecords.push({ name: fc.name, args: fc.args as Record<string, unknown>, result })
              send("tool_result", { name: fc.name, result })
            }
            continue
          }

          // Handle text
          const text = chunk.text
          if (text) {
            fullText += text
            send("chunk", text)
          }
        }

        // Save assistant message
        const { data: msg } = await supabase
          .from("copilot_messages")
          .insert({
            conversation_id: convId,
            role: "assistant",
            content: fullText,
            tool_calls: toolCallsRecords.length > 0 ? toolCallsRecords : null,
          })
          .select("id")
          .single()

        // Update conversation title if first exchange
        if (!conversationId) {
          await supabase
            .from("copilot_conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", convId)
        }

        send("complete", { message_id: msg?.id, conversation_id: convId })
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        send("error", { code: "GENERATION_ERROR", message })
      } finally {
        clearInterval(heartbeat)
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
```

**Step 2: Commit**

```bash
git add my-app/src/app/api/copilot/stream/route.ts
git commit -m "feat(copilot): add SSE streaming endpoint with Gemini 2.5 Pro"
```

---

### Task 5: System Prompt Builder

**Files:**
- Create: `my-app/src/app/api/copilot/stream/system-prompt.ts`

**Step 1: Write the system prompt builder**

```typescript
import type { PersonalitySettings } from "@/types/copilot"

interface SystemPromptInput {
  context: { page: string; pathname: string }
  personality: PersonalitySettings
  memory: string[]
}

export function buildSystemPrompt({ context, personality, memory }: SystemPromptInput): string {
  const toneMap = {
    formal: "Vouvoie l'utilisateur. Ton professionnel et precis.",
    friendly: "Tutoie l'utilisateur. Ton chaleureux d'expert bienveillant.",
  }

  const styleMap = {
    concise: "Reponds de maniere tres concise, droit au but. Pas d'explication sauf si demande.",
    balanced: "Reponds de maniere claire avec une breve explication du raisonnement.",
    detailed: "Reponds de maniere detaillee, explique ton raisonnement complet et donne des alternatives.",
  }

  const memoryBlock =
    memory.length > 0
      ? `\n## Memoire utilisateur\n${memory.map((m) => `- ${m}`).join("\n")}\n`
      : ""

  return `Tu es le Copilot FLOWZ, un assistant IA specialise dans la gestion de boutiques e-commerce.

## Personnalite
${toneMap[personality.tone]}
${styleMap[personality.style]}

## Contexte actuel
L'utilisateur est sur la page: ${context.page} (${context.pathname})
${memoryBlock}
## Capacites
Tu peux :
- Analyser et optimiser les descriptions produits (SEO, copywriting)
- Auditer le SEO des produits et pages
- Gerer les articles de blog (idees, analyse, lancement FloWriter)
- Consulter les donnees Google Search Console
- Afficher les KPIs du dashboard
- Pousser des produits vers WooCommerce/Shopify
- Lancer des optimisations en lot

## Regles
1. Reste dans ton domaine : e-commerce, SEO, contenu, produits, blog, analytics
2. Si on te demande quelque chose hors domaine, redirige poliment vers tes capacites
3. Quand tu proposes une modification (description, meta, etc.), montre toujours l'avant/apres
4. Pour les actions lourdes (push, batch, publish), demande confirmation sauf si l'utilisateur a configure l'execution automatique
5. Utilise les tools disponibles pour acceder aux vraies donnees, ne fabrique jamais de donnees
6. Quand tu detectes une preference recurrente de l'utilisateur, mentionne-la pour qu'elle soit memorisee

## Format des reponses
- Utilise le Markdown pour structurer tes reponses
- Pour les donnees structurees (produits, SEO scores, KPIs), utilise le format JSON encapsule dans un bloc \`\`\`json:card:{type}\`\`\` pour que le frontend affiche une carte riche
- Types de cartes disponibles : product, article, seo, kpi, batch_progress, comparison`
}
```

**Step 2: Commit**

```bash
git add my-app/src/app/api/copilot/stream/system-prompt.ts
git commit -m "feat(copilot): add system prompt builder with personality + memory injection"
```

---

### Task 6: Gemini Tool Definitions & Execution

**Files:**
- Create: `my-app/src/app/api/copilot/stream/tools.ts`

**Step 1: Write the tool definitions and execution logic**

Contains Gemini function declarations (8 tools: get_products, get_product_detail, get_blog_posts, seo_audit, get_dashboard_kpis, get_priority_actions, keyword_suggestions, get_gsc_performance) and server-side execution via Supabase RLS.

Each tool:
- Accepts typed args from Gemini
- Queries Supabase with tenant_id filtering (RLS)
- Returns structured data for Gemini to interpret

**Step 2: Commit**

```bash
git add my-app/src/app/api/copilot/stream/tools.ts
git commit -m "feat(copilot): add 8 Gemini tool definitions with Supabase execution"
```

---

### Task 7: Notifications Endpoint

**Files:**
- Create: `my-app/src/app/api/copilot/notifications/route.ts`

**Step 1: Write the endpoint**

GET endpoint that:
1. Authenticates user
2. Loads notification preferences from copilot_settings
3. Queries aggregated stats (products with low SEO, old drafts, failed syncs)
4. Returns top 5 notifications sorted by priority

**Step 2: Commit**

```bash
git add my-app/src/app/api/copilot/notifications/route.ts
git commit -m "feat(copilot): add notifications endpoint with configurable alert types"
```

---

## Phase 3: Frontend Hooks

### Task 8: useChat Hook (SSE streaming)

**Files:**
- Create: `my-app/src/hooks/copilot/useChat.ts`

**Step 1: Write the hook**

Core chat hook managing:
- `messages` state (ChatMessage[])
- `isStreaming` flag
- `conversationId` tracking
- `sendMessage(content)` — POST to SSE endpoint, parse events, update messages progressively
- `stopStreaming()` — AbortController to cancel SSE
- `clearMessages()` — reset for new conversation
- `loadConversation(convId, messages)` — resume from history
- SSE event parsing: chunk (append text), tool_call (add to toolCalls), tool_result, complete, error
- AbortError handling for user interruption (marks message as `isInterrupted`)

**Step 2: Commit**

```bash
git add my-app/src/hooks/copilot/useChat.ts
git commit -m "feat(copilot): add useChat hook with SSE streaming, abort, and tool call handling"
```

---

### Task 9: useConversations Hook

**Files:**
- Create: `my-app/src/hooks/copilot/useConversations.ts`

**Step 1: Write the hook**

TanStack Query hook for:
- `conversations` — list all (non-deleted), ordered by updated_at DESC
- `loadMessages(conversationId)` — fetch messages for a conversation, map to ChatMessage[]
- `deleteConversation(id)` — soft delete (set deleted_at)
- Invalidation on mutations

**Step 2: Commit**

```bash
git add my-app/src/hooks/copilot/useConversations.ts
git commit -m "feat(copilot): add useConversations hook with CRUD + soft delete"
```

---

### Task 10: useCopilotSettings Hook

**Files:**
- Create: `my-app/src/hooks/copilot/useCopilotSettings.ts`

**Step 1: Write the hook**

TanStack Query hook for:
- `settings` — current settings with defaults fallback
- `updateSettings(partial)` — upsert to Supabase
- Default values: balanced style, friendly tone, auto light, confirm medium/heavy, notifications enabled

**Step 2: Commit**

```bash
git add my-app/src/hooks/copilot/useCopilotSettings.ts
git commit -m "feat(copilot): add useCopilotSettings hook with upsert + defaults"
```

---

### Task 11: useCopilotNotifications Hook

**Files:**
- Create: `my-app/src/hooks/copilot/useCopilotNotifications.ts`

**Step 1: Write the hook**

- Polls `GET /api/copilot/notifications` every 5 minutes
- `refetchIntervalInBackground: false` (pauses when tab inactive)
- Dismiss tracking in localStorage with 24h expiry
- Returns: `notifications`, `count`, `hasUrgent`, `dismiss(id)`

**Step 2: Commit**

```bash
git add my-app/src/hooks/copilot/useCopilotNotifications.ts
git commit -m "feat(copilot): add useCopilotNotifications hook with polling + dismiss"
```

---

### Task 12: useCopilotMemory Hook

**Files:**
- Create: `my-app/src/hooks/copilot/useCopilotMemory.ts`

**Step 1: Write the hook**

TanStack Query hook for:
- `items` — list memory items
- `addMemory(content)` — insert with source "user"
- `deleteMemory(id)` — delete single item
- `clearAll()` — delete all for tenant

**Step 2: Commit**

```bash
git add my-app/src/hooks/copilot/useCopilotMemory.ts
git commit -m "feat(copilot): add useCopilotMemory hook with CRUD + clear all"
```

---

### Task 13: useSpotlightSearch Hook

**Files:**
- Create: `my-app/src/hooks/copilot/useSpotlightSearch.ts`

**Step 1: Write the hook**

Unified search combining:
- Static pages (Dashboard, Produits, Blog, SEO, etc.)
- Static actions (Audit SEO, Optimiser descriptions, etc.)
- DB search (products + blog_posts by title, debounced 200ms, min 2 chars)
- Recents from localStorage (last 5)
- Returns grouped results: `{ navigation, actions }`

**Step 2: Commit**

```bash
git add my-app/src/hooks/copilot/useSpotlightSearch.ts
git commit -m "feat(copilot): add useSpotlightSearch hook with fuzzy search + DB lookup"
```

---

### Task 14: useSlashCommands Hook

**Files:**
- Create: `my-app/src/hooks/copilot/useSlashCommands.ts`

**Step 1: Write the hook**

Command registry with:
- 8 commands: /optimize, /audit, /push, /ideas, /batch, /status, /memory, /clear
- `matchCommand(input)` — find matching command
- `filterCommands(partial)` — autocomplete matches
- `formatCommandMessage(input)` — convert `/optimize sneakers` to natural language prompt

**Step 2: Commit**

```bash
git add my-app/src/hooks/copilot/useSlashCommands.ts
git commit -m "feat(copilot): add useSlashCommands hook with command registry + formatting"
```

---

## Phase 4: CopilotContext Enrichment

### Task 15: Enrich CopilotContext with unified state

**Files:**
- Modify: `my-app/src/contexts/CopilotContext.tsx`

**Step 1: Rewrite the context**

Add to existing API (preserve `isOpen`, `toggleCopilot`, `setCopilotOpen`, `isReady`):
- `isSpotlightOpen`, `openSpotlight`, `closeSpotlight`
- `activeView` ("chat" | "history"), `setActiveView`
- `pendingPrompt`, `promoteToPanelWith(prompt)`, `consumePendingPrompt()`
- Global keyboard shortcuts: Ctrl+K (spotlight), Ctrl+Shift+K (panel), Ctrl+Shift+N (new conversation), Esc (close)

**Step 2: Verify existing usages still work**

Check `TopHeader.tsx` and `AppLayout.tsx` use `isOpen`, `toggleCopilot`, `setCopilotOpen`, `isReady` — all preserved.

**Step 3: Commit**

```bash
git add my-app/src/contexts/CopilotContext.tsx
git commit -m "feat(copilot): enrich CopilotContext with spotlight, views, keyboard shortcuts, prompt promotion"
```

---

## Phase 5: Spotlight UI

### Task 16: SpotlightModal Component

**Files:**
- Create: `my-app/src/components/copilot/spotlight/SpotlightModal.tsx`
- Create: `my-app/src/components/copilot/spotlight/SpotlightInput.tsx`
- Create: `my-app/src/components/copilot/spotlight/SpotlightResults.tsx`
- Create: `my-app/src/components/copilot/spotlight/SpotlightRecents.tsx`

**Step 1: Write SpotlightModal**

Follow FLOWZ design system: `cn()`, semantic colors, `motionTokens`, `rounded-xl`, shadcn Dialog.

Key behaviors:
- Overlay with backdrop blur (`bg-black/60 backdrop-blur-sm`)
- Centered modal (`max-w-xl`)
- Input auto-focused on open
- Results grouped: Recents -> Navigation -> Actions -> Copilot
- Keyboard navigation (up/down + Enter)
- Click outside or Esc to close
- "Demander au Copilot" always at bottom when query present
- Uses `useSpotlightSearch()` and `useCopilot().promoteToPanelWith()`
- On navigation item select -> `router.push(item.path)` + close
- On action select -> `promoteToPanelWith(action command)`

Reference: Design spec Section 3, SettingsModal.tsx patterns. Target ~200-250 lines total across files.

**Step 2: Commit**

```bash
git add my-app/src/components/copilot/spotlight/
git commit -m "feat(copilot): add Spotlight modal with fuzzy search, navigation, actions, and Copilot promotion"
```

---

### Task 17: Integrate Spotlight into AppLayout

**Files:**
- Modify: `my-app/src/components/layout/AppLayout.tsx`

**Step 1: Add SpotlightModal render**

```tsx
import { SpotlightModal } from "@/components/copilot/spotlight/SpotlightModal"

// Inside AppLayoutContent, add after CopilotPanel:
<SpotlightModal />
```

**Step 2: Commit**

```bash
git add my-app/src/components/layout/AppLayout.tsx
git commit -m "feat(copilot): integrate SpotlightModal into AppLayout"
```

---

## Phase 6: Side Panel Refactoring

### Task 18: Decompose CopilotPanel into sub-components

**Files:**
- Modify: `my-app/src/components/copilot/CopilotPanel.tsx` — slim down to shell
- Create: `my-app/src/components/copilot/CopilotHeader.tsx`
- Create: `my-app/src/components/copilot/CopilotChatView.tsx`
- Create: `my-app/src/components/copilot/CopilotWelcome.tsx`
- Create: `my-app/src/components/copilot/CopilotInput.tsx`
- Create: `my-app/src/components/copilot/CopilotMessageList.tsx`

**Step 1: Extract CopilotHeader**

Move header section from CopilotPanel. Add [+] new conversation, [history] toggle, [X] close buttons.

**Step 2: Extract CopilotInput**

Move textarea + send button. Enrich with: auto-expand (5 lines max), 2000 char limit, slash command dropdown (useSlashCommands), stop button during streaming, Shift+Enter newline.

**Step 3: Extract CopilotWelcome**

Move welcome greeting + contextual suggestions. Keep existing motion animations.

**Step 4: Extract CopilotMessageList**

Move message rendering loop. Keep existing motion (slideUp, popLayout).

**Step 5: Create CopilotChatView**

Compose: CopilotWelcome (when no messages) + CopilotMessageList + auto-scroll + floating "down" button.

**Step 6: Slim CopilotPanel to shell**

```tsx
<CopilotHeader />
{activeView === "chat" ? <CopilotChatView /> : <CopilotHistoryView />}
{activeView === "chat" && <CopilotInput />}
```

Keep responsive push/overlay logic in shell.

**Step 7: Commit**

```bash
git add my-app/src/components/copilot/
git commit -m "refactor(copilot): decompose CopilotPanel into Header, ChatView, Welcome, Input, MessageList"
```

---

### Task 19: Wire useChat into CopilotChatView

**Files:**
- Modify: `my-app/src/components/copilot/CopilotChatView.tsx`

**Step 1: Replace hardcoded messages with useChat**

Remove setTimeout fake response. Wire useChat() hook:
- `sendMessage()` on form submit
- `messages` for rendering
- `isStreaming` for typing indicator + stop button
- `stopStreaming()` for abort
- `loadConversation()` when resuming from history
- `clearMessages()` on new conversation
- Handle `consumePendingPrompt()` from spotlight promotion

**Step 2: Commit**

```bash
git add my-app/src/components/copilot/CopilotChatView.tsx
git commit -m "feat(copilot): wire useChat SSE streaming into CopilotChatView"
```

---

### Task 20: Message Components (User, Assistant, ToolIndicator)

**Files:**
- Create: `my-app/src/components/copilot/messages/UserMessage.tsx`
- Create: `my-app/src/components/copilot/messages/AssistantMessage.tsx`
- Create: `my-app/src/components/copilot/messages/ToolIndicator.tsx`
- Create: `my-app/src/components/copilot/messages/TypingIndicator.tsx`

**Step 1: UserMessage** — Simple bubble: user avatar + content + timestamp. ~30 lines.

**Step 2: AssistantMessage** — Orb icon + Markdown content + tool indicators + response cards + copy button (hover) + feedback 👍/👎 (hover). Parses `json:card:{type}` blocks to render ResponseCard. ~80 lines.

**Step 3: ToolIndicator** — Animated badge with contextual label (maps tool names to labels). Pulse via motionTokens. ~50 lines.

**Step 4: TypingIndicator** — Extract existing bouncing dots as standalone component. ~20 lines.

**Step 5: Commit**

```bash
git add my-app/src/components/copilot/messages/
git commit -m "feat(copilot): add UserMessage, AssistantMessage, ToolIndicator, TypingIndicator"
```

---

### Task 21: Response Cards

**Files:**
- Create: `my-app/src/components/copilot/cards/ResponseCard.tsx`
- Create: `my-app/src/components/copilot/cards/ProductCard.tsx`
- Create: `my-app/src/components/copilot/cards/ArticleCard.tsx`
- Create: `my-app/src/components/copilot/cards/SeoCard.tsx`
- Create: `my-app/src/components/copilot/cards/KpiCard.tsx`
- Create: `my-app/src/components/copilot/cards/BatchProgressCard.tsx`
- Create: `my-app/src/components/copilot/cards/ComparisonCard.tsx`

**Step 1: ResponseCard** — Dispatcher: takes `{ type, data }`, renders correct card variant. ~30 lines.

**Step 2: ProductCard** — Image, title, SEO score bar (before/after), description preview. Actions: Appliquer, Previsualiser, Editer. ~80 lines.

**Step 3: ArticleCard** — Title, status badge, word count, meta description. Actions: Ouvrir editeur, Publier, Programmer. ~60 lines.

**Step 4: SeoCard** — Average score (circular progress), critical/warning counts, top 3 issues. Actions: Audit complet, Voir details. ~70 lines.

**Step 5: KpiCard** — Metric label, value, trend arrow, sparkline SVG. ~50 lines.

**Step 6: BatchProgressCard** — Progress bar, X/Y processed, success/fail counts. Actions: Annuler, Voir details. ~50 lines.

**Step 7: ComparisonCard** — Before/after side-by-side with diff highlight. SEO score change. Actions: Appliquer, Rejeter, Editer. ~80 lines.

**Step 8: Commit**

```bash
git add my-app/src/components/copilot/cards/
git commit -m "feat(copilot): add 6 response card types with action buttons"
```

---

### Task 22: CopilotHistoryView

**Files:**
- Create: `my-app/src/components/copilot/CopilotHistoryView.tsx`

**Step 1: Write the component**

Uses `useConversations()`. Groups by date (Aujourd'hui, Hier, Cette semaine, Plus ancien). Each item: title, relative time, message count. Click loads conversation. Delete with hover icon + confirmation. Memory summary at bottom via `useCopilotMemory()`. Search input. ~150 lines.

**Step 2: Commit**

```bash
git add my-app/src/components/copilot/CopilotHistoryView.tsx
git commit -m "feat(copilot): add CopilotHistoryView with grouped conversations + memory summary"
```

---

## Phase 7: Orbe Proactif

### Task 23: OrbHoverPreview + Badge Integration

**Files:**
- Create: `my-app/src/components/copilot/orb/OrbHoverPreview.tsx`
- Modify: `my-app/src/components/layout/TopHeader.tsx`

**Step 1: OrbHoverPreview**

Tooltip component showing notification list on hover. Uses `useCopilotNotifications()`. Up to 5 items with icons. Footer: "Cliquer pour ouvrir le panel". Uses `motionTokens.variants.tooltip`. ~60 lines.

**Step 2: Modify TopHeader**

Add notification badge (count) on AIOrb button. Wrap with OrbHoverPreview. When clicked with notifications -> open panel with suggestions. Orb state: idle (no notifs), active (has notifs), generating (when streaming).

**Step 3: Commit**

```bash
git add my-app/src/components/copilot/orb/OrbHoverPreview.tsx my-app/src/components/layout/TopHeader.tsx
git commit -m "feat(copilot): add proactive orb with notification badge + hover preview"
```

---

## Phase 8: Settings Integration

### Task 24: CopilotSettingsSection

**Files:**
- Create: `my-app/src/components/copilot/settings/CopilotSettingsSection.tsx`
- Modify: `my-app/src/components/settings/SettingsModal.tsx`

**Step 1: Write CopilotSettingsSection**

Uses `useCopilotSettings()` and `useCopilotMemory()`. Sub-sections with existing SettingsCard:
1. Personnalite — Radio groups for style + tone
2. Niveau d'autonomie — 3 rows with radio toggle
3. Notifications proactives — Toggle + checkboxes
4. Raccourcis — Read-only display
5. Memoire — List with edit/delete + clear all
6. Donnees — Conversation count + export + delete all

~200 lines.

**Step 2: Add tab in SettingsModal**

Add "Copilot IA" sidebar item (Sparkles icon). Render CopilotSettingsSection when active.

**Step 3: Commit**

```bash
git add my-app/src/components/copilot/settings/CopilotSettingsSection.tsx my-app/src/components/settings/SettingsModal.tsx
git commit -m "feat(copilot): add Copilot settings section in SettingsModal"
```

---

## Phase 9: Integration & Polish

### Task 25: Feedback System

**Files:**
- Create: `my-app/src/hooks/copilot/useFeedback.ts`

**Step 1: Write the hook**

Simple mutation to update `copilot_messages.feedback` column. Used by AssistantMessage for thumbs up/down.

**Step 2: Commit**

```bash
git add my-app/src/hooks/copilot/useFeedback.ts
git commit -m "feat(copilot): add useFeedback hook for message rating"
```

---

### Task 26: Markdown Renderer for Assistant Messages

**Files:**
- Create: `my-app/src/components/copilot/messages/MarkdownRenderer.tsx`

**Step 1: Write the component**

Renders Markdown content from assistant messages. Handles:
- Bold, italic, lists, code blocks (with copy button)
- Custom `json:card:{type}` blocks parsed and rendered as ResponseCard
- Links styled with primary color
- Tables with proper styling

Use a safe Markdown rendering approach: use `react-markdown` library (or parse with regex for simple formatting) with proper text escaping. For code blocks, render with `<pre><code>` and a copy button. For `json:card:*` blocks, parse with regex, extract JSON, and render as ResponseCard components. All other content is rendered as escaped text — never use innerHTML with unsanitized content. ~100 lines.

**Step 2: Commit**

```bash
git add my-app/src/components/copilot/messages/MarkdownRenderer.tsx
git commit -m "feat(copilot): add MarkdownRenderer with safe rendering and card block detection"
```

---

### Task 27: End-to-End Smoke Test

**Files:** None (manual verification)

**Step 1: Apply Supabase migration**

Run: `supabase db push`
Expected: Migration applies cleanly.

**Step 2: Start dev server**

Run: `npm run dev`
Expected: No build errors.

**Step 3: Test Spotlight**

- Press `Ctrl+K` -> Spotlight opens
- Type "produit" -> navigation results appear
- Press `Esc` -> Spotlight closes

**Step 4: Test Panel**

- Press `Ctrl+Shift+K` -> Panel opens
- Type a message -> SSE streams response from Gemini
- Stop button works during streaming
- New conversation button works

**Step 5: Test Notifications**

- Orb shows badge if notifications exist
- Hover shows preview tooltip
- Click opens panel with suggestions

**Step 6: Test Settings**

- Open Settings -> Copilot IA tab visible
- Change personality -> saves
- Change autonomy -> saves
- Toggle notifications -> saves

**Step 7: Test History**

- Click history icon in panel header
- Past conversations listed
- Click to reload a conversation
- Delete conversation works

**Step 8: Commit any fixes**

```bash
git commit -m "fix(copilot): smoke test fixes"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-3 | Database migration, TypeScript types, Zod schemas |
| 2 | 4-7 | SSE endpoint, system prompt, tools, notifications API |
| 3 | 8-14 | Frontend hooks (chat, conversations, settings, notifications, memory, search, commands) |
| 4 | 15 | Enrich CopilotContext with unified state |
| 5 | 16-17 | Spotlight modal + AppLayout integration |
| 6 | 18-22 | Panel decomposition, chat wiring, messages, cards, history |
| 7 | 23 | Orbe proactif + badge + hover preview |
| 8 | 24 | Settings integration in existing modal |
| 9 | 25-27 | Feedback, markdown renderer, smoke test |

**Total: 27 tasks across 9 phases**
**Estimated files: ~35 new, ~4 modified**
