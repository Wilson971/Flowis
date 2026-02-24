"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Search, FileText, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GscKeywordData, GscTopPage } from "@/lib/gsc/types";

type SortKey = "clicks" | "impressions" | "ctr" | "position";

function useSortable<T>(items: T[], defaultKey: SortKey = "impressions") {
    const [sortKey, setSortKey] = useState<SortKey>(defaultKey);
    const [sortAsc, setSortAsc] = useState(false);

    const toggle = (key: SortKey) => {
        if (sortKey === key) setSortAsc(!sortAsc);
        else { setSortKey(key); setSortAsc(false); }
    };

    const sorted = [...items].sort((a: any, b: any) => {
        const diff = (a[sortKey] ?? 0) - (b[sortKey] ?? 0);
        return sortAsc ? diff : -diff;
    });

    return { sorted, sortKey, sortAsc, toggle };
}

function SortHeader({ label, field, sortKey, sortAsc, onToggle, className }: {
    label: string; field: SortKey; sortKey: SortKey; sortAsc: boolean;
    onToggle: (k: SortKey) => void; className?: string;
}) {
    const isActive = sortKey === field;
    return (
        <button
            onClick={() => onToggle(field)}
            className={cn(
                "flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors",
                isActive && "text-foreground",
                className
            )}
        >
            {label}
            <ArrowUpDown className={cn("h-2.5 w-2.5", isActive && "text-primary")} />
        </button>
    );
}

function PositionBadge({ position }: { position: number }) {
    const color = position <= 3
        ? "text-emerald-500"
        : position <= 10
            ? "text-green-500"
            : position <= 20
                ? "text-amber-500"
                : "text-muted-foreground";
    return <span className={cn("font-medium tabular-nums", color)}>{Math.round(position * 10) / 10}</span>;
}

// ============================================================================
// Top Keywords Table
// ============================================================================

export function GscTopKeywordsTable({ keywords }: { keywords: GscKeywordData[] }) {
    const { sorted, sortKey, sortAsc, toggle } = useSortable(keywords);

    return (
        <Card className="border-border/40">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    Top Mots-cles
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                {keywords.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                        Aucune donnee. Synchronisez d&apos;abord.
                    </p>
                ) : (
                    <div className="space-y-0">
                        {/* Header */}
                        <div className="grid grid-cols-[1fr_60px_70px_50px_50px] gap-2 px-2 py-1.5 border-b border-border/20">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Mot-cle</span>
                            <SortHeader label="Clics" field="clicks" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggle} className="justify-end" />
                            <SortHeader label="Impr." field="impressions" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggle} className="justify-end" />
                            <SortHeader label="CTR" field="ctr" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggle} className="justify-end" />
                            <SortHeader label="Pos." field="position" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggle} className="justify-end" />
                        </div>
                        {/* Rows */}
                        {sorted.map((kw, i) => (
                            <div
                                key={`${kw.query}-${i}`}
                                className="grid grid-cols-[1fr_60px_70px_50px_50px] gap-2 px-2 py-2 hover:bg-muted/20 rounded-lg transition-colors text-xs"
                            >
                                <span className="truncate font-medium">{kw.query}</span>
                                <span className="text-right tabular-nums">{kw.clicks}</span>
                                <span className="text-right tabular-nums text-muted-foreground">
                                    {kw.impressions >= 1000 ? `${(kw.impressions / 1000).toFixed(1)}k` : kw.impressions}
                                </span>
                                <span className="text-right tabular-nums text-muted-foreground">
                                    {(kw.ctr * 100).toFixed(1)}%
                                </span>
                                <span className="text-right">
                                    <PositionBadge position={kw.position} />
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Top Pages Table
// ============================================================================

export function GscTopPagesTable({ pages }: { pages: GscTopPage[] }) {
    const { sorted, sortKey, sortAsc, toggle } = useSortable(pages);

    function extractPath(url: string): string {
        try {
            const u = new URL(url);
            return u.pathname === "/" ? "/" : u.pathname.replace(/\/$/, "");
        } catch {
            return url;
        }
    }

    return (
        <Card className="border-border/40">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Top Pages
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                {pages.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                        Aucune donnee. Synchronisez d&apos;abord.
                    </p>
                ) : (
                    <div className="space-y-0">
                        {/* Header */}
                        <div className="grid grid-cols-[1fr_60px_70px_50px_50px] gap-2 px-2 py-1.5 border-b border-border/20">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Page</span>
                            <SortHeader label="Clics" field="clicks" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggle} className="justify-end" />
                            <SortHeader label="Impr." field="impressions" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggle} className="justify-end" />
                            <SortHeader label="CTR" field="ctr" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggle} className="justify-end" />
                            <SortHeader label="Pos." field="position" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggle} className="justify-end" />
                        </div>
                        {/* Rows */}
                        {sorted.map((page, i) => (
                            <div
                                key={`${page.page_url}-${i}`}
                                className="grid grid-cols-[1fr_60px_70px_50px_50px] gap-2 px-2 py-2 hover:bg-muted/20 rounded-lg transition-colors text-xs"
                            >
                                <span className="truncate font-medium text-primary/80" title={page.page_url}>
                                    {extractPath(page.page_url)}
                                </span>
                                <span className="text-right tabular-nums">{page.clicks}</span>
                                <span className="text-right tabular-nums text-muted-foreground">
                                    {page.impressions >= 1000 ? `${(page.impressions / 1000).toFixed(1)}k` : page.impressions}
                                </span>
                                <span className="text-right tabular-nums text-muted-foreground">
                                    {(page.ctr * 100).toFixed(1)}%
                                </span>
                                <span className="text-right">
                                    <PositionBadge position={page.position} />
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
