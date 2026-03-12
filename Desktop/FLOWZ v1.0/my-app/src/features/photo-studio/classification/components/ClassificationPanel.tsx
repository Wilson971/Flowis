"use client"

import { cn } from '@/lib/utils'
import { styles } from '@/lib/design-system'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, RefreshCw, Sparkles, Star } from 'lucide-react'
import type { ClassificationResult } from '../hooks/useAutoClassify'

// ============================================================================
// Props
// ============================================================================

interface ClassificationPanelProps {
  classification: ClassificationResult | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function ClassificationPanel({
  classification,
  isLoading,
  isError,
  error,
  refetch,
  className,
}: ClassificationPanelProps) {
  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className={cn('space-y-4 p-4', className)}>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------
  if (isError) {
    return (
      <div className={cn('flex flex-col items-center gap-4 p-6', className)}>
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className={cn(styles.text.bodyMuted, 'text-center')}>
          {error?.message ?? 'Classification failed'}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // No data
  // ---------------------------------------------------------------------------
  if (!classification) return null

  const confidencePercent = Math.round(classification.confidence * 100)

  return (
    <div className={cn('space-y-6 p-4', className)}>
      {/* Category & subcategory */}
      <div className="space-y-1">
        <p className={styles.text.label}>Category</p>
        <p className={styles.text.body}>
          {formatCategory(classification.category)}
        </p>
        <p className={styles.text.bodyMuted}>{classification.subCategory}</p>
      </div>

      {/* Materials */}
      <div className="space-y-2">
        <p className={styles.text.label}>Materials</p>
        <div className="flex flex-wrap gap-2">
          {classification.materials.map((mat) => (
            <Badge key={mat} variant="secondary" className="rounded-full">
              {mat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Style & audience */}
      <div className="space-y-2">
        <p className={styles.text.label}>Style & Audience</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="rounded-full">
            {classification.style}
          </Badge>
          <Badge variant="outline" className="rounded-full">
            {formatAudience(classification.targetAudience)}
          </Badge>
        </div>
      </div>

      {/* Color palette */}
      <div className="space-y-2">
        <p className={styles.text.label}>Color Palette</p>
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-full border border-border"
            style={{ backgroundColor: classification.colorPalette.dominant }}
            title={`Dominant: ${classification.colorPalette.dominant}`}
          />
          {classification.colorPalette.accent.map((color, i) => (
            <div
              key={`${color}-${i}`}
              className="h-6 w-6 rounded-full border border-border"
              style={{ backgroundColor: color }}
              title={`Accent: ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Confidence */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className={styles.text.label}>Confidence</p>
          <span className={styles.text.bodyMuted}>{confidencePercent}%</span>
        </div>
        <Progress value={confidencePercent} className="h-2" />
      </div>

      {/* Recommended presets */}
      {classification.recommendedPresets.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className={styles.text.label}>Recommended Presets</p>
          </div>
          <div className="space-y-2">
            {classification.recommendedPresets.map((preset, index) => (
              <div
                key={preset.id}
                className={cn(
                  'flex items-center justify-between rounded-xl border p-4 transition-colors',
                  index === 0
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-card'
                )}
              >
                <div className="flex items-center gap-2">
                  {index === 0 && (
                    <Star className="h-4 w-4 fill-primary text-primary" />
                  )}
                  <div>
                    <p className={styles.text.body}>{preset.name}</p>
                    <p className={cn(styles.text.bodyMuted, 'text-xs')}>
                      {preset.description}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="rounded-full">
                  {preset.score}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function formatCategory(cat: string): string {
  return cat
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' > ')
}

function formatAudience(audience: string): string {
  return audience
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
