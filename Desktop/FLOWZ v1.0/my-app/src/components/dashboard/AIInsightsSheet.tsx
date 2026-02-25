"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { styles, motionTokens } from "@/lib/design-system";
import { SeoScoreRing } from "./SeoScoreRing";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import type { Insight, InsightPriority } from "@/hooks/dashboard/useAIInsights";

interface AIInsightsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allInsights: Insight[];
  groupedActions: {
    critical: Insight[];
    important: Insight[];
    niceToHave: Insight[];
  };
  seoScore: number;
  hasGeminiEnrichment: boolean;
}

const PRIORITY_CONFIG: Record<
  InsightPriority,
  { label: string; icon: React.ElementType; color: string }
> = {
  critical: { label: "Critique", icon: AlertCircle, color: "text-destructive" },
  important: { label: "Important", icon: Zap, color: "text-warning" },
  "nice-to-have": { label: "Suggestion", icon: Info, color: "text-muted-foreground" },
};

const TYPE_STYLES: Record<string, string> = {
  positive: "text-success bg-success/8 border-success/20",
  warning: "text-warning bg-warning/8 border-warning/20",
  tip: "text-primary bg-primary/8 border-primary/20",
  neutral: "text-muted-foreground bg-muted/50 border-border/50",
};

export function AIInsightsSheet({
  open,
  onOpenChange,
  allInsights,
  groupedActions,
  seoScore,
  hasGeminiEnrichment,
}: AIInsightsSheetProps) {
  const router = useRouter();

  const handleNavigate = (route: string) => {
    onOpenChange(false);
    router.push(route);
  };

  const actionGroups = [
    { key: "critical" as const, insights: groupedActions.critical },
    { key: "important" as const, insights: groupedActions.important },
    { key: "nice-to-have" as const, insights: groupedActions.niceToHave },
  ].filter((g) => g.insights.length > 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto">
        <SheetHeader className="pb-4">
          {/* Header with ring */}
          <div className="flex items-center gap-4">
            <SeoScoreRing score={seoScore} size={56} strokeWidth={5} />
            <div>
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Insights IA
              </SheetTitle>
              <p className={styles.text.bodySmall}>
                {allInsights.length} insight{allInsights.length > 1 ? "s" : ""} détecté{allInsights.length > 1 ? "s" : ""}
                {hasGeminiEnrichment && (
                  <span className="ml-1 text-primary">• enrichi par Gemini</span>
                )}
              </p>
            </div>
          </div>
        </SheetHeader>

        <Separator className="mb-4" />

        {/* All insights */}
        <div className="space-y-2 mb-6">
          <h4 className={cn(styles.text.labelSmall, "mb-2")}>Tous les insights</h4>
          <motion.div
            className="space-y-2"
            variants={motionTokens.variants.staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {allInsights.map((insight) => {
              const Icon = insight.icon;
              return (
                <motion.div
                  key={insight.id}
                  variants={motionTokens.variants.staggerItem}
                  className={cn(
                    "flex items-start gap-2.5 p-3 rounded-xl border",
                    TYPE_STYLES[insight.type]
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-relaxed">
                      {insight.text}
                    </p>
                    {insight.ctaLabel && insight.ctaRoute && (
                      <button
                        onClick={() => handleNavigate(insight.ctaRoute!)}
                        className="text-xs font-semibold mt-1 hover:underline inline-flex items-center gap-1 transition-opacity hover:opacity-80"
                      >
                        {insight.ctaLabel}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Actions recommandées groupées par priorité */}
        {actionGroups.length > 0 && (
          <>
            <Separator className="mb-4" />
            <h4 className={cn(styles.text.labelSmall, "mb-3")}>
              Actions recommandées
            </h4>
            <div className="space-y-4">
              {actionGroups.map(({ key, insights }) => {
                const config = PRIORITY_CONFIG[key];
                const PriorityIcon = config.icon;
                return (
                  <div key={key}>
                    <div className={cn("flex items-center gap-1.5 mb-2", config.color)}>
                      <PriorityIcon className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {config.label}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {insights.map((insight) => (
                        <button
                          key={insight.id}
                          onClick={() => handleNavigate(insight.ctaRoute!)}
                          className={cn(
                            "w-full flex items-center justify-between p-2.5 rounded-lg",
                            "bg-muted/50 hover:bg-muted transition-colors text-left group"
                          )}
                        >
                          <span className="text-xs font-medium text-foreground line-clamp-1 flex-1">
                            {insight.text}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground shrink-0 ml-2 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
