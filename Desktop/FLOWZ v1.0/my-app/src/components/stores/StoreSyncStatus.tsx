/**
 * StoreSyncStatus — Scope 3
 *
 * Section sync sur la StoreCard :
 * - Timestamp dernière sync (relatif/absolu)
 * - Badge statut (Succès / Partielle / Échouée)
 * - Progress bar circulaire en temps réel (Supabase Realtime)
 * - Dropdown sync sélective (checkboxes entités)
 * - Icône horloge auto-sync avec tooltip
 */

'use client'

import { useState } from 'react'
import { format, formatDistanceToNow, isAfter, subHours } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronDown,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { LatestSyncJob } from '@/hooks/stores/useStoreRealtime'
import type { SyncProgressPayload, SyncEntity } from '@/types/store'

// ============================================================================
// CONFIG
// ============================================================================

const SYNC_ENTITIES: { id: SyncEntity; label: string; description: string }[] = [
  { id: 'products', label: 'Produits', description: 'Catalogue produits + images' },
  { id: 'categories', label: 'Catégories', description: 'Arborescence des catégories' },
  { id: 'blog', label: 'Blog', description: 'Articles de blog WordPress' },
  { id: 'commercial', label: 'Données commerciales', description: 'Commandes, clients, stocks' },
]

// ============================================================================
// HELPERS
// ============================================================================

function formatSyncTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (isAfter(date, subHours(new Date(), 24))) {
    return formatDistanceToNow(date, { addSuffix: true, locale: fr })
  }
  return format(date, 'd MMM HH:mm', { locale: fr })
}

function SyncStatusBadge({ job }: { job: LatestSyncJob | null }) {
  if (!job) return null

  if (job.status === 'completed') {
    const hasErrors = job.failed_items > 0
    if (hasErrors) {
      return (
        <Badge variant="outline" className="text-[10px] gap-1 bg-warning/10 text-warning border-warning/20">
          <AlertTriangle className="w-3 h-3" />
          Partielle
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-[10px] gap-1 bg-success/10 text-success border-success/20">
        <CheckCircle2 className="w-3 h-3" />
        Succès
      </Badge>
    )
  }

  if (job.status === 'failed') {
    return (
      <Badge variant="outline" className="text-[10px] gap-1 bg-destructive/10 text-destructive border-destructive/20">
        <XCircle className="w-3 h-3" />
        Échouée
      </Badge>
    )
  }

  if (job.status === 'running') {
    return (
      <Badge variant="outline" className="text-[10px] gap-1 bg-info/10 text-info border-info/20">
        <RefreshCw className="w-3 h-3 animate-spin" />
        En cours
      </Badge>
    )
  }

  return null
}

// Circular progress ring
function CircularProgress({ percent }: { percent: number }) {
  const r = 16
  const circumference = 2 * Math.PI * r
  const offset = circumference - (percent / 100) * circumference

  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
      <circle cx="20" cy="20" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-300"
      />
    </svg>
  )
}

// ============================================================================
// COMPONENT
// ============================================================================

interface StoreSyncStatusProps {
  storeId: string
  latestJob: LatestSyncJob | null
  progress: SyncProgressPayload | null
  isSyncActive: boolean
  autoSyncEnabled?: boolean
  nextSyncAt?: string | null
  selectedEntities?: SyncEntity[]
  onSync: (entities: SyncEntity[]) => void
  disabled?: boolean
}

export function StoreSyncStatus({
  latestJob,
  progress,
  isSyncActive,
  autoSyncEnabled = false,
  nextSyncAt,
  selectedEntities: externalSelected,
  onSync,
  disabled = false,
}: StoreSyncStatusProps) {
  const [selected, setSelected] = useState<SyncEntity[]>(
    externalSelected ?? ['products', 'categories', 'blog', 'commercial']
  )

  const lastSyncAt = latestJob?.completed_at || latestJob?.started_at
  const nextSyncFormatted = nextSyncAt
    ? formatDistanceToNow(new Date(nextSyncAt), { addSuffix: false, locale: fr })
    : null

  const toggleEntity = (entity: SyncEntity) => {
    setSelected(prev =>
      prev.includes(entity) ? prev.filter(e => e !== entity) : [...prev, entity]
    )
  }

  const selectAll = () => setSelected(SYNC_ENTITIES.map(e => e.id))

  return (
    <div className="space-y-3">
      {/* Live progress (only when sync running) */}
      {isSyncActive && progress && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-info/5 border border-info/20">
          <div className="relative shrink-0">
            <CircularProgress percent={progress.percent} />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums text-foreground rotate-90">
              {progress.percent}%
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              Étape {progress.step}/{progress.totalSteps} — {progress.entity}
            </p>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {progress.processed.toLocaleString()} / {progress.total.toLocaleString()} éléments
            </p>
          </div>
        </div>
      )}

      {/* Last sync status row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {lastSyncAt ? formatSyncTime(lastSyncAt) : 'Jamais synchronisé'}
          </span>
        </div>
        <SyncStatusBadge job={latestJob} />
      </div>

      {/* Sync button row */}
      <div className="flex items-center gap-2">
        {/* Main sync button */}
        <Button
          size="sm"
          className={cn(
            'flex-1 h-9 font-bold gap-2 rounded-xl transition-all',
            isSyncActive
              ? 'bg-info hover:bg-info/90 text-info-foreground'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          )}
          disabled={disabled || isSyncActive}
          onClick={() => onSync(selected)}
        >
          {isSyncActive ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          {isSyncActive ? 'En cours…' : 'Synchroniser'}
        </Button>

        {/* Selective sync dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0 rounded-xl"
              disabled={disabled || isSyncActive}
              aria-label="Sync sélective"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Entités à synchroniser
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SYNC_ENTITIES.map(({ id, label, description }) => (
              <div
                key={id}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 rounded-md transition-colors"
                onClick={() => toggleEntity(id)}
              >
                <Checkbox
                  id={`entity-${id}`}
                  checked={selected.includes(id)}
                  onCheckedChange={() => toggleEntity(id)}
                  className="pointer-events-none"
                />
                <div className="flex flex-col gap-0.5">
                  <label htmlFor={`entity-${id}`} className="text-sm cursor-pointer font-medium">
                    {label}
                  </label>
                  <span className="text-[10px] text-muted-foreground">{description}</span>
                </div>
              </div>
            ))}
            <DropdownMenuSeparator />
            <div className="px-2 pb-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs h-7"
                onClick={selectAll}
              >
                Tout sélectionner
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Auto-sync badge (only when enabled) */}
        {autoSyncEnabled && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-success/30 bg-success/10 text-success shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {nextSyncFormatted ? `Prochaine sync dans ${nextSyncFormatted}` : 'Auto-sync activée'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}
