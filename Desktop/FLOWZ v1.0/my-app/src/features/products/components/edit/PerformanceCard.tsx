"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TrendingUp, ShoppingCart, DollarSign, BarChart3 } from "lucide-react";

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
            color: "text-primary",
            bgColor: "bg-primary/10",
        },
        {
            label: "Ventes",
            value: totalSales.toString(),
            icon: ShoppingCart,
            color: "text-info",
            bgColor: "bg-info/10",
        },
    ];

    if (averageRating !== undefined) {
        stats.push({
            label: "Note",
            value: `${averageRating.toFixed(1)} (${reviewCount})`,
            icon: BarChart3,
            color: "text-warning",
            bgColor: "bg-warning/10",
        });
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
        >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden card-elevated">
                <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                                Analytique
                            </p>
                            <h3 className="text-sm font-extrabold tracking-tight text-foreground">
                                Performance
                            </h3>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-3">
                    <div className="grid grid-cols-2 gap-3">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 * index }}
                                    className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 border border-border/30"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-md ${stat.bgColor}`}>
                                            <Icon className={`h-3 w-3 ${stat.color}`} />
                                        </div>
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                            {stat.label}
                                        </span>
                                    </div>
                                    <span className="text-sm font-bold tracking-tight">
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
