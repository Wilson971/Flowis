"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Star } from "lucide-react";
import { motionTokens } from "@/lib/design-system";

interface PerformanceCardV2Props {
    totalRevenue?: number;
    totalSales?: number;
    averageRating?: number;
    reviewCount?: number;
}

export const PerformanceCardV2 = ({
    totalRevenue = 0,
    totalSales = 0,
    averageRating,
    reviewCount = 0,
}: PerformanceCardV2Props) => {
    const formatRevenue = (value: number) =>
        `${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F")} €`;

    const kpis = [
        { label: "Revenus", value: formatRevenue(totalRevenue) },
        { label: "Ventes", value: totalSales.toString() },
        ...(averageRating !== undefined
            ? [
                  { label: "Note", value: `${averageRating.toFixed(1)} ★` },
                  { label: "Avis", value: reviewCount.toString() },
              ]
            : []),
    ];

    return (
        <motion.div {...motionTokens.variants.staggerItem}>
            <div className="rounded-xl border border-border/40 bg-card relative group overflow-hidden">
                <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />
                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-3 p-6 pb-4">
                        <div className="h-10 w-10 rounded-xl bg-muted/60 ring-1 ring-border/50 flex items-center justify-center shrink-0">
                            <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                                Performance
                            </h3>
                        </div>
                    </div>

                    {/* KPI Grid */}
                    <div className="grid grid-cols-2 gap-3 p-6 pt-4">
                        {kpis.map((kpi) => (
                            <div key={kpi.label} className="space-y-1">
                                <span className="text-[11px] font-medium text-muted-foreground">
                                    {kpi.label}
                                </span>
                                <p className="text-lg font-semibold tracking-tight text-foreground tabular-nums">
                                    {kpi.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
