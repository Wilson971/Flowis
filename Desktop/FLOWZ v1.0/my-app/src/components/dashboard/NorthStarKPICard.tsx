"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Target, TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motionTokens, styles } from "@/lib/design-system";
import { AnimatedCounter } from "./AnimatedCounter";
import { ProgressRing } from "./ProgressRing";
import { SparklineChart, generateTrendData } from "./SparklineChart";

interface NorthStarKPICardProps {
  score: number;
  analyzedProducts: number;
  previousPeriodChange?: number;
  period?: string;
  onDrillDown?: () => void;
  className?: string;
}

/**
 * NorthStarKPICard - Premium Hero KPI Card
 *
 * Displays the Global SEO Score as the primary dashboard metric.
 * Features: animated radial gauge, sparkline trend, animated counter,
 * glassmorphism effects, and premium micro-interactions.
 */
export function NorthStarKPICard({
  score,
  analyzedProducts,
  previousPeriodChange = 0,
  period = "vs mois dernier",
  onDrillDown,
  className,
}: NorthStarKPICardProps) {
  const getScoreColor = (value: number) => {
    if (value >= 80) return "text-signal-success";
    if (value >= 50) return "text-signal-warning";
    return "text-destructive";
  };

  const getScoreLabel = (value: number) => {
    if (value >= 80) return "Excellent";
    if (value >= 60) return "Bon";
    if (value >= 40) return "Moyen";
    return "Critique";
  };

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

  // Generate synthetic sparkline data
  const sparklineData = useMemo(
    () => generateTrendData(score, score - previousPeriodChange),
    [score, previousPeriodChange]
  );

  const sparklineColor = score >= 80
    ? "hsl(var(--signal-success))"
    : score >= 50
      ? "hsl(var(--primary))"
      : "hsl(var(--destructive))";

  return (
    <div
      className={cn(
        "relative overflow-hidden cursor-pointer group transition-all duration-500",
        "hover:scale-[1.005]",
        className
      )}
      onClick={onDrillDown}
      role={onDrillDown ? "button" : undefined}
      tabIndex={onDrillDown ? 0 : undefined}
      aria-label={`Score SEO Global: ${score} sur 100`}
    >
      {/* Animated ambient glow */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        aria-hidden
      >
        <div className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full blur-3xl",
          score >= 80 ? "bg-signal-success/15" :
            score >= 50 ? "bg-primary/15" :
              "bg-destructive/15"
        )} />
      </motion.div>

      {/* Content */}
      <div className="relative p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary/15 transition-colors">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <p className={cn(styles.text.labelSmall, "text-primary")}>
                Performance
              </p>
              <h3 className={styles.text.h4}>
                Score SEO
              </h3>
            </div>
          </div>

          {/* Trend badge */}
          {previousPeriodChange !== 0 && (
            <motion.div
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border",
                previousPeriodChange > 0
                  ? "bg-signal-success/10 text-signal-success border-signal-success/20"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              )}
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{
                duration: motionTokens.durations.normal,
                delay: 0.8,
                ease: motionTokens.easings.smooth,
              }}
            >
              <TrendIcon className="h-3 w-3" />
              <span className="tabular-nums">
                {previousPeriodChange > 0 ? "+" : ""}{previousPeriodChange}
              </span>
            </motion.div>
          )}
        </div>

        {/* Main content - Horizontal layout: Ring + Stats */}
        <div className="flex items-center gap-4 flex-1">
          {/* Progress Ring with Score */}
          <div className="flex flex-col items-center shrink-0">
            <ProgressRing
              value={score}
              size={80}
              strokeWidth={6}
              delay={0.3}
            >
              <AnimatedCounter
                value={score}
                delay={0.5}
                duration={1.4}
                className={cn("text-2xl font-bold tracking-tight", getScoreColor(score))}
              />
              <span className="text-[10px] text-muted-foreground font-medium">/100</span>
            </ProgressRing>

            {/* Score status badge */}
            <motion.div
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border mt-1.5",
                score >= 80
                  ? "bg-signal-success/10 text-signal-success border-signal-success/20"
                  : score >= 50
                    ? "bg-signal-warning/10 text-signal-warning border-signal-warning/20"
                    : "bg-destructive/10 text-destructive border-destructive/20"
              )}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: motionTokens.durations.normal,
                delay: 0.6,
                ease: motionTokens.easings.smooth,
              }}
            >
              {getScoreLabel(score)}
            </motion.div>
          </div>

          {/* Right side: Sparkline + Meta */}
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {/* Sparkline trend */}
            <div className="flex flex-col">
              <SparklineChart
                data={sparklineData}
                width={100}
                height={28}
                color={sparklineColor}
                id="seo-sparkline"
                delay={0.8}
              />
              <p className="text-[10px] text-muted-foreground mt-1 font-medium uppercase tracking-wider">
                Tendance 7 jours
              </p>
            </div>

            {/* Products analyzed */}
            <p className="text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <AnimatedCounter
                value={analyzedProducts}
                delay={0.7}
                className="font-bold text-foreground"
              />
              {" "}<span>produits analysés</span>
            </p>
          </div>
        </div>

        {/* CTA footer */}
        {onDrillDown && (
          <motion.div
            className="mt-2 pt-2 border-t border-border/30 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-hidden
          >
            <span className="text-[11px] text-primary font-semibold">Voir le détail</span>
            <ArrowRight className="h-3 w-3 text-primary" />
          </motion.div>
        )}
      </div>
    </div>
  );
}
