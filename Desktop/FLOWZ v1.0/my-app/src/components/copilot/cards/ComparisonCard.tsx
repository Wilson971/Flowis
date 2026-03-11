"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ComparisonCardProps {
  data: Record<string, unknown>
}

export function ComparisonCard({ data }: ComparisonCardProps) {
  const beforeText = (data.beforeText as string) ?? ""
  const afterText = (data.afterText as string) ?? ""
  const scoreBefore = (data.scoreBefore as number) ?? 0
  const scoreAfter = (data.scoreAfter as number) ?? 0
  const onApply = data.onApply as (() => void) | undefined
  const onReject = data.onReject as (() => void) | undefined
  const onEdit = data.onEdit as (() => void) | undefined

  const diff = scoreAfter - scoreBefore

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success"
    if (score >= 50) return "text-warning"
    return "text-destructive"
  }

  return (
    <Card className="rounded-xl">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">Comparaison</span>
          <div className="flex items-center gap-1.5 text-xs">
            <span className={cn("font-semibold", getScoreColor(scoreBefore))}>{scoreBefore}</span>
            <span className="text-muted-foreground">&rarr;</span>
            <span className={cn("font-semibold", getScoreColor(scoreAfter))}>{scoreAfter}</span>
            {diff !== 0 && (
              <span className={cn("font-medium", diff > 0 ? "text-success" : "text-destructive")}>
                ({diff > 0 ? "+" : ""}{diff})
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Avant</span>
            <div className="rounded-lg bg-muted/30 p-2.5 text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {beforeText}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Apr\u00e8s</span>
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-2.5 text-xs text-foreground leading-relaxed line-clamp-3">
              {afterText}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {onApply && <Button size="sm" className="rounded-lg text-xs h-7" onClick={onApply}>Appliquer</Button>}
          {onReject && <Button size="sm" variant="outline" className="rounded-lg text-xs h-7" onClick={onReject}>Rejeter</Button>}
          {onEdit && <Button size="sm" variant="ghost" className="rounded-lg text-xs h-7" onClick={onEdit}>Modifier</Button>}
        </div>
      </CardContent>
    </Card>
  )
}
