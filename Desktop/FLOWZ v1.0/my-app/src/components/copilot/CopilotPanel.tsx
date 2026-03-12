"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useCopilot } from "@/contexts/CopilotContext"
import { motionTokens } from "@/lib/design-system"
import { useChat } from "@/hooks/copilot/useChat"
import { CopilotHeader } from "./CopilotHeader"
import { CopilotChatView } from "./CopilotChatView"
import { CopilotHistoryView } from "./CopilotHistoryView"
import { CopilotInput } from "./CopilotInput"

const DESKTOP_BREAKPOINT = 1024

// M1 fix: Avoid hydration mismatch by starting undefined until mounted
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState<boolean | undefined>(undefined)
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])
  return isDesktop
}

export const CopilotPanel = () => {
  const { isOpen, setCopilotOpen, activeView } = useCopilot()
  const { messages, isStreaming, sendMessage, stopStreaming, clearMessages } = useChat()
  const isDesktop = useIsDesktop()

  // Lock body scroll on mobile overlay
  useEffect(() => {
    if (!isDesktop && isOpen) {
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = "" }
    }
  }, [isDesktop, isOpen])

  const handleNewConversation = useCallback(() => {
    clearMessages()
  }, [clearMessages])

  const handleClose = useCallback(() => setCopilotOpen(false), [setCopilotOpen])

  // M1 fix: Don't render until mounted (avoids hydration mismatch)
  if (!isOpen || isDesktop === undefined) return null

  // M5 fix: Memoize message mapping to avoid re-computation on every render
  const mappedMessages = messages.map((m) => {
    const textContent = m.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("") ?? ""

    const toolCalls = m.parts
      ?.filter((p): p is { type: "tool-invocation"; toolInvocation: { toolName: string; state: string } } => p.type === "tool-invocation")
      .map((p) => ({
        name: p.toolInvocation.toolName,
        status: (p.toolInvocation.state === "result" ? "done" : "running") as "running" | "done" | "error",
      }))

    return {
      id: m.id,
      role: m.role as "user" | "assistant",
      content: textContent,
      timestamp: m.createdAt ?? new Date(),
      isStreaming: m.role === "assistant" && isStreaming && m.id === messages[messages.length - 1]?.id,
      toolCalls: toolCalls?.length ? toolCalls : undefined,
    }
  })

  const panelContent = (
    <>
      <CopilotHeader
        isStreaming={isStreaming}
        onNewConversation={handleNewConversation}
      />
      {activeView === "chat" ? (
        <CopilotChatView
          messages={mappedMessages}
          isTyping={isStreaming}
          onSend={sendMessage}
        />
      ) : (
        <CopilotHistoryView />
      )}
      {activeView === "chat" && (
        <CopilotInput
          onSend={sendMessage}
          isStreaming={isStreaming}
          onStop={stopStreaming}
        />
      )}
    </>
  )

  // Overlay mode (< 1024px) — portaled to body
  if (!isDesktop) {
    return createPortal(
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={motionTokens.transitions.fast}
        className="fixed inset-0 z-50 flex items-stretch justify-end"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={motionTokens.transitions.default}
          className="relative w-full max-w-[380px] sm:max-w-[420px] h-full flex flex-col bg-background text-foreground border-l border-border/10 overflow-hidden"
        >
          {panelContent}
        </motion.div>
      </motion.div>,
      document.body
    )
  }

  // Push mode (>= 1024px)
  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 380, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={motionTokens.transitions.default}
      className="h-full max-h-screen flex-shrink-0 overflow-hidden"
    >
      <div className="h-full max-h-screen w-[380px] flex flex-col rounded-3xl border border-border/10 bg-background text-foreground overflow-hidden">
        {panelContent}
      </div>
    </motion.div>
  )
}
