"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Zap,
    Package,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Download,
} from "lucide-react";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import { useGscKeywordsExplorer } from "@/hooks/integrations/useGscKeywordsExplorer";
import { useGscPositionTracking } from "@/hooks/integrations/useGscPositionTracking";
import { GscDateRangePicker } from "./shared/GscDateRangePicker";
import { GscPositionBadge } from "./shared/GscPositionBadge";
import { GscEmptyTab } from "./shared/GscEmptyTab";
import { KeywordsKpiCards } from "./shared/KeywordsKpiCards";
import { KeywordsPositionDistribution } from "./charts/KeywordsPositionDistribution";
import { KeywordsCtrVsPosition } from "./charts/KeywordsCtrVsPosition";
import { KeywordsTopMovers } from "./charts/KeywordsTopMovers";
import type { GscDateRange, GscKeywordsSortBy, GscSortOrder } from "@/lib/gsc/types";

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

function extractPath(url: string): string {
    try {
        const u = new URL(url);
        return u.pathname === "/" ? "/" : u.pathname.replace(/\/$/, "");
    } catch {
        return url;
    }
}

const EMPTY_AGGREGATES = {
    total_clicks: 0,
    total_impressions: 0,
    avg_position: 0,
    quick_wins_count: 0,
    position_distribution: [],
};

type SortableColumn = GscKeywordsSortBy;

// ────────────────────────────────────────────────────────────────────
// CSV Export
// ────────────────────────────────────────────────────────────────────

function exportKeywordsCsv(siteId: string, dateRange: string, search: string, pageUrl: string, sortBy: string, sortOrder: string) {
    const params = new URLSearchParams({
        site_id: siteId,
        date_range: dateRange,
        page: "1",
        per_page: "10000",
        sort_by: sortBy,
        sort_order: sortOrder,
    });
    if (search) params.set("search", search);
    if (pageUrl) params.set("page_url", pageUrl);

    fetch(`/api/gsc/keywords-explorer?${params}`)
        .then(r => r.json())
        .then((data) => {
            const rows = data.keywords || [];
            if (rows.length === 0) return;
            const header = "Mot-cle;URL;Clics;Impressions;CTR;Position;Produit";
            const csv = [
                header,
                ...rows.map((k: any) =>
                    [
                        `"${k.query.replace(/"/g, '""')}"`,
                        `"${k.page_url}"`,
                        k.clicks,
                        k.impressions,
                        (k.ctr * 100).toFixed(2) + "%",
                        k.position.toFixed(1),
                        k.product_title ? `"${k.product_title.replace(/"/g, '""')}"` : "",
                    ].join(";")
                ),
            ].join("\n");

            const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `keywords-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        })
        .catch(console.error);
}

// ────────────────────────────────────────────────────────────────────
// SortHeader
// ────────────────────────────────────────────────────────────────────

function SortHeader({
    label,
    column,
    currentSort,
    currentOrder,
    onSort,
    className,
}: {
    label: string;
    column: SortableColumn;
    currentSort: SortableColumn;
    currentOrder: GscSortOrder;
    onSort: (col: SortableColumn) => void;
    className?: string;
}) {
    const isActive = currentSort === column;
    return (
        <button
            type="button"
            onClick={() => onSort(column)}
            className={cn(
                "inline-flex items-center gap-0.5 hover:text-foreground transition-colors",
                className,
                isActive && "text-foreground"
            )}
        >
            <span>{label}</span>
            {isActive ? (
                currentOrder === "asc" ? (
                    <ArrowUp className="h-3 w-3" />
                ) : (
                    <ArrowDown className="h-3 w-3" />
                )
            ) : (
                <ArrowUpDown className="h-2.5 w-2.5 opacity-40" />
            )}
        </button>
    );
}

// ────────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────────

interface Props {
    siteId: string | null;
}

export function GscKeywordsExplorerTab({ siteId }: Props) {
    const [dateRange, setDateRange] = useState<GscDateRange>("last_28_days");
    const [search, setSearch] = useState("");
    const [pageUrl, setPageUrl] = useState("");
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState<GscKeywordsSortBy>("clicks");
    const [sortOrder, setSortOrder] = useState<GscSortOrder>("desc");
    const debouncedSearch = useDebounce(search, 400);
    const debouncedPageUrl = useDebounce(pageUrl, 400);

    const { data, isLoading, isPlaceholderData } = useGscKeywordsExplorer({
        siteId,
        dateRange,
        search: debouncedSearch,
        pageUrl: debouncedPageUrl,
        page,
        perPage: 50,
        sortBy,
        sortOrder,
    });

    // Position tracking for Top Movers
    const { positions, isLoading: posLoading } = useGscPositionTracking(siteId);

    const keywords = data?.keywords || [];
    const total = data?.total || 0;
    const totalPages = Math.ceil(total / 50);
    const aggregates = data?.aggregates || EMPTY_AGGREGATES;

    const handleSort = useCallback((col: SortableColumn) => {
        if (col === sortBy) {
            setSortOrder(prev => prev === "asc" ? "desc" : "asc");
        } else {
            setSortBy(col);
            setSortOrder(col === "query" ? "asc" : "desc");
        }
        setPage(1);
    }, [sortBy]);

    const handleExport = useCallback(() => {
        if (!siteId) return;
        exportKeywordsCsv(siteId, dateRange, debouncedSearch, debouncedPageUrl, sortBy, sortOrder);
    }, [siteId, dateRange, debouncedSearch, debouncedPageUrl, sortBy, sortOrder]);

    if (!siteId) return <GscEmptyTab icon={Search} title="Aucun site" description="Selectionnez un site GSC." />;

    return (
        <div className="space-y-3">
            {/* Bloc 1 — KPI Cards */}
            {!isLoading && (
                <div className="rounded-xl border border-border bg-card p-6">
                    <KeywordsKpiCards aggregates={aggregates} totalKeywords={total} />
                </div>
            )}

            {/* Bloc 2 — Graphiques */}
            {!isLoading && keywords.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <KeywordsPositionDistribution distribution={aggregates.position_distribution} />
                        <KeywordsCtrVsPosition keywords={keywords} />
                    </div>
                    <div className="mt-4">
                        <KeywordsTopMovers changes={positions} isLoading={posLoading} />
                    </div>
                </div>
            )}

            {/* Bloc 3 — Filtres + Table */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            {/* ── Filters + Feature 6: Export ── */}
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
                <div className="flex gap-2 flex-1 w-full sm:w-auto">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un mot-cle..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="pl-8 h-8 text-xs"
                        />
                    </div>
                    <Input
                        placeholder="Filtrer par URL..."
                        value={pageUrl}
                        onChange={(e) => { setPageUrl(e.target.value); setPage(1); }}
                        className="h-8 text-xs max-w-[200px]"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <GscDateRangePicker value={dateRange} onChange={(v) => { setDateRange(v); setPage(1); }} />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        className="gap-1.5 h-8 text-xs"
                        disabled={total === 0}
                    >
                        <Download className="h-3.5 w-3.5" />
                        CSV
                    </Button>
                </div>
            </div>

            {/* ── Feature 3: Sortable Table ── */}
            <Card className={cn("border-border/40", isPlaceholderData && "opacity-70")}>
                <CardContent className="p-0">
                    {isLoading && !data ? (
                        <div className="p-4 space-y-2">
                            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
                        </div>
                    ) : keywords.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-8 text-center">Aucun mot-cle trouve.</p>
                    ) : (
                        <div>
                            {/* Header */}
                            <div className="grid grid-cols-[1fr_160px_60px_70px_50px_50px] gap-2 px-4 py-2.5 border-b border-border/30 text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/20">
                                <SortHeader label="Mot-cle" column="query" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                                <span>Produit lie</span>
                                <SortHeader label="Clics" column="clicks" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="justify-end" />
                                <SortHeader label="Impr." column="impressions" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="justify-end" />
                                <SortHeader label="CTR" column="ctr" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="justify-end" />
                                <SortHeader label="Pos." column="position" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="justify-end" />
                            </div>
                            {/* Rows */}
                            {keywords.map((kw, i) => {
                                const isQuickWin = kw.position >= 4 && kw.position <= 20 && kw.impressions >= 50;
                                return (
                                    <div
                                        key={`${kw.query}-${kw.page_url}-${i}`}
                                        className="grid grid-cols-[1fr_160px_60px_70px_50px_50px] gap-2 px-4 py-2.5 hover:bg-muted/20 transition-colors text-xs items-center border-b border-border/10 last:border-0"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-medium truncate">{kw.query}</span>
                                                {isQuickWin && (
                                                    <Badge variant="outline" className="text-[9px] px-1 py-0 text-amber-500 border-amber-500/30 gap-0.5 shrink-0">
                                                        <Zap className="h-2.5 w-2.5" /> Quick Win
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground truncate block mt-0.5">
                                                {extractPath(kw.page_url)}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            {kw.product_id ? (
                                                <Link
                                                    href={`/app/products/${kw.product_id}`}
                                                    className="flex items-center gap-1 text-primary hover:underline truncate"
                                                >
                                                    <Package className="h-3 w-3 shrink-0 text-primary/60" />
                                                    <span className="truncate">{kw.product_title}</span>
                                                </Link>
                                            ) : (
                                                <span className="text-muted-foreground/50">&mdash;</span>
                                            )}
                                        </div>
                                        <span className="text-right tabular-nums font-medium">{kw.clicks}</span>
                                        <span className="text-right tabular-nums text-muted-foreground">
                                            {kw.impressions >= 1000 ? `${(kw.impressions / 1000).toFixed(1)}k` : kw.impressions}
                                        </span>
                                        <span className="text-right tabular-nums text-muted-foreground">
                                            {(kw.ctr * 100).toFixed(1)}%
                                        </span>
                                        <span className="text-right">
                                            <GscPositionBadge position={kw.position} />
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{total.toLocaleString()} resultats</span>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <span className="px-2">Page {page} / {totalPages}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
