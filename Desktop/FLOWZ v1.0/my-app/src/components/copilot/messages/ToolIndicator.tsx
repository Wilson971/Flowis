"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { motionTokens } from "@/lib/design-system"

const TOOL_LABELS: Record<string, string> = {
  get_products: "\ud83d\udd0d Recherche de produits...",
  get_product_detail: "\ud83d\udd0d Chargement du produit...",
  seo_audit: "\u26a1 Analyse SEO en cours...",
  get_blog_posts: "\ud83d\udcdd Chargement des articles...",
  get_dashboard_kpis: "\ud83d\udcca R\u00e9cup\u00e9ration des KPIs...",
  get_priority_actions: "\ud83c\udfaf Calcul des priorit\u00e9s...",
  keyword_suggestions: "\ud83d\udd11 Suggestions de mots-cl\u00e9s...",
  get_gsc_performance: "\ud83d\udcc8 Donn\u00e9es Search Console...",
}

interface ToolIndicatorProps {
  name: string
  status: "running" | "done" | "error"
}

export function ToolIndicator({ name, status }: ToolIndicatorProps) {
  const label = TOOL_LABELS[name] ?? name

  return (
    <motion.div
      variants={motionTokens.variants.fadeIn}
      initial="hidden"
      animate="visible"
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs",
        status === "running" && "bg-primary/10 text-primary",
        status === "done" && "bg-success/10 text-success",
        status === "error" && "bg-destructive/10 text-destructive"
      )}
    >
      {status === "running" && (
        <span className="flex gap-0.5">
          <span className="w-1 h-1 bg-current rounded-full animate-pulse" />
          <span className="w-1 h-1 bg-current rounded-full animate-pulse [animation-delay:150ms]" />
          <span className="w-1 h-1 bg-current rounded-full animate-pulse [animation-delay:300ms]" />
        </span>
      )}
      {status === "done" && <span className="text-xs">&#10003;</span>}
      {status === "error" && <span className="text-xs">&#10007;</span>}
      <span>{label}</span>
    </motion.div>
  )
}
