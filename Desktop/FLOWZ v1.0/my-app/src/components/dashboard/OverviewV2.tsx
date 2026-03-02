"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  FileText,
  Zap,
  Activity,
  ArrowRight,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
import { DashboardContext, DashboardKPIs } from "@/types/dashboard";
import { useActionCenter, type ActionItem } from "@/hooks/dashboard/useActionCenter";
import { useAIInsights } from "@/hooks/dashboard/useAIInsights";
import { ActionCenterSheet } from "./ActionCenterSheet";
import { AIInsightsSheet } from "./AIInsightsSheet";
import { GenerateSelectionModal } from "./GenerateSelectionModal";
import type { ActivityItem } from "@/hooks/analytics/useRecentActivity";

// ─── Types ──────────────────────────────────────────────────────────────────

interface OverviewV2Props {
  kpis?: DashboardKPIs;
  context?: DashboardContext;
  activities?: ActivityItem[];
  seoScore?: number;
  coveragePercent?: number;
  coverageTotal?: number;
  coverageOptimized?: number;
  coveragePartial?: number;
  generatedThisMonth?: number;
  prevMonthOptimized?: number | null;
  goal?: number | null;
}

// ─── Card Shell V2 — Vercel pattern ─────────────────────────────────────────

function V2Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card relative overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

// ─── Action Row V2 — flat, minimal ─────────────────────────────────────────

function ActionRowV2({
  action,
  index,
}: {
  action: ActionItem;
  index: number;
}) {
  const Icon = action.icon;

  const dotColor =
    action.priority === "critical"
      ? "bg-red-500"
      : action.priority === "high"
        ? "bg-amber-500"
        : action.priority === "medium"
          ? "bg-primary"
          : "bg-muted-foreground/30";

  if (action.mode === "inline") {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/20 last:border-0 transition-colors hover:bg-muted/30 group">
        <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColor)} />
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border/50 shrink-0">
          <Icon className="h-[18px] w-[18px] text-foreground/70" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-medium text-foreground truncate">
              {action.title}
            </p>
            {action.badge && (
              <span
                className={cn(
                  "h-5 rounded-full px-2 text-[10px] font-medium border-0 inline-flex items-center",
                  action.badgeVariant === "destructive"
                    ? "bg-red-500/10 text-red-500"
                    : "bg-primary/10 text-primary"
                )}
              >
                {action.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {action.description}
          </p>
        </div>
        <Button
          size="sm"
          variant="destructive"
          className="shrink-0 h-7 text-[11px] px-2.5 rounded-lg font-medium"
          disabled={action.isActioning}
          onClick={() => action.onAction?.()}
        >
          {action.isActioning ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            action.cta
          )}
        </Button>
      </div>
    );
  }

  return (
    <Link
      href={action.href || "#"}
      className="flex items-center gap-3 px-4 py-2.5 border-b border-border/20 last:border-0 transition-colors hover:bg-muted/30 group cursor-pointer"
    >
      <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColor)} />
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border/50 shrink-0">
        <Icon className="h-[18px] w-[18px] text-foreground/70" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-medium text-foreground truncate">
            {action.title}
          </p>
          {action.badge && (
            <span
              className={cn(
                "h-5 rounded-full px-2 text-[10px] font-medium border-0 inline-flex items-center",
                action.badgeVariant === "destructive"
                  ? "bg-red-500/10 text-red-500"
                  : action.badgeVariant === "default"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted/60 text-muted-foreground"
              )}
            >
              {action.badge}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {action.description}
          {action.impact && (
            <span className="ml-1.5 text-primary font-medium">
              {action.impact}
            </span>
          )}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
    </Link>
  );
}

// ─── Activity Item V2 — minimal dot timeline ───────────────────────────────

function ActivityItemV2({
  item,
  isLast,
}: {
  item: ActivityItem;
  isLast: boolean;
}) {
  const dotColor =
    item.type === "error"
      ? "bg-red-500"
      : item.type === "success" || item.type === "publication"
        ? "bg-emerald-500"
        : item.type === "sync"
          ? "bg-primary"
          : item.type === "generation" || item.type === "photo_studio"
            ? "bg-primary"
            : item.type === "seo_analysis"
              ? "bg-amber-500"
              : "bg-muted-foreground/30";

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "h-2 w-2 rounded-full mt-1.5 shrink-0",
            dotColor
          )}
        />
        {!isLast && (
          <div className="w-px flex-1 bg-border/40 my-1" />
        )}
      </div>
      <div className={cn("pb-3 min-w-0 flex-1", isLast && "pb-0")}>
        <p className="text-[13px] font-medium text-foreground truncate">
          {item.title}
        </p>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5 truncate">
          {item.description}
        </p>
        <p className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">
          {item.timeAgo || item.timestamp}
        </p>
      </div>
    </div>
  );
}

// ─── SVG Gauge (half-circle) ────────────────────────────────────────────────

const GAUGE_COLORS = {
  optimized: "#10b981",
  partial: "#f59e0b",
  untreated: "#3f3f46",
  track: "currentColor",
} as const;

function SvgGauge({
  segments,
  total,
  percent,
  ratio,
}: {
  segments: { value: number; color: string }[];
  total: number;
  percent: number;
  ratio: string;
}) {
  const r = 70;
  const stroke = 18;
  const cx = 90;
  const cy = 82;
  const circumference = Math.PI * r;

  let accumulated = 0;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((seg) => {
      const frac = total > 0 ? seg.value / total : 0;
      const len = frac * circumference;
      const offset = circumference - accumulated;
      accumulated += len;
      return { ...seg, len, offset };
    });

  return (
    <div className="relative flex flex-col items-center w-full max-w-[280px]">
      <svg viewBox="0 0 180 100" className="w-full">
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/40"
          strokeLinecap="round"
        />
        {/* Colored arcs */}
        {arcs.map((arc, i) => (
          <motion.path
            key={i}
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={arc.color}
            strokeWidth={stroke}
            strokeDasharray={`${arc.len} ${circumference}`}
            strokeDashoffset={-arc.offset + circumference}
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{
              strokeDasharray: `${arc.len} ${circumference}`,
            }}
            transition={{
              duration: 0.9,
              delay: 0.3 + i * 0.15,
              ease: "easeOut",
            }}
          />
        ))}
        {/* Center text — rendered in SVG for perfect positioning */}
        <text
          x={cx}
          y={cy - 12}
          textAnchor="middle"
          className="fill-foreground text-2xl font-semibold"
          style={{ fontSize: 28, fontWeight: 600 }}
        >
          {percent}%
        </text>
        <text
          x={cx}
          y={cy + 2}
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}
        >
          COUVERTURE
        </text>
      </svg>
      {/* Ratio below gauge */}
      <p className="text-[11px] text-muted-foreground tabular-nums -mt-1 text-center">
        <span className="font-semibold text-foreground">{ratio.split("/")[0]}</span>
        {" / "}
        {ratio.split("/")[1]}
      </p>
    </div>
  );
}

// ─── Catalog Coverage V2 — Gauge + 2x2 stats + goal bar ────────────────────

function CatalogCoverageV2({
  total,
  optimized,
  partial = 0,
  coveragePercent,
  generatedThisMonth,
  prevMonthOptimized = null,
  goal = null,
  onBatchOptimize,
}: {
  total: number;
  optimized: number;
  partial?: number;
  coveragePercent: number;
  generatedThisMonth: number;
  prevMonthOptimized?: number | null;
  goal?: number | null;
  onBatchOptimize?: () => void;
}) {
  const router = useRouter();
  const untreated = Math.max(0, total - optimized - partial);

  const hasTrend = prevMonthOptimized != null && prevMonthOptimized > 0;
  const trendDelta = hasTrend ? optimized - prevMonthOptimized! : 0;
  const trendPercent =
    hasTrend && prevMonthOptimized! > 0
      ? Math.round((trendDelta / prevMonthOptimized!) * 100)
      : 0;
  const TrendIcon =
    trendDelta > 0 ? TrendingUp : trendDelta < 0 ? TrendingDown : Minus;

  const effectiveGoal = goal ?? Math.max(total, optimized);
  const goalPercent =
    effectiveGoal > 0
      ? Math.min(100, Math.round((optimized / effectiveGoal) * 100))
      : 0;

  const dailyRate = useMemo(() => {
    const day = new Date().getDate();
    return day > 0 && generatedThisMonth > 0
      ? Math.round((generatedThisMonth / day) * 10) / 10
      : 0;
  }, [generatedThisMonth]);

  const gaugeSegments = [
    { value: optimized, color: GAUGE_COLORS.optimized },
    { value: partial, color: GAUGE_COLORS.partial },
    { value: untreated, color: GAUGE_COLORS.untreated },
  ];

  const optimizedPct = total > 0 ? Math.round((optimized / total) * 100) : 0;
  const partialPct = total > 0 ? Math.round((partial / total) * 100) : 0;
  const untreatedPct = total > 0 ? Math.round((untreated / total) * 100) : 0;

  const statCards = [
    {
      label: "Optimise",
      value: optimized,
      pct: optimizedPct,
      dot: GAUGE_COLORS.optimized,
      bar: GAUGE_COLORS.optimized,
      onClick: () => router.push("/app/products?filter=optimized"),
    },
    {
      label: "Partiel",
      value: partial,
      pct: partialPct,
      dot: GAUGE_COLORS.partial,
      bar: GAUGE_COLORS.partial,
      onClick: () => router.push("/app/products?filter=partial"),
    },
    {
      label: "Non traite",
      value: untreated,
      pct: untreatedPct,
      dot: GAUGE_COLORS.untreated,
      bar: GAUGE_COLORS.untreated,
      onClick: () => router.push("/app/products?filter=unoptimized"),
    },
    {
      label: "Ce mois",
      value: generatedThisMonth,
      pct: null,
      sublabel: dailyRate > 0 ? `${dailyRate}/j` : undefined,
      dot: GAUGE_COLORS.partial,
      bar: GAUGE_COLORS.partial,
      onClick: undefined,
    },
  ];

  return (
    <div className="grid h-full" style={{ gridTemplateRows: "auto 1fr auto" }}>
      {/* ── HEADER (fixed top) ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
            <Sparkles className="h-[18px] w-[18px] text-foreground/70" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Catalogue IA
            </p>
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
              Couverture
            </h3>
          </div>
        </div>
        {hasTrend && (
          <motion.div
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium",
              trendDelta > 0
                ? "bg-emerald-500/10 text-emerald-600"
                : trendDelta < 0
                  ? "bg-red-500/10 text-red-500"
                  : "bg-muted/60 text-muted-foreground"
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <TrendIcon className="h-3 w-3" />
            {trendPercent > 0 ? "+" : ""}
            {trendPercent}% vs M-1
          </motion.div>
        )}
      </div>

      {/* ── BODY (flexible middle) ── */}
      <div className="flex items-center gap-4 px-4 py-2 min-h-0">
        {/* Gauge — 60% */}
        <div className="w-[60%] shrink-0 flex items-center justify-center">
          <SvgGauge
            segments={gaugeSegments}
            total={total}
            percent={coveragePercent}
            ratio={`${optimized.toLocaleString("fr-FR")}/${total.toLocaleString("fr-FR")}`}
          />
        </div>

        {/* 2x2 stats grid — 40% */}
        <div className="w-[40%] min-w-0 flex flex-col justify-center gap-3">
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((card, i) => (
              <motion.div
                key={card.label}
                className={cn(
                  "rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5 flex flex-col gap-1 transition-colors",
                  card.onClick
                    ? "cursor-pointer hover:bg-muted/40"
                    : "cursor-default"
                )}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.4 + i * 0.07,
                  ...motionTokens.transitions.default,
                }}
                onClick={card.onClick}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: card.dot }}
                  />
                  <span className="text-[12px] text-muted-foreground flex-1 truncate">
                    {card.label}
                  </span>
                  {card.pct !== null && card.pct !== undefined && (
                    <span className="text-[11px] font-medium tabular-nums text-muted-foreground/60 shrink-0">
                      {card.pct}%
                    </span>
                  )}
                  {card.sublabel && (
                    <span className="text-[11px] font-medium tabular-nums text-primary shrink-0">
                      {card.sublabel}
                    </span>
                  )}
                </div>
                <span className="text-lg font-semibold tracking-tight text-foreground tabular-nums leading-none">
                  {card.value.toLocaleString("fr-FR")}
                </span>
                {card.pct !== null && card.pct !== undefined && total > 0 && (
                  <div className="h-1 bg-muted/40 rounded-full overflow-hidden mt-0.5">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: card.bar }}
                      initial={{ width: 0 }}
                      animate={{ width: `${card.pct}%` }}
                      transition={{
                        duration: 0.7,
                        delay: 0.55 + i * 0.07,
                        ease: motionTokens.easings.smooth,
                      }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {goal && goal > 0 && (
            <motion.div
              className="space-y-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Objectif {goal.toLocaleString("fr-FR")}</span>
                <span className="font-medium text-foreground tabular-nums">
                  {goalPercent}%
                </span>
              </div>
              <div className="h-2 bg-muted/40 rounded-full overflow-hidden ring-1 ring-border/20">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80"
                  initial={{ width: 0 }}
                  animate={{ width: `${goalPercent}%` }}
                  transition={{
                    duration: 0.9,
                    delay: 0.8,
                    ease: motionTokens.easings.smooth,
                  }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── FOOTER (fixed bottom) ── */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 min-h-[44px]">
        <span className="text-[11px] text-muted-foreground">
          {untreated === 0 ? (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="h-3 w-3" />
              Catalogue 100% optimise
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {untreated} produit{untreated > 1 ? "s" : ""} restant
              {untreated > 1 ? "s" : ""}
            </span>
          )}
        </span>
        {untreated > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] rounded-lg font-medium text-muted-foreground hover:text-foreground px-2 gap-1"
              onClick={() => router.push("/app/products?filter=unoptimized")}
            >
              Voir
              <ArrowRight className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              className="h-8 text-[11px] rounded-lg gap-1.5 font-medium"
              onClick={onBatchOptimize}
            >
              <Zap className="h-3 w-3" />
              Optimiser {untreated}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main V2 Component ─────────────────────────────────────────────────────

export function OverviewV2({
  kpis,
  context,
  activities = [],
  seoScore = 0,
  coveragePercent = 0,
  coverageTotal = 0,
  coverageOptimized = 0,
  coveragePartial = 0,
  generatedThisMonth = 0,
  prevMonthOptimized = null,
  goal = 250,
}: OverviewV2Props) {
  const router = useRouter();
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [insightsSheetOpen, setInsightsSheetOpen] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const storeId = context?.selectedShopId || null;
  const isDisconnected = context?.connectionStatus === "disconnected";
  const draftsCount = kpis?.blogStats?.draftCount ?? 0;
  const untreated = coverageTotal - coverageOptimized;

  const { topActions, totalCount, grouped, resolvedCount } = useActionCenter({
    storeId,
    isDisconnected,
    draftsCount,
    seoScore,
    opportunitiesCount: 0,
    productsWithoutDescription: untreated,
  });

  const { topInsights, allInsights, groupedActions, hasGeminiEnrichment } =
    useAIInsights({ kpis, seoScore, coveragePercent });

  const criticalCount = allInsights.filter(
    (i) => i.priority === "critical"
  ).length;

  const totalBlog =
    (kpis?.blogStats?.draftCount ?? 0) +
    (kpis?.blogStats?.reviewCount ?? 0) +
    (kpis?.blogStats?.scheduledCount ?? 0) +
    (kpis?.blogStats?.publishedCount ?? 0);
  const publishedCount = kpis?.blogStats?.publishedCount ?? 0;
  const reviewCount = kpis?.blogStats?.reviewCount ?? 0;
  const scheduledCount = kpis?.blogStats?.scheduledCount ?? 0;
  const publishRate =
    totalBlog > 0 ? Math.round((publishedCount / totalBlog) * 100) : 0;

  return (
    <>
      <motion.div
        className="h-full flex flex-col gap-3 overflow-y-auto"
        variants={motionTokens.variants.staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* ─── Row 1: Catalog Coverage + AI Insights ─── */}
        <motion.div
          variants={motionTokens.variants.staggerItem}
          className="grid grid-cols-5 gap-3 shrink-0"
        >
          {/* Catalog Coverage — 3 cols — Gauge + 2x2 Grid + Goal */}
          <V2Card className="col-span-3">
            <CatalogCoverageV2
              total={coverageTotal}
              optimized={coverageOptimized}
              partial={coveragePartial}
              coveragePercent={coveragePercent}
              generatedThisMonth={generatedThisMonth}
              prevMonthOptimized={prevMonthOptimized}
              goal={goal}
              onBatchOptimize={() => setShowGenerateModal(true)}
            />
          </V2Card>

          {/* AI Insights — 2 cols */}
          <V2Card className="col-span-2">
            <div className="grid h-full" style={{ gridTemplateRows: "auto 1fr auto" }}>
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
                  <Sparkles className="h-[18px] w-[18px] text-foreground/70" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                    IA
                  </p>
                  <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                    Insights
                    {allInsights.length > 0 && (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        &middot; {allInsights.length} analyse
                        {allInsights.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {criticalCount > 0 && (
                  <span className="h-5 rounded-full px-2 text-[10px] font-medium border-0 bg-red-500/10 text-red-500 inline-flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {criticalCount}
                  </span>
                )}
                {allInsights.length > 0 && (
                  <button
                    onClick={() => setInsightsSheetOpen(true)}
                    className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Tout voir
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* ── BODY (middle) ── */}
            <div className="min-h-0 overflow-hidden">
            {/* SEO score bar */}
            {seoScore > 0 && (
              <div className="px-4 pb-3 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Score SEO global
                  </span>
                  <span
                    className={cn(
                      "font-medium tabular-nums",
                      seoScore >= 70
                        ? "text-emerald-600"
                        : seoScore >= 40
                          ? "text-amber-600"
                          : "text-red-500"
                    )}
                  >
                    {Math.round(seoScore)}/100
                  </span>
                </div>
                <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      seoScore >= 70
                        ? "bg-emerald-500"
                        : seoScore >= 40
                          ? "bg-amber-500"
                          : "bg-red-500"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${seoScore}%` }}
                    transition={{
                      duration: 0.9,
                      delay: 0.4,
                      ease: motionTokens.easings.smooth,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Insights list */}
            <div className="flex-1 divide-y divide-border/20">
              {allInsights.slice(0, 3).map((insight) => {
                const PriorityIcon =
                  insight.priority === "critical"
                    ? AlertTriangle
                    : insight.priority === "important"
                      ? AlertTriangle
                      : CheckCircle2;
                const priorCls =
                  insight.priority === "critical"
                    ? "text-red-500"
                    : insight.priority === "important"
                      ? "text-amber-500"
                      : "text-muted-foreground";
                const priorLabel =
                  insight.priority === "critical"
                    ? "Critique"
                    : insight.priority === "important"
                      ? "Important"
                      : "Info";

                return (
                  <div
                    key={insight.id}
                    className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-muted/30"
                  >
                    <PriorityIcon
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 mt-0.5",
                        priorCls
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <span
                        className={cn(
                          "text-[10px] font-medium uppercase tracking-wider",
                          priorCls
                        )}
                      >
                        {priorLabel}
                      </span>
                      <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                        {insight.text}
                      </p>
                      {insight.ctaLabel && insight.ctaRoute && (
                        <button
                          className="mt-1 flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                          onClick={() => router.push(insight.ctaRoute!)}
                        >
                          {insight.ctaLabel}
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {allInsights.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 mx-auto mb-3">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Tout est optimise
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Aucun insight critique detecte.
                  </p>
                </div>
              )}
            </div>

            </div>{/* end BODY */}

            {/* ── FOOTER (fixed bottom) ── */}
              <div className="px-4 py-3 border-t border-border/30 flex items-center justify-between min-h-[44px]">
                <span className="text-[11px] text-muted-foreground">
                  {hasGeminiEnrichment ? (
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <Sparkles className="h-3 w-3" />
                      Enrichi par Gemini
                    </span>
                  ) : (
                    `${allInsights.length} analyse${allInsights.length > 1 ? "s" : ""}`
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 gap-1 rounded-lg"
                  onClick={() => setInsightsSheetOpen(true)}
                >
                  Plan d&apos;action
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>{/* end grid */}
          </V2Card>
        </motion.div>

        {/* ─── Row 2: Actions + Activity ─── */}
        <motion.div
          variants={motionTokens.variants.staggerItem}
          className="grid grid-cols-5 gap-3 shrink-0"
        >
          {/* Actions — 3 cols */}
          <V2Card className="col-span-3 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
                  <Zap className="h-[18px] w-[18px] text-foreground/70" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                    Priorites
                  </p>
                  <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                    Actions
                    {totalCount > 0 && (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        &middot; {totalCount} en attente
                      </span>
                    )}
                  </h3>
                </div>
              </div>
              {totalCount > 4 && (
                <button
                  onClick={() => setActionSheetOpen(true)}
                  className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Tout voir
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Action rows */}
            <div className="flex-1 divide-y divide-border/20">
              {topActions.slice(0, 6).map((action, i) => (
                <ActionRowV2 key={action.id} action={action} index={i} />
              ))}
            </div>
          </V2Card>

          {/* Activity Timeline — 2 cols */}
          <V2Card className="col-span-2 flex flex-col max-h-[400px]">
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
                  <Activity className="h-[18px] w-[18px] text-foreground/70" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                    Historique
                  </p>
                  <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                    Activite Recente
                  </h3>
                </div>
              </div>
              {activities.length > 0 && (
                <span className="h-5 rounded-full px-2 text-[10px] font-medium border-0 bg-muted/60 text-muted-foreground inline-flex items-center">
                  {activities.length}
                </span>
              )}
            </div>

            <ScrollArea className="flex-1 px-4 pb-4">
              {activities.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 mx-auto mb-3">
                    <Inbox className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Aucune activite
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs mx-auto">
                    Les actions apparaitront ici.
                  </p>
                </div>
              ) : (
                <div>
                  {activities.slice(0, 10).map((item, i) => (
                    <ActivityItemV2
                      key={item.id}
                      item={item}
                      isLast={
                        i === Math.min(activities.length, 10) - 1
                      }
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </V2Card>
        </motion.div>

        {/* ─── Row 4: Content Pipeline (full width, compact) ─── */}
        <motion.div
          variants={motionTokens.variants.staggerItem}
          className="shrink-0"
        >
          <V2Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
                    <FileText className="h-[18px] w-[18px] text-foreground/70" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                      Blog
                    </p>
                    <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                      Pipeline Contenu
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-medium text-foreground tabular-nums">
                    {totalBlog} total
                  </span>
                  {publishRate > 0 && (
                    <span className="h-5 rounded-full px-2 text-[10px] font-medium border-0 bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {publishRate}% publie
                    </span>
                  )}
                </div>
              </div>

              {/* Segmented bar */}
              <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden flex gap-px mb-4">
                {[
                  {
                    count: draftsCount,
                    color: "bg-amber-500",
                    label: "Brouillons",
                  },
                  {
                    count: reviewCount,
                    color: "bg-blue-500",
                    label: "Revision",
                  },
                  {
                    count: scheduledCount,
                    color: "bg-primary",
                    label: "Planifies",
                  },
                  {
                    count: publishedCount,
                    color: "bg-emerald-500",
                    label: "Publies",
                  },
                ].map((stage) => {
                  const width =
                    totalBlog > 0
                      ? (stage.count / totalBlog) * 100
                      : 0;
                  if (width === 0) return null;
                  return (
                    <motion.div
                      key={stage.label}
                      className={cn("h-full rounded-sm", stage.color)}
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{
                        duration: 0.8,
                        delay: 0.3,
                        ease: motionTokens.easings.smooth,
                      }}
                      title={`${stage.label}: ${stage.count}`}
                    />
                  );
                })}
              </div>

              {/* Stage counters + actions in one row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {[
                    {
                      label: "Brouillons",
                      count: draftsCount,
                      dot: "bg-amber-500",
                    },
                    {
                      label: "Revision",
                      count: reviewCount,
                      dot: "bg-blue-500",
                    },
                    {
                      label: "Planifies",
                      count: scheduledCount,
                      dot: "bg-primary",
                    },
                    {
                      label: "Publies",
                      count: publishedCount,
                      dot: "bg-emerald-500",
                    },
                  ].map((stage) => (
                    <div
                      key={stage.label}
                      className="flex items-center gap-2"
                    >
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          stage.dot
                        )}
                      />
                      <span className="text-[11px] text-muted-foreground">
                        {stage.label}
                      </span>
                      <span className="text-[13px] font-semibold text-foreground tabular-nums">
                        {stage.count}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {draftsCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px] rounded-lg font-medium text-muted-foreground hover:text-foreground px-2 gap-1"
                      onClick={() =>
                        router.push("/app/blog?status=draft")
                      }
                    >
                      Brouillons
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="h-8 text-[11px] rounded-lg gap-1.5 font-medium"
                    onClick={() => router.push("/app/blog/new")}
                  >
                    <Sparkles className="h-3 w-3" />
                    Rediger
                  </Button>
                </div>
              </div>
            </div>
          </V2Card>
        </motion.div>
      </motion.div>

      {/* Sheets */}
      <ActionCenterSheet
        open={actionSheetOpen}
        onOpenChange={setActionSheetOpen}
        grouped={grouped}
        resolvedCount={resolvedCount}
      />
      <AIInsightsSheet
        open={insightsSheetOpen}
        onOpenChange={setInsightsSheetOpen}
        allInsights={allInsights}
        groupedActions={groupedActions}
        seoScore={seoScore}
        hasGeminiEnrichment={hasGeminiEnrichment}
      />
      <GenerateSelectionModal
        open={showGenerateModal}
        onOpenChange={setShowGenerateModal}
      />
    </>
  );
}
