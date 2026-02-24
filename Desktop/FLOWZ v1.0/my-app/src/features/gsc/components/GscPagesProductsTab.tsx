"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Link2, Unlink, Eye, EyeOff, AlertTriangle, Package } from "lucide-react";
import Link from "next/link";
import { useGscPagesProducts } from "@/hooks/integrations/useGscPagesProducts";
import { GscDateRangePicker } from "./shared/GscDateRangePicker";
import { GscPositionBadge } from "./shared/GscPositionBadge";
import { GscEmptyTab } from "./shared/GscEmptyTab";
import type { GscDateRange, GscPageWithProduct } from "@/lib/gsc/types";

type FilterStatus = 'all' | 'linked' | 'unlinked';

function extractPath(url: string): string {
    try {
        const u = new URL(url);
        return u.pathname === "/" ? "/" : u.pathname.replace(/\/$/, "");
    } catch {
        return url;
    }
}

interface Props {
    siteId: string | null;
}

export function GscPagesProductsTab({ siteId }: Props) {
    const [dateRange, setDateRange] = useState<GscDateRange>("last_28_days");
    const [filter, setFilter] = useState<FilterStatus>("all");

    const { data, isLoading } = useGscPagesProducts(siteId, dateRange);
    const pages = data?.pages || [];

    const stats = useMemo(() => {
        const linked = pages.filter(p => p.has_product).length;
        const unlinked = pages.filter(p => !p.has_product).length;
        return { linked, unlinked, total: pages.length };
    }, [pages]);

    const filtered = useMemo(() => {
        switch (filter) {
            case 'linked': return pages.filter(p => p.has_product);
            case 'unlinked': return pages.filter(p => !p.has_product);
            default: return pages;
        }
    }, [pages, filter]);

    if (!siteId) return <GscEmptyTab icon={FileText} title="Aucun site" description="Selectionnez un site GSC." />;

    const filters: { label: string; value: FilterStatus; count: number; icon: typeof Link2 }[] = [
        { label: "Toutes", value: "all", count: stats.total, icon: Eye },
        { label: "Liees a un produit", value: "linked", count: stats.linked, icon: Link2 },
        { label: "Sans produit", value: "unlinked", count: stats.unlinked, icon: Unlink },
    ];

    return (
        <div className="space-y-4">
            {/* Stats mini-cards */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="border-border/40">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <div className="text-lg font-bold tabular-nums">{stats.total}</div>
                            <div className="text-[11px] text-muted-foreground">Pages indexees</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/40">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Link2 className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                            <div className="text-lg font-bold tabular-nums text-emerald-500">{stats.linked}</div>
                            <div className="text-[11px] text-muted-foreground">Liees a un produit</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/40">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                            <div className="text-lg font-bold tabular-nums text-amber-500">{stats.unlinked}</div>
                            <div className="text-[11px] text-muted-foreground">Sans produit FLOWZ</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters row */}
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
                <div className="flex gap-1">
                    {filters.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                filter === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <f.icon className="h-3 w-3" />
                            {f.label}
                            <span className={cn(
                                "ml-0.5 tabular-nums",
                                filter === f.value ? "text-primary-foreground/70" : "text-muted-foreground/60"
                            )}>({f.count})</span>
                        </button>
                    ))}
                </div>
                <GscDateRangePicker value={dateRange} onChange={setDateRange} />
            </div>

            {/* Table */}
            <Card className="border-border/40">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-4 space-y-2">
                            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-8 text-center">Aucune page trouvee.</p>
                    ) : (
                        <div>
                            <div className="grid grid-cols-[1fr_160px_60px_70px_50px_50px] gap-2 px-4 py-2.5 border-b border-border/30 text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/20">
                                <span>Page</span>
                                <span>Produit FLOWZ</span>
                                <span className="text-right">Clics</span>
                                <span className="text-right">Impr.</span>
                                <span className="text-right">CTR</span>
                                <span className="text-right">Pos.</span>
                            </div>
                            {filtered.map((p, i) => (
                                <div
                                    key={`${p.page_url}-${i}`}
                                    className="grid grid-cols-[1fr_160px_60px_70px_50px_50px] gap-2 px-4 py-2.5 hover:bg-muted/20 transition-colors text-xs items-center border-b border-border/10 last:border-0"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            {p.has_product ? (
                                                <Link2 className="h-3 w-3 text-emerald-500 shrink-0" />
                                            ) : (
                                                <EyeOff className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                                            )}
                                            <span className="truncate font-medium text-primary/80" title={p.page_url}>
                                                {extractPath(p.page_url)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        {p.has_product && p.product_id ? (
                                            <Link href={`/app/products/${p.product_id}`} className="flex items-center gap-1 text-primary hover:underline truncate">
                                                <Package className="h-3 w-3 shrink-0 text-primary/60" />
                                                <span className="truncate">{p.product_title || "Sans titre"}</span>
                                            </Link>
                                        ) : (
                                            <span className="text-muted-foreground/40">Non lie</span>
                                        )}
                                    </div>
                                    <span className="text-right tabular-nums font-medium">{p.clicks}</span>
                                    <span className="text-right tabular-nums text-muted-foreground">
                                        {p.impressions >= 1000 ? `${(p.impressions / 1000).toFixed(1)}k` : p.impressions}
                                    </span>
                                    <span className="text-right tabular-nums text-muted-foreground">
                                        {(p.ctr * 100).toFixed(1)}%
                                    </span>
                                    <span className="text-right">
                                        <GscPositionBadge position={p.position} />
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
