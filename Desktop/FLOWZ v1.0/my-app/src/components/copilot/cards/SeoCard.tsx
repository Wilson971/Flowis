"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SeoCardProps {
  data: Record<string, unknown>
}

export function SeoCard({ data }: SeoCardProps) {
  // Support both formats: {avgScore} and {average_seo_score}
  const avgScore = (data.avgScore as number) ?? (data.average_seo_score as number) ?? 0
  const criticalCount = (data.criticalCount as number) ?? (data.critical_count as number) ?? 0
  const totalProducts = (data.total_products as number) ?? 0
  const issues = (data.issues as string[]) ?? []

  // M4 fix: Use semantic color tokens instead of hardcoded Tailwind colors
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success"
    if (score >= 50) return "text-warning"
    return "text-destructive"
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-success"
    if (score >= 50) return "bg-warning"
    return "bg-destructive"
  }

  const healthyCount = totalProducts - criticalCount
  const healthyPct = totalProducts > 0 ? Math.round((healthyCount / totalProducts) * 100) : 0

  return (
    <Card className="rounded-xl overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Score header */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className={cn("text-2xl font-bold", getScoreColor(avgScore))}>{avgScore}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
          <div className="flex items-center gap-1.5">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                {criticalCount} critique{criticalCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {totalProducts > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{healthyCount} sains</span>
              <span>{criticalCount} à optimiser</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
              <div
                className={cn("h-full rounded-full transition-all", getScoreBg(avgScore))}
                style={{ width: `${healthyPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Issues list */}
        {issues.length > 0 && (
          <ul className="space-y-1">
            {issues.slice(0, 3).map((issue, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-destructive mt-0.5">&#8226;</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
