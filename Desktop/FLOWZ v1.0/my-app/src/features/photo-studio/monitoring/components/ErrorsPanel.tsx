"use client"

import { cn } from '@/lib/utils'
import { styles } from '@/lib/design-system'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2 } from 'lucide-react'
import type { StudioStats } from '../types'

interface ErrorsPanelProps {
  errorsByType: StudioStats['errors_by_type'] | undefined
  isLoading: boolean
}

export function ErrorsPanel({ errorsByType, isLoading }: ErrorsPanelProps) {
  if (isLoading) {
    return (
      <Card className={cn(styles.card.base, 'p-6')}>
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </Card>
    )
  }

  const errors = errorsByType ?? []

  return (
    <Card className={cn(styles.card.base)}>
      <CardHeader className="p-6 pb-4">
        <CardTitle className={cn(styles.text.h4)}>
          Erreurs (7 derniers jours)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {errors.length === 0 ? (
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 className="h-5 w-5" />
            <span className={cn(styles.text.body)}>Aucune erreur</span>
          </div>
        ) : (
          <ul className="space-y-2">
            {errors.map((err) => (
              <li
                key={err.error_type}
                className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
              >
                <span className={cn(styles.text.body, 'truncate')}>
                  {err.error_type}
                </span>
                <Badge variant="destructive" className="shrink-0 ml-2">
                  {err.count}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
