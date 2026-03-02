/**
 * StoreMetricsSection — Scope 4 (refactorisé Sprint 4)
 *
 * 3 métriques en ligne : Produits optimisés | Score SEO | Alerte sans desc
 * Supprimé : couverture IA (redondant avec stats row)
 */

'use client'

import { useRouter } from 'next/navigation'
import { Package, BarChart2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { StoreKPIs } from '@/types/store'

// ============================================================================
// HELPERS
// ============================================================================

function optimizedColor(percent: number): string {
    if (percent >= 75) return 'bg-success'
    if (percent >= 50) return 'bg-warning'
    return 'bg-destructive'
}

function seoTextColor(score: number): string {
    if (score >= 70) return 'text-success'
    if (score >= 40) return 'text-warning'
    return 'text-destructive'
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function MetricTile({
    icon: Icon,
    label,
    children,
    isLoading,
}: {
    icon: React.ElementType
    label: string
    children: React.ReactNode
    isLoading: boolean
}) {
    return (
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted/60 transition-colors">
            <div className="flex items-center gap-1.5 text-muted-foreground">
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            {isLoading ? (
                <Skeleton className="h-5 w-16" />
            ) : (
                children
            )}
        </div>
    )
}

// ============================================================================
// COMPONENT
// ============================================================================

interface StoreMetricsSectionProps {
    storeId: string
    kpis: StoreKPIs | null | undefined
    isLoading: boolean
}

export function StoreMetricsSection({ storeId, kpis, isLoading }: StoreMetricsSectionProps) {
    const router = useRouter()

    const totalProducts = kpis?.totalProducts ?? 0
    const optimizedProducts = kpis?.optimizedProducts ?? 0
    const avgSeoScore = kpis?.avgSeoScore ?? 0
    const productsWithoutDesc = kpis?.productsWithoutDesc ?? 0

    const coveragePercent = totalProducts > 0
        ? Math.round((optimizedProducts / totalProducts) * 100)
        : 0

    const optimizedLabel = totalProducts > 0
        ? `${optimizedProducts.toLocaleString()} / ${totalProducts.toLocaleString()}`
        : '—'

    return (
        <div className="space-y-2">
            {/* Alert: products without description */}
            {!isLoading && productsWithoutDesc > 0 && (
                <button
                    onClick={() => router.push(`/app/products?filter=no_description&store=${storeId}`)}
                    className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors group/alert"
                >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="underline-offset-2 group-hover/alert:underline">
                        {productsWithoutDesc} sans description
                    </span>
                </button>
            )}

            {/* 2-column metrics */}
            <div className="grid grid-cols-2 gap-2">
                {/* Produits optimisés */}
                <MetricTile icon={Package} label="Optimisés" isLoading={isLoading}>
                    <div className="space-y-1.5">
                        <span className="text-sm font-bold tabular-nums text-foreground">
                            {optimizedLabel}
                        </span>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                                className={cn(
                                    'h-full rounded-full transition-all duration-500',
                                    optimizedColor(coveragePercent)
                                )}
                                style={{ width: `${Math.min(100, coveragePercent)}%` }}
                            />
                        </div>
                    </div>
                </MetricTile>

                {/* Score SEO moyen */}
                <MetricTile icon={BarChart2} label="Score SEO" isLoading={isLoading}>
                    <div className="flex items-baseline gap-1">
                        <span className={cn('text-lg font-bold tabular-nums', seoTextColor(avgSeoScore))}>
                            {Math.round(avgSeoScore)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">/100</span>
                    </div>
                </MetricTile>
            </div>
        </div>
    )
}
