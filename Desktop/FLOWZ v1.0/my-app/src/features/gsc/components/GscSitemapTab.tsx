"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Map,
    RefreshCw,
    Search,
    FileText,
    ShoppingBag,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    AlertCircle,
} from "lucide-react";
import { useGscSitemap, type GscSitemapUrl, type GscSitemapStats } from "@/hooks/integrations/useGscSitemap";
import { useDebounce } from "@/hooks/useDebounce";
import type { GscUrlSource } from "@/lib/gsc/types";

// ============================================================================
// Sub-components
// ============================================================================

function KpiCard({
    label,
    value,
    icon: Icon,
    iconClass,
}: {
    label: string;
    value: number;
    icon: typeof Map;
    iconClass: string;
}) {
    return (
        <Card className="border-border/40">
            <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", iconClass)}>
                    <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold tabular-nums">{value.toLocaleString()}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function KpiSkeleton() {
    return (
        <Card className="border-border/40">
            <CardContent className="p-4 flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                <div className="space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-12" />
                </div>
            </CardContent>
        </Card>
    );
}

const SOURCE_BADGE: Record<GscUrlSource, { label: string; className: string; icon: typeof FileText }> = {
    sitemap: { label: "Sitemap XML", className: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: FileText },
    product: { label: "Produit", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: ShoppingBag },
    blog: { label: "Blog", className: "bg-violet-500/10 text-violet-600 border-violet-500/20", icon: BookOpen },
    manual: { label: "Manuel", className: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: FileText },
};

function SourceBadge({ source }: { source: GscUrlSource }) {
    const config = SOURCE_BADGE[source] ?? SOURCE_BADGE.manual;
    const Icon = config.icon;
    return (
        <Badge
            variant="outline"
            className={cn("gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full", config.className)}
        >
            <Icon className="h-3 w-3" />
            {config.label}
        </Badge>
    );
}

function UrlRow({ row }: { row: GscSitemapUrl }) {
    const lastmod = row.lastmod
        ? new Date(row.lastmod).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
        : "—";

    return (
        <div className={cn(
            "flex items-center gap-3 px-4 py-2.5 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors group",
            !row.is_active && "opacity-50"
        )}>
            {/* URL */}
            <TooltipProvider delayDuration={300}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <p className="flex-1 text-xs font-mono truncate text-foreground min-w-0">
                            {row.url}
                        </p>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[480px] break-all text-xs">
                        {row.url}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* Source */}
            <div className="w-[120px] shrink-0">
                <SourceBadge source={row.source} />
            </div>

            {/* Lastmod */}
            <p className="w-[110px] shrink-0 text-xs text-muted-foreground text-right">
                {lastmod}
            </p>

            {/* Status */}
            <div className="w-[70px] shrink-0 flex justify-end">
                {row.is_active ? (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-full bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        Actif
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-full bg-muted text-muted-foreground">
                        Inactif
                    </Badge>
                )}
            </div>

            {/* External link */}
            <a
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            >
                <ExternalLink className="h-3.5 w-3.5" />
            </a>
        </div>
    );
}

function RowSkeleton() {
    return (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/30">
            <Skeleton className="flex-1 h-3.5 rounded" />
            <Skeleton className="w-[120px] h-5 rounded-full" />
            <Skeleton className="w-[110px] h-3.5 rounded" />
            <Skeleton className="w-[70px] h-5 rounded-full" />
            <Skeleton className="w-3.5 h-3.5 rounded" />
        </div>
    );
}

function EmptyState({ onRefresh, isRefreshing }: { onRefresh: () => void; isRefreshing: boolean }) {
    return (
        <div className="flex flex-col items-center text-center gap-4 py-16">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                <Map className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
                <p className="text-sm font-semibold">Aucune URL dans le sitemap</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                    Lancez le premier scan pour récupérer et analyser les URLs de votre sitemap XML.
                </p>
            </div>
            <Button size="sm" onClick={onRefresh} disabled={isRefreshing} className="gap-2 mt-1">
                <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                {isRefreshing ? "Scan en cours…" : "Lancer le scan"}
            </Button>
        </div>
    );
}

function Pagination({
    page,
    totalPages,
    total,
    perPage,
    onPrev,
    onNext,
}: {
    page: number;
    totalPages: number;
    total: number;
    perPage: number;
    onPrev: () => void;
    onNext: () => void;
}) {
    const from = (page - 1) * perPage + 1;
    const to = Math.min(page * perPage, total);

    return (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
                {total === 0 ? "0 URL" : `${from}–${to} sur ${total.toLocaleString()} URLs`}
            </p>
            <div className="flex items-center gap-1.5">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={onPrev}
                    disabled={page <= 1}
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs font-medium tabular-nums px-1">
                    {page} / {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={onNext}
                    disabled={page >= totalPages}
                >
                    <ChevronRight className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}

// ============================================================================
// Main
// ============================================================================

interface GscSitemapTabProps {
    siteId: string | null;
}

export function GscSitemapTab({ siteId }: GscSitemapTabProps) {
    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebounce(searchInput, 300);

    const {
        urls,
        total,
        stats,
        isLoading,
        page,
        setPage,
        totalPages,
        perPage,
        source,
        setSource,
        setSearch,
        refreshSitemap,
        isRefreshing,
        refreshResult,
        refreshError,
    } = useGscSitemap(siteId);

    // Sync debounced search into hook
    const handleSearchChange = useCallback((value: string) => {
        setSearchInput(value);
        setSearch(value);
    }, [setSearch]);

    const handleSourceChange = useCallback((val: string) => {
        setSource(val === "all" ? undefined : (val as GscUrlSource));
    }, [setSource]);

    return (
        <motion.div
            className="space-y-3"
            initial="hidden"
            animate="visible"
            variants={motionTokens.variants.slideUp}
            transition={motionTokens.transitions.default}
        >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {isLoading ? (
                    <>
                        <KpiSkeleton />
                        <KpiSkeleton />
                        <KpiSkeleton />
                    </>
                ) : (
                    <>
                        <KpiCard
                            label="Total URLs"
                            value={total}
                            icon={Map}
                            iconClass="bg-primary/10 text-primary"
                        />
                        <KpiCard
                            label="Sitemap XML"
                            value={stats.sitemap}
                            icon={FileText}
                            iconClass="bg-blue-500/10 text-blue-600"
                        />
                        <KpiCard
                            label="Produits & Blog FLOWZ"
                            value={stats.product + stats.blog}
                            icon={ShoppingBag}
                            iconClass="bg-emerald-500/10 text-emerald-600"
                        />
                    </>
                )}
            </div>

            {/* Refresh result banner */}
            {refreshResult && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-700">
                    <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                    Scan terminé — {refreshResult.total.toLocaleString()} URLs ({refreshResult.new} nouvelles, {refreshResult.removed} supprimées)
                </div>
            )}

            {refreshError && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {refreshError.message}
                </div>
            )}

            {/* Main Card */}
            <Card className="border-border/40">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 border-b border-border/30">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            value={searchInput}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Rechercher une URL…"
                            className="pl-8 h-8 text-xs"
                        />
                    </div>

                    <Select value={source ?? "all"} onValueChange={handleSourceChange}>
                        <SelectTrigger className="w-[160px] h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-xs">Toutes les sources</SelectItem>
                            <SelectItem value="sitemap" className="text-xs">Sitemap XML</SelectItem>
                            <SelectItem value="product" className="text-xs">Produits</SelectItem>
                            <SelectItem value="blog" className="text-xs">Blog</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => refreshSitemap()}
                        disabled={isRefreshing || !siteId}
                        className="gap-1.5 h-8 text-xs shrink-0"
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                        {isRefreshing ? "Scan…" : "Rafraîchir le sitemap"}
                    </Button>
                </div>

                {/* Column headers */}
                {(isLoading || urls.length > 0) && (
                    <div className="flex items-center gap-3 px-4 py-2 border-b border-border/20 bg-muted/20">
                        <p className="flex-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">URL</p>
                        <p className="w-[120px] shrink-0 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Source</p>
                        <p className="w-[110px] shrink-0 text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Modifié</p>
                        <p className="w-[70px] shrink-0 text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Statut</p>
                        <div className="w-3.5" />
                    </div>
                )}

                {/* Content */}
                {isLoading ? (
                    <div>
                        {Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)}
                    </div>
                ) : urls.length === 0 ? (
                    <EmptyState onRefresh={() => refreshSitemap()} isRefreshing={isRefreshing} />
                ) : (
                    <motion.div
                        variants={motionTokens.variants.staggerContainer}
                        initial="hidden"
                        animate="visible"
                    >
                        {urls.map((row) => (
                            <motion.div key={row.id} variants={motionTokens.variants.staggerItem}>
                                <UrlRow row={row} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Pagination */}
                {total > 0 && (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        perPage={perPage}
                        onPrev={() => setPage(page - 1)}
                        onNext={() => setPage(page + 1)}
                    />
                )}
            </Card>
        </motion.div>
    );
}
