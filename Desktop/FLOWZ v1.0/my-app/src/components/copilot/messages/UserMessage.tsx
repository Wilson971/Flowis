"use client"

import { User } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserMessageProps {
  content: string
  timestamp: Date
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

export function UserMessage({ content, timestamp }: UserMessageProps) {
  return (
    <div className="flex gap-2.5 flex-row-reverse">
      <div className={cn(
        "h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5"
      )}>
        <User className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="flex flex-col items-end gap-1 max-w-[85%]">
        <div className="px-3 py-2 rounded-xl rounded-br-sm bg-primary text-primary-foreground text-xs leading-relaxed">
          {content}
        </div>
        <span className="text-xs text-muted-foreground/50 px-1">{timeAgo(timestamp)}</span>
      </div>
    </div>
  )
}
