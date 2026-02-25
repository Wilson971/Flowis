"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardContext, DashboardKPIs } from "@/types/dashboard";
import { GenerateSelectionModal } from "./GenerateSelectionModal";
import { CatalogCoverageCard } from "./CatalogCoverageCard";
import { ActivityTimeline, ActivityItem } from "./ActivityTimeline";
import { SeoScoreHero } from "./SeoScoreHero";
import { AIInsightsCard } from "./AIInsightsCard";
import { ActionCenter } from "./ActionCenter";
import { ContentPipeline } from "./ContentPipeline";
import { GscTrafficOverviewCard } from "./GscTrafficOverviewCard";
import { GscIndexationStatusCard } from "./GscIndexationStatusCard";
import { GscFastOpportunitiesCard } from "./GscFastOpportunitiesCard";
import { useSeoGlobalScore } from "@/hooks/products/useSeoGlobalScore";
import { useCatalogCoverage } from "@/hooks/dashboard/useCatalogCoverage";
import { useGscConnection } from "@/hooks/integrations/useGscConnection";
import { useGscOpportunities } from "@/hooks/integrations/useGscOpportunities";
import { useSelectedStore } from "@/contexts/StoreContext";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/design-system";

type KPICardsGridProps = {
  kpis?: DashboardKPIs;
  context?: DashboardContext;
  activities?: ActivityItem[];
  isLoading?: boolean;
};

/**
 * KPICardsGrid - Redesigned Dashboard Layout
 *
 * New layout based on information hierarchy:
 * - Row 1 (Hero): SEO Score Hero (with breakdown) + Action Center (contextual)
 * - Row 2 (Performance): Traffic (span 2) + Indexation + Opportunities
 * - Row 3 (Content & Status): Coverage + Content Pipeline + Connection Health + Activity
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
  // GSC connection + opportunities for ActionCenter
  const { selectedStore } = useSelectedStore();
  const { connections, isConnected: gscConnected } = useGscConnection({ linkedOnly: true });
  const storeMatchedSite = selectedStore
    ? connections.find(c => c.store_id === selectedStore.id)
    : null;
  const effectiveSiteId = storeMatchedSite?.site_id || connections[0]?.site_id || null;
  const { data: opportunities } = useGscOpportunities(
    gscConnected ? effectiveSiteId : null,
    "last_28_days"
  );

  const seoScore = seoData?.averageScore ?? 0;
  const seoScorePrevMonth = kpis?.seoScorePrevMonth ?? null;
  const previousPeriodChange =
    seoScorePrevMonth != null ? Math.round(seoScore - seoScorePrevMonth) : 0;

  const coveragePercent = coverageData?.coveragePercent ?? kpis?.catalogCoveragePercent ?? 0;
  const isDisconnected = context?.connectionStatus === "disconnected";
  const draftsCount = kpis?.blogStats?.draftCount ?? 0;
  const opportunitiesCount = opportunities?.quick_wins?.length ?? 0;
  const productsWithoutDesc = (coverageData?.total ?? 0) - (coverageData?.optimized ?? 0);

  return (
    <>
      {/* Full-height bento grid */}
      <motion.div
        className="grid grid-cols-4 gap-2 h-full"
        style={{ gridTemplateRows: "1.2fr 1fr 1fr" }}
        variants={motionTokens.variants.staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* ═══════════ ROW 1: HERO SEO + ACTION CENTER ═══════════ */}

        {/* SEO Score Hero — span 2 cols */}
        <motion.div variants={motionTokens.variants.staggerItem} className="col-span-2 min-h-0">
          <div className="h-full border border-border/40 bg-card/95 backdrop-blur-lg rounded-xl relative overflow-hidden group hover:bg-card/90 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-transparent pointer-events-none" />
            <SeoScoreHero
              score={seoScore}
              breakdown={seoData?.breakdown}
              detailedPillars={seoData?.detailedPillars}
              analyzedProducts={seoData?.analyzedProductsCount || 0}
              previousPeriodChange={previousPeriodChange}
              period="vs mois dernier"
              onDrillDown={() => router.push("/app/seo")}
              onViewImprovements={() => router.push("/app/products?sort=seo_score")}
              onFixCategory={(category) => router.push(`/app/products?seo_issue=${category}`)}
            />
          </div>
        </motion.div>

        {/* AI Insights */}
        <motion.div variants={motionTokens.variants.staggerItem} className="min-h-0">
          <div className="h-full border border-border/40 bg-card/95 backdrop-blur-lg rounded-xl relative overflow-hidden group hover:bg-card/90 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-transparent pointer-events-none" />
            <AIInsightsCard kpis={kpis} seoScore={seoScore} coveragePercent={coveragePercent} />
          </div>
        </motion.div>

        {/* Action Center (contextual, dynamic) */}
        <motion.div variants={motionTokens.variants.staggerItem} className="min-h-0">
          <div className="h-full border border-border/40 bg-card/95 backdrop-blur-lg rounded-xl relative overflow-hidden group hover:bg-card/90 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-transparent pointer-events-none" />
            <ActionCenter
              storeId={storeId}
              isDisconnected={isDisconnected}
              draftsCount={draftsCount}
              seoScore={seoScore}
              opportunitiesCount={opportunitiesCount}
              productsWithoutDescription={productsWithoutDesc}
            />
          </div>
        </motion.div>

        {/* ═══════════ ROW 2: PERFORMANCE ═══════════ */}

        <motion.div variants={motionTokens.variants.staggerItem} className="col-span-2 min-h-0">
          <div className="h-full border border-border/40 bg-card/95 backdrop-blur-lg rounded-xl relative overflow-hidden group hover:bg-card/90 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-transparent pointer-events-none" />
            <GscTrafficOverviewCard />
          </div>
        </motion.div>

        <motion.div variants={motionTokens.variants.staggerItem} className="min-h-0">
          <div className="h-full border border-border/40 bg-card/95 backdrop-blur-lg rounded-xl relative overflow-hidden group hover:bg-card/90 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-transparent pointer-events-none" />
            <GscIndexationStatusCard />
          </div>
        </motion.div>

        <motion.div variants={motionTokens.variants.staggerItem} className="min-h-0">
          <div className="h-full border border-border/40 bg-card/95 backdrop-blur-lg rounded-xl relative overflow-hidden group hover:bg-card/90 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-transparent pointer-events-none" />
            <GscFastOpportunitiesCard />
          </div>
        </motion.div>

        {/* ═══════════ ROW 3: CONTENT & STATUS ═══════════ */}

        <motion.div variants={motionTokens.variants.staggerItem} className="col-span-2 min-h-0">
          <div className="h-full border border-border/40 bg-card/95 backdrop-blur-lg rounded-xl relative overflow-hidden group hover:bg-card/90 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-transparent pointer-events-none" />
            <CatalogCoverageCard
              total={coverageData?.total ?? kpis?.aiOptimizedProducts ?? 0}
              optimized={coverageData?.optimized ?? kpis?.aiOptimizedProducts ?? 0}
              coveragePercent={coveragePercent}
              generatedThisMonth={coverageData?.generatedThisMonth ?? 0}
              prevMonthOptimized={kpis?.aiOptimizedPrevMonth ?? null}
              goal={250}
              isLoading={coverageLoading && isLoading}
              onBatchOptimize={() => setShowGenerateModal(true)}
            />
          </div>
        </motion.div>

        <motion.div variants={motionTokens.variants.staggerItem} className="min-h-0">
          <div className="h-full border border-border/40 bg-card/95 backdrop-blur-lg rounded-xl relative overflow-hidden group hover:bg-card/90 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-transparent pointer-events-none" />
            <ContentPipeline
              draftsCount={kpis?.blogStats?.draftCount || 0}
              publishedCount={kpis?.blogStats?.publishedCount || 0}
              lastCreated={
                kpis?.blogStats?.lastCreatedAt
                  ? new Date(kpis.blogStats.lastCreatedAt).toLocaleDateString()
                  : undefined
              }
              onViewDrafts={() => router.push("/app/blog?status=draft")}
              onCreateArticle={() => router.push("/app/blog/new")}
            />
          </div>
        </motion.div>

        <motion.div variants={motionTokens.variants.staggerItem} className="min-h-0">
          <div className="h-full border border-border/40 bg-card/95 backdrop-blur-lg rounded-xl relative overflow-hidden group hover:bg-card/90 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-transparent pointer-events-none" />
            <ActivityTimeline activities={(activities || []) as ActivityItem[]} />
          </div>
        </motion.div>
      </motion.div>

      {/* Generate modal */}
      <GenerateSelectionModal
        open={showGenerateModal}
        onOpenChange={setShowGenerateModal}
      />
    </>
  );
};
