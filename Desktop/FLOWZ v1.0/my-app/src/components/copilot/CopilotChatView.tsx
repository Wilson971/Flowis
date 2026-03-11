"use client"

import { useState, useCallback, useEffect } from "react"
import { CopilotWelcome } from "./CopilotWelcome"
import { CopilotMessageList, type CopilotMessage } from "./CopilotMessageList"
import { useCopilot } from "@/contexts/CopilotContext"

interface CopilotChatViewProps {
  messages: CopilotMessage[]
  isTyping: boolean
  onSend: (content: string) => void
}

export function CopilotChatView({ messages, isTyping, onSend }: CopilotChatViewProps) {
  const { consumePendingPrompt } = useCopilot()

  // Consume pending prompt from spotlight promotion
  useEffect(() => {
    const pending = consumePendingPrompt()
    if (pending) {
      onSend(pending)
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {messages.length === 0 ? (
        <div className="flex-1 p-4">
          <CopilotWelcome onSend={onSend} />
        </div>
      ) : (
        <CopilotMessageList messages={messages} isTyping={isTyping} />
      )}
    </div>
  )
}
