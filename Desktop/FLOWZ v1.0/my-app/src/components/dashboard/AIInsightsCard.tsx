"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
import { DashboardKPIs } from "@/types/dashboard";
import { useAIInsights } from "@/hooks/dashboard/useAIInsights";
import { AIInsightsSheet } from "./AIInsightsSheet";

interface AIInsightsCardProps {
  kpis?: DashboardKPIs;
  seoScore?: number;
  coveragePercent?: number;
  className?: string;
}

const TYPE_STYLES: Record<string, string> = {
  positive: "text-success bg-success/6 border-success/15",
  warning: "text-warning bg-warning/6 border-warning/15",
  tip: "text-primary bg-primary/6 border-primary/15",
  neutral: "text-muted-foreground bg-muted/40 border-border/40",
};

export function AIInsightsCard({
  kpis,
  seoScore = 0,
  coveragePercent = 0,
  className,
}: AIInsightsCardProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  const { topInsights, allInsights, groupedActions, hasGeminiEnrichment } =
    useAIInsights({ kpis, seoScore, coveragePercent });

  return (
    <>
      <div className={cn("h-full flex flex-col p-4 gap-2", className)}>
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Sparkles className="h-4 w-4 text-foreground" />
              <motion.div
                className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-foreground"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <h3 className="text-sm font-semibold">Insights IA</h3>
          </div>
          {allInsights.length > 3 && (
            <button
              onClick={() => setSheetOpen(true)}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
            >
              Tout voir
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Insights — fill available space evenly */}
        <div className="flex-1 flex flex-col gap-1.5 min-h-0">
          {topInsights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <motion.div
                key={insight.id}
                className={cn(
                  "flex-1 flex items-center gap-2 px-2.5 rounded-lg border min-h-0",
                  TYPE_STYLES[insight.type]
                )}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: motionTokens.durations.normal,
                  delay: 0.3 + index * 0.08,
                  ease: motionTokens.easings.smooth,
                }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <p className="flex-1 text-[11px] font-medium leading-snug line-clamp-2">
                  {insight.text}
                  {insight.ctaLabel && insight.ctaRoute && (
                    <>
                      {" "}
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); router.push(insight.ctaRoute!); }}
                        onKeyDown={(e) => { if (e.key === "Enter") router.push(insight.ctaRoute!); }}
                        className="opacity-60 hover:opacity-100 hover:underline cursor-pointer transition-opacity"
                      >
                        {insight.ctaLabel}
                      </span>
                    </>
                  )}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AIInsightsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        allInsights={allInsights}
        groupedActions={groupedActions}
        seoScore={seoScore}
        hasGeminiEnrichment={hasGeminiEnrichment}
      />
    </>
  );
}
