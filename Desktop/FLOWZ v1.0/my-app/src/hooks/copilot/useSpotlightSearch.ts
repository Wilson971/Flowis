"use client"

import { useState, useMemo, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { useDebounce } from "@/hooks/useDebounce"
import type { SpotlightItem } from "@/types/copilot"

const RECENTS_KEY = "copilot-spotlight-recents"
const MAX_RECENTS = 5

const PAGES: SpotlightItem[] = [
  { id: "nav-dashboard", category: "navigation", label: "Dashboard", icon: "LayoutDashboard", path: "/app/overview" },
  { id: "nav-products", category: "navigation", label: "Produits", icon: "Package", path: "/app/products" },
  { id: "nav-blog", category: "navigation", label: "Blog", icon: "FileText", path: "/app/blog" },
  { id: "nav-seo", category: "navigation", label: "SEO", icon: "Search", path: "/app/seo" },
  { id: "nav-photo-studio", category: "navigation", label: "Photo Studio", icon: "Camera", path: "/app/photo-studio" },
  { id: "nav-settings", category: "navigation", label: "Parametres", icon: "Settings", path: "/app/settings" },
  { id: "nav-flowriter", category: "navigation", label: "FloWriter", icon: "Sparkles", path: "/app/blog/flowriter" },
]

const ACTIONS: SpotlightItem[] = [
  { id: "action-audit-seo", category: "action", label: "Audit SEO", description: "Analyser le SEO de vos produits", icon: "ShieldCheck" },
  { id: "action-optimize", category: "action", label: "Optimiser descriptions", description: "Ameliorer les descriptions produits", icon: "Wand2" },
  { id: "action-ideas", category: "action", label: "Idees d'articles", description: "Generer des sujets de blog", icon: "Lightbulb" },
  { id: "action-summary", category: "action", label: "Resume du jour", description: "Voir les KPIs et activite recente", icon: "BarChart3" },
]

function getRecents(): SpotlightItem[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useSpotlightSearch() {
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, 200)
  const supabase = createClient()

  const shouldSearch = debouncedQuery.length >= 2

  const { data: dbResults = [], isFetching: isSearching } = useQuery<SpotlightItem[]>({
    queryKey: ["copilot-spotlight-db", debouncedQuery],
    queryFn: async () => {
      const term = `%${debouncedQuery}%`

      const [productsRes, postsRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, title")
          .ilike("title", term)
          .limit(5),
        supabase
          .from("blog_posts")
          .select("id, title")
          .ilike("title", term)
          .limit(5),
      ])

      const items: SpotlightItem[] = []

      for (const p of productsRes.data ?? []) {
        items.push({
          id: `product-${p.id}`,
          category: "navigation",
          label: p.title,
          icon: "Package",
          path: `/app/products/${p.id}`,
        })
      }

      for (const b of postsRes.data ?? []) {
        items.push({
          id: `blog-${b.id}`,
          category: "navigation",
          label: b.title,
          icon: "FileText",
          path: `/app/blog/editor/${b.id}`,
        })
      }

      return items
    },
    enabled: shouldSearch,
    staleTime: 10_000,
  })

  const results = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return { navigation: [], actions: [] }

    const navigation = [
      ...PAGES.filter((p) => p.label.toLowerCase().includes(q)),
      ...dbResults,
    ]

    const actions = ACTIONS.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q)
    )

    return { navigation, actions }
  }, [query, dbResults])

  const recents = useMemo(() => getRecents(), [])

  const addRecent = useCallback((item: SpotlightItem) => {
    const current = getRecents().filter((r) => r.id !== item.id)
    const updated = [{ ...item, category: "recent" as const }, ...current].slice(0, MAX_RECENTS)
    try {
      localStorage.setItem(RECENTS_KEY, JSON.stringify(updated))
    } catch {
      // ignore
    }
  }, [])

  const hasResults = results.navigation.length > 0 || results.actions.length > 0

  return {
    query,
    setQuery,
    results,
    recents,
    addRecent,
    isSearching,
    hasResults,
  }
}
