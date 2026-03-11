"use client"

import { useState } from "react"
import { Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AIOrb } from "@/components/ui/ai-orb"
import { cn } from "@/lib/utils"
import { ToolIndicator } from "./ToolIndicator"

interface AssistantMessageProps {
  content: string
  timestamp: Date
  isStreaming?: boolean
  isInterrupted?: boolean
  toolCalls?: { name: string; status: "running" | "done" | "error" }[]
}

export function AssistantMessage({
  content,
  isStreaming,
  isInterrupted,
  toolCalls,
}: AssistantMessageProps) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex gap-2.5 group">
      <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <AIOrb size={15} state={isStreaming ? "generating" : "active"} />
      </div>
      <div className="flex-1 max-w-[85%] space-y-2">
        {/* Tool calls */}
        {toolCalls?.map((tc, i) => (
          <ToolIndicator key={i} name={tc.name} status={tc.status} />
        ))}

        {/* Content */}
        <div className="px-3 py-2 rounded-xl rounded-bl-sm bg-muted/50 text-foreground/90 text-xs leading-relaxed whitespace-pre-wrap">
          {content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-3.5 bg-primary/70 ml-0.5 animate-pulse rounded-sm" />
          )}
        </div>

        {isInterrupted && (
          <span className="text-xs text-muted-foreground/60 italic">(interrompu)</span>
        )}

        {/* Hover actions */}
        <div className={cn(
          "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        )}>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-lg"
            onClick={handleCopy}
            aria-label="Copier"
          >
            {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-6 w-6 rounded-lg", feedback === "up" && "text-success")}
            onClick={() => setFeedback(feedback === "up" ? null : "up")}
            aria-label="Utile"
          >
            <ThumbsUp className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-6 w-6 rounded-lg", feedback === "down" && "text-destructive")}
            onClick={() => setFeedback(feedback === "down" ? null : "down")}
            aria-label="Pas utile"
          >
            <ThumbsDown className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
