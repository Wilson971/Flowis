'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { styles } from '@/lib/design-system'
import { StoreSeoRadial } from './StoreSeoRadial'
import { StoreSyncStatus } from './StoreSyncStatus'
import type { StoreKPIs, SyncEntity, SyncProgressPayload } from '@/types/store'
import type { LatestSyncJob } from '@/hooks/stores/useStoreRealtime'

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface StoreCompactViewProps {
  storeId: string
  kpis: StoreKPIs | null | undefined
  kpisLoading: boolean
  latestJob: LatestSyncJob | null
  progress: SyncProgressPayload | null
  isSyncActive: boolean
  autoSyncEnabled: boolean
  nextSyncAt: string | null
  onSync: (entities: SyncEntity[]) => void
  syncDisabled: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function StoreCompactView({
  storeId,
  kpis,
  kpisLoading,
  latestJob,
  progress,
  isSyncActive,
  autoSyncEnabled,
  nextSyncAt,
  onSync,
  syncDisabled,
}: StoreCompactViewProps) {
  const productsWithoutDesc = kpis?.productsWithoutDesc ?? 0
  const seoScore = kpis?.avgSeoScore ?? 0

  return (
    <div className="flex flex-col gap-4">
      {/* Row: SEO radial + inline stats */}
      <div className="flex items-start gap-4">
        {/* SEO Radial */}
        <div className="shrink-0">
          {kpisLoading ? (
            <Skeleton className="size-14 rounded-full" />
          ) : (
            <StoreSeoRadial score={seoScore} size="sm" />
          )}
        </div>

        {/* Stats + alert */}
        <div className="flex flex-col gap-1 min-w-0">
          {/* Inline stats */}
          {kpisLoading ? (
            <Skeleton className="h-4 w-40 rounded-lg" />
          ) : (
            <p className={cn(styles.text.body, 'leading-snug')}>
              <span className="font-semibold text-foreground">
                {kpis?.totalProducts ?? 0}
              </span>
              <span className="text-muted-foreground"> prod</span>
              <span className="text-muted-foreground mx-1">·</span>
              <span className="font-semibold text-foreground">
                {kpis?.totalCategories ?? 0}
              </span>
              <span className="text-muted-foreground"> cat</span>
              <span className="text-muted-foreground mx-1">·</span>
              <span className="font-semibold text-foreground">
                {kpis?.totalBlogPosts ?? 0}
              </span>
              <span className="text-muted-foreground"> blog</span>
            </p>
          )}

          {/* Alert: products without description */}
          {!kpisLoading && productsWithoutDesc > 0 && (
            <Link
              href={`/app/products?filter=no_description&store=${storeId}`}
              className={cn(
                'inline-flex items-center gap-1 text-destructive hover:text-destructive/80 transition-colors',
                styles.text.label,
              )}
            >
              <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
              <span>
                {productsWithoutDesc} produit
                {productsWithoutDesc > 1 ? 's' : ''} sans description
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* Sync status */}
      <StoreSyncStatus
        storeId={storeId}
        latestJob={latestJob}
        progress={progress}
        isSyncActive={isSyncActive}
        autoSyncEnabled={autoSyncEnabled}
        nextSyncAt={nextSyncAt}
        onSync={onSync}
        disabled={syncDisabled}
      />
    </div>
  )
}
