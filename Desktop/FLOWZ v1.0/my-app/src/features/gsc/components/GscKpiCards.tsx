"use client";

import { cn } from "@/lib/utils";
import { HelpCircle, Check } from "lucide-react";
import type { GscKpiSummary } from "@/lib/gsc/types";

export type MetricKey = "clicks" | "impressions" | "ctr" | "position";

interface GscKpiCardsProps {
    kpis: GscKpiSummary;
    kpisPrevious?: GscKpiSummary;
    visibleMetrics: Record<MetricKey, boolean>;
    onToggleMetric: (metric: MetricKey) => void;
}

function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(2)} k`;
    return String(n);
}

const METRIC_COLORS: Record<MetricKey, { bg: string; border: string }> = {
    clicks: { bg: "bg-[#4285f4]", border: "border-[#4285f4]" },
    impressions: { bg: "bg-[#5e35b1]", border: "border-[#5e35b1]" },
    ctr: { bg: "bg-[#00897b]", border: "border-[#00897b]" },
    position: { bg: "bg-[#e65100]", border: "border-[#e65100]" },
};

export function GscKpiCards({ kpis, visibleMetrics, onToggleMetric }: GscKpiCardsProps) {
    const cards: Array<{
        key: MetricKey;
        label: string;
        value: string;
    }> = [
            {
                key: "clicks",
                label: "Nombre total de clics",
                value: formatNumber(kpis.total_clicks),
            },
            {
                key: "impressions",
                label: "Nombre total d'im...",
                value: formatNumber(kpis.total_impressions),
            },
            {
                key: "ctr",
                label: "CTR moyen",
                value: `${(kpis.avg_ctr * 100).toFixed(1)} %`.replace('.', ','),
            },
            {
                key: "position",
                label: "Position moyenne",
                value: String(Math.round(kpis.avg_position * 10) / 10).replace('.', ','),
            },
        ];

    return (
        <div className="flex flex-col md:flex-row w-full rounded-xl overflow-hidden bg-card border border-border mt-4 mb-2">
            {cards.map((card) => {
                const colors = METRIC_COLORS[card.key];
                const isActive = visibleMetrics[card.key];

                return (
                    <div
                        key={card.key}
                        className={cn(
                            "flex-1 flex flex-col p-4 cursor-pointer relative transition-colors select-none",
                            "border-b md:border-b-0 md:border-r border-border last:border-0",
                            isActive ? colors.bg : "hover:bg-muted/30"
                        )}
                        onClick={() => onToggleMetric(card.key)}
                    >
                        {/* Top colored line if inactive to match GSC slightly (optional, but requested exact photo, so let's stick to simple) */}
                        <div className={cn("flex items-center gap-2 mb-6 text-[13px]", isActive ? "text-white" : "text-foreground")}>
                            <div
                                className={cn(
                                    "flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[2px] border transition-colors",
                                    isActive ? "border-white bg-transparent text-white" : "border-muted-foreground/50",
                                )}
                            >
                                {isActive && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                            </div>
                            <span>{card.label}</span>
                        </div>

                        <div className="flex items-end justify-between mt-auto">
                            <span className={cn(
                                "text-3xl lg:text-4xl leading-none",
                                isActive ? "text-white" : "text-foreground" // Native GSC uses dark grey for text when inactive
                            )}>
                                {card.value}
                            </span>
                            <HelpCircle className={cn(
                                "h-4 w-4 shrink-0 transition-opacity mb-1",
                                isActive ? "text-white/80" : "text-muted-foreground/60"
                            )} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
