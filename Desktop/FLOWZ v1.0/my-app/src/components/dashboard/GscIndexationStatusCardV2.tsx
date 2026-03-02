"use client";

import { useGscConnection } from "@/hooks/integrations/useGscConnection";
import { useGscIndexation } from "@/hooks/integrations/useGscIndexation";
import { useSelectedStore } from "@/contexts/StoreContext";
import {
  ShieldCheck,
  FileSearch,
  ExternalLink,
  ChevronRight,
  Bot,
  EyeOff,
  Search,
  Ban,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useMemo, useState, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Sector,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
} from "recharts";

/* ─── Types ──────────────────────────────────────────────────── */

interface SegmentEntry {
  name: string;
  value: number;
  color: string;
  filter: string;
  label: string;
}

/* ─── Active arc shape ───────────────────────────────────────── */

function ActiveArcShape(props: Record<string, unknown>) {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill,
  } = props as {
    cx: number; cy: number; innerRadius: number; outerRadius: number;
    startAngle: number; endAngle: number; fill: string;
  };
  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={(outerRadius as number) + 3}
        outerRadius={(outerRadius as number) + 7}
        startAngle={startAngle} endAngle={endAngle}
        fill={fill} opacity={0.18}
      />
      <Sector
        cx={cx} cy={cy}
        innerRadius={(innerRadius as number) - 2}
        outerRadius={(outerRadius as number) + 4}
        startAngle={startAngle} endAngle={endAngle}
        fill={fill} opacity={1}
      />
    </g>
  );
}

/* ─── Tooltips ───────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DonutTooltip(props: any) {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as SegmentEntry;
  return (
    <div className="bg-popover border border-border rounded-xl shadow-xl px-3 py-2 text-xs min-w-[130px]">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
        <span className="font-semibold text-foreground">{d.label}</span>
      </div>
      <div className="flex justify-between gap-4 tabular-nums text-muted-foreground">
        <span>{d.value} pages</span>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TrendTooltip(props: any) {
  const { active, payload, label } = props;
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-2.5 py-1.5 text-[10px]">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-semibold text-foreground">{payload[0].value}% indexees</p>
    </div>
  );
}

/* ─── Drill-down reasons ─────────────────────────────────────── */

const NOT_INDEXED_REASONS = [
  {
    key: "crawled_not_indexed" as const,
    label: "Crawlee, non indexee",
    icon: Bot,
    filter: "crawled_not_indexed",
    hint: "Google a crawle la page mais a choisi de ne pas l'indexer",
  },
  {
    key: "discovered_not_indexed" as const,
    label: "Decouverte, non crawlee",
    icon: Search,
    filter: "discovered_not_indexed",
    hint: "Google a trouve l'URL mais ne l'a pas encore crawlee",
  },
  {
    key: "noindex" as const,
    label: "Balise noindex",
    icon: EyeOff,
    filter: "noindex",
    hint: "La page a une directive noindex",
  },
  {
    key: "blocked_robots" as const,
    label: "Bloquee robots.txt",
    icon: Ban,
    filter: "blocked_robots",
    hint: "Le fichier robots.txt empeche Google de crawler cette URL",
  },
  {
    key: "unknown" as const,
    label: "Statut inconnu",
    icon: HelpCircle,
    filter: "unknown",
    hint: "Statut en attente d'inspection GSC",
  },
] as const;

/* ─── Semantic chart colors ──────────────────────────────────── */

const SEGMENT_COLORS = {
  indexed: "#10b981",      // emerald-500
  not_indexed: "#f59e0b",  // amber-500
  errors: "#ef4444",       // red-500
} as const;

/* ─── Main component ─────────────────────────────────────────── */

export function GscIndexationStatusCardV2() {
  const router = useRouter();
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { connections, isConnected, isLoading: connLoading } = useGscConnection({ linkedOnly: true });
  const { selectedStore } = useSelectedStore();

  const storeMatchedSite = selectedStore
    ? connections.find((c) => c.store_id === selectedStore.id)
    : null;
  const effectiveSiteId = storeMatchedSite?.site_id || connections[0]?.site_id || null;

  const { overview, isOverviewLoading } = useGscIndexation(isConnected ? effectiveSiteId : null);

  const isLoading = connLoading || isOverviewLoading;

  const { trendData, delta } = useMemo(() => {
    const history = overview?.history ?? [];
    if (history.length < 2) return { trendData: [], delta: null };
    const safeTotal = overview!.total || 1;
    const data = history.map((h) => ({
      date: new Date(h.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      rate: Math.round(((h.indexed ?? 0) / (h.total || safeTotal)) * 100),
    }));
    const prev = data[data.length - 2].rate;
    const curr = data[data.length - 1].rate;
    return { trendData: data, delta: curr - prev };
  }, [overview]);

  const onPieEnter = useCallback((_: unknown, index: number) => setActiveIndex(index), []);
  const onPieLeave = useCallback(() => setActiveIndex(null), []);

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex flex-col h-full justify-between p-4">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center py-4">
          <Skeleton className="h-28 w-28 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
      </div>
    );
  }

  /* ── Not connected ── */
  if (!isConnected || !overview) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-full text-center space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50">
          <FileSearch className="h-5 w-5 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Sante Indexation</p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-[200px]">
            Les donnees d&apos;indexation ne sont pas disponibles.
          </p>
        </div>
      </div>
    );
  }

  const total = overview.total || 0;
  const indexed = overview.indexed || 0;
  const errors = overview.errors || 0;
  const notIndexed = overview.not_indexed || 0;
  const percentage = total > 0 ? Math.round((indexed / total) * 100) : 0;
  const isHealthy = percentage > 80 && errors === 0;

  const segments: SegmentEntry[] = [
    { name: "indexed", value: indexed, color: SEGMENT_COLORS.indexed, filter: "indexed", label: "Indexees" },
    { name: "not_indexed", value: notIndexed, color: SEGMENT_COLORS.not_indexed, filter: "not_indexed", label: "Non indexees" },
    { name: "errors", value: errors, color: SEGMENT_COLORS.errors, filter: "errors", label: "Erreurs" },
  ].filter((s) => s.value > 0);

  const DeltaIcon = delta === null ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaColor = delta === null ? "text-muted-foreground"
    : delta > 0 ? "text-emerald-600"
    : delta < 0 ? "text-red-500"
    : "text-muted-foreground";

  return (
    <div className="flex flex-col h-full p-4 relative group">

      {/* ── Header — Vercel style ── */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
            {isHealthy
              ? <ShieldCheck className="h-[18px] w-[18px] text-foreground/70" />
              : <FileSearch className="h-[18px] w-[18px] text-foreground/70" />
            }
          </div>
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider leading-none mb-1">
              SEO
            </p>
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Indexation</h3>
          </div>
        </div>
        <span className="h-5 rounded-full px-2 text-[10px] font-medium border-0 bg-muted/60 text-muted-foreground inline-flex items-center">
          Apercu
        </span>
      </div>

      {/* ── Donut ── */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%" minHeight={130}>
          <PieChart>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Pie
              data={segments}
              cx="50%"
              cy="50%"
              innerRadius="52%"
              outerRadius="72%"
              dataKey="value"
              strokeWidth={0}
              {...{ activeIndex: activeIndex ?? undefined, activeShape: ActiveArcShape } as any}
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              onClick={(entry: SegmentEntry) => router.push(`/app/seo?filter=${entry.filter}`)}
              isAnimationActive
              animationBegin={0}
              animationDuration={900}
              animationEasing="ease-out"
              style={{ cursor: "pointer" }}
            >
              {segments.map((seg) => (
                <Cell key={seg.name} fill={seg.color} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} cursor={false} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-semibold tracking-tight text-foreground leading-none">
            {percentage}%
          </span>
          {DeltaIcon && delta !== null && (
            <span className={cn("flex items-center gap-0.5 text-[10px] font-medium mt-0.5", deltaColor)}>
              <DeltaIcon className="w-2.5 h-2.5" />
              {Math.abs(delta)}%
            </span>
          )}
          <span className="text-[10px] text-muted-foreground/60 mt-0.5 uppercase tracking-wider font-medium">
            indexees
          </span>
        </div>
      </div>

      {/* ── Trend sparkline ── */}
      {trendData.length >= 3 && (
        <div className="h-10 w-full -mx-1 mb-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 2, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="v2-gsc-trend-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis domain={["auto", "auto"]} hide />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "3 3" }} />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                fill="url(#v2-gsc-trend-fill)"
                dot={false}
                activeDot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                isAnimationActive
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── 3 metrics ── */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); router.push("/app/seo?filter=indexed"); }}
          className="flex flex-col p-2 rounded-lg bg-emerald-500/5 ring-1 ring-emerald-500/10 hover:bg-emerald-500/10 transition-colors text-left"
        >
          <span className="text-[10px] uppercase font-medium text-muted-foreground/60 tracking-wider mb-0.5">Valides</span>
          <span className="text-base font-semibold tracking-tight text-success tabular-nums">{indexed}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (notIndexed > 0) setDrilldownOpen((v) => !v);
            else router.push("/app/seo?filter=not_indexed");
          }}
          className={cn(
            "flex flex-col p-2 rounded-lg ring-1 transition-colors text-left",
            notIndexed > 0
              ? "bg-amber-500/5 ring-amber-500/10 hover:bg-amber-500/10"
              : "bg-muted/30 ring-border/20 hover:bg-muted/50"
          )}
        >
          <span className={cn(
            "text-[10px] uppercase font-medium tracking-wider mb-0.5 flex items-center gap-0.5",
            notIndexed > 0 ? "text-muted-foreground/60" : "text-muted-foreground/60"
          )}>
            Non idx.
            {notIndexed > 0 && (
              <ChevronRight className={cn("w-2.5 h-2.5 transition-transform", drilldownOpen && "rotate-90")} />
            )}
          </span>
          <span className={cn("text-base font-semibold tracking-tight tabular-nums", notIndexed > 0 ? "text-warning" : "text-foreground")}>
            {notIndexed}
          </span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); router.push("/app/seo?filter=errors"); }}
          className={cn(
            "flex flex-col p-2 rounded-lg ring-1 transition-colors text-left",
            errors > 0
              ? "bg-red-500/5 ring-red-500/10 hover:bg-red-500/10"
              : "bg-muted/30 ring-border/20 hover:bg-muted/50"
          )}
        >
          <span className="text-[10px] uppercase font-medium text-muted-foreground/60 tracking-wider mb-0.5">
            Erreurs
          </span>
          <span className={cn("text-base font-semibold tracking-tight tabular-nums", errors > 0 ? "text-destructive" : "text-foreground")}>
            {errors}
          </span>
        </button>
      </div>

      {/* ── Drill-down: GSC reasons ── */}
      {drilldownOpen && notIndexed > 0 && (
        <div className="mt-2 space-y-1 border-t border-border/30 pt-2">
          <p className="text-[10px] uppercase font-medium text-muted-foreground/60 tracking-wider mb-1.5">
            Raisons GSC
          </p>
          {NOT_INDEXED_REASONS.map(({ key, label, icon: Icon, filter, hint }) => {
            const count = overview[key] ?? 0;
            if (count === 0) return null;
            const pct = notIndexed > 0 ? Math.round((count / notIndexed) * 100) : 0;
            return (
              <button
                key={key}
                onClick={(e) => { e.stopPropagation(); router.push(`/app/seo?filter=${filter}`); }}
                title={hint}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-left",
                  "bg-muted/20 hover:bg-muted/40"
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0 text-foreground/70" />
                <span className="flex-1 text-xs font-medium text-foreground truncate">{label}</span>
                <span className="text-xs font-semibold tabular-nums text-foreground">{count}</span>
                <span className="text-[10px] text-muted-foreground/60 w-7 text-right shrink-0">{pct}%</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Hover external link */}
      <button
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/60"
        onClick={(e) => { e.stopPropagation(); router.push("/app/seo"); }}
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
