"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Hash, MousePointerClick, Crosshair, Zap } from "lucide-react";
import type { GscKeywordsAggregates } from "@/lib/gsc/types";

interface Props {
    aggregates: GscKeywordsAggregates;
    totalKeywords: number;
}

function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
}

const CARDS = [
    {
        key: "total",
        label: "Mots-cles",
        icon: Hash,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        getValue: (a: GscKeywordsAggregates, total: number) => formatNumber(total),
    },
    {
        key: "clicks",
        label: "Clics totaux",
        icon: MousePointerClick,
        color: "text-violet-500",
        bg: "bg-violet-500/10",
        getValue: (a: GscKeywordsAggregates) => formatNumber(a.total_clicks),
    },
    {
        key: "position",
        label: "Position moy.",
        icon: Crosshair,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        getValue: (a: GscKeywordsAggregates) => String(a.avg_position),
    },
    {
        key: "quickwins",
        label: "Quick Wins",
        icon: Zap,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        getValue: (a: GscKeywordsAggregates) => String(a.quick_wins_count),
    },
] as const;

export function KeywordsKpiCards({ aggregates, totalKeywords }: Props) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CARDS.map((card) => (
                <Card key={card.key} className="border-border/40">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                {card.label}
                            </span>
                            <div className={cn("p-1.5 rounded-lg", card.bg)}>
                                <card.icon className={cn("h-3.5 w-3.5", card.color)} />
                            </div>
                        </div>
                        <span className="text-2xl font-bold tabular-nums">
                            {card.getValue(aggregates, totalKeywords)}
                        </span>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
