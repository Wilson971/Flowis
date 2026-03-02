'use client'

/**
 * StoreExpandedView — Bento mini-dashboard for StoreCard expanded state.
 *
 * Layout:
 *  1. Hero row: large SEO radial + optimised bar | 3 stat tiles + sync status
 *  2. AI Quota section (StoreQuotaBar)
 *  3. Alert if products without description > 0
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Package, FolderTree, BookOpen, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { styles, motionTokens } from '@/lib/design-system'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { StoreSeoRadial } from './StoreSeoRadial'
import { StoreSyncStatus } from './StoreSyncStatus'
import { StoreQuotaBar } from './StoreQuotaBar'
import { useStoreAIQuota } from '@/hooks/stores/useStoreAIQuota'
import type { StoreKPIs, SyncEntity, SyncProgressPayload } from '@/types/store'
import type { LatestSyncJob } from '@/hooks/stores/useStoreRealtime'

// ============================================================================
// TYPES
// ============================================================================

interface StoreExpandedViewProps {
  storeId: string
  kpis: StoreKPIs | null | undefined
  kpisLoading: boolean
  latestJob: LatestSyncJob | null
  progress: SyncProgressPayload | null
  isSyncActive: boolean
  autoSyncEnabled: boolean
  onSync: (entities: SyncEntity[]) => void
  syncDisabled: boolean
}

// ============================================================================
// STAT TILE
// ============================================================================

interface StatTileProps {
  icon: React.ReactNode
  label: string
  value: number | undefined
  loading: boolean
}

function StatTile({ icon, label, value, loading }: StatTileProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 rounded-xl border border-border/50 bg-muted/50 p-3'
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground [&>svg]:h-3.5 [&>svg]:w-3.5">
          {icon}
        </span>
        <span
          className={cn(styles.text.label, 'text-[10px] uppercase tracking-wide')}
        >
          {label}
        </span>
      </div>
      {loading ? (
        <Skeleton className="h-5 w-10" />
      ) : (
        <span
          className={cn(
            'tabular-nums font-bold leading-none',
            styles.text.h4
          )}
        >
          {value ?? 0}
        </span>
      )}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StoreExpandedView({
  storeId,
  kpis,
  kpisLoading,
  latestJob,
  progress,
  isSyncActive,
  autoSyncEnabled,
  onSync,
  syncDisabled,
}: StoreExpandedViewProps) {
  const { data: quota, isLoading: quotaLoading } = useStoreAIQuota(storeId)

  // Compute optimised progress
  const optimised = kpis?.optimizedProducts ?? 0
  const total = kpis?.totalProducts ?? 0
  const optimisedPercent = total > 0 ? Math.round((optimised / total) * 100) : 0

  const optimisedBarColor =
    optimisedPercent >= 75
      ? 'bg-success'
      : optimisedPercent >= 50
      ? 'bg-warning'
      : 'bg-destructive'

  const seoScore = kpis?.avgSeoScore ?? 0
  const productsWithoutDesc = kpis?.productsWithoutDesc ?? 0

  return (
    <AnimatePresence>
      <motion.div
        key="expanded"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={motionTokens.transitions.default}
        className="overflow-hidden"
      >
        <div className="flex flex-col gap-4 pt-4">
          {/* ----------------------------------------------------------------
              1. HERO ROW
          ---------------------------------------------------------------- */}
          <div className="flex gap-4">
            {/* Left: SEO radial + optimised bar */}
            <div className="flex flex-col items-center gap-3">
              {kpisLoading ? (
                <Skeleton className="h-[120px] w-[120px] rounded-full" />
              ) : (
                <StoreSeoRadial score={seoScore} size="lg" />
              )}

              {/* Optimised progress bar */}
              <div className="w-[120px] flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium"
                  >
                    Optimisés
                  </span>
                  {kpisLoading ? (
                    <Skeleton className="h-3 w-10" />
                  ) : (
                    <span className="text-xs font-bold tabular-nums text-foreground">
                      {optimised}/{total}
                    </span>
                  )}
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  {!kpisLoading && (
                    <motion.div
                      className={cn('h-full rounded-full', optimisedBarColor)}
                      initial={{ width: 0 }}
                      animate={{ width: `${optimisedPercent}%` }}
                      transition={motionTokens.transitions.slow}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Right: stat tiles + sync status */}
            <div className="flex flex-1 flex-col gap-3 min-w-0">
              <div className="grid grid-cols-3 gap-2">
                <StatTile
                  icon={<Package />}
                  label="Produits"
                  value={kpis?.totalProducts}
                  loading={kpisLoading}
                />
                <StatTile
                  icon={<FolderTree />}
                  label="Catégories"
                  value={kpis?.totalCategories}
                  loading={kpisLoading}
                />
                <StatTile
                  icon={<BookOpen />}
                  label="Blog"
                  value={kpis?.totalBlogPosts}
                  loading={kpisLoading}
                />
              </div>

              <StoreSyncStatus
                storeId={storeId}
                latestJob={latestJob}
                progress={progress}
                isSyncActive={isSyncActive}
                autoSyncEnabled={autoSyncEnabled}
                nextSyncAt={null}
                onSync={onSync}
                disabled={syncDisabled}
              />
            </div>
          </div>

          {/* ----------------------------------------------------------------
              2. AI QUOTA
          ---------------------------------------------------------------- */}
          <div className="border-t border-border/50 pt-3">
            <StoreQuotaBar quota={quota} isLoading={quotaLoading} />
          </div>

          {/* ----------------------------------------------------------------
              3. ALERT — products without description
          ---------------------------------------------------------------- */}
          {!kpisLoading && productsWithoutDesc > 0 && (
            <div className="border-t border-border/50 pt-3">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'w-full justify-start gap-2 rounded-xl text-destructive',
                  'hover:bg-destructive/10 hover:text-destructive'
                )}
                asChild
              >
                <Link
                  href={`/app/products?store=${storeId}&filter=no_description`}
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="text-sm">
                    {productsWithoutDesc} produit
                    {productsWithoutDesc > 1 ? 's' : ''} sans description
                  </span>
                </Link>
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
