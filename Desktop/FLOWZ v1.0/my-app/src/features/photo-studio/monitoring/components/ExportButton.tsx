"use client"

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import type { StudioStats } from '../types'

interface ExportButtonProps {
  metrics: StudioStats | undefined
}

export function ExportButton({ metrics }: ExportButtonProps) {
  const handleExport = () => {
    if (!metrics) return

    const rows = [
      ['Action', 'Count', 'Avg Latency (ms)', 'Cost (USD)', 'Success Rate (%)'],
      ...metrics.by_action.map((a) => [
        a.action,
        String(a.count),
        String(Math.round(a.avg_latency_ms)),
        a.cost_usd.toFixed(4),
        a.success_rate.toFixed(1),
      ]),
      [],
      ['Total Generations', String(metrics.total_generations)],
      ['Successful', String(metrics.successful)],
      ['Failed', String(metrics.failed)],
      ['Overall Success Rate', `${metrics.success_rate.toFixed(1)}%`],
      ['Avg Latency (ms)', String(Math.round(metrics.avg_latency_ms))],
      ['Total Cost (USD)', metrics.total_cost_usd.toFixed(4)],
    ]

    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const date = new Date().toISOString().slice(0, 10)

    const link = document.createElement('a')
    link.href = url
    link.download = `studio-metrics-${date}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={!metrics}
      className={cn('gap-2')}
    >
      <Download className="h-4 w-4" />
      Exporter CSV
    </Button>
  )
}
