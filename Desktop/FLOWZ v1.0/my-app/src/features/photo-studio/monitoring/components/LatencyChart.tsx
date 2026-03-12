"use client"

import { cn } from '@/lib/utils'
import { styles } from '@/lib/design-system'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { StudioStats } from '../types'

const ACTION_COLORS: Record<string, string> = {
  remove_bg: 'bg-blue-500',
  replace_bg: 'bg-violet-500',
  replace_bg_white: 'bg-violet-400',
  replace_bg_studio: 'bg-violet-600',
  replace_bg_marble: 'bg-violet-300',
  replace_bg_wood: 'bg-violet-700',
  enhance: 'bg-emerald-500',
  enhance_light: 'bg-emerald-400',
  enhance_color: 'bg-emerald-600',
  harmonize: 'bg-amber-500',
  magic_edit: 'bg-pink-500',
  generate_angles: 'bg-cyan-500',
  generate_scene: 'bg-cyan-600',
}

function getBarColor(action: string): string {
  return ACTION_COLORS[action] ?? 'bg-primary'
}

interface LatencyChartProps {
  byAction: StudioStats['by_action'] | undefined
  isLoading: boolean
}

export function LatencyChart({ byAction, isLoading }: LatencyChartProps) {
  if (isLoading) {
    return (
      <Card className={cn(styles.card.base, 'p-6')}>
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </Card>
    )
  }

  const actions = byAction ?? []
  const maxLatency = Math.max(...actions.map((a) => a.avg_latency_ms), 1)

  return (
    <Card className={cn(styles.card.base)}>
      <CardHeader className="p-6 pb-4">
        <CardTitle className={cn(styles.text.h4)}>
          Latence par action
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-3">
        {actions.length === 0 ? (
          <p className={cn(styles.text.bodyMuted)}>Aucune donnée</p>
        ) : (
          actions.map((item) => {
            const widthPercent = (item.avg_latency_ms / maxLatency) * 100
            return (
              <div key={item.action} className="flex items-center gap-3">
                <span className={cn(styles.text.label, 'w-36 shrink-0 truncate')}>
                  {item.action.replace(/_/g, ' ')}
                </span>
                <div className="flex-1 h-6 bg-muted rounded-lg overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-lg transition-all duration-300',
                      getBarColor(item.action)
                    )}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
                <span className={cn(styles.text.bodyMuted, 'w-16 text-right text-sm shrink-0')}>
                  {Math.round(item.avg_latency_ms)}ms
                </span>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
