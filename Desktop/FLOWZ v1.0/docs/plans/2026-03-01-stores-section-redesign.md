# Stores Section Redesign — Bento Dashboard with Compact/Expanded

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Stores page into a premium Bento Dashboard with global stats bar, dual-mode cards (compact/expanded), hero SEO radial chart, and AI Quota integration.

**Architecture:** Page splits into: (1) StoresGlobalStats bar using `useAllStoresKPIs`, (2) view toggle persisted in localStorage, (3) StoreCard rewritten with compact/expanded sub-components using Framer Motion `layout` + `AnimatePresence`. Existing sub-components (StoreMetricsSection, StoreQuotaBar, StoreSyncStatus) are reused as-is inside expanded view.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui, Framer Motion, TanStack Query, FLOWZ Design System tokens

---

## Task 1: Create StoresGlobalStats Component

**Files:**
- Create: `my-app/src/components/stores/StoresGlobalStats.tsx`

**Step 1: Create the global stats bar component**

```tsx
/**
 * StoresGlobalStats — Global KPI bar for all stores
 */

'use client'

import { Store, Package, BarChart2, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { cardStyles, textStyles } from '@/lib/design-system/styles'
import { motionTokens } from '@/lib/design-system/tokens'
import { Skeleton } from '@/components/ui/skeleton'
import { useAllStoresKPIs } from '@/hooks/stores/useStoreKPIs'

function StatMiniCard({
  icon: Icon,
  label,
  value,
  suffix,
  isLoading,
  index,
}: {
  icon: React.ElementType
  label: string
  value: number | string | undefined
  suffix?: string
  isLoading: boolean
  index: number
}) {
  return (
    <motion.div
      variants={motionTokens.variants.bentoItem}
      custom={index}
      className={cn(
        cardStyles.glass,
        'flex items-center gap-3 p-4'
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="min-w-0">
        {isLoading ? (
          <>
            <Skeleton className="h-6 w-12 mb-1" />
            <Skeleton className="h-3 w-16" />
          </>
        ) : (
          <>
            <p className="text-xl font-bold tabular-nums text-foreground leading-none">
              {typeof value === 'number' ? value.toLocaleString() : value ?? '—'}
              {suffix && <span className="text-sm font-normal text-muted-foreground ml-0.5">{suffix}</span>}
            </p>
            <p className={cn(textStyles.bodySmall, 'mt-0.5')}>{label}</p>
          </>
        )}
      </div>
    </motion.div>
  )
}

export function StoresGlobalStats() {
  const { data, isLoading } = useAllStoresKPIs()

  return (
    <motion.div
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      <StatMiniCard
        icon={Store}
        label="Boutiques"
        value={data?.totalStores}
        isLoading={isLoading}
        index={0}
      />
      <StatMiniCard
        icon={Package}
        label="Produits"
        value={data?.totalProducts}
        isLoading={isLoading}
        index={1}
      />
      <StatMiniCard
        icon={BarChart2}
        label="Taux optimisation"
        value={data?.optimizationRate}
        suffix="%"
        isLoading={isLoading}
        index={2}
      />
      <StatMiniCard
        icon={RefreshCw}
        label="Optimisés"
        value={data ? `${data.optimizedProducts} / ${data.totalProducts}` : undefined}
        isLoading={isLoading}
        index={3}
      />
    </motion.div>
  )
}
```

**Step 2: Export from index**

In `my-app/src/components/stores/index.ts`, add:
```ts
export { StoresGlobalStats } from './StoresGlobalStats';
```

**Step 3: Commit**

```bash
git add my-app/src/components/stores/StoresGlobalStats.tsx my-app/src/components/stores/index.ts
git commit -m "feat(stores): add StoresGlobalStats bar component"
```

---

## Task 2: Create StoreSeoRadial Component

**Files:**
- Create: `my-app/src/components/stores/StoreSeoRadial.tsx`

**Step 1: Create the SEO radial chart component**

This is a pure SVG donut chart — no external chart library needed.

```tsx
/**
 * StoreSeoRadial — Radial/donut chart for SEO score display
 *
 * Sizes: 'sm' (compact card) | 'lg' (expanded card)
 */

'use client'

import { cn } from '@/lib/utils'

function seoColor(score: number): string {
  if (score >= 70) return 'text-success'
  if (score >= 40) return 'text-warning'
  return 'text-destructive'
}

function seoStrokeColor(score: number): string {
  if (score >= 70) return 'stroke-success'
  if (score >= 40) return 'stroke-warning'
  return 'stroke-destructive'
}

interface StoreSeoRadialProps {
  score: number
  size?: 'sm' | 'lg'
  className?: string
}

export function StoreSeoRadial({ score, size = 'sm', className }: StoreSeoRadialProps) {
  const dims = size === 'sm'
    ? { w: 64, h: 64, r: 26, stroke: 5, fontSize: 'text-lg', label: 'text-[8px]' }
    : { w: 120, h: 120, r: 48, stroke: 8, fontSize: 'text-3xl', label: 'text-xs' }

  const circumference = 2 * Math.PI * dims.r
  const offset = circumference - (Math.min(score, 100) / 100) * circumference

  return (
    <div className={cn('relative flex items-center justify-center', className)} style={{ width: dims.w, height: dims.h }}>
      <svg width={dims.w} height={dims.h} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={dims.w / 2}
          cy={dims.h / 2}
          r={dims.r}
          fill="none"
          className="stroke-muted"
          strokeWidth={dims.stroke}
        />
        {/* Progress circle */}
        <circle
          cx={dims.w / 2}
          cy={dims.h / 2}
          r={dims.r}
          fill="none"
          className={cn(seoStrokeColor(score), 'transition-all duration-700')}
          strokeWidth={dims.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold tabular-nums leading-none', dims.fontSize, seoColor(score))}>
          {Math.round(score)}
        </span>
        {size === 'lg' && (
          <span className={cn(dims.label, 'text-muted-foreground mt-0.5')}>/100</span>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Export from index**

In `my-app/src/components/stores/index.ts`, add:
```ts
export { StoreSeoRadial } from './StoreSeoRadial';
```

**Step 3: Commit**

```bash
git add my-app/src/components/stores/StoreSeoRadial.tsx my-app/src/components/stores/index.ts
git commit -m "feat(stores): add StoreSeoRadial SVG donut chart"
```

---

## Task 3: Create StoreCompactView Component

**Files:**
- Create: `my-app/src/components/stores/StoreCompactView.tsx`

**Step 1: Create the compact view**

This extracts the compact card body from StoreCard. It shows: identity left, mini SEO radial + inline stats right, alert + last sync, footer with sync + toggle.

```tsx
/**
 * StoreCompactView — Compact card content for Store bento cards
 */

'use client'

import { Package, FolderTree, BookOpen, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { textStyles } from '@/lib/design-system/styles'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StoreSeoRadial } from './StoreSeoRadial'
import { StoreSyncStatus } from './StoreSyncStatus'
import type { StoreKPIs, SyncEntity, SyncProgressPayload } from '@/types/store'
import type { LatestSyncJob } from '@/hooks/stores/useStoreRealtime'

interface StoreCompactViewProps {
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

export function StoreCompactView({
  storeId,
  kpis,
  kpisLoading,
  latestJob,
  progress,
  isSyncActive,
  autoSyncEnabled,
  onSync,
  syncDisabled,
}: StoreCompactViewProps) {
  const router = useRouter()
  const avgSeoScore = kpis?.avgSeoScore ?? 0
  const productsWithoutDesc = kpis?.productsWithoutDesc ?? 0

  return (
    <div className="space-y-4">
      {/* SEO Radial + Inline Stats */}
      <div className="flex items-center gap-4">
        {/* Mini SEO radial */}
        <div className="shrink-0">
          {kpisLoading ? (
            <Skeleton className="w-16 h-16 rounded-full" />
          ) : (
            <StoreSeoRadial score={avgSeoScore} size="sm" />
          )}
        </div>

        {/* Stats + alert */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Inline stats */}
          {kpisLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <p className={cn(textStyles.bodySmall, 'tabular-nums')}>
              <span className="font-semibold text-foreground">{kpis?.totalProducts?.toLocaleString() ?? 0}</span> prod
              {' · '}
              <span className="font-semibold text-foreground">{kpis?.totalCategories?.toLocaleString() ?? 0}</span> cat
              {' · '}
              <span className="font-semibold text-foreground">{kpis?.totalBlogPosts?.toLocaleString() ?? 0}</span> blog
            </p>
          )}

          {/* Alert: no description */}
          {!kpisLoading && productsWithoutDesc > 0 && (
            <button
              onClick={() => router.push(`/app/products?filter=no_description&store=${storeId}`)}
              className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
            >
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span className="underline-offset-2 hover:underline">
                {productsWithoutDesc} sans description
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Sync status (compact) */}
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
  )
}
```

**Step 2: Export from index**

In `my-app/src/components/stores/index.ts`, add:
```ts
export { StoreCompactView } from './StoreCompactView';
```

**Step 3: Commit**

```bash
git add my-app/src/components/stores/StoreCompactView.tsx my-app/src/components/stores/index.ts
git commit -m "feat(stores): add StoreCompactView for compact card mode"
```

---

## Task 4: Create StoreExpandedView Component

**Files:**
- Create: `my-app/src/components/stores/StoreExpandedView.tsx`

**Step 1: Create the expanded view**

This is the bento mini-dashboard: large SEO radial, 3 stat tiles, optimized progress bar, sync section, AI quota bar.

```tsx
/**
 * StoreExpandedView — Expanded bento mini-dashboard for Store cards
 */

'use client'

import { Package, FolderTree, BookOpen, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { cardStyles, textStyles } from '@/lib/design-system/styles'
import { motionTokens } from '@/lib/design-system/tokens'
import { Skeleton } from '@/components/ui/skeleton'
import { StoreSeoRadial } from './StoreSeoRadial'
import { StoreSyncStatus } from './StoreSyncStatus'
import { StoreQuotaBar } from './StoreQuotaBar'
import { useStoreAIQuota } from '@/hooks/stores/useStoreAIQuota'
import type { StoreKPIs, SyncEntity, SyncProgressPayload } from '@/types/store'
import type { LatestSyncJob } from '@/hooks/stores/useStoreRealtime'

// ============================================================================
// HELPERS
// ============================================================================

function optimizedColor(percent: number): string {
  if (percent >= 75) return 'bg-success'
  if (percent >= 50) return 'bg-warning'
  return 'bg-destructive'
}

function StatTile({
  icon: Icon,
  label,
  value,
  isLoading,
}: {
  icon: React.ElementType
  label: string
  value: number | undefined
  isLoading: boolean
}) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-3 rounded-xl bg-muted/50 border border-border/60',
      'hover:bg-muted/70 transition-colors'
    )}>
      {isLoading ? (
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-5 w-10" />
          <Skeleton className="h-3 w-14" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1 mb-1 text-muted-foreground">
            <Icon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
          </div>
          <span className="text-xl font-bold tabular-nums text-foreground">
            {value?.toLocaleString() ?? 0}
          </span>
        </>
      )}
    </div>
  )
}

// ============================================================================
// COMPONENT
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
  const router = useRouter()
  const { data: quota, isLoading: quotaLoading } = useStoreAIQuota(storeId)

  const totalProducts = kpis?.totalProducts ?? 0
  const optimizedProducts = kpis?.optimizedProducts ?? 0
  const avgSeoScore = kpis?.avgSeoScore ?? 0
  const productsWithoutDesc = kpis?.productsWithoutDesc ?? 0

  const coveragePercent = totalProducts > 0
    ? Math.round((optimizedProducts / totalProducts) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={motionTokens.transitions.default}
      className="space-y-4 overflow-hidden"
    >
      {/* Hero: SEO Radial + Stats Grid */}
      <div className="flex gap-4">
        {/* Large SEO Radial */}
        <div className="shrink-0 flex flex-col items-center gap-2">
          {kpisLoading ? (
            <Skeleton className="w-[120px] h-[120px] rounded-full" />
          ) : (
            <StoreSeoRadial score={avgSeoScore} size="lg" />
          )}
          {/* Optimized progress */}
          <div className="w-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Optimisés</span>
              <span className="text-xs font-semibold tabular-nums text-foreground">
                {optimizedProducts}/{totalProducts}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', optimizedColor(coveragePercent))}
                style={{ width: `${Math.min(100, coveragePercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right column: stat tiles + sync */}
        <div className="flex-1 space-y-3">
          {/* 3 stat tiles */}
          <div className="grid grid-cols-3 gap-2">
            <StatTile icon={Package} label="Produits" value={kpis?.totalProducts} isLoading={kpisLoading} />
            <StatTile icon={FolderTree} label="Catégories" value={kpis?.totalCategories} isLoading={kpisLoading} />
            <StatTile icon={BookOpen} label="Blog" value={kpis?.totalBlogPosts} isLoading={kpisLoading} />
          </div>

          {/* Sync status */}
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

      {/* AI Quota bar */}
      <div className="border-t border-border/50 pt-3">
        <StoreQuotaBar quota={quota} isLoading={quotaLoading} />
      </div>

      {/* Alert: products without description */}
      {!kpisLoading && productsWithoutDesc > 0 && (
        <button
          onClick={() => router.push(`/app/products?filter=no_description&store=${storeId}`)}
          className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="underline-offset-2 hover:underline">
            {productsWithoutDesc} produits sans description
          </span>
        </button>
      )}
    </motion.div>
  )
}
```

**Step 2: Export from index**

In `my-app/src/components/stores/index.ts`, add:
```ts
export { StoreExpandedView } from './StoreExpandedView';
```

**Step 3: Commit**

```bash
git add my-app/src/components/stores/StoreExpandedView.tsx my-app/src/components/stores/index.ts
git commit -m "feat(stores): add StoreExpandedView bento mini-dashboard"
```

---

## Task 5: Rewrite StoreCard with Compact/Expanded Modes

**Files:**
- Modify: `my-app/src/components/stores/StoreCard.tsx` (full rewrite)

**Step 1: Rewrite StoreCard**

Keep existing helpers (countryFlag, StoreAvatar, PlatformBadge, InlineNameEdit) but replace the main component body with compact/expanded toggle.

The card now receives a `viewMode: 'compact' | 'expanded'` prop from the page. The card renders the identity header (shared), then conditionally renders `StoreCompactView` or `StoreExpandedView`, with `AnimatePresence` for smooth transitions.

```tsx
/**
 * StoreCard — Bento Dashboard Redesign
 *
 * Dual-mode card: compact (overview) or expanded (mini-dashboard).
 * Reuses: StoreSyncStatus, StoreMetricsSection, StoreQuotaBar, StoreHealthPopover.
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  MoreHorizontal, Settings, Trash2, Clock, Globe, Unplug, Link2, Pencil,
  Check, X, Copy, Download, PauseCircle, PlayCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { cardStyles } from '@/lib/design-system/styles'
import { motionTokens } from '@/lib/design-system/tokens'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StoreHealthPopover } from './StoreHealthPopover'
import { StoreCompactView } from './StoreCompactView'
import { StoreExpandedView } from './StoreExpandedView'
import { useConnectionHealth } from '@/hooks/stores/useStoreHeartbeat'
import { useStoreRealtime, useLatestSyncJob } from '@/hooks/stores/useStoreRealtime'
import { useStoreSyncSettings } from '@/hooks/stores/useStoreSyncSettings'
import { useUpdateStore, usePauseStore, useResumeStore, useDuplicateStore } from '@/hooks/stores/useStores'
import { useStoreKPIs } from '@/hooks/stores/useStoreKPIs'
import type { Store, ConnectionHealth, SyncEntity } from '@/types/store'

// ============================================================================
// TYPES
// ============================================================================

interface StoreCardProps {
  store: Store
  viewMode?: 'compact' | 'expanded'
  onSync?: (storeId: string, entities: SyncEntity[]) => void
  onEdit?: (storeId: string) => void
  onDisconnect?: (store: Store) => void
  onReconnect?: (storeId: string) => void
  onDelete?: (store: Store) => void
  onCancelDeletion?: (storeId: string) => void
  onToggleActive?: (storeId: string, active: boolean) => void
}

// ============================================================================
// HELPERS (kept from original)
// ============================================================================

function countryFlag(code: string): string {
  const codePoints = Array.from(code.toUpperCase()).map(
    ch => 0x1F1E6 - 65 + ch.charCodeAt(0)
  )
  return String.fromCodePoint(...codePoints)
}

function StoreAvatar({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const colors = [
    'bg-primary/20 text-primary',
    'bg-success/20 text-success',
    'bg-info/20 text-info',
    'bg-warning/20 text-warning',
    'bg-destructive/20 text-destructive',
  ]
  const colorClass = colors[name.charCodeAt(0) % colors.length]
  const letter = name.charAt(0).toUpperCase()

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`Logo ${name}`}
        className="w-11 h-11 rounded-xl object-cover border border-border"
      />
    )
  }

  return (
    <div className={cn(
      'w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold border border-border',
      colorClass
    )}>
      {letter}
    </div>
  )
}

function PlatformBadge({ platform }: { platform: string }) {
  const labels: Record<string, string> = { woocommerce: 'WooCommerce', shopify: 'Shopify' }
  const variants: Record<string, 'default' | 'info' | 'outline'> = { woocommerce: 'default', shopify: 'info' }
  return (
    <Badge variant={variants[platform] ?? 'outline'} size="sm">
      {labels[platform] ?? platform}
    </Badge>
  )
}

function InlineNameEdit({ storeId, name }: { storeId: string; name: string }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const [savedValue, setSavedValue] = useState(name)
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate: updateStore, isPending } = useUpdateStore()

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const handleSave = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || trimmed === savedValue) {
      setValue(savedValue)
      setEditing(false)
      return
    }
    updateStore(
      { id: storeId, name: trimmed },
      {
        onSuccess: () => { setSavedValue(trimmed); setEditing(false) },
        onError: () => { setValue(savedValue); setEditing(false) },
      }
    )
  }, [value, savedValue, storeId, updateStore])

  const handleCancel = useCallback(() => {
    setValue(savedValue)
    setEditing(false)
  }, [savedValue])

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value.slice(0, 64))}
          onBlur={handleSave}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') handleCancel()
          }}
          className="text-base font-bold uppercase tracking-tight bg-transparent border-b border-primary outline-none w-full max-w-[200px]"
          maxLength={64}
          disabled={isPending}
        />
        <button onMouseDown={e => { e.preventDefault(); handleSave() }} className="text-success hover:text-success/80 transition-colors">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onMouseDown={e => { e.preventDefault(); handleCancel() }} className="text-muted-foreground hover:text-destructive transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-1.5 group/name cursor-pointer"
      onDoubleClick={() => setEditing(true)}
      title="Double-clic pour renommer"
    >
      <h2 className="text-base font-bold uppercase tracking-tight text-foreground leading-tight">
        {savedValue}
      </h2>
      <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover/name:opacity-100 transition-opacity" />
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StoreCard({
  store,
  viewMode = 'compact',
  onSync,
  onEdit,
  onDisconnect,
  onReconnect,
  onDelete,
  onCancelDeletion,
  onToggleActive,
}: StoreCardProps) {
  // Scope 7
  const { mutate: pauseStore, isPending: isPausing } = usePauseStore()
  const { mutate: resumeStore, isPending: isResuming } = useResumeStore()
  const { mutate: duplicateStore, isPending: isDuplicating } = useDuplicateStore()
  const isPaused = !!store.paused_at

  const handleExportJSON = () => {
    const exportData = {
      id: store.id, name: store.name, platform: store.platform,
      currency: store.currency, primary_language: store.primary_language,
      country_code: store.country_code, active: store.active,
      shop_url: store.platform_connections?.shop_url ?? '',
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `boutique-${store.name.toLowerCase().replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Data hooks
  const { data: healthData } = useConnectionHealth(store.id)
  const health: ConnectionHealth = healthData?.health ?? 'unknown'
  const isUnhealthy = health === 'unhealthy'
  const { progress, isActive: isSyncActive } = useStoreRealtime(store.id)
  const { data: latestJob } = useLatestSyncJob(store.id)
  const { data: syncConfig } = useStoreSyncSettings(store.id)
  const { data: kpis, isLoading: kpisLoading } = useStoreKPIs(store.id)

  const isDisconnected = store.status === 'disconnected' || !store.active
  const isDeletionScheduled = store.status === 'pending_deletion'

  const shopUrl = store.platform_connections?.shop_url ||
    (store.platform_connections?.credentials_encrypted as Record<string, string>)?.shop_url || ''
  const displayUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')

  const handleSync = useCallback((entities: SyncEntity[]) => {
    onSync?.(store.id, entities)
  }, [store.id, onSync])

  const syncDisabled = !store.active || isDisconnected || isDeletionScheduled

  return (
    <motion.div
      layout
      variants={motionTokens.variants.staggerItem}
      whileHover={viewMode === 'compact' ? motionTokens.variants.hoverLift : undefined}
    >
      <Card className={cn(
        'group relative w-full rounded-2xl border bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden',
        isUnhealthy && 'border-destructive/60 shadow-destructive/10',
        isPaused && 'border-warning/60',
        !store.active && 'opacity-60 grayscale-[0.5]'
      )}>
        <CardContent className="p-6 flex flex-col gap-4">

          {/* ── Identity Header (shared) ──────────────────────── */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="relative shrink-0">
                <StoreAvatar name={store.name} logoUrl={store.logo_url} />
                {isUnhealthy && (
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-destructive border-2 border-card" />
                )}
              </div>

              <div className="flex flex-col gap-1 min-w-0">
                <InlineNameEdit storeId={store.id} name={store.name} />
                <div className="flex flex-wrap items-center gap-1.5">
                  <PlatformBadge platform={store.platform} />
                  <StoreHealthPopover
                    storeId={store.id}
                    health={health}
                    lastCheckedAt={healthData?.lastHeartbeat ?? null}
                    errorMessage={healthData?.error ?? null}
                  />
                  {isPaused && (
                    <Badge variant="outline" size="sm" className="border-warning/60 text-warning">En pause</Badge>
                  )}
                  {isDeletionScheduled && (
                    <Badge variant="destructive" size="sm">Suppression planifiée</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {store.country_code && <span title={store.country_code}>{countryFlag(store.country_code)}</span>}
                  {displayUrl && (
                    <>
                      <Globe className="w-3 h-3 shrink-0" />
                      <a
                        href={shopUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate max-w-[160px] hover:text-foreground hover:underline transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        {displayUrl}
                      </a>
                    </>
                  )}
                  {viewMode === 'expanded' && store.currency && (
                    <Badge variant="outline" size="sm" className="font-mono ml-1">{store.currency}</Badge>
                  )}
                  {viewMode === 'expanded' && store.primary_language && (
                    <Badge variant="outline" size="sm" className="ml-0.5">{store.primary_language.toUpperCase()}</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Options menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Options Boutique</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(store.id)}>
                    <Settings className="h-4 w-4 mr-2 opacity-70" />Paramètres
                  </DropdownMenuItem>
                )}
                {!isDeletionScheduled && (
                  isPaused ? (
                    <DropdownMenuItem onClick={() => resumeStore(store.id)} disabled={isResuming}>
                      <PlayCircle className="h-4 w-4 mr-2 opacity-70 text-success" />{isResuming ? 'En cours…' : 'Reprendre'}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => pauseStore(store.id)} disabled={isPausing}>
                      <PauseCircle className="h-4 w-4 mr-2 opacity-70 text-warning" />{isPausing ? 'En cours…' : 'Mettre en pause'}
                    </DropdownMenuItem>
                  )
                )}
                <DropdownMenuItem onClick={() => duplicateStore(store.id)} disabled={isDuplicating}>
                  <Copy className="h-4 w-4 mr-2 opacity-70" />{isDuplicating ? 'Duplication…' : 'Dupliquer'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJSON}>
                  <Download className="h-4 w-4 mr-2 opacity-70" />Exporter JSON
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isDisconnected && onReconnect ? (
                  <DropdownMenuItem onClick={() => onReconnect(store.id)}>
                    <Link2 className="h-4 w-4 mr-2 opacity-70" />Reconnecter
                  </DropdownMenuItem>
                ) : onDisconnect && (
                  <DropdownMenuItem onClick={() => onDisconnect(store)}>
                    <Unplug className="h-4 w-4 mr-2 opacity-70" />Déconnecter
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {isDeletionScheduled && onCancelDeletion ? (
                  <DropdownMenuItem onClick={() => onCancelDeletion(store.id)} className="text-success font-medium">
                    <Clock className="h-4 w-4 mr-2" />Annuler la suppression
                  </DropdownMenuItem>
                ) : onDelete && (
                  <DropdownMenuItem onClick={() => onDelete(store)} className="text-destructive font-bold">
                    <Trash2 className="h-4 w-4 mr-2" />Supprimer la boutique
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ── Card Body: Compact or Expanded ──────────────── */}
          <AnimatePresence mode="wait" initial={false}>
            {viewMode === 'compact' ? (
              <motion.div
                key="compact"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={motionTokens.transitions.fast}
              >
                <StoreCompactView
                  storeId={store.id}
                  kpis={kpis}
                  kpisLoading={kpisLoading}
                  latestJob={latestJob ?? null}
                  progress={progress}
                  isSyncActive={isSyncActive}
                  autoSyncEnabled={syncConfig?.auto_sync_enabled ?? false}
                  onSync={handleSync}
                  syncDisabled={syncDisabled}
                />
              </motion.div>
            ) : (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={motionTokens.transitions.fast}
              >
                <StoreExpandedView
                  storeId={store.id}
                  kpis={kpis}
                  kpisLoading={kpisLoading}
                  latestJob={latestJob ?? null}
                  progress={progress}
                  isSyncActive={isSyncActive}
                  autoSyncEnabled={syncConfig?.auto_sync_enabled ?? false}
                  onSync={handleSync}
                  syncDisabled={syncDisabled}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Footer: Toggle Active ───────────────────────── */}
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Switch
                checked={store.active}
                onCheckedChange={checked => onToggleActive?.(store.id, checked)}
                disabled={isDeletionScheduled}
              />
              <span className="text-xs font-medium text-muted-foreground">Boutique Active</span>
            </div>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  )
}
```

**Step 2: Commit**

```bash
git add my-app/src/components/stores/StoreCard.tsx
git commit -m "feat(stores): rewrite StoreCard with compact/expanded dual-mode"
```

---

## Task 6: Rewrite StoresPage with Global Stats + View Toggle

**Files:**
- Modify: `my-app/src/app/app/stores/page.tsx` (full rewrite)

**Step 1: Rewrite the page**

Add: global stats bar, view toggle (compact/expanded) persisted in localStorage, stagger animation on grid.

```tsx
"use client"

/**
 * Stores Management Page — Bento Dashboard Redesign
 *
 * Layout: Header → Global Stats Bar → View Toggle → Animated Store Cards Grid
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Store as StoreIcon, Plus, LayoutGrid, Maximize2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { textStyles } from '@/lib/design-system/styles'
import { motionTokens } from '@/lib/design-system/tokens'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StoreCard } from '@/components/stores/StoreCard'
import { StoresGlobalStats } from '@/components/stores/StoresGlobalStats'
import { DeleteStoreDialog } from '@/components/stores/DeleteStoreDialog'
import { DisconnectStoreDialog } from '@/components/stores/DisconnectStoreDialog'
import { StoreSettingsModal } from '@/components/stores/StoreSettingsModal'
import { WooSyncModal } from '@/components/sync/WooSyncModal'
import { useSelectedStore } from '@/contexts/StoreContext'
import type { Store as StoreContextStore } from '@/contexts/StoreContext'
import { useToggleActive } from '@/hooks/stores/useStores'
import { useScheduleStoreDeletion } from '@/hooks/stores/useScheduleStoreDeletion'
import { useDisconnectStore } from '@/hooks/stores/useDisconnectStore'
import { useAutoHealthCheck } from '@/hooks/stores/useStoreHeartbeat'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { Store, SyncEntity } from '@/types/store'

// ============================================================================
// VIEW MODE TOGGLE
// ============================================================================

type ViewMode = 'compact' | 'expanded'

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/60">
      <button
        onClick={() => onChange('compact')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
          mode === 'compact'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        Compact
      </button>
      <button
        onClick={() => onChange('expanded')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
          mode === 'expanded'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Maximize2 className="w-3.5 h-3.5" />
        Détaillé
      </button>
    </div>
  )
}

// ============================================================================
// STORE CARD WRAPPER
// ============================================================================

function StoreCardConnected({
  store: rawStore,
  viewMode,
}: {
  store: StoreContextStore
  viewMode: ViewMode
}) {
  const store = rawStore as unknown as Store
  const [showSync, setShowSync] = useState(false)
  const [syncEntities, setSyncEntities] = useState<SyncEntity[]>(['products', 'categories'])
  const [showSettings, setShowSettings] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showDisconnect, setShowDisconnect] = useState(false)

  const { mutate: toggleActive } = useToggleActive()
  const { mutate: scheduleDeletion, isPending: isDeletingPending } = useScheduleStoreDeletion()
  const { mutate: disconnectStore, isPending: isDisconnectPending } = useDisconnectStore()

  const handleSync = (storeId: string, entities: SyncEntity[]) => {
    setSyncEntities(entities)
    setShowSync(true)
  }

  return (
    <>
      <StoreCard
        store={store}
        viewMode={viewMode}
        onSync={handleSync}
        onEdit={() => setShowSettings(true)}
        onDisconnect={() => setShowDisconnect(true)}
        onDelete={() => setShowDelete(true)}
        onToggleActive={(id, active) => toggleActive({ id, active })}
      />

      <WooSyncModal
        open={showSync}
        onOpenChange={setShowSync}
        storeId={store.id}
        storeName={store.name}
      />
      <StoreSettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        store={rawStore}
      />
      <DeleteStoreDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        store={store}
        onScheduleDeletion={(storeId, confirmation) => scheduleDeletion({ storeId, confirmation })}
        isPending={isDeletingPending}
      />
      <DisconnectStoreDialog
        open={showDisconnect}
        onOpenChange={setShowDisconnect}
        store={store}
        onConfirm={(storeId, force) => disconnectStore({ storeId, force })}
        isPending={isDisconnectPending}
      />
    </>
  )
}

// ============================================================================
// PAGE
// ============================================================================

export default function StoresPage() {
  const { stores, isLoading } = useSelectedStore()
  const router = useRouter()
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('flowz-stores-view', 'compact')

  const storeIds = stores.map((s: StoreContextStore) => s.id)
  useAutoHealthCheck(storeIds)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Chargement des boutiques…</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={motionTokens.variants.slideUp}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={textStyles.h1}>Boutiques</h1>
          <p className={cn(textStyles.bodyMuted, 'mt-1')}>
            Gérez vos boutiques en ligne connectées
          </p>
        </div>
        <Button onClick={() => router.push('/app/onboarding')}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une boutique
        </Button>
      </div>

      {stores.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <StoreIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune boutique configurée</h3>
            <p className="text-muted-foreground mb-4">
              Connectez votre première boutique pour commencer
            </p>
            <Button onClick={() => router.push('/app/onboarding')}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une boutique
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Global Stats Bar */}
          <StoresGlobalStats />

          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <p className={textStyles.bodySmall}>
              {stores.length} boutique{stores.length > 1 ? 's' : ''} connectée{stores.length > 1 ? 's' : ''}
            </p>
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          </div>

          {/* Store Cards Grid */}
          <motion.div
            variants={motionTokens.variants.staggerContainer}
            initial="hidden"
            animate="visible"
            className={cn(
              'grid gap-6',
              viewMode === 'compact'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2'
            )}
          >
            {stores.map((store: StoreContextStore) => (
              <StoreCardConnected
                key={store.id}
                store={store}
                viewMode={viewMode}
              />
            ))}
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
```

**Step 2: Commit**

```bash
git add my-app/src/app/app/stores/page.tsx
git commit -m "feat(stores): rewrite StoresPage with global stats bar + view toggle"
```

---

## Task 7: Update Component Exports

**Files:**
- Modify: `my-app/src/components/stores/index.ts`

**Step 1: Update exports to include all new components**

```ts
/**
 * Store Components - Export centralisé
 */

// Store display
export { StoreCard } from './StoreCard';
export { StoreHealthPopover } from './StoreHealthPopover';
export { StoreSyncStatus } from './StoreSyncStatus';
export { StoreMetricsSection } from './StoreMetricsSection';
export { StoreQuotaBar } from './StoreQuotaBar';
export { StoreSettingsModal } from './StoreSettingsModal';

// Bento redesign
export { StoresGlobalStats } from './StoresGlobalStats';
export { StoreSeoRadial } from './StoreSeoRadial';
export { StoreCompactView } from './StoreCompactView';
export { StoreExpandedView } from './StoreExpandedView';

// Store actions
export { DeleteStoreDialog } from './DeleteStoreDialog';
export { DisconnectStoreDialog } from './DisconnectStoreDialog';
```

Note: Remove `EditStoreModal` export (deprecated, replaced by StoreSettingsModal).

**Step 2: Commit**

```bash
git add my-app/src/components/stores/index.ts
git commit -m "chore(stores): update component exports, remove deprecated EditStoreModal"
```

---

## Task 8: Verify Build + Visual QA

**Step 1: Run build to check for TypeScript errors**

Run: `npm run build`
Expected: No type errors in stores components

**Step 2: Run dev server and visual check**

Run: `npm run dev`
Expected:
- Page loads with global stats bar (4 mini-cards)
- View toggle switches between compact and expanded
- Compact mode: small SEO radial + inline stats + sync
- Expanded mode: large SEO radial + 3 stat tiles + sync + AI quota bar
- Framer Motion stagger animation on card grid
- Cards have hover lift in compact mode
- localStorage persists view preference

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(stores): complete Bento Dashboard redesign with compact/expanded modes"
```
