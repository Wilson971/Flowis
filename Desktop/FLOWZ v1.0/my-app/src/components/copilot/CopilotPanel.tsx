"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useCopilot } from "@/contexts/CopilotContext"
import { motionTokens } from "@/lib/design-system"
import { CopilotHeader } from "./CopilotHeader"
import { CopilotChatView } from "./CopilotChatView"
import { CopilotHistoryView } from "./CopilotHistoryView"
import { CopilotInput } from "./CopilotInput"
import type { CopilotMessage } from "./CopilotMessageList"

const DESKTOP_BREAKPOINT = 1024

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(true)
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])
  return isDesktop
}

export const CopilotPanel = () => {
  const { isOpen, setCopilotOpen, activeView, setActiveView } = useCopilot()
  const [messages, setMessages] = useState<CopilotMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const isDesktop = useIsDesktop()

  // Lock body scroll on mobile overlay
  useEffect(() => {
    if (!isDesktop && isOpen) {
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = "" }
    }
  }, [isDesktop, isOpen])

  const handleSend = useCallback((content: string) => {
    const userMsg: CopilotMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsStreaming(true)

    // Simulated AI response (will be replaced with real API)
    setTimeout(() => {
      const assistantMsg: CopilotMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Je comprends votre demande concernant "${content.slice(0, 50)}...". Cette fonctionnalité sera bientôt connectée à l'IA FLOWZ pour vous fournir des réponses personnalisées basées sur vos données.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
      setIsStreaming(false)
    }, 1500)
  }, [])

  const handleStop = useCallback(() => {
    setIsStreaming(false)
  }, [])

  const handleNewConversation = useCallback(() => {
    setMessages([])
    setIsStreaming(false)
  }, [])

  const handleClose = useCallback(() => setCopilotOpen(false), [setCopilotOpen])

  if (!isOpen) return null

  const panelContent = (
    <>
      <CopilotHeader
        isStreaming={isStreaming}
        onNewConversation={handleNewConversation}
      />
      {activeView === "chat" ? (
        <CopilotChatView
          messages={messages}
          isTyping={isStreaming}
          onSend={handleSend}
        />
      ) : (
        <CopilotHistoryView />
      )}
      {activeView === "chat" && (
        <CopilotInput
          onSend={handleSend}
          isStreaming={isStreaming}
          onStop={handleStop}
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
