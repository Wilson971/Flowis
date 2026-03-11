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
