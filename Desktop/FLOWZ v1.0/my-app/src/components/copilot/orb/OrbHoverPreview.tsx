"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Package,
  RefreshCw,
  TrendingDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motionTokens } from "@/lib/design-system"
import type { CopilotNotification, NotificationType } from "@/types/copilot"

const iconMap: Record<NotificationType, React.ElementType> = {
  seo_critical: AlertTriangle,
  drafts_forgotten: FileText,
  gsc_performance: TrendingDown,
  sync_failed: RefreshCw,
  batch_complete: CheckCircle,
  products_unpublished: Package,
}

const colorMap: Record<NotificationType, string> = {
  seo_critical: "text-destructive",
  drafts_forgotten: "text-warning",
  gsc_performance: "text-orange-400",
  sync_failed: "text-destructive",
  batch_complete: "text-emerald-500",
  products_unpublished: "text-muted-foreground",
}

interface OrbHoverPreviewProps {
  notifications: CopilotNotification[]
  isVisible: boolean
}

export function OrbHoverPreview({ notifications, isVisible }: OrbHoverPreviewProps) {
  if (notifications.length === 0) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          {...motionTokens.variants.tooltip}
          className={cn(
            "absolute top-full right-0 mt-2 z-50",
            "w-72 max-w-xs rounded-xl border border-border bg-popover p-3 shadow-lg"
          )}
        >
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Notifications ({notifications.length})
          </p>
          <ul className="space-y-1.5">
            {notifications.slice(0, 5).map((n) => {
              const Icon = iconMap[n.type]
              return (
                <li key={n.id} className="flex items-start gap-2">
                  <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", colorMap[n.type])} />
                  <span className="text-xs text-popover-foreground leading-snug">
                    {n.message}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-2.5 text-center text-[10px] text-muted-foreground">
            Cliquer pour ouvrir le panel
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
