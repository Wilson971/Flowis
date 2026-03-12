"use client"

import { cn } from '@/lib/utils'
import { styles } from '@/lib/design-system'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, DollarSign, CheckCircle, Timer } from 'lucide-react'
import { useStudioQuota } from '../hooks/useStudioQuota'
import { useStudioMetrics } from '../hooks/useStudioMetrics'

interface MetricsCardsProps {
  from: Date
  to: Date
}

export function MetricsCards({ from, to }: MetricsCardsProps) {
  const { quota, isLoading: quotaLoading, usagePercent, isNearLimit } = useStudioQuota()
  const { data: metrics, isLoading: metricsLoading } = useStudioMetrics(from, to)

  const isLoading = quotaLoading || metricsLoading

  if (isLoading) {
    return (
      <div className={cn(styles.layout.gridCols4, 'gap-4')}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className={cn(styles.card.base, 'p-6')}>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: 'Générations ce mois',
      value: `${quota?.generations_used ?? 0} / ${quota?.generations_limit ?? 100}`,
      icon: Activity,
      hasProgress: true,
    },
    {
      label: 'Coût estimé',
      value: `€${((metrics?.total_cost_usd ?? quota?.cost_usd ?? 0) * 0.92).toFixed(2)}`,
      icon: DollarSign,
    },
    {
      label: 'Taux de succès',
      value: `${(metrics?.success_rate ?? 0).toFixed(1)}%`,
      icon: CheckCircle,
    },
    {
      label: 'Latence moyenne',
      value: `${Math.round(metrics?.avg_latency_ms ?? 0)}ms`,
      icon: Timer,
    },
  ]

  return (
    <div className={cn(styles.layout.gridCols4, 'gap-4')}>
      {cards.map((card) => (
        <Card key={card.label} className={cn(styles.card.base, 'p-6')}>
          <CardContent className="p-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className={cn(styles.text.bodyMuted, 'text-sm')}>
                {card.label}
              </span>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={cn(styles.text.h3)}>{card.value}</p>
            {card.hasProgress && (
              <Progress
                value={usagePercent}
                className={cn(
                  'h-2',
                  isNearLimit && '[&>div]:bg-destructive'
                )}
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
