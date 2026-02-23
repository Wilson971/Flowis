"use client";

import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { GscIndexationOverview } from "@/lib/gsc/types";

interface GscIndexationStatusBarProps {
    overview: GscIndexationOverview;
}

const VERDICT_CONFIG: Array<{
    key: keyof Omit<GscIndexationOverview, 'total' | 'history'>;
    label: string;
    color: string;
    dotColor: string;
}> = [
    { key: 'indexed', label: 'Indexe', color: 'bg-emerald-500', dotColor: 'bg-emerald-500' },
    { key: 'not_indexed', label: 'Non indexe', color: 'bg-red-500', dotColor: 'bg-red-500' },
    { key: 'crawled_not_indexed', label: 'Explore, non indexe', color: 'bg-orange-400', dotColor: 'bg-orange-400' },
    { key: 'discovered_not_indexed', label: 'Decouvert, non indexe', color: 'bg-amber-400', dotColor: 'bg-amber-400' },
    { key: 'noindex', label: 'Marque noindex', color: 'bg-muted-foreground/60', dotColor: 'bg-muted-foreground/60' },
    { key: 'blocked_robots', label: 'Bloque robots.txt', color: 'bg-muted-foreground/30', dotColor: 'bg-muted-foreground/30' },
    { key: 'errors', label: 'Erreur', color: 'bg-red-700', dotColor: 'bg-red-700' },
    { key: 'unknown', label: 'Inconnu', color: 'bg-muted', dotColor: 'bg-muted' },
];

export function GscIndexationStatusBar({ overview }: GscIndexationStatusBarProps) {
    const total = overview.total || 1;

    return (
        <div className="space-y-2">
            {/* Proportional bar */}
            <TooltipProvider>
                <div className="flex h-8 w-full overflow-hidden rounded-full">
                    {VERDICT_CONFIG.map(({ key, label, color }) => {
                        const count = overview[key] as number;
                        if (count === 0) return null;
                        const pct = (count / total) * 100;
                        return (
                            <Tooltip key={key}>
                                <TooltipTrigger asChild>
                                    <div
                                        className={cn(color, "h-full transition-all cursor-default")}
                                        style={{ width: `${Math.max(pct, 1)}%` }}
                                    />
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">
                                    <span className="font-semibold">{label}</span>
                                    <span className="ml-1.5 text-muted-foreground">
                                        {count} ({pct.toFixed(1)}%)
                                    </span>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </div>
            </TooltipProvider>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
                {VERDICT_CONFIG.map(({ key, label, dotColor }) => {
                    const count = overview[key] as number;
                    if (count === 0) return null;
                    return (
                        <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className={cn("h-2 w-2 rounded-full", dotColor)} />
                            {label}: {count}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/** Verdict dot for individual URL rows */
export function VerdictDot({ verdict }: { verdict: string }) {
    const config = VERDICT_CONFIG.find(c => c.key === verdict);
    const color = config?.dotColor || 'bg-muted';
    const label = config?.label || 'Inconnu';

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className={cn("inline-block h-2.5 w-2.5 rounded-full shrink-0", color)} />
                </TooltipTrigger>
                <TooltipContent className="text-xs">{label}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
