"use client";

import { useGscConnection } from "@/hooks/integrations/useGscConnection";
import { useGscDashboard } from "@/hooks/integrations/useGscDashboard";
import { useSelectedStore } from "@/contexts/StoreContext";
import { useState } from "react";
import { Activity, ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, Line } from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

/* ─── Period tabs ─────────────────────────────────────────────── */

const PERIOD_OPTIONS = [
  { label: "7J", days: 7 },
  { label: "14J", days: 14 },
  { label: "28J", days: 28 },
  { label: "90J", days: 90 },
] as const;

type PeriodDays = (typeof PERIOD_OPTIONS)[number]["days"];

/* ─── Helpers ─────────────────────────────────────────────────── */

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function calculateTrend(current: number, previous: number) {
  if (!previous) return { value: "0.0", isPositive: true };
  const change = ((current - previous) / previous) * 100;
  return { value: Math.abs(change).toFixed(1), isPositive: change >= 0 };
}

/* ─── Trend chip ──────────────────────────────────────────────── */

function TrendChip({ value, isPositive }: { value: string; isPositive: boolean }) {
  const numVal = parseFloat(value);
  if (numVal === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
        <Minus className="h-2.5 w-2.5" />
      </span>
    );
  }
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-[10px] font-medium tabular-nums",
      isPositive ? "text-emerald-600" : "text-red-500"
    )}>
      {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {value}%
    </span>
  );
}

/* ─── Chart colors ────────────────────────────────────────────── */

const CHART_COLORS = {
  clicks:      { stroke: "hsl(217, 91%, 60%)", fill: "hsl(217, 91%, 60%)" },
  impressions: { stroke: "hsl(263, 70%, 58%)", fill: "hsl(263, 70%, 58%)" },
  ctr:         { stroke: "hsl(160, 84%, 39%)", fill: "hsl(160, 84%, 39%)" },
  position:    { stroke: "hsl(38, 92%, 50%)",  fill: "hsl(38, 92%, 50%)" },
} as const;

/* ─── Main component ─────────────────────────────────────────── */

export function GscTrafficOverviewCardV2() {
  const router = useRouter();
  const [days, setDays] = useState<PeriodDays>(28);
  const { connections, isConnected, isLoading: connLoading } = useGscConnection({ linkedOnly: true });
  const { selectedStore } = useSelectedStore();

  const storeMatchedSite = selectedStore
    ? connections.find(c => c.store_id === selectedStore.id)
    : null;
  const effectiveSiteId = storeMatchedSite?.site_id || connections[0]?.site_id || null;

  const { data: dashboard, isLoading: dashLoading } = useGscDashboard(
    isConnected ? effectiveSiteId : null,
    days
  );

  const isLoading = connLoading || dashLoading;

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-4 gap-4">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-2.5 w-12" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
        <Skeleton className="flex-1 w-full rounded-xl" />
      </div>
    );
  }

  /* ── Empty / not connected ── */
  if (!isConnected || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-full text-center space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50">
          <Activity className="h-5 w-5 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Trafic Organique</p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-[200px]">
            Connectez Google Search Console pour voir votre trafic organique.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.href = "/api/gsc/oauth/authorize"}
          className="h-8 text-[11px] rounded-lg gap-1.5 font-medium mt-1"
        >
          Connecter GSC
        </Button>
      </div>
    );
  }

  const { kpis, kpis_previous, daily } = dashboard;

  const clicksTrend = calculateTrend(kpis.total_clicks, kpis_previous?.total_clicks || 0);
  const impressionsTrend = calculateTrend(kpis.total_impressions, kpis_previous?.total_impressions || 0);
  const ctrTrend = calculateTrend(kpis.avg_ctr, kpis_previous?.avg_ctr || 0);
  const positionTrend = (() => {
    const prev = kpis_previous?.avg_position || 0;
    if (!prev) return { value: "0.0", isPositive: true };
    const change = ((kpis.avg_position - prev) / prev) * 100;
    return { value: Math.abs(change).toFixed(1), isPositive: change <= 0 };
  })();

  const chartData = daily.map(d => ({
    ...d,
    date: new Date(d.stat_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
  }));

  const metrics = [
    { label: "Clics", value: formatNumber(kpis.total_clicks), trend: clicksTrend, colorKey: "clicks" as const },
    { label: "Impressions", value: formatNumber(kpis.total_impressions), trend: impressionsTrend, colorKey: "impressions" as const },
    { label: "CTR Moyen", value: `${(kpis.avg_ctr * 100).toFixed(1)}%`, trend: ctrTrend, colorKey: "ctr" as const },
    { label: "Position", value: `#${kpis.avg_position.toFixed(1)}`, trend: positionTrend, colorKey: "position" as const },
  ];

  return (
    <div
      className="relative flex flex-col h-full cursor-pointer group overflow-hidden"
      onClick={() => router.push("/app/seo")}
    >

      {/* ── Header ── */}
      <div className="relative flex items-center justify-between px-4 pt-4 pb-2 z-10">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50">
              <Activity className="h-[18px] w-[18px] text-foreground/70" />
            </div>
            {/* Static live dot */}
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-card" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider leading-none mb-1">
              Google Search Console
            </p>
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Trafic Organique</h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Period tabs */}
          <div className="flex items-center bg-muted/40 rounded-lg p-0.5 ring-1 ring-border/30">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={(e) => { e.stopPropagation(); setDays(opt.days); }}
                className={cn(
                  "h-5 px-2 text-[10px] font-medium rounded-md transition-colors",
                  days === opt.days
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground/60 hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            className="opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/60"
            onClick={(e) => { e.stopPropagation(); router.push("/app/seo"); }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hairline divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      {/* ── KPI metrics row ── */}
      <div className="relative grid grid-cols-4 z-10 px-4 py-2.5 gap-2">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="flex flex-col gap-0.5 px-2 py-1.5 rounded-lg transition-colors hover:bg-muted/30"
          >
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider leading-none">
              {m.label}
            </span>
            <span className="text-xl font-semibold tracking-tight text-foreground leading-none tabular-nums">
              {m.value}
            </span>
            <TrendChip value={m.trend.value} isPositive={m.trend.isPositive} />
          </div>
        ))}
      </div>

      {/* ── Chart ── */}
      <div className="relative flex-1 w-full min-h-[80px] mt-1">
        {/* Legend */}
        <div className="absolute top-1.5 left-4 flex items-center gap-3 z-10 pointer-events-none">
          {[
            { color: CHART_COLORS.clicks.stroke, label: "Clics", dashed: false },
            { color: CHART_COLORS.impressions.stroke, label: "Impressions", dashed: false },
            { color: CHART_COLORS.ctr.stroke, label: "CTR", dashed: false },
            { color: CHART_COLORS.position.stroke, label: "Position", dashed: true },
          ].map(leg => (
            <div key={leg.label} className="flex items-center gap-1">
              {leg.dashed ? (
                <div className="w-4 border-t-2 border-dashed" style={{ borderColor: leg.color }} />
              ) : (
                <div className="w-3 h-[2px] rounded-full" style={{ background: leg.color }} />
              )}
              <span className="text-[10px] font-medium text-muted-foreground/60">{leg.label}</span>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 28, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="v2ColorClicks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.clicks.fill} stopOpacity={0.3} />
                <stop offset="100%" stopColor={CHART_COLORS.clicks.fill} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="v2ColorImpressions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.impressions.fill} stopOpacity={0.15} />
                <stop offset="100%" stopColor={CHART_COLORS.impressions.fill} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="v2ColorCtr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.ctr.fill} stopOpacity={0.2} />
                <stop offset="100%" stopColor={CHART_COLORS.ctr.fill} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                fontSize: "11px",
                padding: "10px 13px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              }}
              itemStyle={{ paddingTop: 3, paddingBottom: 3 }}
              labelStyle={{ marginBottom: "6px", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.5 }}
              labelFormatter={(label) => label}
              formatter={(value, name) => {
                if (name === "Position") return [`#${Number(value).toFixed(1)}`, "Position"];
                if (name === "Impressions") return [formatNumber(Number(value)), "Impressions"];
                if (name === "CTR") return [`${(Number(value) * 100).toFixed(2)}%`, "CTR"];
                return [value, name];
              }}
            />
            <YAxis yAxisId="clicks" hide />
            <YAxis yAxisId="impressions" hide />
            <YAxis yAxisId="ctr" hide />
            <YAxis yAxisId="position" hide reversed />
            <Area yAxisId="impressions" type="monotone" dataKey="impressions"
              stroke={CHART_COLORS.impressions.stroke} strokeWidth={1.5}
              fillOpacity={1} fill="url(#v2ColorImpressions)" name="Impressions" />
            <Area yAxisId="clicks" type="monotone" dataKey="clicks"
              stroke={CHART_COLORS.clicks.stroke} strokeWidth={2}
              fillOpacity={1} fill="url(#v2ColorClicks)" name="Clics" />
            <Area yAxisId="ctr" type="monotone" dataKey="ctr"
              stroke={CHART_COLORS.ctr.stroke} strokeWidth={1.5}
              fillOpacity={1} fill="url(#v2ColorCtr)" name="CTR" />
            <Line yAxisId="position" type="monotone" dataKey="position"
              stroke={CHART_COLORS.position.stroke} strokeWidth={1.5}
              dot={false} strokeDasharray="5 3" name="Position" />
          </AreaChart>
        </ResponsiveContainer>

        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none rounded-b-xl" />
      </div>
    </div>
  );
}
