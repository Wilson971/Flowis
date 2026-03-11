"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Package, FileText, Zap, MessageSquare,
  LayoutDashboard, Settings, Camera, Sparkles,
  Clock, ArrowRight, ShieldCheck, Wand2, Lightbulb, BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motionTokens } from "@/lib/design-system"
import { useCopilot } from "@/contexts/CopilotContext"
import { useSpotlightSearch } from "@/hooks/copilot/useSpotlightSearch"
import type { SpotlightItem } from "@/types/copilot"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Package, FileText, LayoutDashboard, Settings, Camera, Sparkles,
  Search, Zap, MessageSquare, Clock, ShieldCheck, Wand2, Lightbulb, BarChart3,
}

function ItemIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Zap
  return <Icon className={className} />
}

export function SpotlightModal() {
  const router = useRouter()
  const { isSpotlightOpen, closeSpotlight, promoteToPanelWith } = useCopilot()
  const { query, setQuery, results, recents, addRecent, isSearching, hasResults } = useSpotlightSearch()
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Build flat list of selectable items
  const flatItems = useCallback((): (SpotlightItem | { id: "ask-copilot"; label: string })[] => {
    if (!query) {
      return [...recents, ...results.navigation, ...results.actions]
    }
    const items: (SpotlightItem | { id: "ask-copilot"; label: string })[] = [
      ...results.navigation,
      ...results.actions,
    ]
    // Always append "Demander au Copilot" when there's a query
    items.push({ id: "ask-copilot", label: `Demander au Copilot : "${query}"` })
    return items
  }, [query, results, recents])

  const items = flatItems()

  // Reset index when results change
  useEffect(() => {
    setActiveIndex(0)
  }, [query, results.navigation.length, results.actions.length])

  // Focus input on open
  useEffect(() => {
    if (isSpotlightOpen) {
      setQuery("")
      setActiveIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }))
    }
  }, [isSpotlightOpen, setQuery])

  // Scroll active item into view
  useEffect(() => {
    const container = listRef.current
    if (!container) return
    const active = container.querySelector("[data-active='true']")
    if (active) {
      active.scrollIntoView({ block: "nearest" })
    }
  }, [activeIndex])

  const selectItem = useCallback(
    (item: (typeof items)[number]) => {
      if (item.id === "ask-copilot") {
        promoteToPanelWith(query)
        return
      }
      const si = item as SpotlightItem
      addRecent(si)
      closeSpotlight()
      if (si.path) {
        router.push(si.path)
      } else if (si.action) {
        si.action()
      } else {
        // Actions without handler -> promote to panel
        promoteToPanelWith(si.label)
      }
    },
    [query, addRecent, closeSpotlight, router, promoteToPanelWith]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, items.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === "Enter" && items[activeIndex]) {
        e.preventDefault()
        selectItem(items[activeIndex])
      }
    },
    [items, activeIndex, selectItem]
  )

  // Section renderer
  const renderSection = (title: string, sectionItems: SpotlightItem[], startIndex: number) => {
    if (sectionItems.length === 0) return null
    return (
      <div className="py-1">
        <div className="px-4 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </div>
        {sectionItems.map((item, i) => {
          const idx = startIndex + i
          return (
            <button
              key={item.id}
              data-active={idx === activeIndex}
              onClick={() => selectItem(item)}
              onMouseEnter={() => setActiveIndex(idx)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors rounded-lg mx-1",
                idx === activeIndex ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              style={{ width: "calc(100% - 0.5rem)" }}
            >
              <ItemIcon name={item.icon} className="h-4 w-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{item.label}</div>
                {item.description && (
                  <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                )}
              </div>
              {item.path && <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
            </button>
          )
        })}
      </div>
    )
  }

  // Calculate section start indices
  let offset = 0
  const recentItems = !query ? recents : []
  const recentStart = offset
  offset += recentItems.length
  const navStart = offset
  offset += results.navigation.length
  const actionStart = offset
  offset += results.actions.length

  return (
    <AnimatePresence>
      {isSpotlightOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-center bg-black/60 backdrop-blur-sm"
          variants={motionTokens.variants.fadeIn}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={closeSpotlight}
        >
          <motion.div
            className="w-full max-w-xl mx-auto mt-[20vh] h-fit"
            variants={motionTokens.variants.slideUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="bg-card border border-border rounded-xl shadow-xl overflow-hidden"
              onKeyDown={handleKeyDown}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher ou demander..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded-md border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-1">
                {/* No query: show recents + suggestions */}
                {!query && recents.length > 0 && (
                  renderSection("Recents", recentItems, recentStart)
                )}

                {renderSection(
                  query ? "Resultats" : "Navigation",
                  results.navigation.length > 0 ? results.navigation : (!query ? ([] as SpotlightItem[]) : []),
                  navStart
                )}

                {renderSection("Actions", results.actions.length > 0 ? results.actions : (!query ? ([] as SpotlightItem[]) : []), actionStart)}

                {/* No results message */}
                {query && !hasResults && !isSearching && (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Aucun resultat pour &quot;{query}&quot;
                  </div>
                )}

                {/* Ask Copilot footer */}
                {query && (
                  <div className="border-t border-border py-1">
                    <button
                      data-active={activeIndex === items.length - 1}
                      onClick={() => selectItem(items[items.length - 1])}
                      onMouseEnter={() => setActiveIndex(items.length - 1)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors rounded-lg mx-1",
                        activeIndex === items.length - 1
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-primary"
                      )}
                      style={{ width: "calc(100% - 0.5rem)" }}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span className="text-sm truncate">Demander au Copilot : &quot;{query}&quot;</span>
                      <ArrowRight className="h-3 w-3 shrink-0 ml-auto" />
                    </button>
                  </div>
                )}

                {/* Loading indicator */}
                {isSearching && (
                  <div className="px-4 py-2 text-xs text-muted-foreground">
                    Recherche...
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
