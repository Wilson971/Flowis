"use client"

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { styles, motionTokens } from '@/lib/design-system'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion } from 'framer-motion'
import { useStudioMetrics } from '../hooks/useStudioMetrics'
import { MetricsCards } from './MetricsCards'
import { LatencyChart } from './LatencyChart'
import { ErrorsPanel } from './ErrorsPanel'
import { ExportButton } from './ExportButton'

type DateRange = 'this-month' | '7-days' | '30-days'

function getDateRange(range: DateRange): { from: Date; to: Date } {
  const to = new Date()
  const from = new Date()

  switch (range) {
    case 'this-month':
      from.setDate(1)
      from.setHours(0, 0, 0, 0)
      break
    case '7-days':
      from.setDate(from.getDate() - 7)
      break
    case '30-days':
      from.setDate(from.getDate() - 30)
      break
  }

  return { from, to }
}

export function StudioAnalyticsDashboard() {
  const [range, setRange] = useState<DateRange>('this-month')
  const { from, to } = useMemo(() => getDateRange(range), [range])
  const { data: metrics, isLoading } = useStudioMetrics(from, to)

  return (
    <motion.div
      className="space-y-6"
      variants={motionTokens.variants.fadeIn}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className={cn(styles.layout.flexBetween)}>
        <h2 className={cn(styles.text.h2)}>Analytiques Studio</h2>
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={(v) => setRange(v as DateRange)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">Ce mois</SelectItem>
              <SelectItem value="7-days">7 derniers jours</SelectItem>
              <SelectItem value="30-days">30 derniers jours</SelectItem>
            </SelectContent>
          </Select>
          <ExportButton metrics={metrics} />
        </div>
      </div>

      {/* KPI Cards */}
      <MetricsCards from={from} to={to} />

      {/* Charts + Errors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LatencyChart byAction={metrics?.by_action} isLoading={isLoading} />
        <ErrorsPanel errorsByType={metrics?.errors_by_type} isLoading={isLoading} />
      </div>
    </motion.div>
  )
}
