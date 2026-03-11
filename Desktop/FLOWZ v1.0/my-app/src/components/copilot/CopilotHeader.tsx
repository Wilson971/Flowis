"use client"

import { Plus, History, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AIOrb } from "@/components/ui/ai-orb"
import { cn } from "@/lib/utils"
import { useCopilot } from "@/contexts/CopilotContext"

interface CopilotHeaderProps {
  isStreaming?: boolean
  onNewConversation?: () => void
}

export function CopilotHeader({ isStreaming, onNewConversation }: CopilotHeaderProps) {
  const { activeView, setActiveView, setCopilotOpen } = useCopilot()

  const handleNew = () => {
    onNewConversation?.()
    setActiveView("chat")
  }

  const handleToggleHistory = () => {
    setActiveView(activeView === "chat" ? "history" : "chat")
  }

  return (
    <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/10">
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <AIOrb size={18} state={isStreaming ? "generating" : "active"} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Copilot FLOWZ</h3>
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              isStreaming ? "bg-warning animate-pulse" : "bg-success"
            )} />
            <p className="text-xs text-muted-foreground">
              {isStreaming ? "En cours..." : "En ligne"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNew}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
          aria-label="Nouvelle conversation"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleHistory}
          className={cn(
            "h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground",
            activeView === "history" && "bg-muted text-foreground"
          )}
          aria-label="Historique"
        >
          <History className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCopilotOpen(false)}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
