"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Trash2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { motionTokens } from "@/lib/design-system"

// Placeholder types until real hooks exist
type Conversation = {
  id: string
  title: string
  updatedAt: Date
  messageCount: number
}

type MemorySummary = {
  key: string
  value: string
}

// Placeholder hooks — will be replaced with real implementations
function useConversations() {
  return {
    conversations: [] as Conversation[],
    loadConversation: (_id: string) => {},
    deleteConversation: (_id: string) => {},
  }
}

function useCopilotMemory() {
  return { memories: [] as MemorySummary[] }
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return "\u00e0 l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

function groupByDate(conversations: Conversation[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)

  const groups: { label: string; items: Conversation[] }[] = [
    { label: "Aujourd'hui", items: [] },
    { label: "Hier", items: [] },
    { label: "Cette semaine", items: [] },
    { label: "Plus ancien", items: [] },
  ]

  for (const conv of conversations) {
    const d = conv.updatedAt
    if (d >= today) groups[0].items.push(conv)
    else if (d >= yesterday) groups[1].items.push(conv)
    else if (d >= weekAgo) groups[2].items.push(conv)
    else groups[3].items.push(conv)
  }

  return groups.filter((g) => g.items.length > 0)
}

export function CopilotHistoryView() {
  const { conversations, loadConversation, deleteConversation } = useConversations()
  const { memories } = useCopilotMemory()
  const [search, setSearch] = useState("")
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const filtered = search
    ? conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : conversations

  const groups = groupByDate(filtered)

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      deleteConversation(id)
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(id)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Search */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className={cn(
              "w-full rounded-lg border border-border/20 bg-muted/30 pl-8 pr-3 py-2",
              "text-xs text-foreground placeholder:text-muted-foreground/50",
              "focus:outline-none focus:ring-1 focus:ring-primary/30"
            )}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="px-4 pb-4 space-y-4">
          {groups.length === 0 && (
            <motion.div
              variants={motionTokens.variants.fadeIn}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">
                {search ? "Aucun r\u00e9sultat" : "Aucune conversation"}
              </p>
            </motion.div>
          )}

          {groups.map((group) => (
            <div key={group.label} className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60 px-1">
                {group.label}
              </p>
              <AnimatePresence>
                {group.items.map((conv) => (
                  <motion.button
                    key={conv.id}
                    variants={motionTokens.variants.staggerItem}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    onClick={() => loadConversation(conv.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl",
                      "bg-muted/20 hover:bg-muted/50 transition-colors text-left group"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{conv.title}</p>
                      <p className="text-xs text-muted-foreground/60">{timeAgo(conv.updatedAt)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-6 w-6 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0",
                        confirmDeleteId === conv.id && "opacity-100 text-destructive"
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(conv.id)
                      }}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          ))}

          {/* Memory summary */}
          {memories.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border/10">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60 px-1">
                M\u00e9moire
              </p>
              {memories.map((m) => (
                <div key={m.key} className="px-3 py-2 rounded-lg bg-muted/20 text-xs">
                  <span className="text-muted-foreground font-medium">{m.key}:</span>{" "}
                  <span className="text-foreground/80">{m.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
