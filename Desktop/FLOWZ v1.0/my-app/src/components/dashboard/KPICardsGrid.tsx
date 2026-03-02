"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardContext, DashboardKPIs } from "@/types/dashboard";
import type { ActivityItem } from "@/hooks/analytics/useRecentActivity";
import { SeoScoreHeroV2 } from "./SeoScoreHeroV2";
import { GscTrafficOverviewCardV2 } from "./GscTrafficOverviewCardV2";
import { GscIndexationStatusCardV2 } from "./GscIndexationStatusCardV2";
import { GscFastOpportunitiesCard } from "./GscFastOpportunitiesCard";
import { OverviewV2 } from "./OverviewV2";
import { useSeoGlobalScore } from "@/hooks/products/useSeoGlobalScore";
import { useCatalogCoverage } from "@/hooks/dashboard/useCatalogCoverage";
import { motion, AnimatePresence } from "framer-motion";
import { motionTokens } from "@/lib/design-system";
import { LayoutDashboard, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type KPICardsGridProps = {
  kpis?: DashboardKPIs;
  context?: DashboardContext;
  activities?: ActivityItem[];
  isLoading?: boolean;
  /** Active tab derived from URL — "overview" | "seo" */
  activeTab?: "overview" | "seo";
};

/** Wrapper card uniforme — h-full pour remplir la cellule CSS grid */
const CardShell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={cn(
      "h-full border border-border/40 bg-card rounded-xl relative group transition-colors overflow-auto",
      className
    )}
  >
    <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />
    {children}
  </div>
);

export const KPICardsGrid = ({
  kpis,
  context,
  activities,
  isLoading = false,
  activeTab = "overview",
}: KPICardsGridProps) => {
  const router = useRouter();

  const storeId = context?.selectedShopId || null;

  const { data: seoData } = useSeoGlobalScore(storeId);
  const { data: coverageData } = useCatalogCoverage(storeId);

  const seoScore = seoData?.averageScore ?? 0;
  const seoScorePrevMonth = kpis?.seoScorePrevMonth ?? null;
  const previousPeriodChange =
    seoScorePrevMonth != null ? Math.round(seoScore - seoScorePrevMonth) : 0;

  const coveragePercent = coverageData?.coveragePercent ?? kpis?.catalogCoveragePercent ?? 0;

  return (
    <>
      <div className="h-full flex flex-col">

        {/* ── Nav Tab Bar — Vercel underline style ── */}
        <nav
          className="flex items-center gap-1 border-b border-border/40 shrink-0 mb-3"
          aria-label="Dashboard navigation"
        >
          <Link
            href="/app/overview"
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-px",
              "focus-visible:outline-none focus-visible:ring-0",
              activeTab === "overview"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutDashboard className={cn("h-3.5 w-3.5", activeTab === "overview" ? "text-foreground/70" : "text-muted-foreground/60")} />
            Vue d&apos;ensemble
          </Link>

          <Link
            href="/app/overview/seo"
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-px",
              "focus-visible:outline-none focus-visible:ring-0",
              activeTab === "seo"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className={cn("h-3.5 w-3.5", activeTab === "seo" ? "text-foreground/70" : "text-muted-foreground/60")} />
            SEO &amp; Trafic
          </Link>
        </nav>

        {/* ── Content ── */}
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">

            {/* ══════════════════════════════════════════════════════════
                VUE D'ENSEMBLE
            ════════════════════════════════════════════════════════════ */}
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                className="h-full"
                variants={motionTokens.variants.fadeIn}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <OverviewV2
                  kpis={kpis}
                  context={context}
                  activities={(activities || []) as ActivityItem[]}
                  seoScore={seoScore}
                  coveragePercent={coveragePercent}
                  coverageTotal={coverageData?.total ?? kpis?.aiOptimizedProducts ?? 0}
                  coverageOptimized={coverageData?.optimized ?? kpis?.aiOptimizedProducts ?? 0}
                  generatedThisMonth={coverageData?.generatedThisMonth ?? 0}
                  prevMonthOptimized={kpis?.aiOptimizedPrevMonth ?? null}
                  goal={250}
                />
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════
                SEO & TRAFIC

                ┌─────────────────────┬──────────────────────┐  row 1 — 1.4fr
                │  SeoScoreHero (2)   │  Opportunités (2)    │
                ├─────────────────────┴──────┬───────────────┤  row 2 — 1fr
                │  GscTrafficOverview (3)    │ Indexation (1) │
                └────────────────────────────┴───────────────┘
            ════════════════════════════════════════════════════════════ */}
            {activeTab === "seo" && (
              <motion.div
                key="seo"
                className="grid grid-cols-4 gap-3 h-full min-h-0"
                style={{ gridTemplateRows: "1.4fr 1fr" }}
                variants={motionTokens.variants.staggerContainer}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                {/* Row 1 — Radar score + Opportunities */}
                <motion.div variants={motionTokens.variants.staggerItem} className="col-span-2 min-h-0">
                  <CardShell>
                    <SeoScoreHeroV2
                      score={seoScore}
                      breakdown={seoData?.breakdown}
                      detailedPillars={seoData?.detailedPillars}
                      analyzedProducts={seoData?.analyzedProductsCount || 0}
                      previousPeriodChange={previousPeriodChange}
                      period="vs mois dernier"
                      onDrillDown={() => router.push("/app/seo")}
                      onViewImprovements={() => router.push("/app/products?sort=seo_score")}
                      onFixCategory={(category) =>
                        router.push(`/app/products?seo_issue=${category}`)
                      }
                    />
                  </CardShell>
                </motion.div>

                <motion.div variants={motionTokens.variants.staggerItem} className="col-span-2 min-h-0">
                  <CardShell>
                    <GscFastOpportunitiesCard />
                  </CardShell>
                </motion.div>

                {/* Row 2 — Traffic + Indexation */}
                <motion.div variants={motionTokens.variants.staggerItem} className="col-span-3 min-h-0">
                  <CardShell>
                    <GscTrafficOverviewCardV2 />
                  </CardShell>
                </motion.div>

                <motion.div variants={motionTokens.variants.staggerItem} className="col-span-1 min-h-0">
                  <CardShell>
                    <GscIndexationStatusCardV2 />
                  </CardShell>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

    </>
  );
};
