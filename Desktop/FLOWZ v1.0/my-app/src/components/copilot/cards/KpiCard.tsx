"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Package, FileText, BarChart3, PenTool, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  data: Record<string, unknown>
}

// M4 fix: Use semantic/muted colors instead of hardcoded Tailwind palette
const KPI_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  total_products: { label: "Produits", icon: Package, color: "text-primary" },
  total_articles: { label: "Articles", icon: FileText, color: "text-accent-foreground" },
  average_seo_score: { label: "Score SEO moyen", icon: BarChart3, color: "text-warning" },
  drafts: { label: "Brouillons", icon: PenTool, color: "text-muted-foreground" },
  published: { label: "Publiés", icon: BookOpen, color: "text-success" },
}

export function KpiCard({ data }: KpiCardProps) {
  // If it has known KPI keys, render as a dashboard summary
  const knownKeys = Object.keys(data).filter((k) => k in KPI_CONFIG)

  if (knownKeys.length > 0) {
    return (
      <Card className="rounded-xl overflow-hidden">
        <CardContent className="p-3 grid grid-cols-2 gap-2">
          {knownKeys.map((key) => {
            const config = KPI_CONFIG[key]
            const value = data[key] as number | string
            const Icon = config.icon
            return (
              <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                <div className={cn("p-1.5 rounded-md bg-muted", config.color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground leading-tight">{config.label}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
                  </p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  // Fallback: single metric card
  const label = (data.label as string) ?? "Métrique"
  const value = (data.value as string | number) ?? 0
  const trend = (data.trend as number) ?? 0
  const trendDirection = trend > 0 ? "up" : trend < 0 ? "down" : "neutral"

  return (
    <Card className="rounded-xl">
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-foreground">
            {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
          </p>
        </div>
        {trend !== 0 && (
          <div className={cn(
            "flex items-center gap-0.5 text-xs font-medium",
            trendDirection === "up" && "text-success",
            trendDirection === "down" && "text-destructive"
          )}>
            <span>{trendDirection === "up" ? "↑" : "↓"}</span>
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
