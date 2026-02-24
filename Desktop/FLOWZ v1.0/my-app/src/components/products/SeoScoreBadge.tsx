/**
 * SeoScoreBadge - Badge de score SEO avec indicateur visuel
 * Utilise la palette unifiée 5 niveaux (emerald/green/amber/orange/red)
 */
'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle } from 'lucide-react';
import { getSeoStatusColors, getScoreLabel, getScoreColor, getScoreLevelKey } from '@/lib/seo/scoreColors';
import type { SeoLevelKey } from '@/types/seo';

// ============================================================================
// Types
// ============================================================================

export type SeoStatus = SeoLevelKey | 'not_analyzed';

interface SeoScoreBadgeProps {
    score: number | null | undefined;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

interface SeoScoreCircleProps {
    score: number | null | undefined;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    className?: string;
}

interface SeoScoreProgressProps {
    score: number | null | undefined;
    label?: string;
    className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

function getStatus(score: number | null | undefined): SeoStatus {
    if (score === null || score === undefined) return 'not_analyzed';
    return getScoreLevelKey(score);
}

function getLabel(status: SeoStatus): string {
    if (status === 'not_analyzed') return 'Non analysé';
    const scoreMap: Record<SeoLevelKey, number> = { excellent: 95, good: 80, average: 60, poor: 40, critical: 15 };
    return getScoreLabel(scoreMap[status]);
}

// ============================================================================
// Size Config
// ============================================================================

const sizeConfig = {
    sm: { badge: 'text-xs px-1.5 py-0.5', circle: 'h-8 w-8 text-xs', icon: 'h-3 w-3' },
    md: { badge: 'text-sm px-2 py-1', circle: 'h-12 w-12 text-sm', icon: 'h-4 w-4' },
    lg: { badge: 'text-base px-3 py-1.5', circle: 'h-16 w-16 text-lg', icon: 'h-5 w-5' },
};

// ============================================================================
// Components
// ============================================================================

export function SeoScoreBadge({ score, showLabel = false, size = 'md', className }: SeoScoreBadgeProps) {
    const status = getStatus(score);
    const label = getLabel(status);
    const colors = getSeoStatusColors(score ?? null);
    const sizes = sizeConfig[size];

    if (score === null || score === undefined) {
        return (
            <Badge variant="outline" className={cn(sizes.badge, 'text-muted-foreground', className)}>
                N/A
            </Badge>
        );
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant="outline" className={cn(sizes.badge, colors.bg, colors.text, colors.border, className)}>
                        {score}
                        {showLabel && <span className="ml-1">- {label}</span>}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Score SEO: {score}/100</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export function SeoScoreCircle({ score, size = 'md', showLabel = true, className }: SeoScoreCircleProps) {
    const status = getStatus(score);
    const label = getLabel(status);
    const colors = getSeoStatusColors(score ?? null);
    const sizes = sizeConfig[size];

    const Icon = status === 'excellent' || status === 'good'
        ? CheckCircle
        : status === 'poor' || status === 'critical'
            ? AlertCircle
            : Minus;

    if (score === null || score === undefined) {
        return (
            <div className={cn(sizes.circle, 'rounded-full flex items-center justify-center bg-muted text-muted-foreground', className)}>
                <span>?</span>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(sizes.circle, 'rounded-full flex flex-col items-center justify-center font-bold border-2', colors.bg, colors.text, colors.border, className)}>
                        <span>{score}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="flex items-center gap-2">
                        <Icon className={cn('h-4 w-4', colors.text)} />
                        <div>
                            <p className="font-medium">{label}</p>
                            <p className="text-xs text-muted-foreground">Score SEO: {score}/100</p>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export function SeoScoreProgress({ score, label, className }: SeoScoreProgressProps) {
    const status = getStatus(score);
    const statusLabel = getLabel(status);
    const colors = getSeoStatusColors(score ?? null);
    const displayScore = score ?? 0;

    return (
        <div className={cn('space-y-1.5', className)}>
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label || 'Score SEO'}</span>
                <div className="flex items-center gap-2">
                    <span className={cn('font-medium', colors.text)}>
                        {score !== null && score !== undefined ? `${score}/100` : 'N/A'}
                    </span>
                    <Badge variant="outline" className={cn('text-xs', colors.bg, colors.text)}>
                        {statusLabel}
                    </Badge>
                </div>
            </div>
            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <div
                    className={cn('absolute inset-y-0 left-0 rounded-full transition-all', colors.progress)}
                    style={{ width: `${displayScore}%` }}
                />
            </div>
        </div>
    );
}

export function SeoTrendIndicator({ current, previous, className }: { current: number | null; previous: number | null; className?: string }) {
    if (current === null || previous === null) return null;

    const diff = current - previous;
    const isPositive = diff > 0;
    const isNeutral = diff === 0;

    return (
        <div className={cn('flex items-center gap-1 text-sm', isPositive ? 'text-emerald-600' : isNeutral ? 'text-muted-foreground' : 'text-destructive', className)}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : isNeutral ? <Minus className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{isPositive ? '+' : ''}{diff}</span>
        </div>
    );
}
