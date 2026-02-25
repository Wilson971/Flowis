"use client";

import { useGscConnection } from "@/hooks/integrations/useGscConnection";
import { useGscDashboard } from "@/hooks/integrations/useGscDashboard";
import { useSelectedStore } from "@/contexts/StoreContext";
import { TrendingUp, MousePointerClick, Eye, ExternalLink, Activity, MapPin } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, Line } from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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

export function GscTrafficOverviewCard() {
    const router = useRouter();
    const { connections, isConnected, isLoading: connLoading } = useGscConnection({ linkedOnly: true });
    const { selectedStore } = useSelectedStore();

    const storeMatchedSite = selectedStore
        ? connections.find(c => c.store_id === selectedStore.id)
        : null;
    const effectiveSiteId = storeMatchedSite?.site_id || connections[0]?.site_id || null;

    const { data: dashboard, isLoading: dashLoading } = useGscDashboard(
        isConnected ? effectiveSiteId : null,
        28
    );

    const isLoading = connLoading || dashLoading;

    if (isLoading) {
        return (
            <div className="flex flex-col h-full p-4 gap-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-xl" />
                    <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-2.5 w-20" />
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-0 border border-border/30 rounded-xl overflow-hidden">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="px-3 py-3 space-y-2">
                            <Skeleton className="h-2.5 w-12" />
                            <Skeleton className="h-5 w-10" />
                            <Skeleton className="h-4 w-8 rounded-full" />
                        </div>
                    ))}
                </div>
                <Skeleton className="flex-1 w-full rounded-xl" />
            </div>
        );
    }

    if (!isConnected || !dashboard) {
        return (
            <div className="relative flex flex-col items-center justify-center p-6 h-full text-center space-y-4 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
                </div>
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold">Trafic Organique</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 max-w-[180px] leading-relaxed">
                        Connectez Google Search Console pour voir votre trafic organique.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = "/api/gsc/oauth/authorize"}
                    className="text-xs h-8 rounded-lg"
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
        {
            icon: <MousePointerClick className="w-3.5 h-3.5" />,
            label: "Clics",
            value: formatNumber(kpis.total_clicks),
            trend: clicksTrend,
            color: "#4285f4",
            gradId: "colorClicksOverview",
        },
        {
            icon: <Eye className="w-3.5 h-3.5" />,
            label: "Impressions",
            value: formatNumber(kpis.total_impressions),
            trend: impressionsTrend,
            color: "#8b5cf6",
            gradId: "colorImpressionsOverview",
        },
        {
            icon: <TrendingUp className="w-3.5 h-3.5" />,
            label: "CTR Moyen",
            value: `${(kpis.avg_ctr * 100).toFixed(1)}%`,
            trend: ctrTrend,
            color: "#10b981",
            gradId: null,
        },
        {
            icon: <MapPin className="w-3.5 h-3.5" />,
            label: "Position",
            value: `#${kpis.avg_position.toFixed(1)}`,
            trend: positionTrend,
            color: "#f59e0b",
            gradId: null,
        },
    ];

    return (
        <div
            className="relative flex flex-col h-full cursor-pointer group overflow-hidden"
            onClick={() => router.push("/app/seo")}
        >
            {/* Ambient background glows */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-8 -left-8 w-40 h-40 bg-[#4285f4]/8 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-36 h-36 bg-[#8b5cf6]/8 rounded-full blur-3xl" />
            </div>

            {/* ── Header ── */}
            <div className="relative flex items-center justify-between px-4 pt-4 pb-3 z-10">
                <div className="flex items-center gap-3">
                    {/* Icon badge with live pulse */}
                    <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                            <Activity className="w-4 h-4" />
                        </div>
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 ring-2 ring-card" />
                        </span>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold leading-none text-foreground">Trafic Organique</h3>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-medium tracking-wide">Google Search Console</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-muted-foreground/70 bg-muted/50 border border-border/40 px-2.5 py-1 rounded-full tracking-widest uppercase">
                        28J
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg bg-muted/60 text-muted-foreground hover:text-foreground">
                        <ExternalLink className="w-3 h-3" />
                    </div>
                </div>
            </div>

            {/* Hairline separator */}
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

            {/* ── KPI metrics row ── */}
            <div className="relative grid grid-cols-4 z-10 px-2 py-1">
                {metrics.map((m, i) => (
                    <div
                        key={i}
                        className="relative flex items-center gap-2 px-2 py-1.5 rounded-lg mx-0.5 transition-colors duration-200 hover:bg-white/[0.03]"
                    >
                        {/* Left accent bar */}
                        <div
                            className="shrink-0 w-[2px] h-7 rounded-full opacity-70"
                            style={{ background: `linear-gradient(to bottom, ${m.color}, transparent)` }}
                        />

                        <div className="flex flex-col min-w-0">
                            {/* Label */}
                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-50 leading-none mb-1" style={{ color: m.color }}>
                                {m.label}
                            </span>
                            {/* Value + trend inline */}
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-black tracking-tight leading-none tabular-nums" style={{ color: m.color }}>
                                    {m.value}
                                </span>
                                <span className={cn(
                                    "text-[9px] font-bold leading-none",
                                    m.trend.isPositive ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {m.trend.isPositive ? "↑" : "↓"}{m.trend.value}%
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Chart — full bleed ── */}
            <div className="relative flex-1 w-full min-h-[80px] mt-1">
                {/* Chart legend */}
                <div className="absolute top-1.5 left-4 flex items-center gap-3.5 z-10 pointer-events-none">
                    {[
                        { color: "#4285f4", label: "Clics", dashed: false },
                        { color: "#8b5cf6", label: "Impressions", dashed: false },
                        { color: "#10b981", label: "CTR", dashed: false },
                        { color: "#f59e0b", label: "Position", dashed: true },
                    ].map(leg => (
                        <div key={leg.label} className="flex items-center gap-1">
                            {leg.dashed ? (
                                <div className="w-4 border-t-2 border-dashed" style={{ borderColor: leg.color }} />
                            ) : (
                                <div className="w-3 h-[2px] rounded-full" style={{ background: leg.color }} />
                            )}
                            <span className="text-[9px] font-medium text-muted-foreground/50">{leg.label}</span>
                        </div>
                    ))}
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 24, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorClicksOverview" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#4285f4" stopOpacity={0.45} />
                                <stop offset="100%" stopColor="#4285f4" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorImpressionsOverview" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.22} />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorCtrOverview" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            contentStyle={{
                                borderRadius: "12px",
                                background: "rgba(8, 8, 12, 0.94)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                fontSize: "11px",
                                padding: "10px 13px",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                            }}
                            itemStyle={{ paddingTop: 3, paddingBottom: 3, color: "rgba(255,255,255,0.75)" }}
                            labelStyle={{ color: "rgba(255,255,255,0.3)", marginBottom: "6px", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase" }}
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
                        <Area
                            yAxisId="impressions"
                            type="monotone"
                            dataKey="impressions"
                            stroke="#8b5cf6"
                            strokeWidth={1.5}
                            fillOpacity={1}
                            fill="url(#colorImpressionsOverview)"
                            name="Impressions"
                        />
                        <Area
                            yAxisId="clicks"
                            type="monotone"
                            dataKey="clicks"
                            stroke="#4285f4"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorClicksOverview)"
                            name="Clics"
                        />
                        <Area
                            yAxisId="ctr"
                            type="monotone"
                            dataKey="ctr"
                            stroke="#10b981"
                            strokeWidth={1.5}
                            fillOpacity={1}
                            fill="url(#colorCtrOverview)"
                            name="CTR"
                        />
                        <Line
                            yAxisId="position"
                            type="monotone"
                            dataKey="position"
                            stroke="#f59e0b"
                            strokeWidth={1.5}
                            dot={false}
                            strokeDasharray="5 3"
                            name="Position"
                        />
                    </AreaChart>
                </ResponsiveContainer>

                {/* Bottom fade overlay */}
                <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-card to-transparent pointer-events-none rounded-b-xl" />
            </div>
        </div>
    );
}
