"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { CopilotMemoryItem } from "@/types/copilot"

const QUERY_KEY = ["copilot-memory"]

export function useCopilotMemory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: items = [], isLoading } = useQuery<CopilotMemoryItem[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("copilot_memory")
        .select("id, tenant_id, content, source, created_at")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      return data ?? []
    },
  })

  const addMemory = useMutation({
    mutationFn: async (content: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase
        .from("copilot_memory")
        .insert({ tenant_id: user.id, content, source: "user" })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  const deleteMemory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("copilot_memory")
        .delete()
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  const clearAll = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase
        .from("copilot_memory")
        .delete()
        .eq("tenant_id", user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  return {
    items,
    isLoading,
    addMemory: addMemory.mutate,
    deleteMemory: deleteMemory.mutate,
    clearAll: clearAll.mutate,
  }
}
