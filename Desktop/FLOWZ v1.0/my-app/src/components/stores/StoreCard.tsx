/**
 * StoreCard — Bento Dashboard Redesign
 *
 * Dual-mode card: compact (overview) or expanded (mini-dashboard).
 * Reuses: StoreSyncStatus, StoreQuotaBar, StoreHealthPopover, StoreCompactView, StoreExpandedView.
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  MoreHorizontal, Settings, Trash2, Clock, Globe, Unplug, Link2, Pencil,
  Check, X, Copy, Download, PauseCircle, PlayCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
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
// HELPERS
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

// ============================================================================
// INLINE NAME EDIT
// ============================================================================

function InlineNameEdit({ storeId, name }: { storeId: string; name: string }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const [savedValue, setSavedValue] = useState(name)
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate: updateStore, isPending } = useUpdateStore()

  useEffect(() => {
    if (editing) inputRef.current?.focus({ preventScroll: true })
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
  // Advanced actions
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

          {/* ── Identity Header ──────────────────────────────── */}
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
                  nextSyncAt={null}
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
