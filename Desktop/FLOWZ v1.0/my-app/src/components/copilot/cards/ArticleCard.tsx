"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ArticleCardProps {
  data: Record<string, unknown>
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  draft: { label: "Brouillon", variant: "outline" },
  published: { label: "Publi\u00e9", variant: "default" },
  scheduled: { label: "Planifi\u00e9", variant: "secondary" },
}

export function ArticleCard({ data }: ArticleCardProps) {
  const title = (data.title as string) ?? "Article"
  const status = (data.status as string) ?? "draft"
  const wordCount = (data.wordCount as number) ?? 0
  const metaDescription = (data.metaDescription as string) ?? ""
  const onOpen = data.onOpen as (() => void) | undefined
  const onPublish = data.onPublish as (() => void) | undefined

  const statusConfig = STATUS_MAP[status] ?? STATUS_MAP.draft

  return (
    <Card className="rounded-xl">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{title}</h4>
          <Badge variant={statusConfig.variant} className="flex-shrink-0">{statusConfig.label}</Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{wordCount.toLocaleString("fr-FR")} mots</span>
        </div>

        {metaDescription && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{metaDescription}</p>
        )}

        <div className="flex items-center gap-2 pt-1">
          {onOpen && <Button size="sm" variant="outline" className="rounded-lg text-xs h-7" onClick={onOpen}>Ouvrir</Button>}
          {onPublish && status !== "published" && (
            <Button size="sm" className="rounded-lg text-xs h-7" onClick={onPublish}>Publier</Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
