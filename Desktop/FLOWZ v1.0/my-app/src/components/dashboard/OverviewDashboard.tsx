"use client";

import { useState } from "react";
import { useUserProfile } from "@/hooks/profile/useUserProfile";
import { useDashboardKPIs } from "@/hooks/dashboard/useDashboardKPIs";
import { useRecentActivity } from "@/hooks/analytics/useRecentActivity";
import { useSelectedStore } from "@/contexts/StoreContext";
import { DashboardHeader } from "./DashboardHeader";
import { KPICardsGrid } from "./KPICardsGrid";
import { DashboardSkeleton } from "../skeletons/DashboardSkeleton";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/design-system";
import { DashboardContext } from "@/types/dashboard";

/**
 * OverviewDashboard - Premium Command Center
 *
 * Main dashboard container with premium bento grid layout,
 * animated counters, AI insights, sparkline trends.
 */
export const OverviewDashboard = () => {
  const { selectedStore, stores, isLoading: storeLoading } = useSelectedStore();
  const { context: kpiContext, kpis, isLoading: kpisLoading } = useDashboardKPIs("current_month", selectedStore?.id);
  const { profile: userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: activities, isLoading: activitiesLoading } = useRecentActivity(selectedStore?.id);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const isLoading = kpisLoading || profileLoading || activitiesLoading || storeLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const userName = userProfile?.full_name || userProfile?.username || "Utilisateur";
  const userEmail = userProfile?.email;

  const context: DashboardContext = {
    selectedShopId: selectedStore?.id || null,
    selectedShopName: selectedStore?.name || "Aucune boutique",
    selectedShopPlatform: selectedStore?.platform || null,
    connectionStatus:
      selectedStore?.status === "active"
        ? "connected"
        : selectedStore?.status === "error"
          ? "pending"
          : "disconnected",
    totalAccountShops: stores.length,
    activeShopsCount: stores.filter((s) => s.status === "active").length,
    shopStats: kpiContext?.shopStats || {
      totalProducts: 0,
      totalCategories: 0,
      totalBlogPosts: 0,
      syncErrors: 0,
    },
  };

  return (
    <div className="flex flex-col gap-2 overflow-hidden flex-1">
      <motion.div
        variants={motionTokens.variants.staggerContainer}
        initial="hidden"
        animate="visible"
        className="shrink-0"
      >
        {/* Dashboard Header */}
        <DashboardHeader
          userName={userName}
          userEmail={userEmail || undefined}
          context={context}
          isLoading={isLoading}
          onGenerateClick={() => setShowGenerateModal(true)}
        />
      </motion.div>

      {/* KPI Bento Grid - fills remaining space */}
      <div className="flex-1 min-h-0">
        <KPICardsGrid
          kpis={kpis || undefined}
          context={context}
          activities={activities}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
