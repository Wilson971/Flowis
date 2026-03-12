"use client"

import { useCallback, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { useChat as useAIChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"

export function useChat() {
  const pathname = usePathname()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const conversationIdRef = useRef<string | null>(null)

  const {
    messages,
    sendMessage: aiSendMessage,
    status,
    stop,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
  } = useAIChat({
    transport: new DefaultChatTransport({
      api: "/api/copilot/stream",
      // H1 fix: Include conversationId in request body
      body: {
        conversationId: conversationIdRef.current,
        context: {
          page: pathname?.split("/").pop() ?? "overview",
          pathname: pathname ?? "/app/overview",
        },
      },
    }),
    // H1 fix: Read x-conversation-id from response headers
    onResponse: (response: Response) => {
      const newConvId = response.headers.get("x-conversation-id")
      if (newConvId && newConvId !== conversationIdRef.current) {
        conversationIdRef.current = newConvId
        setConversationId(newConvId)
      }
    },
  })

  const isStreaming = status === "streaming" || status === "submitted"

  const sendMessage = useCallback(
    (content: string) => {
      if (isStreaming || !content.trim()) return
      aiSendMessage({ text: content.trim() })
    },
    [isStreaming, aiSendMessage]
  )

  const stopStreaming = useCallback(() => {
    stop()
  }, [stop])

  const clearMessages = useCallback(() => {
    setMessages([])
    conversationIdRef.current = null
    setConversationId(null)
  }, [setMessages])

  return {
    messages,
    isStreaming,
    conversationId,
    sendMessage,
    stopStreaming,
    clearMessages,
    input,
    handleInputChange,
    handleSubmit,
  }
}
