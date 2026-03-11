"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

const STORAGE_KEY = "flowiz-copilot-open"

interface CopilotContextType {
  // Panel (existing — preserve these)
  isOpen: boolean
  toggleCopilot: () => void
  setCopilotOpen: (open: boolean) => void
  isReady: boolean
  // Spotlight (new)
  isSpotlightOpen: boolean
  openSpotlight: () => void
  closeSpotlight: () => void
  // View (new)
  activeView: "chat" | "history"
  setActiveView: (view: "chat" | "history") => void
  // Promotion spotlight → panel (new)
  pendingPrompt: string | null
  promoteToPanelWith: (prompt: string) => void
  consumePendingPrompt: () => string | null
}

const CopilotContext = createContext<CopilotContextType | null>(null)

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false)
  const [activeView, setActiveView] = useState<"chat" | "history">("chat")
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null)

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === "true") setIsOpen(true)
    } catch {}
    setIsReady(true)
  }, [])

  // Persist panel state
  useEffect(() => {
    if (!isReady) return
    try {
      localStorage.setItem(STORAGE_KEY, String(isOpen))
    } catch {}
  }, [isOpen, isReady])

  const toggleCopilot = useCallback(() => setIsOpen((p) => !p), [])
  const setCopilotOpen = useCallback((open: boolean) => setIsOpen(open), [])

  const openSpotlight = useCallback(() => setIsSpotlightOpen(true), [])
  const closeSpotlight = useCallback(() => setIsSpotlightOpen(false), [])

  const promoteToPanelWith = useCallback((prompt: string) => {
    setPendingPrompt(prompt)
    setIsSpotlightOpen(false)
    setIsOpen(true)
    setActiveView("chat")
  }, [])

  const consumePendingPrompt = useCallback(() => {
    const p = pendingPrompt
    setPendingPrompt(null)
    return p
  }, [pendingPrompt])

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+K — Spotlight
      if ((e.ctrlKey || e.metaKey) && e.key === "k" && !e.shiftKey) {
        e.preventDefault()
        setIsSpotlightOpen((p) => !p)
      }
      // Ctrl+Shift+K — Panel
      if ((e.ctrlKey || e.metaKey) && e.key === "K" && e.shiftKey) {
        e.preventDefault()
        setIsOpen((p) => !p)
      }
      // Ctrl+Shift+N — New conversation
      if ((e.ctrlKey || e.metaKey) && e.key === "N" && e.shiftKey) {
        e.preventDefault()
        setPendingPrompt(null)
        setActiveView("chat")
        setIsOpen(true)
      }
      // Esc — close spotlight first, then panel
      if (e.key === "Escape") {
        if (isSpotlightOpen) {
          setIsSpotlightOpen(false)
          e.preventDefault()
        }
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isSpotlightOpen])

  return (
    <CopilotContext.Provider
      value={{
        isOpen,
        toggleCopilot,
        setCopilotOpen,
        isReady,
        isSpotlightOpen,
        openSpotlight,
        closeSpotlight,
        activeView,
        setActiveView,
        pendingPrompt,
        promoteToPanelWith,
        consumePendingPrompt,
      }}
    >
      {children}
    </CopilotContext.Provider>
  )
}

export function useCopilot() {
  const ctx = useContext(CopilotContext)
  if (!ctx) throw new Error("useCopilot must be used within CopilotProvider")
  return ctx
}
