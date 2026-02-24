"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motionTokens, styles } from "@/lib/design-system";
import { AnimatedCounter } from "./AnimatedCounter";
import { ProgressRing } from "./ProgressRing";
import { SparklineChart, generateTrendData } from "./SparklineChart";

interface CatalogCoverageCardProps {
  total: number;
  optimized: number;
  coveragePercent: number;
  generatedThisMonth: number;
  prevMonthOptimized?: number | null;
  isLoading?: boolean;
}

/**
 * CatalogCoverageCard - Premium AI catalog coverage
 *
 * Compact vertical layout with radial progress ring,
 * animated counters, sparkline trend, and metric tiles.
 */
export function CatalogCoverageCard({
  total,
  optimized,
  coveragePercent,
  generatedThisMonth,
  prevMonthOptimized = null,
  isLoading = false,
}: CatalogCoverageCardProps) {
  const hasTrend = prevMonthOptimized != null && prevMonthOptimized > 0;
  const trendDelta = hasTrend ? optimized - prevMonthOptimized! : 0;
  const trendPercent = hasTrend && prevMonthOptimized! > 0
    ? Math.round((trendDelta / prevMonthOptimized!) * 100)
    : 0;

  const TrendIcon = trendDelta > 0 ? TrendingUp : trendDelta < 0 ? TrendingDown : Minus;
  const trendColor = trendDelta > 0
    ? "text-signal-success"
    : trendDelta < 0
      ? "text-destructive"
      : "text-muted-foreground";

  // Sparkline data
  const sparklineData = useMemo(
    () => generateTrendData(optimized, prevMonthOptimized),
    [optimized, prevMonthOptimized]
  );

  const progressColor = coveragePercent >= 80
    ? "hsl(var(--signal-success))"
    : coveragePercent >= 50
      ? "hsl(var(--primary))"
      : "hsl(var(--signal-warning))";

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-5 w-24 bg-muted rounded" />
          </div>
        </div>
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full group">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:text-primary group-hover:bg-primary/10 transition-all duration-300 border border-border">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className={cn(styles.text.labelSmall, "text-primary")}>
            Catalogue IA
          </p>
          <h3 className={styles.text.h4}>
            Couverture
          </h3>
        </div>
      </div>

      {/* Ring + Counter */}
      <div className="flex items-center gap-3 mb-1">
        <ProgressRing
          value={coveragePercent}
          size={64}
          strokeWidth={5}
          delay={0.4}
        >
          <AnimatedCounter
            value={coveragePercent}
            delay={0.6}
            format="integer"
            suffix="%"
            className="text-xs"
          />
        </ProgressRing>

        <div className="flex-1">
          <p className="text-xs text-muted-foreground">
            <AnimatedCounter
              value={optimized}
              delay={0.5}
              className="font-semibold text-foreground text-sm"
            />
            {" "}/ {total.toLocaleString("fr-FR")} produits
          </p>

          {/* Sparkline */}
          <SparklineChart
            data={sparklineData}
            width={120}
            height={24}
            color={progressColor}
            id="coverage-sparkline"
            delay={0.7}
            className="mt-1"
          />
        </div>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 gap-2 mt-auto">
        <div className="p-2 rounded-xl bg-muted/40 border border-border/50 text-center">
          <div className="flex items-center gap-1 justify-center mb-0.5">
            <Zap className="h-3 w-3 text-primary" />
            <AnimatedCounter
              value={generatedThisMonth}
              delay={0.7}
              className="text-sm text-foreground"
            />
          </div>
          <p className={styles.text.labelSmall}>
            Ce mois
          </p>
        </div>

        {hasTrend && (
          <div className="p-2 rounded-xl bg-muted/40 border border-border/50 text-center">
            <div className={cn("flex items-center gap-1 justify-center mb-0.5", trendColor)}>
              <TrendIcon className="h-3 w-3" />
              <span className="text-sm font-bold tabular-nums">
                {trendPercent > 0 ? "+" : ""}{trendPercent}%
              </span>
            </div>
            <p className={styles.text.labelSmall}>
              vs M-1
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
