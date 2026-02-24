"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { motionTokens, styles } from "@/lib/design-system";
import { DashboardKPIs } from "@/types/dashboard";

interface AIInsightsCardProps {
  kpis?: DashboardKPIs;
  seoScore?: number;
  coveragePercent?: number;
  className?: string;
}

type Insight = {
  id: string;
  text: string;
  type: "positive" | "warning" | "neutral" | "tip";
  icon: React.ElementType;
};

/**
 * AIInsightsCard - Natural language metric observations
 *
 * Generates 2-3 contextual insights from KPI data.
 * Displays with staggered typewriter-style animation.
 */
export function AIInsightsCard({
  kpis,
  seoScore = 0,
  coveragePercent = 0,
  className,
}: AIInsightsCardProps) {
  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = [];

    // SEO Score insight
    if (seoScore > 0) {
      const prevMonth = kpis?.seoScorePrevMonth;
      if (prevMonth != null && seoScore > prevMonth) {
        const delta = Math.round(seoScore - prevMonth);
        result.push({
          id: "seo-up",
          text: `Score SEO en hausse de +${delta} pts ce mois. Continuez sur cette lancée.`,
          type: "positive",
          icon: TrendingUp,
        });
      } else if (prevMonth != null && seoScore < prevMonth) {
        const delta = Math.round(prevMonth - seoScore);
        result.push({
          id: "seo-down",
          text: `Score SEO en baisse de -${delta} pts. Vérifiez vos dernières modifications.`,
          type: "warning",
          icon: TrendingDown,
        });
      } else if (seoScore >= 80) {
        result.push({
          id: "seo-excellent",
          text: `Score SEO excellent (${Math.round(seoScore)}/100). Votre catalogue est bien optimisé.`,
          type: "positive",
          icon: CheckCircle2,
        });
      } else if (seoScore < 50) {
        result.push({
          id: "seo-low",
          text: `Score SEO à ${Math.round(seoScore)}/100. Générez du contenu IA pour l'améliorer rapidement.`,
          type: "warning",
          icon: AlertTriangle,
        });
      }
    }

    // Catalog coverage insight
    if (coveragePercent > 0) {
      if (coveragePercent >= 80) {
        result.push({
          id: "coverage-high",
          text: `${coveragePercent.toFixed(0)}% du catalogue couvert par l'IA. Objectif quasi atteint.`,
          type: "positive",
          icon: CheckCircle2,
        });
      } else if (coveragePercent < 30) {
        result.push({
          id: "coverage-low",
          text: `Seulement ${coveragePercent.toFixed(0)}% du catalogue optimisé. Lancez une génération en masse.`,
          type: "tip",
          icon: Lightbulb,
        });
      } else {
        result.push({
          id: "coverage-mid",
          text: `${coveragePercent.toFixed(0)}% de couverture IA. Continuez pour atteindre 80%.`,
          type: "neutral",
          icon: TrendingUp,
        });
      }
    }

    // Blog insight
    if (kpis?.blogStats) {
      const { publishedCount, draftCount } = kpis.blogStats;
      if (draftCount > 0 && draftCount >= publishedCount) {
        result.push({
          id: "blog-drafts",
          text: `${draftCount} brouillons en attente de publication. Publiez pour booster votre SEO.`,
          type: "tip",
          icon: Lightbulb,
        });
      } else if (publishedCount > 0 && draftCount === 0) {
        result.push({
          id: "blog-clean",
          text: `${publishedCount} articles publiés, aucun brouillon en attente. Pipeline propre.`,
          type: "positive",
          icon: CheckCircle2,
        });
      }
    }

    // AI generation this month
    if (kpis) {
      const aiThisMonth = kpis.aiOptimizedProducts;
      const aiPrev = kpis.aiOptimizedPrevMonth;
      if (aiPrev != null && aiThisMonth > aiPrev) {
        const growth = Math.round(((aiThisMonth - aiPrev) / Math.max(aiPrev, 1)) * 100);
        if (growth > 10) {
          result.push({
            id: "ai-growth",
            text: `+${growth}% de produits optimisés vs le mois dernier. Forte progression.`,
            type: "positive",
            icon: TrendingUp,
          });
        }
      }
    }

    // If no insights generated, show default
    if (result.length === 0) {
      result.push({
        id: "default",
        text: "Connectez une boutique et générez du contenu pour recevoir des insights IA.",
        type: "neutral",
        icon: Lightbulb,
      });
    }

    return result.slice(0, 3);
  }, [kpis, seoScore, coveragePercent]);

  const getTypeStyles = (type: Insight["type"]) => {
    switch (type) {
      case "positive":
        return "text-signal-success bg-signal-success/8 border-signal-success/20";
      case "warning":
        return "text-signal-warning bg-signal-warning/8 border-signal-warning/20";
      case "tip":
        return "text-primary bg-primary/8 border-primary/20";
      default:
        return "text-muted-foreground bg-muted/50 border-border/50";
    }
  };

  return (
    <div className={cn("h-full flex flex-col p-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="relative">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Sparkles className="h-5 w-5" />
          </div>
          {/* Pulse indicator */}
          <motion.div
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.6, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
        <div>
          <p className={cn(styles.text.labelSmall, "text-primary")}>
            IA
          </p>
          <h3 className={styles.text.h4}>
            Insights
          </h3>
        </div>
      </div>

      {/* Insights list */}
      <div className="flex-1 space-y-1.5 overflow-hidden">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={insight.id}
              className={cn(
                "flex items-start gap-2.5 p-2 rounded-xl border transition-all duration-200",
                "hover:scale-[1.01] hover:shadow-sm",
                getTypeStyles(insight.type)
              )}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: motionTokens.durations.normal,
                delay: 0.4 + index * motionTokens.staggerDelays.slow,
                ease: motionTokens.easings.smooth,
              }}
            >
              <Icon className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">
                {insight.text}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
