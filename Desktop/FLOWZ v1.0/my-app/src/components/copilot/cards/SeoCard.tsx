"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SeoCardProps {
  data: Record<string, unknown>
}

export function SeoCard({ data }: SeoCardProps) {
  const avgScore = (data.avgScore as number) ?? 0
  const criticalCount = (data.criticalCount as number) ?? 0
  const warningCount = (data.warningCount as number) ?? 0
  const issues = (data.issues as string[]) ?? []
  const onFullAudit = data.onFullAudit as (() => void) | undefined
  const onViewDetails = data.onViewDetails as (() => void) | undefined

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success"
    if (score >= 50) return "text-warning"
    return "text-destructive"
  }

  return (
    <Card className="rounded-xl">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={cn("text-2xl font-bold", getScoreColor(avgScore))}>{avgScore}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
          <div className="flex items-center gap-1.5">
            {criticalCount > 0 && <Badge variant="destructive" className="text-xs">{criticalCount} critique{criticalCount > 1 ? "s" : ""}</Badge>}
            {warningCount > 0 && <Badge variant="outline" className="text-xs border-warning/30 text-warning">{warningCount} warning{warningCount > 1 ? "s" : ""}</Badge>}
          </div>
        </div>

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

        <div className="flex items-center gap-2 pt-1">
          {onFullAudit && <Button size="sm" className="rounded-lg text-xs h-7" onClick={onFullAudit}>Audit complet</Button>}
          {onViewDetails && <Button size="sm" variant="outline" className="rounded-lg text-xs h-7" onClick={onViewDetails}>Voir d\u00e9tails</Button>}
        </div>
      </CardContent>
    </Card>
  )
}
