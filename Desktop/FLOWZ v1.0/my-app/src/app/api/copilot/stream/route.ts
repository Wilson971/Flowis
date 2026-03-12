import { NextRequest } from "next/server"
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
})
import { createClient } from "@/lib/supabase/server"
import { copilotMessageSchema } from "@/schemas/copilot"
import { rateLimitOrNull } from "@/lib/rate-limit"
import { createCopilotTools } from "./tools"
import { buildSystemPrompt } from "./system-prompt"
import { detectPromptInjection } from "@/lib/ai/prompt-safety"

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

  // Extract our custom fields, pass messages to AI SDK
  const { conversationId, context: rawContext } = body

  // Validate context separately
  const contextParsed = copilotMessageSchema.shape.context.safeParse(rawContext)
  const context = contextParsed.success
    ? contextParsed.data
    : { page: "overview", pathname: "/app/overview" }

  const messages: UIMessage[] = body.messages ?? []

  // C1 fix: Validate user messages against prompt injection patterns
  for (const msg of messages) {
    if (msg.role !== "user") continue
    const textParts = (msg.parts ?? [])
      .filter((p: { type: string }) => p.type === "text")
      .map((p: { type: string; text?: string }) => p.text ?? "")
    if (textParts.some((t: string) => detectPromptInjection(t))) {
      return new Response(
        JSON.stringify({ error: "Message contains disallowed content" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }
  }

  // Get or create conversation from the first user message
  let convId = conversationId as string | null
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")
  const userContent = lastUserMsg
    ? lastUserMsg.parts?.find((p: { type: string }) => p.type === "text")?.text ?? ""
    : ""

  if (!convId && userContent) {
    // C2 fix: Handle null insert result gracefully
    const { data: conv, error: convError } = await supabase
      .from("copilot_conversations")
      .insert({ tenant_id: user.id, title: userContent.slice(0, 80) })
      .select("id")
      .single()
    if (convError || !conv) {
      return new Response(
        JSON.stringify({ error: "Failed to create conversation" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }
    convId = conv.id
  }

  // Save user message to DB
  if (userContent) {
    await supabase.from("copilot_messages").insert({
      conversation_id: convId,
      role: "user",
      content: userContent,
    })
  }

  // Load settings & memory
  const [settingsRes, memoryRes] = await Promise.all([
    supabase
      .from("copilot_settings")
      .select("personality, autonomy")
      .eq("tenant_id", user.id)
      .single(),
    supabase
      .from("copilot_memory")
      .select("content")
      .eq("tenant_id", user.id)
      .limit(20),
  ])

  const systemPrompt = buildSystemPrompt({
    context,
    personality: settingsRes.data?.personality ?? { style: "balanced", tone: "friendly" },
    memory: memoryRes.data?.map((m) => m.content) ?? [],
  })

  // Create tools bound to this tenant
  const tools = createCopilotTools(user.id, supabase)

  // Stream with AI SDK
  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
    onFinish: async ({ text }) => {
      // Persist assistant message
      if (convId && text) {
        await supabase.from("copilot_messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: text,
        })

        await supabase
          .from("copilot_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", convId)
      }
    },
  })

  return result.toUIMessageStreamResponse({
    headers: {
      "x-conversation-id": convId ?? "",
    },
  })
}
