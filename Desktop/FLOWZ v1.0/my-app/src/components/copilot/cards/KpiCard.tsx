"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  data: Record<string, unknown>
}

export function KpiCard({ data }: KpiCardProps) {
  const label = (data.label as string) ?? "M\u00e9trique"
  const value = (data.value as string | number) ?? 0
  const trend = (data.trend as number) ?? 0
  const trendDirection = trend > 0 ? "up" : trend < 0 ? "down" : "neutral"

  return (
    <Card className="rounded-xl">
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-foreground">{typeof value === "number" ? value.toLocaleString("fr-FR") : value}</p>
        </div>
        {trend !== 0 && (
          <div className={cn(
            "flex items-center gap-0.5 text-xs font-medium",
            trendDirection === "up" && "text-success",
            trendDirection === "down" && "text-destructive"
          )}>
            <span>{trendDirection === "up" ? "\u2191" : "\u2193"}</span>
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
