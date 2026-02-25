"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    RefreshCw,
    Search,
    ExternalLink,
    TrendingUp,
    BarChart3,
    Type,
    FileText,
    Lightbulb,
    ArrowUpDown,
    ShieldCheck,
    Info,
    ListChecks,
    Map,
    ClipboardList,
} from "lucide-react";

import { useGscConnection } from "@/hooks/integrations/useGscConnection";
import { useGscDashboard } from "@/hooks/integrations/useGscDashboard";
import { useSelectedStore } from "@/contexts/StoreContext";
import { GscKpiCards, type MetricKey } from "./GscKpiCards";
import { GscPerformanceChart } from "./GscPerformanceChart";
import { GscTabbedData } from "./GscTabbedData";
import { GscKeywordsExplorerTab } from "./GscKeywordsExplorerTab";
import { GscPagesProductsTab } from "./GscPagesProductsTab";
import { GscOpportunitesTab } from "./GscOpportunitesTab";
import { GscPositionTrackingTab } from "./GscPositionTrackingTab";
import { GscIndexationTab } from "./GscIndexationTab";

// ============================================================================
// Empty State
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

function DashboardSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
            <Skeleton className="h-[340px] rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Skeleton className="h-[300px] rounded-xl" />
                <Skeleton className="h-[300px] rounded-xl" />
            </div>
        </div>
    );
}

function PlaceholderTab({ icon: Icon, title, description }: { icon: typeof Info; title: string; description: string }) {
    return (
        <Card className="border-border/40">
            <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-4 py-12">
                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                        <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold">{title}</h3>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Main Page
// ============================================================================

const EMPTY_KPIS = { total_clicks: 0, total_impressions: 0, avg_ctr: 0, avg_position: 0 };

const DEFAULT_VISIBLE: Record<MetricKey, boolean> = {
    clicks: true,
    impressions: true,
    ctr: false,
    position: false,
};

export function GscSeoPage() {
    const { connections, isConnected, isLoading: connLoading, sync, isSyncing } = useGscConnection({ linkedOnly: true });
    const { selectedStore } = useSelectedStore();
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    const [days, setDays] = useState(28);
    const searchParams = useSearchParams();
    const tabFromUrl = searchParams.get("tab");
    const [activeTab, setActiveTab] = useState(tabFromUrl || "analytics");

    // Sync tab from URL when navigating from sidebar
    useEffect(() => {
        if (tabFromUrl && tabFromUrl !== activeTab) {
            setActiveTab(tabFromUrl);
        }
    }, [tabFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps
    const [visibleMetrics, setVisibleMetrics] = useState<Record<MetricKey, boolean>>(DEFAULT_VISIBLE);

    const storeMatchedSite = selectedStore
        ? connections.find(c => c.store_id === selectedStore.id)
        : null;
    const effectiveSiteId = selectedSiteId || storeMatchedSite?.site_id || connections[0]?.site_id || null;

    const { data: dashboard, isLoading: dashLoading } = useGscDashboard(
        isConnected ? effectiveSiteId : null,
        days
    );

    const selectedSite = connections.find(c => c.site_id === effectiveSiteId);

    const handleToggleMetric = useCallback((metric: MetricKey) => {
        setVisibleMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
    }, []);

    if (connLoading) return <DashboardSkeleton />;
    if (!isConnected) return <GscEmptyState />;

    const siteDisplayUrl = selectedSite?.site_url
        ? selectedSite.site_url.replace(/^https?:\/\//, "").replace(/\/$/, "")
        : null;

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
                            <h1 className="text-xl font-bold tracking-tight">SEO Analytics</h1>
                            {siteDisplayUrl && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                                    {siteDisplayUrl}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
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

                        {activeTab === "analytics" && (
                            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                                <SelectTrigger className="w-[120px] h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7" className="text-xs">7 derniers jours</SelectItem>
                                    <SelectItem value="28" className="text-xs">28 derniers jours</SelectItem>
                                    <SelectItem value="90" className="text-xs">90 derniers jours</SelectItem>
                                </SelectContent>
                            </Select>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                if (!effectiveSiteId) return;
                                sync({ siteId: effectiveSiteId, dateRange: 'last_28_days' });
                                sync({ siteId: effectiveSiteId, dateRange: 'last_7_days' });
                            }}
                            disabled={isSyncing || !effectiveSiteId}
                            className="gap-1.5 h-8 text-xs"
                        >
                            <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
                            {isSyncing ? "Sync..." : "Synchroniser"}
                        </Button>
                    </div>
                </div>

                {selectedSite && connections.length <= 1 && !siteDisplayUrl && (
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

            {/* Tabs */}
            <div className="space-y-3">
                {/* Bloc 1 — Navigation onglets */}
                <div className="rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border border-border w-fit overflow-x-auto">
                    {[
                        { value: "analytics", label: "Analytique", icon: BarChart3 },
                        { value: "keywords", label: "Mots-clés", icon: Type },
                        { value: "audit", label: "Audit", icon: ShieldCheck },
                        { value: "info", label: "Info", icon: Info },
                        { value: "indexation", label: "Indexation", icon: ListChecks },
                        { value: "sitemaps", label: "Plans de site", icon: Map },
                        { value: "tasks", label: "Tâches", icon: ClipboardList },
                    ].map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            onClick={() => setActiveTab(value)}
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-medium rounded-md transition-colors whitespace-nowrap",
                                activeTab === value
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </button>
                    ))}
                </div>
                </div>

                {/* ── Analytique (Overview) ── */}
                {activeTab === "analytics" && (
                    <div className="space-y-3">
                        {dashLoading ? (
                            <DashboardSkeleton />
                        ) : (
                            <>
                                <div className="rounded-xl border border-border bg-card p-6">
                                    <GscKpiCards
                                        kpis={dashboard?.kpis || EMPTY_KPIS}
                                        kpisPrevious={dashboard?.kpis_previous || EMPTY_KPIS}
                                        visibleMetrics={visibleMetrics}
                                        onToggleMetric={handleToggleMetric}
                                    />
                                </div>
                                <div className="rounded-xl border border-border bg-card p-6">
                                    <GscPerformanceChart
                                        data={dashboard?.daily || []}
                                        visibleMetrics={visibleMetrics}
                                    />
                                </div>
                                <div className="rounded-xl border border-border bg-card p-6">
                                    <GscTabbedData dashboard={dashboard} />
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── Mots-clés ── */}
                {activeTab === "keywords" && (
                    <GscKeywordsExplorerTab siteId={effectiveSiteId} />
                )}

                {/* ── Audit ── */}
                {activeTab === "audit" && (
                    <div className="rounded-xl border border-border bg-card p-6">
                        <PlaceholderTab
                            icon={ShieldCheck}
                            title="Audit SEO"
                            description="L'audit technique de votre site sera bientôt disponible."
                        />
                    </div>
                )}

                {/* ── Info ── */}
                {activeTab === "info" && (
                    <div className="rounded-xl border border-border bg-card p-6">
                        <PlaceholderTab
                            icon={Info}
                            title="Informations"
                            description="Les informations détaillées du site seront bientôt disponibles."
                        />
                    </div>
                )}

                {/* ── Indexation ── */}
                {activeTab === "indexation" && (
                    <GscIndexationTab
                        siteId={effectiveSiteId}
                        siteUrl={selectedSite?.site_url || ""}
                    />
                )}

                {/* ── Plans de site ── */}
                {activeTab === "sitemaps" && (
                    <div className="rounded-xl border border-border bg-card p-6">
                        <PlaceholderTab
                            icon={Map}
                            title="Plans de site"
                            description="La gestion des sitemaps sera bientôt disponible."
                        />
                    </div>
                )}

                {/* ── Tâches ── */}
                {activeTab === "tasks" && (
                    <div className="rounded-xl border border-border bg-card p-6">
                        <PlaceholderTab
                            icon={ClipboardList}
                            title="Tâches SEO"
                            description="La liste des tâches SEO à réaliser sera bientôt disponible."
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
