"use client";

import { motion } from "framer-motion";
import { Target, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

interface NorthStarKPICardProps {
    /** Score SEO global (0-100) */
    score: number;
    /** Nombre de produits analysés */
    analyzedProducts: number;
    /** Variation par rapport au mois précédent (en points) */
    previousPeriodChange?: number;
    /** Période affichée */
    period?: string;
    /** Callback au clic pour drill-down */
    onDrillDown?: () => void;
    /** Classes CSS additionnelles */
    className?: string;
}

/**
 * NorthStarKPICard - Carte KPI "Étoile du Nord"
 * 
 * Affiche le Score SEO Global comme métrique principale du dashboard.
 * Design "hero" avec jauge circulaire animée.
 */
export function NorthStarKPICard({
    score,
    analyzedProducts,
    previousPeriodChange = 0,
    period = "ce mois",
    onDrillDown,
    className,
}: NorthStarKPICardProps) {
    // Calcul de la couleur basée sur le score
    const getScoreColor = (value: number) => {
        if (value >= 80) return "text-signal-success";
        if (value >= 50) return "text-signal-warning";
        return "text-destructive";
    };

    const getScoreBgColor = (value: number) => {
        if (value >= 80) return "from-signal-success/20 to-signal-success/5";
        if (value >= 50) return "from-signal-warning/20 to-signal-warning/5";
        return "from-destructive/20 to-destructive/5";
    };

    const getScoreLabel = (value: number) => {
        if (value >= 80) return "Excellent";
        if (value >= 60) return "Bon";
        if (value >= 40) return "À améliorer";
        return "Critique";
    };

    // Calcul du pourcentage pour le cercle SVG
    const circumference = 2 * Math.PI * 45; // rayon = 45
    const strokeDashoffset = circumference - (score / 100) * circumference;

    // Icône et couleur pour le changement
    const TrendIcon = previousPeriodChange > 0
        ? TrendingUp
        : previousPeriodChange < 0
            ? TrendingDown
            : Minus;

    const trendColor = previousPeriodChange > 0
        ? "text-signal-success"
        : previousPeriodChange < 0
            ? "text-destructive"
            : "text-muted-foreground";

    return (
        <div
            className={cn(
                "relative overflow-hidden cursor-pointer group transition-all duration-300",
                "hover:shadow-lg",
                className
            )}
            onClick={onDrillDown}
            role={onDrillDown ? "button" : undefined}
            tabIndex={onDrillDown ? 0 : undefined}
        >
            {/* Gradient background overlay */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-50",
                getScoreBgColor(score)
            )} />

            {/* Sparkle decorations */}
            <div className="absolute top-3 right-3 opacity-20">
                <Sparkles className="h-6 w-6 text-primary" />
            </div>

            {/* Content */}
            <div className="relative p-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:text-foreground transition-colors border border-border">
                        <Target className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                            Performance
                        </p>
                        <h3 className="text-xl font-bold tracking-tight text-foreground">Score SEO Global</h3>
                    </div>
                </div>

                {/* Main content - Score with circular gauge */}
                <div className="flex items-center justify-between">
                    {/* Circular gauge */}
                    <div className="relative">
                        <svg width="100" height="100" className="-rotate-90">
                            {/* Background circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                className="text-muted/30"
                            />
                            {/* Progress circle */}
                            <motion.circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeLinecap="round"
                                className={getScoreColor(score)}
                                strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset }}
                                transition={{
                                    duration: motionTokens.durations.slow * 3,
                                    ease: motionTokens.easings.smooth,
                                    delay: motionTokens.durations.normal,
                                }}
                            />
                        </svg>

                        {/* Score value in center */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.span
                                className={cn(
                                    "text-2xl font-bold font-heading tabular-nums",
                                    getScoreColor(score)
                                )}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    duration: motionTokens.durations.slow,
                                    delay: motionTokens.durations.slow,
                                    ease: motionTokens.easings.smooth,
                                }}
                            >
                                {score}
                            </motion.span>
                            <span className="text-[10px] text-muted-foreground">/100</span>
                        </div>
                    </div>

                    {/* Right side stats */}
                    <div className="flex-1 pl-4 space-y-2">
                        {/* Status label */}
                        <div className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                            score >= 80 ? "bg-signal-success/10 text-signal-success" :
                                score >= 50 ? "bg-signal-warning/10 text-signal-warning" :
                                    "bg-destructive/10 text-destructive"
                        )}>
                            {getScoreLabel(score)}
                        </div>

                        {/* Trend indicator */}
                        {previousPeriodChange !== 0 && (
                            <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
                                <TrendIcon className="h-3 w-3" />
                                <span className="font-medium">
                                    {previousPeriodChange > 0 ? "+" : ""}{previousPeriodChange} pts
                                </span>
                                <span className="text-muted-foreground">{period}</span>
                            </div>
                        )}

                        {/* Products analyzed */}
                        <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground tabular-nums">
                                {analyzedProducts.toLocaleString('fr-FR')}
                            </span>{" "}
                            produits analysés
                        </p>
                    </div>
                </div>

                {/* CTA hint on hover */}
                {onDrillDown && (
                    <div className="mt-3 pt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-primary font-medium text-center">
                            Cliquez pour voir le détail →
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
