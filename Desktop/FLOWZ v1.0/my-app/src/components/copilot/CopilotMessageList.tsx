"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowDown } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motionTokens } from "@/lib/design-system"
import { UserMessage } from "./messages/UserMessage"
import { AssistantMessage } from "./messages/AssistantMessage"
import { TypingIndicator } from "./messages/TypingIndicator"

export type CopilotMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isStreaming?: boolean
  isInterrupted?: boolean
  toolCalls?: { name: string; status: "running" | "done" | "error" }[]
}

interface CopilotMessageListProps {
  messages: CopilotMessage[]
  isTyping: boolean
}

export function CopilotMessageList({ messages, isTyping }: CopilotMessageListProps) {
  const scrollEndRef = useRef<HTMLDivElement>(null)
  const [showScrollDown, setShowScrollDown] = useState(false)

  const scrollToBottom = useCallback(() => {
    const el = scrollEndRef.current
    if (!el) return
    const container = el.closest("[data-radix-scroll-area-viewport]")
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
    }
  }, [])

  // Auto-scroll on new messages / typing
  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  // Detect if user scrolled up
  useEffect(() => {
    const el = scrollEndRef.current
    if (!el) return
    const container = el.closest("[data-radix-scroll-area-viewport]")
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100)
    }
    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <ScrollArea className="flex-1 min-h-0 overflow-y-auto relative">
      <div className="p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              variants={motionTokens.variants.slideUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
            >
              {msg.role === "user" ? (
                <UserMessage content={msg.content} timestamp={msg.timestamp} />
              ) : (
                <AssistantMessage
                  content={msg.content}
                  timestamp={msg.timestamp}
                  isStreaming={msg.isStreaming}
                  isInterrupted={msg.isInterrupted}
                  toolCalls={msg.toolCalls}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {isTyping && (
            <motion.div
              variants={motionTokens.variants.fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={scrollEndRef} />
      </div>

      {/* Floating scroll-down button */}
      <AnimatePresence>
        {showScrollDown && (
          <motion.div
            variants={motionTokens.variants.fadeInScale}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="sticky bottom-2 flex justify-center"
          >
            <Button
              size="icon"
              variant="secondary"
              onClick={scrollToBottom}
              className={cn("h-8 w-8 rounded-full shadow-md")}
              aria-label="Aller en bas"
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </ScrollArea>
  )
}
