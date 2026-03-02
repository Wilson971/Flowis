/**
 * Products Stats Cards V2 — Vercel Pro KPI Pattern (Compact)
 */

import { LucideIcon, Package, RefreshCw, Sparkles } from "lucide-react";
import { useCounterAnimation } from "@/hooks/useCounterAnimation";
import { cn } from "@/lib/utils";

type StatCardV2Props = {
  label: string;
  value: number;
  icon: LucideIcon;
  isLoading?: boolean;
  badge?: { label: string; variant: "warning" | "info" | "success" };
  subText?: string;
  total?: number;
};

const StatCardV2 = ({
  label,
  value,
  icon: Icon,
  isLoading = false,
  badge,
  subText,
  total,
}: StatCardV2Props) => {
  const animatedValue = useCounterAnimation(value, { duration: 1200 });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/40 bg-card px-3 py-2 flex items-center justify-between">
        <div className="h-3 w-16 rounded bg-muted animate-pulse" />
        <div className="h-4 w-8 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card relative overflow-hidden px-4 py-3">
      <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />
      <div className="relative z-10 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
          <Icon className="h-3.5 w-3.5 text-muted-foreground/40" />
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {animatedValue}
          </span>
          {total !== undefined && (
            <span className="text-[11px] font-medium text-muted-foreground mb-0.5">
              / {total}
            </span>
          )}
          {badge && (
            <span className={cn(
              "h-5 rounded-full px-2 text-[10px] font-medium border-0 inline-flex items-center mb-0.5",
              badge.variant === "warning" && "bg-warning/10 text-warning",
              badge.variant === "info" && "bg-primary/10 text-primary",
              badge.variant === "success" && "bg-success/10 text-success",
            )}>
              {badge.label}
            </span>
          )}
        </div>
        {subText && (
          <p className="text-[10px] text-muted-foreground/60">{subText}</p>
        )}
      </div>
    </div>
  );
};

type ProductsStatsCardsV2Props = {
  totalProducts: number;
  unsyncedCount: number;
  notOptimizedCount: number;
  optimizedCount?: number;
  isLoading?: boolean;
  className?: string;
};

export const ProductsStatsCardsV2 = ({
  totalProducts,
  unsyncedCount,
  notOptimizedCount,
  optimizedCount,
  isLoading = false,
  className,
}: ProductsStatsCardsV2Props) => {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-3", className)}>
      <StatCardV2
        label="Total Produits"
        value={totalProducts}
        icon={Package}
        isLoading={isLoading}
      />
      <StatCardV2
        label="A synchroniser"
        value={unsyncedCount}
        icon={RefreshCw}
        isLoading={isLoading}
        badge={
          unsyncedCount > 0
            ? { label: "Action requise", variant: "warning" }
            : undefined
        }
        total={totalProducts}
      />
      <StatCardV2
        label={optimizedCount !== undefined ? "Optimises" : "Non optimises"}
        value={optimizedCount !== undefined ? optimizedCount : notOptimizedCount}
        icon={Sparkles}
        isLoading={isLoading}
        badge={
          (optimizedCount === undefined && notOptimizedCount > 0) ||
            (optimizedCount !== undefined && optimizedCount === 0)
            ? { label: "A traiter", variant: "info" }
            : undefined
        }
        subText={optimizedCount !== undefined ? "avec contenu IA" : "produits sans contenu IA"}
      />
    </div>
  );
};
