"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getScoreColor } from "@/lib/seo/scoreColors"

interface ProductCardProps {
  data: Record<string, unknown>
}

export function ProductCard({ data }: ProductCardProps) {
  const title = (data.title as string) ?? "Produit"
  const seoScore = (data.seoScore as number) ?? 0
  const seoScoreBefore = data.seoScoreBefore as number | undefined
  const description = (data.description as string) ?? ""
  const truncated = description.length > 120 ? description.slice(0, 120) + "..." : description
  const onApply = data.onApply as (() => void) | undefined
  const onView = data.onView as (() => void) | undefined

  return (
    <Card className="rounded-xl">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{title}</h4>
          <Badge variant="outline" className="flex-shrink-0">Produit</Badge>
        </div>

        {/* SEO Score bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Score SEO</span>
            <div className="flex items-center gap-1">
              {seoScoreBefore !== undefined && (
                <>
                  <span className="text-muted-foreground line-through">{seoScoreBefore}%</span>
                  <span className="text-muted-foreground">&rarr;</span>
                </>
              )}
              <span className={cn("font-semibold", getScoreColor(seoScore))}>{seoScore}%</span>
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", getScoreColor(seoScore).replace("text-", "bg-"))}
              style={{ width: `${Math.min(100, seoScore)}%` }}
            />
          </div>
        </div>

        {truncated && (
          <p className="text-xs text-muted-foreground leading-relaxed">{truncated}</p>
        )}

        <div className="flex items-center gap-2 pt-1">
          {onApply && <Button size="sm" className="rounded-lg text-xs h-7" onClick={onApply}>Appliquer</Button>}
          {onView && <Button size="sm" variant="outline" className="rounded-lg text-xs h-7" onClick={onView}>Voir</Button>}
        </div>
      </CardContent>
    </Card>
  )
}
