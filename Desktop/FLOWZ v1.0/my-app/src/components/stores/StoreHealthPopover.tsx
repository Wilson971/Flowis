/**
 * StoreHealthPopover — Scope 2
 *
 * Pastille de santé cliquable avec popover de détail :
 * - Statut coloré (healthy/degraded/unhealthy/unknown)
 * - Timestamp relatif dernière vérification
 * - Code erreur + message humain
 * - Bouton "Tester maintenant" avec rate-limit 1min
 */

'use client'

import { useState, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AlertCircle, CheckCircle2, Clock, RefreshCw, Wifi, WifiOff, HelpCircle, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStoreHeartbeat } from '@/hooks/stores/useStoreHeartbeat'
import type { ConnectionHealth, HealthErrorCode } from '@/types/store'

// ============================================================================
// CONFIG
// ============================================================================

const healthConfig: Record<
  ConnectionHealth,
  { label: string; dotClass: string; Icon: React.ElementType; badgeClass: string }
> = {
  healthy: {
    label: 'Connecté',
    dotClass: 'bg-success shadow-[0_0_8px_var(--success)]',
    Icon: CheckCircle2,
    badgeClass: 'bg-success/10 text-success border-success/20',
  },
  degraded: {
    label: 'Dégradé',
    dotClass: 'bg-warning shadow-[0_0_8px_var(--warning)]',
    Icon: AlertCircle,
    badgeClass: 'bg-warning/10 text-warning border-warning/20',
  },
  unhealthy: {
    label: 'Hors ligne',
    dotClass: 'bg-destructive shadow-[0_0_8px_var(--destructive)]',
    Icon: WifiOff,
    badgeClass: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  unknown: {
    label: 'Non vérifié',
    dotClass: 'bg-muted-foreground/40',
    Icon: HelpCircle,
    badgeClass: 'bg-muted text-muted-foreground border-border',
  },
}

const errorMessages: Partial<Record<HealthErrorCode, { label: string; docPath?: string }>> = {
  AUTH_EXPIRED: { label: 'Clé API expirée ou révoquée', docPath: '/docs/reconnect-api' },
  SSL_ERROR: { label: 'Certificat SSL invalide', docPath: '/docs/ssl-error' },
  SITE_DOWN: { label: 'Le site est inaccessible', docPath: '/docs/site-down' },
  RATE_LIMITED: { label: 'Limite de requêtes atteinte (rate limit)', docPath: '/docs/rate-limit' },
  PERMISSION_DENIED: { label: 'Permissions insuffisantes sur l\'API', docPath: '/docs/permissions' },
  TIMEOUT: { label: 'Délai de réponse dépassé (> 10s)', docPath: '/docs/timeout' },
}

// ============================================================================
// COMPONENT
// ============================================================================

interface StoreHealthPopoverProps {
  storeId: string
  health: ConnectionHealth
  lastCheckedAt: string | null
  errorCode?: HealthErrorCode | null
  errorMessage?: string | null
  responseTimeMs?: number | null
  cmsVersion?: string | null
}

export function StoreHealthPopover({
  storeId,
  health,
  lastCheckedAt,
  errorCode,
  errorMessage,
  responseTimeMs,
  cmsVersion,
}: StoreHealthPopoverProps) {
  const [lastTestedAt, setLastTestedAt] = useState<number | null>(null)
  const { mutate: runHeartbeat, isPending } = useStoreHeartbeat()

  const cfg = healthConfig[health]

  // Rate-limit: désactive le bouton 60s après un test
  const canTest = !isPending && (lastTestedAt === null || Date.now() - lastTestedAt > 60_000)
  const [, setTick] = useState(0) // force re-render pour le countdown

  const handleTest = useCallback(() => {
    runHeartbeat(storeId, {
      onSettled: () => {
        setLastTestedAt(Date.now())
        // Re-render toutes les 10s pour mettre à jour le countdown
        const interval = setInterval(() => setTick(t => t + 1), 10_000)
        setTimeout(() => clearInterval(interval), 65_000)
      },
    })
  }, [storeId, runHeartbeat])

  const lastCheckedFormatted = lastCheckedAt
    ? formatDistanceToNow(new Date(lastCheckedAt), { addSuffix: true, locale: fr })
    : null

  const secondsSinceTest = lastTestedAt ? Math.round((Date.now() - lastTestedAt) / 1000) : null
  const cooldownLeft = secondsSinceTest !== null && secondsSinceTest < 60
    ? 60 - secondsSinceTest
    : null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative flex items-center gap-1.5 group/health focus:outline-none"
          aria-label={`Statut connexion : ${cfg.label}`}
        >
          {/* Pastille */}
          <span
            className={cn(
              'w-2.5 h-2.5 rounded-full transition-transform duration-200 group-hover/health:scale-125',
              cfg.dotClass
            )}
          />
          {/* Pulse pour healthy */}
          {health === 'healthy' && (
            <span className="absolute w-2.5 h-2.5 rounded-full bg-success/40 animate-ping" />
          )}
          <span className="text-[11px] font-medium text-muted-foreground group-hover/health:text-foreground transition-colors">
            {cfg.label}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        className="w-72 p-0 overflow-hidden rounded-xl border-border/60 shadow-lg"
      >
        {/* Header */}
        <div className={cn('flex items-center gap-3 px-4 py-3 border-b border-border/50', cfg.badgeClass)}>
          <cfg.Icon className="w-4 h-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{cfg.label}</p>
            {responseTimeMs != null && health !== 'unhealthy' && (
              <p className="text-xs opacity-70">{responseTimeMs}ms de latence</p>
            )}
          </div>
          <Badge variant="outline" className={cn('text-[10px] shrink-0', cfg.badgeClass)}>
            {health.toUpperCase()}
          </Badge>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-3">
          {/* Dernière vérif */}
          {lastCheckedFormatted && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Vérifié {lastCheckedFormatted}</span>
            </div>
          )}

          {/* Version CMS */}
          {cmsVersion && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wifi className="w-3.5 h-3.5 shrink-0" />
              <span>Version CMS : <span className="font-mono text-foreground">{cmsVersion}</span></span>
            </div>
          )}

          {/* Erreur */}
          {(errorCode || errorMessage) && (
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 space-y-1">
              {errorCode && errorMessages[errorCode] && (
                <p className="text-xs font-semibold text-destructive">
                  {errorMessages[errorCode]!.label}
                </p>
              )}
              {errorMessage && (
                <p className="text-xs text-muted-foreground font-mono break-all line-clamp-3">
                  {errorMessage}
                </p>
              )}
              {errorCode && errorMessages[errorCode]?.docPath && (
                <a
                  href={errorMessages[errorCode]!.docPath}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3 h-3" />
                  Voir la résolution
                </a>
              )}
            </div>
          )}

          {/* Bouton test */}
          <Button
            size="sm"
            variant="outline"
            className="w-full h-8 text-xs gap-2"
            disabled={!canTest}
            onClick={handleTest}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isPending && 'animate-spin')} />
            {isPending
              ? 'Test en cours…'
              : cooldownLeft !== null
                ? `Réessayer dans ${cooldownLeft}s`
                : 'Tester maintenant'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
