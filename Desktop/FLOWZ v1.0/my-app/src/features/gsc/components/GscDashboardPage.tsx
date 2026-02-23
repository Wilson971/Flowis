"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Search, ExternalLink, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useGscConnection } from "@/hooks/integrations/useGscConnection";
import { useGscDashboard } from "@/hooks/integrations/useGscDashboard";
import { useSelectedStore } from "@/contexts/StoreContext";
import { GscKpiCards } from "./GscKpiCards";
import { GscPerformanceChart } from "./GscPerformanceChart";
import { GscTopKeywordsTable, GscTopPagesTable } from "./GscTopTables";

// ============================================================================
// Empty State (not connected)
// ============================================================================

function GscEmptyState() {
    return (
        <Card className="border-border/40">
            <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-4 py-12">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Search className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2 max-w-md">
                        <h3 className="text-lg font-bold">Connecter Google Search Console</h3>
                        <p className="text-sm text-muted-foreground">
                            Visualisez vos performances Google : clics, impressions, CTR, position.
                            Identifiez vos meilleurs mots-cles et pages.
                        </p>
                    </div>
                    <Button
                        onClick={() => { window.location.href = "/api/gsc/oauth/authorize"; }}
                        className="gap-2 mt-2"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Connecter GSC
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function DashboardSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
            </div>
            <Skeleton className="h-[340px] rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Skeleton className="h-[300px] rounded-xl" />
                <Skeleton className="h-[300px] rounded-xl" />
            </div>
        </div>
    );
}

// ============================================================================
// Main Dashboard
// ============================================================================

const EMPTY_KPIS = { total_clicks: 0, total_impressions: 0, avg_ctr: 0, avg_position: 0 };

export function GscDashboardPage() {
    const { connections, isConnected, isLoading: connLoading, sync, isSyncing } = useGscConnection({ linkedOnly: true });
    const { selectedStore } = useSelectedStore();
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    const [days, setDays] = useState(28);

    // Auto-select: match current store first, then fallback to first site
    const storeMatchedSite = selectedStore
        ? connections.find(c => c.store_id === selectedStore.id)
        : null;
    const effectiveSiteId = selectedSiteId || storeMatchedSite?.site_id || connections[0]?.site_id || null;

    const { data: dashboard, isLoading: dashLoading } = useGscDashboard(
        isConnected ? effectiveSiteId : null,
        days
    );

    const selectedSite = connections.find(c => c.site_id === effectiveSiteId);

    if (connLoading) return <DashboardSkeleton />;
    if (!isConnected) return <GscEmptyState />;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Search Console</h1>
                            <p className="text-xs text-muted-foreground">
                                Performances Google de vos sites
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Site selector */}
                        {connections.length > 1 && (
                            <Select
                                value={effectiveSiteId || ""}
                                onValueChange={(v) => setSelectedSiteId(v)}
                            >
                                <SelectTrigger className="w-[220px] h-8 text-xs">
                                    <SelectValue placeholder="Selectionner un site" />
                                </SelectTrigger>
                                <SelectContent>
                                    {connections.map((c) => (
                                        <SelectItem key={c.site_id} value={c.site_id} className="text-xs">
                                            {c.site_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {/* Period selector */}
                        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                            <SelectTrigger className="w-[100px] h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7" className="text-xs">7 jours</SelectItem>
                                <SelectItem value="28" className="text-xs">28 jours</SelectItem>
                                <SelectItem value="90" className="text-xs">90 jours</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sync button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => effectiveSiteId && sync({ siteId: effectiveSiteId })}
                            disabled={isSyncing || !effectiveSiteId}
                            className="gap-1.5 h-8 text-xs"
                        >
                            <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
                            {isSyncing ? "Sync..." : "Synchroniser"}
                        </Button>
                    </div>
                </div>

                {/* Site info badge */}
                {selectedSite && connections.length <= 1 && (
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                            {selectedSite.site_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </Badge>
                        {selectedSite.email && (
                            <span className="text-[11px] text-muted-foreground">{selectedSite.email}</span>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            {dashLoading ? (
                <DashboardSkeleton />
            ) : (
                <>
                    {/* KPI Cards */}
                    <GscKpiCards
                        kpis={dashboard?.kpis || EMPTY_KPIS}
                        kpisPrevious={dashboard?.kpis_previous || EMPTY_KPIS}
                    />

                    {/* Performance Chart */}
                    <GscPerformanceChart data={dashboard?.daily || []} />

                    {/* Top Keywords + Top Pages */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <GscTopKeywordsTable keywords={dashboard?.top_keywords || []} />
                        <GscTopPagesTable pages={dashboard?.top_pages || []} />
                    </div>
                </>
            )}
        </div>
    );
}
