/**
 * Products Stats Cards Component
 *
 * Modern stat cards with animations and badges
 */

import { LucideIcon, Package, RefreshCw, Sparkles } from "lucide-react";
import { useCounterAnimation } from "@/hooks/useCounterAnimation";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { m } from "framer-motion";

type StatCardProps = {
  title: string;
  value: number;
  icon: LucideIcon;
  isLoading?: boolean;
  badge?: { label: string; variant: "warning" | "info" | "success" };
  subText?: string;
  total?: number;
  delay?: number;
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  isLoading = false,
  badge,
  subText,
  total,
  delay = 0,
}: StatCardProps) => {
  const animatedValue = useCounterAnimation(value, { duration: 1200 });

  if (isLoading) {
    return (
      <Card className="h-full border border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              <div className="h-7 w-16 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="group h-full">
      <Card className="relative overflow-hidden bg-card text-card-foreground border border-border h-full card-elevated">
        <CardContent className="p-5 flex flex-col justify-center h-full">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:text-foreground transition-colors border border-border">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex flex-col w-full min-w-0">
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate mb-0.5">
                  Statistique
                </p>
                {badge && (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-md ml-2 shrink-0 border uppercase tracking-wider",
                      badge.variant === "warning" &&
                      "text-warning bg-warning/10 border-warning/20",
                      badge.variant === "info" &&
                      "text-info bg-info/10 border-info/20",
                      badge.variant === "success" &&
                      "text-success bg-success/10 border-success/20"
                    )}
                  >
                    {badge.label}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold tracking-tight text-foreground truncate mb-1">
                {title}
              </h3>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
                  {animatedValue}
                </span>
                {total !== undefined && (
                  <span className="text-sm text-muted-foreground font-medium">
                    / {total}
                  </span>
                )}
              </div>
              {subText && (
                <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-wide">{subText}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

type ProductsStatsCardsProps = {
  totalProducts: number;
  unsyncedCount: number;
  notOptimizedCount: number;
  optimizedCount?: number;
  isLoading?: boolean;
  className?: string;
};

export const ProductsStatsCards = ({
  totalProducts,
  unsyncedCount,
  notOptimizedCount,
  optimizedCount,
  isLoading = false,
  className,
}: ProductsStatsCardsProps) => {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      <StatCard
        title="Total Produits"
        value={totalProducts}
        icon={Package}
        isLoading={isLoading}
        delay={0}
      />
      <StatCard
        title="À synchroniser"
        value={unsyncedCount}
        icon={RefreshCw}
        isLoading={isLoading}
        badge={
          unsyncedCount > 0
            ? { label: "Action requise", variant: "warning" }
            : undefined
        }
        total={totalProducts}
        delay={0.1}
      />
      <StatCard
        title={optimizedCount !== undefined ? "Optimisés" : "Non optimisés"}
        value={optimizedCount !== undefined ? optimizedCount : notOptimizedCount}
        icon={Sparkles}
        isLoading={isLoading}
        badge={
          (optimizedCount === undefined && notOptimizedCount > 0) ||
            (optimizedCount !== undefined && optimizedCount === 0)
            ? { label: "À traiter", variant: "info" }
            : undefined
        }
        subText={optimizedCount !== undefined ? "avec contenu IA" : "produits sans contenu IA"}
        delay={0.2}
      />
    </div>
  );
};
