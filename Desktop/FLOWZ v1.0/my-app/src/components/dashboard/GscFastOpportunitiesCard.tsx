"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
import { useGscConnection } from "@/hooks/integrations/useGscConnection";
import {
  useGscScoredOpportunities,
  type OpportunityCategory,
} from "@/hooks/integrations/useGscOpportunities";
import { useSelectedStore } from "@/contexts/StoreContext";
import { useRouter } from "next/navigation";
import {
  Zap,
  MousePointerClick,
  EyeOff,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Target,
  Link2,
  Lightbulb,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { GscOpportunitiesSheet } from "./GscOpportunitiesSheet";
import type { ScoredOpportunity } from "@/lib/gsc/scoring";

/* ─── Constants ───────────────────────────────────────────── */

const VISIBLE_COUNT = 7;

const CATEGORY_TABS: {
  value: OpportunityCategory;
  label: string;
  icon: typeof Zap;
}[] = [
  { value: "quick_wins", label: "Quick Wins", icon: Zap },
  { value: "low_ctr", label: "Low CTR", icon: MousePointerClick },
  { value: "no_clicks", label: "No Clicks", icon: EyeOff },
];

/* ─── Score badge ─────────────────────────────────────────── */

function ScoreBadge({ score, color }: { score: number; color: ScoredOpportunity["scoreColor"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-8 h-5 rounded-full text-[10px] font-semibold tabular-nums border-0 shrink-0",
        color === "success" && "bg-emerald-500/10 text-emerald-600",
        color === "warning" && "bg-amber-500/10 text-amber-600",
        color === "error" && "bg-red-500/10 text-red-500"
      )}
    >
      {score}
    </span>
  );
}

/* ─── Trend chip — Vercel style ───────────────────────────── */

function TrendChip({ trend, delta }: { trend: ScoredOpportunity["trend"]; delta: number | null }) {
  if (trend === "new") {
    return (
      <span className="inline-flex items-center gap-0.5 h-5 rounded-full px-1.5 text-[10px] font-medium bg-primary/10 text-primary border-0">
        <Sparkles className="w-2.5 h-2.5" />
        New
      </span>
    );
  }

  if (trend === "up") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600">
        <ArrowUpRight className="w-3 h-3" />
        {delta != null && Math.abs(delta) >= 1 ? Math.abs(Math.round(delta)) : ""}
      </span>
    );
  }

  if (trend === "down") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-red-500">
        <ArrowDownRight className="w-3 h-3" />
        {delta != null && Math.abs(delta) >= 1 ? Math.abs(Math.round(delta)) : ""}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center text-muted-foreground/40">
      <Minus className="w-2.5 h-2.5" />
    </span>
  );
}

/* ─── Opportunity row — Vercel table row ──────────────────── */

function OpportunityRow({
  opp,
  isNew,
  onClick,
}: {
  opp: ScoredOpportunity;
  isNew: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      variants={motionTokens.variants.staggerItem}
      onClick={onClick}
      className={cn(
        "group/row w-full flex items-center gap-3 px-3 py-2.5",
        "border-b border-border/20 last:border-0",
        "transition-colors hover:bg-muted/30",
        "text-left cursor-pointer"
      )}
    >
      {/* Score */}
      <ScoreBadge score={opp.score} color={opp.scoreColor} />

      {/* Query + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-medium text-foreground truncate">
            {opp.query}
          </span>
          {(isNew || opp.trend === "new") && (
            <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider tabular-nums">
            #{Math.round(opp.position)}
          </span>
          <span className="text-[10px] text-muted-foreground/50 tabular-nums">
            {opp.impressions.toLocaleString()} impr
          </span>
        </div>
      </div>

      {/* Trend */}
      <div className="shrink-0">
        <TrendChip trend={opp.trend} delta={opp.trendDelta} />
      </div>

      {/* Chevron on hover */}
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 opacity-0 group-hover/row:opacity-100 transition-all" />
    </motion.button>
  );
}

/* ─── Loading skeleton ────────────────────────────────────── */

function CardSkeleton() {
  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-2.5 w-10" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="flex gap-4 mt-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-14" />
      </div>
      <div className="flex-1 space-y-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/10">
            <Skeleton className="h-5 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="h-3.5 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Empty state — Vercel Pro ────────────────────────────── */

function EmptyState({ isConnected }: { isConnected: boolean }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center p-6 h-full text-center space-y-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50">
        {isConnected ? (
          <Lightbulb className="h-5 w-5 text-muted-foreground/50" />
        ) : (
          <Link2 className="h-5 w-5 text-muted-foreground/50" />
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          {isConnected ? "Opportunités" : "Google Search Console"}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1 max-w-[200px]">
          {isConnected
            ? "Aucune opportunité détectée pour le moment."
            : "Connectez GSC pour découvrir vos opportunités SEO."}
        </p>
      </div>
      {!isConnected && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-[11px] rounded-lg gap-1.5 font-medium mt-1"
          onClick={() => router.push("/app/settings")}
        >
          <Link2 className="w-3.5 h-3.5" />
          Connecter GSC
        </Button>
      )}
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────── */

export function GscFastOpportunitiesCard() {
  const [activeCategory, setActiveCategory] = useState<OpportunityCategory>("quick_wins");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetCategory, setSheetCategory] = useState<OpportunityCategory>("quick_wins");

  const { connections, isConnected, isLoading: connLoading } = useGscConnection({ linkedOnly: true });
  const { selectedStore } = useSelectedStore();

  const storeMatchedSite = selectedStore
    ? connections.find((c) => c.store_id === selectedStore.id)
    : null;
  const effectiveSiteId = storeMatchedSite?.site_id || connections[0]?.site_id || null;

  const { data: scored, isLoading: oppLoading } = useGscScoredOpportunities(
    isConnected ? effectiveSiteId : null
  );

  const isLoading = connLoading || oppLoading;

  const currentItems = useMemo(() => {
    if (!scored) return [];
    return scored[activeCategory] || [];
  }, [scored, activeCategory]);

  const visibleItems = currentItems.slice(0, VISIBLE_COUNT);
  const remainingCount = Math.max(0, currentItems.length - VISIBLE_COUNT);

  const openSheet = (cat: OpportunityCategory) => {
    setSheetCategory(cat);
    setSheetOpen(true);
  };

  if (isLoading) return <CardSkeleton />;

  if (!isConnected || !scored || scored.totalCount === 0) {
    return <EmptyState isConnected={isConnected} />;
  }

  const counts: Record<OpportunityCategory, number> = {
    quick_wins: scored.quick_wins.length,
    low_ctr: scored.low_ctr.length,
    no_clicks: scored.no_clicks.length,
  };

  return (
    <>
      <div className="flex flex-col h-full">

        {/* ── Header — Vercel Pro ── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
              <Target className="h-[18px] w-[18px] text-foreground/70" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider leading-none mb-1">
                SEO
              </p>
              <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                Opportunités
              </h3>
            </div>
          </div>

          {/* Total count badge */}
          <span className="h-5 rounded-full px-2 text-[10px] font-medium border-0 bg-amber-500/10 text-amber-600 inline-flex items-center tabular-nums">
            {scored.totalCount}
          </span>
        </div>

        {/* ── Underline tabs ── */}
        <div className="flex items-center gap-1 px-4 border-b border-border/30">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.value;
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveCategory(tab.value)}
                className={cn(
                  "relative flex items-center gap-1 px-2.5 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "h-3 w-3",
                  isActive ? "text-foreground/70" : "text-muted-foreground/60"
                )} />
                <span className="hidden sm:inline">{tab.label}</span>
                {counts[tab.value] > 0 && (
                  <span className={cn(
                    "text-[10px] tabular-nums ml-0.5",
                    isActive ? "text-muted-foreground" : "text-muted-foreground/50"
                  )}>
                    {counts[tab.value]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Rows ── */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              variants={motionTokens.variants.staggerContainer}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {visibleItems.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <p className="text-xs text-muted-foreground/60">
                    Aucune opportunité dans cette catégorie.
                  </p>
                </div>
              ) : (
                visibleItems.map((opp) => (
                  <OpportunityRow
                    key={opp.query}
                    opp={opp}
                    isNew={scored.newKeywords.has(opp.query.toLowerCase())}
                    onClick={() => openSheet(activeCategory)}
                  />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        {remainingCount > 0 && (
          <div className="px-4 pb-3 pt-1 shrink-0 border-t border-border/20">
            <button
              onClick={() => openSheet(activeCategory)}
              className={cn(
                "w-full flex items-center justify-center gap-1 py-1.5 rounded-lg",
                "text-[11px] font-medium text-muted-foreground",
                "hover:text-foreground hover:bg-muted/30",
                "transition-colors"
              )}
            >
              Voir les {remainingCount} autres
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Sheet */}
      <GscOpportunitiesSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        opportunities={scored[sheetCategory] || []}
        category={sheetCategory}
        newKeywords={scored.newKeywords}
      />
    </>
  );
}
