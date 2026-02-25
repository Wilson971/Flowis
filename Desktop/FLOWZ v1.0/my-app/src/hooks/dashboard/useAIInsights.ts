"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  FileText,
  ShoppingBag,
  Search,
} from "lucide-react";
import { DashboardKPIs } from "@/types/dashboard";

// ============================================================================
// TYPES
// ============================================================================

export type InsightPriority = "critical" | "important" | "nice-to-have";
export type InsightType = "positive" | "warning" | "neutral" | "tip";

export type Insight = {
  id: string;
  text: string;
  type: InsightType;
  icon: React.ElementType;
  priority: InsightPriority;
  /** CTA label for inline link */
  ctaLabel?: string;
  /** Route to navigate on CTA click */
  ctaRoute?: string;
};

// Priority ordering for sorting
const PRIORITY_ORDER: Record<InsightPriority, number> = {
  critical: 0,
  important: 1,
  "nice-to-have": 2,
};

// ============================================================================
// LOCAL HEURISTIC ENGINE
// ============================================================================

function generateLocalInsights(
  kpis: DashboardKPIs | undefined,
  seoScore: number,
  coveragePercent: number
): Insight[] {
  const result: Insight[] = [];

  // --- SEO Score insights ---
  if (seoScore > 0) {
    const prevMonth = kpis?.seoScorePrevMonth;

    if (prevMonth != null && seoScore > prevMonth) {
      const delta = Math.round(seoScore - prevMonth);
      result.push({
        id: "seo-up",
        text: `Score SEO en hausse de +${delta} pts ce mois.`,
        type: "positive",
        icon: TrendingUp,
        priority: "nice-to-have",
        ctaLabel: "Voir le détail →",
        ctaRoute: "/app/seo",
      });
    } else if (prevMonth != null && seoScore < prevMonth) {
      const delta = Math.round(prevMonth - seoScore);
      result.push({
        id: "seo-down",
        text: `Score SEO en baisse de -${delta} pts. Vérifiez les modifications récentes.`,
        type: "warning",
        icon: TrendingDown,
        priority: "important",
        ctaLabel: "Diagnostiquer →",
        ctaRoute: "/app/products?sort=seo_score",
      });
    } else if (seoScore >= 80) {
      result.push({
        id: "seo-excellent",
        text: `Score SEO excellent (${Math.round(seoScore)}/100). Catalogue bien optimisé.`,
        type: "positive",
        icon: CheckCircle2,
        priority: "nice-to-have",
      });
    } else if (seoScore < 40) {
      result.push({
        id: "seo-critical",
        text: `Score SEO critique (${Math.round(seoScore)}/100). Optimisez vos fiches produits.`,
        type: "warning",
        icon: AlertTriangle,
        priority: "critical",
        ctaLabel: "Optimiser maintenant →",
        ctaRoute: "/app/products?sort=seo_score",
      });
    } else if (seoScore < 60) {
      result.push({
        id: "seo-low",
        text: `Score SEO à ${Math.round(seoScore)}/100. Générez du contenu IA pour l'améliorer.`,
        type: "warning",
        icon: AlertTriangle,
        priority: "important",
        ctaLabel: "Générer du contenu →",
        ctaRoute: "/app/products",
      });
    }
  }

  // --- Catalog coverage ---
  if (coveragePercent > 0) {
    if (coveragePercent >= 95) {
      result.push({
        id: "coverage-complete",
        text: `${coveragePercent.toFixed(0)}% du catalogue couvert par l'IA. Objectif atteint !`,
        type: "positive",
        icon: CheckCircle2,
        priority: "nice-to-have",
      });
    } else if (coveragePercent >= 80) {
      result.push({
        id: "coverage-high",
        text: `${coveragePercent.toFixed(0)}% du catalogue couvert. Finissez les derniers produits.`,
        type: "positive",
        icon: CheckCircle2,
        priority: "nice-to-have",
        ctaLabel: "Voir les restants →",
        ctaRoute: "/app/products?filter=no_ai",
      });
    } else if (coveragePercent < 30) {
      result.push({
        id: "coverage-low",
        text: `Seulement ${coveragePercent.toFixed(0)}% du catalogue optimisé. Lancez une génération en masse.`,
        type: "tip",
        icon: Lightbulb,
        priority: "critical",
        ctaLabel: "Lancer le batch →",
        ctaRoute: "/app/products",
      });
    } else {
      result.push({
        id: "coverage-mid",
        text: `${coveragePercent.toFixed(0)}% de couverture IA. Continuez pour atteindre 80%.`,
        type: "neutral",
        icon: TrendingUp,
        priority: "important",
        ctaLabel: "Continuer →",
        ctaRoute: "/app/products",
      });
    }
  }

  // --- Blog insights ---
  if (kpis?.blogStats) {
    const { publishedCount, draftCount } = kpis.blogStats;
    if (draftCount > 5) {
      result.push({
        id: "blog-many-drafts",
        text: `${draftCount} brouillons en attente. Publiez pour booster votre SEO.`,
        type: "tip",
        icon: FileText,
        priority: "important",
        ctaLabel: "Voir les brouillons →",
        ctaRoute: "/app/blog?status=draft",
      });
    } else if (draftCount > 0) {
      result.push({
        id: "blog-drafts",
        text: `${draftCount} brouillon${draftCount > 1 ? "s" : ""} en attente de publication.`,
        type: "tip",
        icon: Lightbulb,
        priority: "nice-to-have",
        ctaLabel: "Publier →",
        ctaRoute: "/app/blog?status=draft",
      });
    } else if (publishedCount > 0 && draftCount === 0) {
      result.push({
        id: "blog-clean",
        text: `${publishedCount} articles publiés, pipeline propre.`,
        type: "positive",
        icon: CheckCircle2,
        priority: "nice-to-have",
      });
    }
  }

  // --- AI generation growth ---
  if (kpis) {
    const aiThisMonth = kpis.aiOptimizedProducts;
    const aiPrev = kpis.aiOptimizedPrevMonth;
    if (aiPrev != null && aiThisMonth > aiPrev) {
      const growth = Math.round(
        ((aiThisMonth - aiPrev) / Math.max(aiPrev, 1)) * 100
      );
      if (growth > 10) {
        result.push({
          id: "ai-growth",
          text: `+${growth}% de produits optimisés vs le mois dernier. Forte progression.`,
          type: "positive",
          icon: TrendingUp,
          priority: "nice-to-have",
        });
      }
    }
  }

  // --- SEO Health breakdown ---
  if (kpis?.seoHealth) {
    const { criticalCount } = kpis.seoHealth;
    if (criticalCount > 0) {
      result.push({
        id: "seo-critical-products",
        text: `${criticalCount} produit${criticalCount > 1 ? "s" : ""} avec un score SEO critique (<40).`,
        type: "warning",
        icon: Search,
        priority: "critical",
        ctaLabel: "Voir les produits →",
        ctaRoute: "/app/products?seo_issue=critical",
      });
    }
  }

  // --- Default insight ---
  if (result.length === 0) {
    result.push({
      id: "default",
      text: "Connectez une boutique et générez du contenu pour recevoir des insights IA.",
      type: "neutral",
      icon: Lightbulb,
      priority: "nice-to-have",
    });
  }

  // Sort by priority
  result.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  return result;
}

// ============================================================================
// GEMINI ENRICHMENT (lazy)
// ============================================================================

async function fetchGeminiInsights(
  kpis: DashboardKPIs,
  seoScore: number,
  coveragePercent: number
): Promise<Insight[]> {
  const res = await fetch("/api/insights/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kpis, seoScore, coveragePercent }),
  });

  if (!res.ok) return [];

  const data = await res.json();
  return (data.insights ?? []).map((i: {
    id: string;
    text: string;
    type: InsightType;
    priority: InsightPriority;
    ctaLabel?: string;
    ctaRoute?: string;
  }) => ({
    ...i,
    icon: getIconForType(i.type),
  }));
}

function getIconForType(type: InsightType) {
  switch (type) {
    case "positive": return CheckCircle2;
    case "warning": return AlertTriangle;
    case "tip": return Lightbulb;
    default: return ShoppingBag;
  }
}

// ============================================================================
// HOOK
// ============================================================================

interface UseAIInsightsOptions {
  kpis?: DashboardKPIs;
  seoScore: number;
  coveragePercent: number;
}

export function useAIInsights({ kpis, seoScore, coveragePercent }: UseAIInsightsOptions) {
  // Immediate local insights
  const localInsights = useMemo(
    () => generateLocalInsights(kpis, seoScore, coveragePercent),
    [kpis, seoScore, coveragePercent]
  );

  // Lazy Gemini enrichment
  const { data: geminiInsights } = useQuery({
    queryKey: ["ai-insights-gemini", seoScore, coveragePercent, kpis?.blogStats?.draftCount],
    queryFn: () => fetchGeminiInsights(kpis!, seoScore, coveragePercent),
    enabled: !!kpis && seoScore > 0,
    staleTime: 5 * 60_000, // 5 min cache
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Merge: local first, then Gemini (deduped by id)
  const allInsights = useMemo(() => {
    if (!geminiInsights?.length) return localInsights;

    const localIds = new Set(localInsights.map((i) => i.id));
    const enriched = geminiInsights.filter((i) => !localIds.has(i.id));
    const merged = [...localInsights, ...enriched];
    merged.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    return merged;
  }, [localInsights, geminiInsights]);

  return {
    /** Top 3 for card display */
    topInsights: allInsights.slice(0, 3),
    /** All insights for sheet */
    allInsights,
    /** Grouped by priority for actions section */
    groupedActions: {
      critical: allInsights.filter((i) => i.priority === "critical" && i.ctaRoute),
      important: allInsights.filter((i) => i.priority === "important" && i.ctaRoute),
      niceToHave: allInsights.filter((i) => i.priority === "nice-to-have" && i.ctaRoute),
    },
    hasGeminiEnrichment: !!geminiInsights?.length,
  };
}
