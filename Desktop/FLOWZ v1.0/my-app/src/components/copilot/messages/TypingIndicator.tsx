"use client"

import { AIOrb } from "@/components/ui/ai-orb"

export function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <AIOrb size={15} state="generating" />
      </div>
      <div className="bg-muted/50 px-3 py-2.5 rounded-xl rounded-bl-sm">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}
