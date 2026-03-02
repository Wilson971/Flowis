/**
 * StoreQuotaBar — Scope 5
 *
 * Barre de quota IA mensuel par boutique :
 * - Barre horizontale X / Y crédits
 * - Couleur seuil (vert < 70%, orange 70–90%, rouge > 90%)
 * - Badge "Quota faible" si > 90%
 * - Répartition par feature (flowriter / photo_studio) au hover
 * - Tooltip date de reset
 */

'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Zap, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import type { StoreAIQuota } from '@/types/store'

// ============================================================================
// HELPERS
// ============================================================================

function quotaBarColor(percent: number): string {
    if (percent >= 90) return 'bg-destructive'
    if (percent >= 70) return 'bg-warning'
    return 'bg-success'
}

function quotaTextColor(percent: number): string {
    if (percent >= 90) return 'text-destructive'
    if (percent >= 70) return 'text-warning'
    return 'text-success'
}

const FEATURE_LABELS: Record<string, string> = {
    flowriter: 'FloWriter',
    photo_studio: 'Photo Studio',
}

// ============================================================================
// COMPONENT
// ============================================================================

interface StoreQuotaBarProps {
    quota: StoreAIQuota | null | undefined
    isLoading: boolean
}

export function StoreQuotaBar({ quota, isLoading }: StoreQuotaBarProps) {
    if (isLoading) {
        return (
            <div className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-full rounded-full" />
            </div>
        )
    }

    if (!quota) return null

    const { used, limit, percent, byFeature, resetDate } = quota
    const isLow = percent >= 90

    const resetFormatted = resetDate
        ? format(new Date(resetDate), 'd MMM', { locale: fr })
        : null

    // Feature breakdown for popover
    const features = Object.entries(byFeature).filter(([, v]) => v > 0)

    return (
        <div className="space-y-1.5">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Crédits IA</span>
                    {isLow && (
                        <Badge
                            variant="destructive"
                            className="h-4 px-1.5 py-0 text-[9px] font-bold"
                        >
                            Quota faible
                        </Badge>
                    )}
                </div>

                <Popover>
                    <PopoverTrigger asChild>
                        <button className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                            <span className={cn('font-semibold tabular-nums', quotaTextColor(percent))}>
                                {used.toLocaleString()}
                            </span>
                            <span className="text-muted-foreground/60"> / {limit.toLocaleString()}</span>
                            <ChevronDown className="w-3 h-3 ml-0.5" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="end" className="w-56 p-3 space-y-3">
                        {/* Total */}
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-foreground">
                                {used.toLocaleString()} / {limit.toLocaleString()} crédits
                            </p>
                            {resetFormatted && (
                                <p className="text-[11px] text-muted-foreground">
                                    Reset le {resetFormatted}
                                </p>
                            )}
                        </div>

                        {/* Per-feature breakdown */}
                        {features.length > 0 && (
                            <div className="space-y-1.5 border-t border-border/50 pt-2">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Par feature
                                </p>
                                {features.map(([feature, credits]) => {
                                    const featurePercent = used > 0 ? Math.round((credits / used) * 100) : 0
                                    return (
                                        <div key={feature} className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {FEATURE_LABELS[feature] ?? feature}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <span className="text-xs font-semibold tabular-nums text-foreground">
                                                    {credits.toLocaleString()}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    ({featurePercent}%)
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {features.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                Aucune utilisation ce mois-ci
                            </p>
                        )}
                    </PopoverContent>
                </Popover>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-500',
                        quotaBarColor(percent)
                    )}
                    style={{ width: `${Math.min(100, percent)}%` }}
                />
            </div>
        </div>
    )
}
