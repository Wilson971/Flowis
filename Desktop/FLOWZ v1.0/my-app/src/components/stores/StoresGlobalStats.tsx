"use client";

import { motion } from "framer-motion";
import { Store, Package, BarChart2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { cardStyles, textStyles } from "@/lib/design-system/styles";
import { motionTokens } from "@/lib/design-system/tokens/motion";
import { useAllStoresKPIs } from "@/hooks/stores/useStoreKPIs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatCard {
  icon: React.ElementType;
  value: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function StatCardSkeleton() {
  return (
    <div
      className={cn(
        cardStyles.glass,
        "p-4 flex items-center gap-4 animate-pulse"
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-muted/60 shrink-0" />
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="h-5 w-16 rounded-lg bg-muted/60" />
        <div className="h-3 w-24 rounded-md bg-muted/40" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single stat card
// ---------------------------------------------------------------------------

interface StatCardProps {
  card: StatCard;
  index: number;
}

function StatCardItem({ card, index }: StatCardProps) {
  const Icon = card.icon;

  return (
    <motion.div
      variants={motionTokens.variants.bentoItem}
      custom={index}
      className={cn(
        cardStyles.glass,
        "p-4 flex items-center gap-4"
      )}
    >
      {/* Icon container */}
      <div
        className={cn(
          "w-10 h-10 rounded-xl shrink-0",
          "bg-primary/10 flex items-center justify-center"
        )}
      >
        <Icon className="w-5 h-5 text-primary" strokeWidth={1.8} />
      </div>

      {/* Text */}
      <div className="flex flex-col min-w-0">
        <span className="text-xl font-bold tracking-tight text-foreground leading-none">
          {card.value}
        </span>
        <span className={cn(textStyles.bodySmall, "mt-0.5 truncate")}>
          {card.label}
        </span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function StoresGlobalStats() {
  const { data, isLoading } = useAllStoresKPIs();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const totalStores = data?.totalStores ?? 0;
  const totalProducts = data?.totalProducts ?? 0;
  const optimizedProducts = data?.optimizedProducts ?? 0;
  const optimizationRate = data?.optimizationRate ?? 0;

  const cards: StatCard[] = [
    {
      icon: Store,
      value: String(totalStores),
      label: "Boutiques",
    },
    {
      icon: Package,
      value: String(totalProducts),
      label: "Produits",
    },
    {
      icon: BarChart2,
      value: `${optimizationRate}%`,
      label: "Taux optimisation",
    },
    {
      icon: RefreshCw,
      value: `${optimizedProducts} / ${totalProducts}`,
      label: "Optimisés",
    },
  ];

  return (
    <motion.div
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {cards.map((card, index) => (
        <StatCardItem key={card.label} card={card} index={index} />
      ))}
    </motion.div>
  );
}

export default StoresGlobalStats;
