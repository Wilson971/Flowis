"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motionTokens, styles } from "@/lib/design-system";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Insight } from "@/lib/dashboard/generate-insights";

interface PerformanceInsightsProps {
  insights: Insight[];
  isLoading?: boolean;
}

const typeStyles: Record<Insight["type"], string> = {
  warning: "text-amber-500 bg-amber-500/10",
  opportunity: "text-blue-500 bg-blue-500/10",
  achievement: "text-emerald-500 bg-emerald-500/10",
};

export function PerformanceInsights({
  insights,
  isLoading = false,
}: PerformanceInsightsProps) {
  const displayed = insights.slice(0, 5);

  return (
    <div className={cn(styles.card.base, "p-6")}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className={cn(
            "flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary"
          )}
        >
          <Sparkles className="h-4 w-4" />
        </div>
        <h3 className={cn(styles.text.h4)}>Insights &amp; Recommandations</h3>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && displayed.length === 0 && (
        <p className={cn(styles.text.bodyMuted, "text-center py-6")}>
          Aucun insight pour le moment
        </p>
      )}

      {/* Insights list */}
      {!isLoading && displayed.length > 0 && (
        <motion.ul
          className="space-y-4"
          variants={motionTokens.variants.staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {displayed.map((insight) => {
            const Icon = insight.icon;
            return (
              <motion.li
                key={insight.id}
                variants={motionTokens.variants.staggerItem}
                className="flex items-start gap-3"
              >
                <div
                  className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
                    typeStyles[insight.type]
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(styles.text.label, "mb-0.5")}>
                    {insight.title}
                  </p>
                  <p className={cn(styles.text.bodyMuted, "text-sm")}>
                    {insight.description}
                  </p>
                  {insight.action && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 h-7 text-xs"
                      asChild
                    >
                      <Link href={insight.action.href}>
                        {insight.action.label}
                      </Link>
                    </Button>
                  )}
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </div>
  );
}
