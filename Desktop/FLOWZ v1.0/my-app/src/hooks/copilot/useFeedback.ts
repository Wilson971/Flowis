"use client"

import { useMutation } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { MessageFeedback } from "@/types/copilot"

export function useFeedback() {
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ messageId, feedback }: { messageId: string; feedback: MessageFeedback }) => {
      const { error } = await supabase
        .from("copilot_messages")
        .update({ feedback })
        .eq("id", messageId)

      if (error) throw error
    },
  })
}
