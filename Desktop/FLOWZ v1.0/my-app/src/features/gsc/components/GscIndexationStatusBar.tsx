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
    { key: 'indexed',               label: 'Indexé',               color: 'bg-[#22c55e]',           dotColor: 'bg-[#22c55e]' },
    { key: 'not_indexed',           label: 'Non indexé',            color: 'bg-[#f59e0b]',           dotColor: 'bg-[#f59e0b]' },
    { key: 'crawled_not_indexed',   label: 'Exploré, non indexé',   color: 'bg-[#f97316]',           dotColor: 'bg-[#f97316]' },
    { key: 'discovered_not_indexed',label: 'Découvert, non indexé', color: 'bg-[#eab308]',           dotColor: 'bg-[#eab308]' },
    { key: 'noindex',               label: 'Noindex (volontaire)',  color: 'bg-[#6366f1]',           dotColor: 'bg-[#6366f1]' },
    { key: 'blocked_robots',        label: 'Bloqué robots.txt',     color: 'bg-[#8b5cf6]',           dotColor: 'bg-[#8b5cf6]' },
    { key: 'errors',                label: 'Erreur',                color: 'bg-[#ef4444]',           dotColor: 'bg-[#ef4444]' },
    { key: 'unknown',               label: 'Inconnu',               color: 'bg-[#52525b]',           dotColor: 'bg-[#52525b]' },
];

export function GscIndexationStatusBar({ overview }: GscIndexationStatusBarProps) {
    const total = overview.total || 1;
    const inspected = (overview.indexed || 0) + (overview.not_indexed || 0) + (overview.crawled_not_indexed || 0) +
        (overview.discovered_not_indexed || 0) + (overview.noindex || 0) + (overview.blocked_robots || 0) +
        (overview.errors || 0) + (overview.unknown || 0);
    const pctInspected = total > 0 ? Math.round((inspected / total) * 100) : 0;

    return (
        <div className="space-y-2">
            {/* Total counter */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                    <span className="font-semibold text-foreground">{inspected}</span> inspectées sur{" "}
                    <span className="font-semibold text-foreground">{total}</span> URLs
                </span>
                <span className={cn(
                    "font-semibold",
                    pctInspected === 100 ? "text-emerald-500" : "text-amber-500"
                )}>
                    {pctInspected}% complété
                </span>
            </div>

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
