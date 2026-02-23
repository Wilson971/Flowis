"use client";

import { useGscConnection } from "@/hooks/integrations/useGscConnection";
import { useGscDashboard } from "@/hooks/integrations/useGscDashboard";
import { useSelectedStore } from "@/contexts/StoreContext";
import { TrendingUp, MousePointerClick, Eye, ExternalLink, Activity } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
}

function calculateTrend(current: number, previous: number) {
    if (!previous) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
        value: Math.abs(change).toFixed(1),
        isPositive: change >= 0
    };
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
            <div className="flex flex-col h-full justify-between p-4">
                <Skeleton className="h-6 w-1/3 mb-4" />
                <div className="flex space-x-4 mb-6">
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-10 w-1/4" />
                </div>
                <Skeleton className="h-[100px] w-full mt-auto" />
            </div>
        );
    }

    if (!isConnected || !dashboard) {
        return (
            <div className="flex flex-col items-center justify-center p-6 h-full text-center space-y-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold">Trafic Organique</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                        Connectez Google Search Console pour voir votre trafic organique.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.href = "/api/gsc/oauth/authorize"} className="mt-2 text-xs h-8">
                    Connecter
                </Button>
            </div>
        );
    }

    const { kpis, kpis_previous, daily } = dashboard;

    const clicksTrend = calculateTrend(kpis.total_clicks, kpis_previous?.total_clicks || 0);
    const impressionsTrend = calculateTrend(kpis.total_impressions, kpis_previous?.total_impressions || 0);
    const ctrTrend = calculateTrend(kpis.avg_ctr, kpis_previous?.avg_ctr || 0);

    const chartData = daily.map(d => ({
        ...d,
        date: new Date(d.stat_date).toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit' })
    }));

    return (
        <div
            className="flex flex-col h-full p-4 cursor-pointer group"
            onClick={() => router.push("/app/seo")}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Activity className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold text-sm">Trafic Organique</h3>
                </div>
                <span className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider bg-muted/50 px-2 py-0.5 rounded-full">
                    28 jours
                </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-1 z-10 w-full mt-1">
                {/* Clicks */}
                <div>
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <MousePointerClick className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Clics</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold tracking-tight text-[#4285f4]">
                            {formatNumber(kpis.total_clicks)}
                        </span>
                        <span className={cn(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded-sm",
                            clicksTrend.isPositive ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
                        )}>
                            {clicksTrend.isPositive ? "+" : "-"}{clicksTrend.value}%
                        </span>
                    </div>
                </div>

                {/* Impressions */}
                <div>
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Impressions</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold tracking-tight text-[#5e35b1]">
                            {formatNumber(kpis.total_impressions)}
                        </span>
                        <span className={cn(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded-sm",
                            impressionsTrend.isPositive ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
                        )}>
                            {impressionsTrend.isPositive ? "+" : "-"}{impressionsTrend.value}%
                        </span>
                    </div>
                </div>

                {/* CTR */}
                <div>
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">CTR Moyen</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold tracking-tight text-foreground">
                            {(kpis.avg_ctr * 100).toFixed(1)}%
                        </span>
                        <span className={cn(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded-sm",
                            ctrTrend.isPositive ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
                        )}>
                            {ctrTrend.isPositive ? "+" : "-"}{ctrTrend.value}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Sparkline Chart */}
            <div className="flex-1 w-full min-h-[40px] relative -mx-2 px-2 -mb-2 mt-1">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorClicksOverview" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4285f4" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#4285f4" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorImpressionsOverview" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#5e35b1" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#5e35b1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontSize: '12px', padding: '8px' }}
                            itemStyle={{ paddingTop: 0, paddingBottom: 0 }}
                            labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                            labelFormatter={(label) => `Le ${label}`}
                        />
                        <YAxis yAxisId="clicks" hide />
                        <YAxis yAxisId="impressions" hide />
                        <Area
                            yAxisId="impressions"
                            type="monotone"
                            dataKey="impressions"
                            stroke="#5e35b1"
                            strokeWidth={2}
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
                    </AreaChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 bg-gradient-to-t from-card/30 to-transparent pointer-events-none" />
            </div>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-1 rounded bg-muted/50 text-muted-foreground">
                    <ExternalLink className="w-3.5 h-3.5" />
                </div>
            </div>
        </div>
    );
}
