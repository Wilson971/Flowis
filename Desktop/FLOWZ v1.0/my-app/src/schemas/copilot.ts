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
