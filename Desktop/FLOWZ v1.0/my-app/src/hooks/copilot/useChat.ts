"use client"

import { useState, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import type { ChatMessage, ToolCallRecord, CopilotSSEEvent } from "@/types/copilot"

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const pathname = usePathname()

  const sendMessage = useCallback(
    async (content: string) => {
      if (isStreaming || !content.trim()) return

      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      }

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
        toolCalls: [],
      }

      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setIsStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response = await fetch("/api/copilot/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content.trim(),
            conversation_id: conversationId,
            page_context: pathname,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error("No response body")

        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          let currentEventType = ""

          for (const line of lines) {
            if (line.startsWith("event:")) {
              currentEventType = line.slice(6).trim()
              continue
            }

            if (line.startsWith("data:")) {
              const rawData = line.slice(5).trim()
              if (!rawData) continue

              let event: CopilotSSEEvent | null = null

              try {
                if (currentEventType === "heartbeat" || currentEventType === "connected") {
                  event = { type: currentEventType } as CopilotSSEEvent
                } else {
                  const parsed = JSON.parse(rawData)
                  event = { type: currentEventType, data: parsed } as CopilotSSEEvent
                }
              } catch {
                // Non-JSON data for chunk events
                if (currentEventType === "chunk") {
                  event = { type: "chunk", data: rawData }
                }
              }

              if (!event) continue

              switch (event.type) {
                case "chunk": {
                  const chunkData = (event as { type: "chunk"; data: string }).data
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? { ...msg, content: msg.content + chunkData }
                        : msg
                    )
                  )
                  break
                }

                case "tool_call": {
                  const toolData = (event as { type: "tool_call"; data: { name: string; args: Record<string, unknown> } }).data
                  const toolCall: ToolCallRecord = { name: toolData.name, args: toolData.args }
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? { ...msg, toolCalls: [...(msg.toolCalls ?? []), toolCall] }
                        : msg
                    )
                  )
                  break
                }

                case "tool_result": {
                  const resultData = (event as { type: "tool_result"; data: { name: string; result: unknown } }).data
                  setMessages((prev) =>
                    prev.map((msg) => {
                      if (msg.id !== assistantMessage.id) return msg
                      const updatedCalls = (msg.toolCalls ?? []).map((tc) =>
                        tc.name === resultData.name && tc.result === undefined
                          ? { ...tc, result: resultData.result }
                          : tc
                      )
                      return { ...msg, toolCalls: updatedCalls }
                    })
                  )
                  break
                }

                case "complete": {
                  const completeData = (event as { type: "complete"; data: { message_id: string; conversation_id: string } }).data
                  setConversationId(completeData.conversation_id)
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? { ...msg, id: completeData.message_id, isStreaming: false }
                        : msg
                    )
                  )
                  break
                }

                case "error": {
                  const errorData = (event as { type: "error"; data: { code: string; message: string } }).data
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? { ...msg, content: `Erreur: ${errorData.message}`, isStreaming: false }
                        : msg
                    )
                  )
                  break
                }

                // connected, heartbeat — no action
              }

              currentEventType = ""
            }
          }
        }

        // Finalize if not already done by complete event
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id && msg.isStreaming
              ? { ...msg, isStreaming: false }
              : msg
          )
        )
      } catch (err: unknown) {
        const isAbort = err instanceof DOMException && err.name === "AbortError"
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  isStreaming: false,
                  isInterrupted: isAbort,
                  content: isAbort
                    ? msg.content || "Réponse interrompue."
                    : msg.content || "Une erreur est survenue.",
                }
              : msg
          )
        )
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [isStreaming, conversationId, pathname]
  )

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setConversationId(null)
  }, [])

  const loadConversation = useCallback((convId: string, msgs: ChatMessage[]) => {
    setConversationId(convId)
    setMessages(msgs)
  }, [])

  return {
    messages,
    isStreaming,
    conversationId,
    sendMessage,
    stopStreaming,
    clearMessages,
    loadConversation,
  }
}
