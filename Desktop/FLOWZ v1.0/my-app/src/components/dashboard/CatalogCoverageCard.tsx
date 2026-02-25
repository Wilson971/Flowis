"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Target,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motionTokens, styles } from "@/lib/design-system";
import { AnimatedCounter } from "./AnimatedCounter";
import { DonutChart, type DonutSegment } from "./DonutChart";
import { Button } from "@/components/ui/button";

interface CatalogCoverageCardProps {
  total: number;
  optimized: number;
  partial?: number;
  coveragePercent: number;
  generatedThisMonth: number;
  prevMonthOptimized?: number | null;
  goal?: number | null;
  isLoading?: boolean;
  onBatchOptimize?: () => void;
}

/**
 * CatalogCoverageCard v2 — Premium glassmorphism donut + breakdown
 *
 * 2-column layout: donut left, breakdown + goal + prediction right.
 * Bottom bar: prediction + CTA.
 */
export function CatalogCoverageCard({
  total,
  optimized,
  partial = 0,
  coveragePercent,
  generatedThisMonth,
  prevMonthOptimized = null,
  goal = null,
  isLoading = false,
  onBatchOptimize,
}: CatalogCoverageCardProps) {
  const router = useRouter();

  const untreated = Math.max(0, total - optimized - partial);

  // Trend calculation
  const hasTrend = prevMonthOptimized != null && prevMonthOptimized > 0;
  const trendDelta = hasTrend ? optimized - prevMonthOptimized! : 0;
  const trendPercent =
    hasTrend && prevMonthOptimized! > 0
      ? Math.round((trendDelta / prevMonthOptimized!) * 100)
      : 0;

  const TrendIcon =
    trendDelta > 0 ? TrendingUp : trendDelta < 0 ? TrendingDown : Minus;
  const trendColor =
    trendDelta > 0
      ? "text-signal-success"
      : trendDelta < 0
        ? "text-destructive"
        : "text-muted-foreground";

  // Goal progress
  const effectiveGoal = goal ?? Math.max(total, optimized);
  const goalPercent =
    effectiveGoal > 0 ? Math.min(100, Math.round((optimized / effectiveGoal) * 100)) : 0;

  // Prediction: days to 100% based on this month's velocity
  const daysToComplete = useMemo(() => {
    if (untreated <= 0) return 0;
    if (generatedThisMonth <= 0) return null; // no velocity data

    const now = new Date();
    const dayOfMonth = now.getDate();
    const dailyRate = generatedThisMonth / dayOfMonth;
    if (dailyRate <= 0) return null;

    return Math.ceil(untreated / dailyRate);
  }, [untreated, generatedThisMonth]);

  // Donut segments
  const segments: DonutSegment[] = useMemo(
    () => [
      {
        label: "Optimisé",
        value: optimized,
        color: "hsl(var(--signal-success))",
        glowColor: "hsl(var(--signal-success))",
      },
      {
        label: "Partiel",
        value: partial,
        color: "hsl(var(--primary))",
        glowColor: "hsl(var(--primary))",
      },
      {
        label: "Non traité",
        value: untreated,
        color: "hsl(var(--muted-foreground))",
      },
    ],
    [optimized, partial, untreated]
  );

  // Legend items (filter out 0-value)
  const legendItems = segments.filter((s) => s.value > 0 || s.label === "Non traité");

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse h-full">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-5 w-32 bg-muted rounded" />
          </div>
        </div>
        <div className="flex gap-6">
          <div className="h-28 w-28 rounded-full bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-4 w-1/2 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full group">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:text-foreground transition-all duration-300 border border-border">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className={styles.text.labelSmall}>Catalogue IA</p>
            <h3 className={styles.text.h4}>Couverture</h3>
          </div>
        </div>

        {/* Trend badge */}
        {hasTrend && (
          <motion.div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold",
              trendDelta > 0
                ? "bg-signal-success/10 text-signal-success"
                : trendDelta < 0
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-muted-foreground"
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, ...motionTokens.transitions.default }}
          >
            <TrendIcon className="h-3 w-3" />
            {trendPercent > 0 ? "+" : ""}
            {trendPercent}% vs M-1
          </motion.div>
        )}
      </div>

      {/* ── Main content: Donut + Breakdown ── */}
      <div className="flex items-center gap-4 flex-1 min-h-0">
        {/* Donut */}
        <div className="shrink-0">
          <DonutChart segments={segments} size={110} strokeWidth={10} delay={0.3}>
            <AnimatedCounter
              value={coveragePercent}
              delay={0.5}
              format="integer"
              suffix="%"
              className="text-lg"
            />
            <span className="text-[10px] text-muted-foreground">couverture</span>
          </DonutChart>

          {/* Product count below donut */}
          <div className="text-center mt-1">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {optimized.toLocaleString("fr-FR")}
              </span>
              {" / "}
              {total.toLocaleString("fr-FR")} produits
            </p>
          </div>
        </div>

        {/* Right side: Legend + Goal */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Breakdown legend */}
          <div className="space-y-2">
            {legendItems.map((item, i) => {
              const pct =
                total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <motion.div
                  key={item.label}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.5 + i * 0.1,
                    ...motionTokens.transitions.default,
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-card"
                    style={{
                      backgroundColor: item.color,
                      ringColor: item.color,
                    }}
                  />
                  <span className="text-xs text-muted-foreground truncate">
                    {item.label}
                  </span>
                  <span className="text-xs font-semibold text-foreground tabular-nums ml-auto">
                    {item.value.toLocaleString("fr-FR")}
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
                    {pct}%
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Goal progress bar */}
          {goal && goal > 0 && (
            <motion.div
              className="space-y-1"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, ...motionTokens.transitions.default }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Target className="h-3 w-3" />
                  <span>
                    Objectif : {goal.toLocaleString("fr-FR")}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-foreground tabular-nums">
                  {goalPercent}%
                </span>
              </div>
              <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                  initial={{ width: 0 }}
                  animate={{ width: `${goalPercent}%` }}
                  transition={{
                    duration: 1,
                    delay: 0.9,
                    ease: motionTokens.easings.smooth,
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Generated this month tile */}
          <motion.div
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/50"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, ...motionTokens.transitions.default }}
          >
            <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
            <AnimatedCounter
              value={generatedThisMonth}
              delay={0.8}
              className="text-sm text-foreground"
            />
            <span className="text-[10px] text-muted-foreground">
              générés ce mois
            </span>
          </motion.div>
        </div>
      </div>

      {/* ── Bottom bar: Prediction + CTA ── */}
      <motion.div
        className="flex items-center justify-between mt-3 pt-3 border-t border-border/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, ...motionTokens.transitions.default }}
      >
        {/* Prediction */}
        <div className="text-xs text-muted-foreground">
          {untreated === 0 ? (
            <span className="text-signal-success font-medium">
              ✓ Catalogue 100% optimisé
            </span>
          ) : daysToComplete != null ? (
            <>
              <span className="text-foreground font-medium">~{daysToComplete}j</span>{" "}
              pour 100%
            </>
          ) : (
            <span>
              {untreated} produit{untreated > 1 ? "s" : ""} restant{untreated > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* CTA */}
        {untreated > 0 && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
              onClick={() => router.push("/app/products?filter=unoptimized")}
            >
              Voir
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-7 text-xs px-3"
              onClick={onBatchOptimize}
            >
              <Zap className="h-3 w-3 mr-1" />
              Optimiser {untreated}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
