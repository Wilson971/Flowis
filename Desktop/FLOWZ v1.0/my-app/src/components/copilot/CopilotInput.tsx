"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { ArrowUp, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { motionTokens } from "@/lib/design-system"

const SLASH_COMMANDS = [
  { command: "/seo", label: "Audit SEO", description: "Lancer un audit SEO" },
  { command: "/produits", label: "Produits", description: "Rechercher des produits" },
  { command: "/blog", label: "Blog", description: "G\u00e9rer les articles" },
  { command: "/kpi", label: "KPIs", description: "Voir les indicateurs" },
  { command: "/aide", label: "Aide", description: "Commandes disponibles" },
]

const MAX_CHARS = 2000

interface CopilotInputProps {
  onSend: (content: string) => void
  isStreaming: boolean
  onStop: () => void
}

export function CopilotInput({ onSend, isStreaming, onStop }: CopilotInputProps) {
  const [value, setValue] = useState("")
  const [showSlash, setShowSlash] = useState(false)
  const [slashFilter, setSlashFilter] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const filteredCommands = SLASH_COMMANDS.filter((c) =>
    c.command.startsWith("/" + slashFilter)
  )

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    if (v.length > MAX_CHARS) return
    setValue(v)

    if (v.startsWith("/")) {
      setShowSlash(true)
      setSlashFilter(v.slice(1))
    } else {
      setShowSlash(false)
    }
  }

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setValue("")
    setShowSlash(false)
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [value, isStreaming, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (showSlash && filteredCommands.length > 0) {
        selectCommand(filteredCommands[0].command)
      } else {
        handleSend()
      }
    }
    if (e.key === "Escape") {
      setShowSlash(false)
    }
  }

  const selectCommand = (cmd: string) => {
    setValue(cmd + " ")
    setShowSlash(false)
    textareaRef.current?.focus({ preventScroll: true })
  }

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement
    target.style.height = "auto"
    target.style.height = Math.min(target.scrollHeight, 120) + "px"
  }

  // Focus on mount
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus({ preventScroll: true }), 300)
  }, [])

  return (
    <div className="flex-shrink-0 border-t border-border/10 p-3">
      <div className="relative">
        {/* Slash command dropdown */}
        <AnimatePresence>
          {showSlash && filteredCommands.length > 0 && (
            <motion.div
              variants={motionTokens.variants.dropdown}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-border/20 bg-card shadow-lg overflow-hidden z-20"
            >
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.command}
                  onClick={() => selectCommand(cmd.command)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-left",
                    "hover:bg-muted/50 transition-colors"
                  )}
                >
                  <span className="text-xs font-mono text-primary">{cmd.command}</span>
                  <span className="text-xs text-muted-foreground">{cmd.description}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder="Demandez-moi quelque chose..."
              rows={1}
              className={cn(
                "w-full resize-none rounded-xl border border-border/20 bg-muted/30 px-3 py-2.5",
                "text-xs text-foreground placeholder:text-muted-foreground/50",
                "focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30",
                "transition-colors max-h-[120px]"
              )}
              style={{ height: "auto", minHeight: "38px" }}
            />
          </div>
          {isStreaming ? (
            <Button
              size="icon"
              variant="destructive"
              onClick={onStop}
              className="h-[38px] w-[38px] rounded-xl flex-shrink-0"
              aria-label="Arr\u00eater"
            >
              <Square className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!value.trim()}
              className="h-[38px] w-[38px] rounded-xl flex-shrink-0"
              aria-label="Envoyer"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground/40 text-center mt-2">
        Copilot FLOWZ &mdash; IA contextuelle
      </p>
    </div>
  )
}
