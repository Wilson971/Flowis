"use client"

import { useMemo, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import type { CopilotNotification } from "@/types/copilot"

const STORAGE_KEY = "copilot-dismissed-notifs"
const EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

function getDismissed(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, number>
    const now = Date.now()
    const cleaned: Record<string, number> = {}
    for (const [id, ts] of Object.entries(parsed)) {
      if (now - ts < EXPIRY_MS) cleaned[id] = ts
    }
    return cleaned
  } catch {
    return {}
  }
}

function saveDismissed(dismissed: Record<string, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed))
  } catch {
    // storage full — ignore
  }
}

export function useCopilotNotifications({ enabled = true }: { enabled?: boolean } = {}) {
  const { data: raw = [], isLoading } = useQuery<CopilotNotification[]>({
    queryKey: ["copilot-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/copilot/notifications")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return data.notifications ?? []
    },
    enabled,
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: false,
    staleTime: 60_000,
  })

  const notifications = useMemo(() => {
    const dismissed = getDismissed()
    return raw.filter((n) => !dismissed[n.id])
  }, [raw])

  const count = notifications.length
  const hasUrgent = notifications.some((n) => n.priority === "urgent")

  const dismiss = useCallback((id: string) => {
    const dismissed = getDismissed()
    dismissed[id] = Date.now()
    saveDismissed(dismissed)
  }, [])

  return { notifications, count, hasUrgent, dismiss, isLoading }
}
