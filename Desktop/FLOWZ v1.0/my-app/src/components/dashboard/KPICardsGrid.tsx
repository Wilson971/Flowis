"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardContext, DashboardKPIs } from "@/types/dashboard";
import { GenerateSelectionModal } from "./GenerateSelectionModal";
import { QuickActionsCard } from "./QuickActionsCard";
import { ConnectionHealthCard } from "./ConnectionHealthCard";
import { BlogContentCard } from "./BlogContentCard";
import { CatalogCoverageCard } from "./CatalogCoverageCard";
import { ActivityTimeline, ActivityItem } from "./ActivityTimeline";
import { NorthStarKPICard } from "./NorthStarKPICard";
import { AIInsightsCard } from "./AIInsightsCard";
import { GscTrafficOverviewCard } from "./GscTrafficOverviewCard";
import { GscIndexationStatusCard } from "./GscIndexationStatusCard";
import { GscFastOpportunitiesCard } from "./GscFastOpportunitiesCard";
import { useSeoGlobalScore } from "@/hooks/products/useSeoGlobalScore";
import { useCatalogCoverage } from "@/hooks/dashboard/useCatalogCoverage";
import { useStoreHeartbeat } from "@/hooks/stores/useStoreHeartbeat";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/design-system";

type KPICardsGridProps = {
  kpis?: DashboardKPIs;
  context?: DashboardContext;
  activities?: ActivityItem[];
  isLoading?: boolean;
};

/**
 * KPICardsGrid - Premium Bento Dashboard Layout
 *
 * Asymmetric 3-column bento grid with clear visual hierarchy:
 * - Row 1 (Hero): SEO Score (span 2) + AI Insights
 * - Row 2 (Traffic): GSC Traffic Overview (span 2) + Indexation Status
 * - Row 3 (Metrics): Store Health + Catalog Coverage + Blog Content
 * - Row 4 (Actions/Perf): Fast Opportunities + Quick Actions + Activity Timeline
 */
export const KPICardsGrid = ({
  kpis,
  context,
  activities,
  isLoading = false,
}: KPICardsGridProps) => {
  const router = useRouter();
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const storeId = context?.selectedShopId || null;

  // Data hooks
  const { data: seoData } = useSeoGlobalScore(storeId);
  const { data: coverageData, isLoading: coverageLoading } = useCatalogCoverage(storeId);
  const heartbeat = useStoreHeartbeat();

  const handleTestConnection = () => {
    heartbeat.mutate(storeId ?? undefined);
  };

  const seoScore = seoData?.averageScore ?? 0;
  const seoScorePrevMonth = kpis?.seoScorePrevMonth ?? null;
  const previousPeriodChange =
    seoScorePrevMonth != null ? Math.round(seoScore - seoScorePrevMonth) : 0;

  const handleCreateBlog = () => {
    router.push("/app/blog/new");
  };

  const coveragePercent = coverageData?.coveragePercent ?? kpis?.catalogCoveragePercent ?? 0;

  return (
    <>
      {/* Full-height bento grid: 4 cols × 3 rows filling viewport */}
      <div
        className="grid grid-cols-4 gap-2 h-full"
        style={{ gridTemplateRows: "1fr 1fr 1fr" }}
      >
        {/* ═══════════ ROW 1: HERO & INSIGHTS ═══════════ */}

        <motion.div variants={motionTokens.variants.staggerItem} className="min-h-0">
          <div className="h-full border border-border/40 bg-card/90 backdrop-blur-xl rounded-xl relative overflow-hidden group hover:shadow-glow-md hover:shadow-primary/10 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-foreground/5 via-transparent to-transparent pointer-events-none" />
            <NorthStarKPICard
              score={seoScore}
              analyzedProducts={seoData?.analyzedProductsCount || 0}
              previousPeriodChange={previousPeriodChange}
              period="vs mois dernier"
              onDrillDown={() => router.push("/app/seo")}
            />
          </div>
        </motion.div>

        <motion.div variants={motionTokens.variants.staggerItem} className="min-h-0">
          <div className="h-full border border-primary/15 bg-card/90 backdrop-blur-xl rounded-xl relative overflow-hidden group hover:border-primary/30 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <AIInsightsCard kpis={kpis} seoScore={seoScore} coveragePercent={coveragePercent} />
          </div>
        </motion.div>

        <motion.div variants={motionTokens.variants.staggerItem} className="min-h-0">
          <div className="h-full border border-border/50 bg-card rounded-xl relative overflow-hidden group hover:border-border transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <CatalogCoverageCard
              total={coverageData?.total ?? kpis?.aiOptimizedProducts ?? 0}
              optimized={coverageData?.optimized ?? kpis?.aiOptimizedProducts ?? 0}
              coveragePercent={coveragePercent}
              generatedThisMonth={coverageData?.generatedThisMonth ?? 0}
              prevMonthOptimized={kpis?.aiOptimizedPrevMonth ?? null}
              isLoading={coverageLoading && isLoading}
            />
          </div>
        </motion.div>

        <motion.div variants={motionTokens.variants.staggerItem} className="min-h-0">
          <div className="h-full border border-border/50 bg-card rounded-xl relative overflow-hidden group hover:border-border transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <ConnectionHealthCard
              health={context?.connectionStatus || "disconnected"}
              platform={context?.selectedShopPlatform || null}
              storeName={context?.selectedShopName || "Boutique"}
              lastVerified={2}
              productsCount={context?.shopStats?.totalProducts || 0}
              lastSyncAt={kpis?.storeLastSyncedAt ?? null}
              onTestConnection={handleTestConnection}
            />
          </div>
        </motion.div>

        {/* ═══════════ ROW 2: GSC INSIGHTS ═══════════ */}

        <motion.div variants={motionTokens.variants.staggerItem} className="col-span-2 min-h-0">
          <div className="h-full border border-border/50 bg-card rounded-xl relative overflow-hidden group hover:border-border transition-all duration-300">
            <GscTrafficOverviewCard />
          </div>
        </motion.div>

        <motion.div variants={motionTokens.variants.staggerItem} className="min-h-0">
          <div className="h-full border border-border/50 bg-card rounded-xl relative overflow-hidden group hover:border-border transition-all duration-300">
            <GscIndexationStatusCard />
          </div>
        </motion.div>

        <motion.div variants={motionTokens.variants.staggerItem} className="min-h-0">
          <div className="h-full border border-border/50 bg-card rounded-xl relative overflow-hidden group hover:border-border transition-all duration-300">
            <GscFastOpportunitiesCard />
          </div>
        </motion.div>

        {/* ═══════════ ROW 3: METRICS & ACTIONS ═══════════ */}

        <motion.div variants={motionTokens.variants.staggerItem} className="min-h-0">
          <div className="h-full border border-border/50 bg-card rounded-xl relative overflow-hidden group hover:border-border transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <BlogContentCard
              publishedCount={kpis?.blogStats?.publishedCount || 0}
              draftsCount={kpis?.blogStats?.draftCount || 0}
              lastCreated={
                kpis?.blogStats?.lastCreatedAt
                  ? new Date(kpis.blogStats.lastCreatedAt).toLocaleDateString()
                  : "Jamais"
              }
              onCreateArticle={handleCreateBlog}
            />
          </div>
        </motion.div>

        <motion.div variants={motionTokens.variants.staggerItem} className="min-h-0">
          <div className="h-full border border-border/50 bg-card rounded-xl relative overflow-hidden group hover:border-primary/20 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />
            <QuickActionsCard />
          </div>
        </motion.div>

        <motion.div variants={motionTokens.variants.staggerItem} className="col-span-2 min-h-0">
          <div className="h-full border border-border/40 bg-card/95 backdrop-blur-lg rounded-xl relative overflow-hidden group hover:bg-card/90 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-transparent pointer-events-none" />
            <ActivityTimeline activities={(activities || []) as ActivityItem[]} />
          </div>
        </motion.div>
      </div>

      {/* Generate modal */}
      <GenerateSelectionModal
        open={showGenerateModal}
        onOpenChange={setShowGenerateModal}
      />
    </>
  );
};

