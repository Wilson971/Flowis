"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { ChatMessage, CopilotConversation } from "@/types/copilot"

const QUERY_KEY = ["copilot-conversations"]

export function useConversations() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: conversations = [], isLoading } = useQuery<CopilotConversation[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("copilot_conversations")
        .select("id, tenant_id, title, summary, created_at, updated_at, deleted_at")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(50)

      if (error) throw error
      return data ?? []
    },
    staleTime: 30_000,
  })

  const loadMessages = async (conversationId: string): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
      .from("copilot_messages")
      .select("id, conversation_id, role, content, tool_calls, feedback, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(200)

    if (error) throw error

    return (data ?? [])
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(msg.created_at),
        toolCalls: msg.tool_calls ?? undefined,
        feedback: msg.feedback ?? undefined,
      }))
  }

  const deleteConversation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("copilot_conversations")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  return {
    conversations,
    isLoading,
    loadMessages,
    deleteConversation: deleteConversation.mutate,
  }
}
