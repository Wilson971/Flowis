"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TrendingUp, ShoppingCart, DollarSign, BarChart3 } from "lucide-react";
import { motionTokens } from "@/lib/design-system";
import { cn } from "@/lib/utils";

interface PerformanceCardProps {
    totalRevenue?: number;
    totalSales?: number;
    averageRating?: number;
    reviewCount?: number;
}

/**
 * PerformanceCard
 *
 * Carte affichant les statistiques de performance du produit.
 * Revenus, ventes totales, note moyenne.
 */
export const PerformanceCard = ({
    totalRevenue = 0,
    totalSales = 0,
    averageRating,
    reviewCount = 0,
}: PerformanceCardProps) => {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const stats = [
        {
            label: "Revenus",
            value: formatCurrency(totalRevenue),
            icon: DollarSign,
        },
        {
            label: "Ventes",
            value: totalSales.toString(),
            icon: ShoppingCart,
        },
    ];

    if (averageRating !== undefined) {
        stats.push({
            label: "Note",
            value: `${averageRating.toFixed(1)} (${reviewCount})`,
            icon: BarChart3,
        });
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={motionTokens.transitions.fast}
        >
            <Card className="rounded-xl border border-border/40 bg-card relative group overflow-hidden">
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />

                <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
                            <TrendingUp className="h-[18px] w-[18px] text-foreground/70" />
                        </div>
                        <div>
                            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-0.5">
                                Analytique
                            </p>
                            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                                Performance
                            </h3>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-3 relative z-10">
                    <div className="grid grid-cols-2 gap-3">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={motionTokens.transitions.fast}
                                    className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 border border-border/30"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-muted/60">
                                            <Icon className="h-3 w-3 text-foreground/70" />
                                        </div>
                                        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                                            {stat.label}
                                        </span>
                                    </div>
                                    <span className="text-sm font-semibold tracking-tight tabular-nums">
                                        {stat.value}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};
