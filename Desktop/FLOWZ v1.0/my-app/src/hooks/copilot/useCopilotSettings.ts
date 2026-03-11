"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { CopilotSettings } from "@/types/copilot"

const QUERY_KEY = ["copilot-settings"]

const DEFAULT_SETTINGS: Omit<CopilotSettings, "tenant_id" | "updated_at"> = {
  personality: { style: "balanced", tone: "friendly" },
  autonomy: { light: "auto", medium: "confirm", heavy: "confirm" },
  notifications: {
    enabled: true,
    types: {
      seo_critical: true,
      drafts_forgotten: true,
      gsc_performance: true,
      sync_failed: true,
      batch_complete: true,
      products_unpublished: false,
    },
  },
}

export function useCopilotSettings() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: row, error } = await supabase
        .from("copilot_settings")
        .select("*")
        .eq("tenant_id", user.id)
        .maybeSingle()

      if (error) throw error
      return row
    },
    staleTime: 60_000,
  })

  const settings: Omit<CopilotSettings, "tenant_id" | "updated_at"> = {
    personality: data?.personality ?? DEFAULT_SETTINGS.personality,
    autonomy: data?.autonomy ?? DEFAULT_SETTINGS.autonomy,
    notifications: data?.notifications ?? DEFAULT_SETTINGS.notifications,
  }

  const updateMutation = useMutation({
    mutationFn: async (partial: Partial<Omit<CopilotSettings, "tenant_id" | "updated_at">>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const merged = {
        personality: { ...settings.personality, ...partial.personality },
        autonomy: { ...settings.autonomy, ...partial.autonomy },
        notifications: partial.notifications
          ? {
              ...settings.notifications,
              ...partial.notifications,
              types: { ...settings.notifications.types, ...partial.notifications?.types },
            }
          : settings.notifications,
      }

      const { error } = await supabase
        .from("copilot_settings")
        .upsert(
          { tenant_id: user.id, ...merged, updated_at: new Date().toISOString() },
          { onConflict: "tenant_id" }
        )

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  return {
    settings,
    isLoading,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  }
}
