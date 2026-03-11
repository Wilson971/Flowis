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
          if (chunk.functionCalls && chunk.functionCalls.length > 0) {
            for (const fc of chunk.functionCalls) {
              send("tool_call", { name: fc.name, args: fc.args })
              const result = await executeToolCall(fc.name, fc.args as Record<string, unknown>, user.id, supabase)
              toolCallsRecords.push({ name: fc.name, args: fc.args as Record<string, unknown>, result })
              send("tool_result", { name: fc.name, result })
            }
            continue
          }

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
