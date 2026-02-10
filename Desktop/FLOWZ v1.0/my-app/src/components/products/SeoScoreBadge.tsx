/**
 * SeoScoreBadge - Badge de score SEO avec indicateur visuel
 */
'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import {
    getSeoStatus,
    getSeoColor,
    getSeoLabel,
    type SeoStatus,
} from '@/hooks/products/useSeoAnalysis';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

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
// Size Config
// ============================================================================

const sizeConfig = {
    sm: {
        badge: 'text-xs px-1.5 py-0.5',
        circle: 'h-8 w-8 text-xs',
        icon: 'h-3 w-3',
    },
    md: {
        badge: 'text-sm px-2 py-1',
        circle: 'h-12 w-12 text-sm',
        icon: 'h-4 w-4',
    },
    lg: {
        badge: 'text-base px-3 py-1.5',
        circle: 'h-16 w-16 text-lg',
        icon: 'h-5 w-5',
    },
};

const statusColors = {
    excellent: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-300 dark:border-green-700',
        progress: 'bg-green-500',
    },
    good: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-300 dark:border-blue-700',
        progress: 'bg-blue-500',
    },
    needs_work: {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-300 dark:border-amber-700',
        progress: 'bg-amber-500',
    },
    poor: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-300 dark:border-red-700',
        progress: 'bg-red-500',
    },
    not_analyzed: {
        bg: 'bg-gray-100 dark:bg-gray-900/30',
        text: 'text-gray-500 dark:text-gray-400',
        border: 'border-gray-300 dark:border-gray-700',
        progress: 'bg-gray-400',
    },
};

// ============================================================================
// Components
// ============================================================================

/**
 * Badge compact avec score SEO
 */
export function SeoScoreBadge({
    score,
    showLabel = false,
    size = 'md',
    className,
}: SeoScoreBadgeProps) {
    const status = getSeoStatus(score);
    const label = getSeoLabel(status);
    const colors = statusColors[status];
    const sizes = sizeConfig[size];

    if (score === null || score === undefined) {
        return (
            <Badge
                variant="outline"
                className={cn(sizes.badge, 'text-muted-foreground', className)}
            >
                N/A
            </Badge>
        );
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge
                        variant="outline"
                        className={cn(sizes.badge, colors.bg, colors.text, colors.border, className)}
                    >
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

/**
 * Cercle avec score SEO
 */
export function SeoScoreCircle({
    score,
    size = 'md',
    showLabel = true,
    className,
}: SeoScoreCircleProps) {
    const status = getSeoStatus(score);
    const label = getSeoLabel(status);
    const colors = statusColors[status];
    const sizes = sizeConfig[size];

    const Icon = status === 'excellent' || status === 'good'
        ? CheckCircle
        : status === 'poor'
            ? AlertCircle
            : Minus;

    if (score === null || score === undefined) {
        return (
            <div
                className={cn(
                    sizes.circle,
                    'rounded-full flex items-center justify-center',
                    'bg-muted text-muted-foreground',
                    className
                )}
            >
                <span>?</span>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            sizes.circle,
                            'rounded-full flex flex-col items-center justify-center font-bold',
                            colors.bg,
                            colors.text,
                            'border-2',
                            colors.border,
                            className
                        )}
                    >
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

/**
 * Barre de progression SEO
 */
export function SeoScoreProgress({
    score,
    label,
    className,
}: SeoScoreProgressProps) {
    const status = getSeoStatus(score);
    const statusLabel = getSeoLabel(status);
    const colors = statusColors[status];

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

/**
 * Indicateur de tendance SEO
 */
export function SeoTrendIndicator({
    current,
    previous,
    className,
}: {
    current: number | null;
    previous: number | null;
    className?: string;
}) {
    if (current === null || previous === null) {
        return null;
    }

    const diff = current - previous;
    const isPositive = diff > 0;
    const isNeutral = diff === 0;

    return (
        <div
            className={cn(
                'flex items-center gap-1 text-sm',
                isPositive ? 'text-green-600' : isNeutral ? 'text-gray-500' : 'text-red-600',
                className
            )}
        >
            {isPositive ? (
                <TrendingUp className="h-4 w-4" />
            ) : isNeutral ? (
                <Minus className="h-4 w-4" />
            ) : (
                <TrendingDown className="h-4 w-4" />
            )}
            <span>{isPositive ? '+' : ''}{diff}</span>
        </div>
    );
}
