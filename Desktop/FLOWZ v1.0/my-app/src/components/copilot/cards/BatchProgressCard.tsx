"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface BatchProgressCardProps {
  data: Record<string, unknown>
}

export function BatchProgressCard({ data }: BatchProgressCardProps) {
  const processed = (data.processed as number) ?? 0
  const total = (data.total as number) ?? 0
  const successCount = (data.successCount as number) ?? 0
  const failCount = (data.failCount as number) ?? 0
  const status = (data.status as string) ?? "running"
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0

  return (
    <Card className="rounded-xl">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">Traitement par lot</span>
          <Badge variant={status === "done" ? "default" : "secondary"} className="text-xs">
            {status === "done" ? "Termin\u00e9" : status === "error" ? "Erreur" : "En cours"}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                status === "error" ? "bg-destructive" : "bg-primary"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{processed}/{total} trait\u00e9s</span>
            <span>{pct}%</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {successCount > 0 && <span className="text-success">{successCount} r\u00e9ussi{successCount > 1 ? "s" : ""}</span>}
          {failCount > 0 && <span className="text-destructive">{failCount} \u00e9chou\u00e9{failCount > 1 ? "s" : ""}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
