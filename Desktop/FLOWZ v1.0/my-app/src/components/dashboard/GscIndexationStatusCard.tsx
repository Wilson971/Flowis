"use client";

import { useGscConnection } from "@/hooks/integrations/useGscConnection";
import { useGscIndexation } from "@/hooks/integrations/useGscIndexation";
import { useSelectedStore } from "@/contexts/StoreContext";
import {
    ShieldCheck,
    FileSearch,
    ExternalLink,
    TrendingUp,
    TrendingDown,
    Minus,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

// Minimal sparkline rendered as an inline SVG
function Sparkline({ data }: { data: number[] }) {
    if (data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const W = 80;
    const H = 28;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * W;
        const y = H - ((v - min) / range) * H;
        return `${x},${y}`;
    });
    const polyline = pts.join(" ");
    return (
        <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            className="overflow-visible"
        >
            <polyline
                points={polyline}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
            />
            {/* Last point dot */}
            {pts[pts.length - 1] && (
                <circle
                    cx={parseFloat(pts[pts.length - 1].split(",")[0])}
                    cy={parseFloat(pts[pts.length - 1].split(",")[1])}
                    r="2"
                    className="fill-primary"
                />
            )}
        </svg>
    );
}

export function GscIndexationStatusCard() {
    const router = useRouter();
    const { connections, isConnected, isLoading: connLoading } = useGscConnection({ linkedOnly: true });
    const { selectedStore } = useSelectedStore();

    const storeMatchedSite = selectedStore
        ? connections.find((c) => c.store_id === selectedStore.id)
        : null;
    const effectiveSiteId = storeMatchedSite?.site_id || connections[0]?.site_id || null;

    const { overview, isOverviewLoading } = useGscIndexation(isConnected ? effectiveSiteId : null);

    const isLoading = connLoading || isOverviewLoading;

    // Compute sparkline + delta from history[]
    const { sparklineData, delta } = useMemo(() => {
        const history = overview?.history ?? [];
        if (history.length < 2) return { sparklineData: [], delta: null };
        const total = overview!.total || 1;
        const rates = history.map((h) =>
            Math.round(((h.indexed ?? 0) / (h.total || total)) * 100)
        );
        const prev = rates[rates.length - 2];
        const curr = rates[rates.length - 1];
        return { sparklineData: rates, delta: curr - prev };
    }, [overview]);

    if (isLoading) {
        return (
            <div className="flex flex-col h-full justify-between p-4">
                <div className="flex justify-between items-center mb-4">
                    <Skeleton className="h-6 w-1/2" />
                </div>
                <div className="flex-1 flex flex-col justify-center gap-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-8 w-24 mx-auto" />
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        <Skeleton className="h-12 rounded-lg" />
                        <Skeleton className="h-12 rounded-lg" />
                        <Skeleton className="h-12 rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    if (!isConnected || !overview) {
        return (
            <div className="flex flex-col items-center justify-center p-6 h-full text-center space-y-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileSearch className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold">Santé Indexation</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                        Les données d&apos;indexation ne sont pas disponibles.
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

    // Delta indicator
    const DeltaIcon =
        delta === null ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
    const deltaColor =
        delta === null ? "" : delta > 0 ? "text-emerald-500" : delta < 0 ? "text-rose-500" : "text-muted-foreground";

    return (
        <div className="flex flex-col h-full p-4 relative group">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground border border-border group-hover:text-foreground transition-colors">
                        {isHealthy ? (
                            <ShieldCheck className="w-4 h-4" />
                        ) : (
                            <FileSearch className="w-4 h-4" />
                        )}
                    </div>
                    <h3 className="font-semibold text-sm">Indexation</h3>
                </div>
                <span className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider bg-muted/50 px-2 py-0.5 rounded-full">
                    Aperçu
                </span>
            </div>

            {/* Main percentage + sparkline row */}
            <div className="flex items-end justify-between mb-1">
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold tracking-tight">{percentage}%</span>
                    {DeltaIcon && delta !== null && (
                        <span className={cn("flex items-center gap-0.5 text-xs font-medium mb-0.5", deltaColor)}>
                            <DeltaIcon className="w-3 h-3" />
                            {Math.abs(delta)}%
                        </span>
                    )}
                </div>
                <div className="flex flex-col items-end gap-0.5">
                    {sparklineData.length >= 2 && (
                        <Sparkline data={sparklineData} />
                    )}
                    <span className="text-xs font-medium text-muted-foreground">
                        indexées
                    </span>
                </div>
            </div>

            <Progress
                value={percentage}
                className="h-1.5 mb-3"
                indicatorClassName={cn(
                    isHealthy
                        ? "bg-emerald-500"
                        : percentage > 60
                        ? "bg-amber-500"
                        : "bg-rose-500"
                )}
            />

            {/* 3 metrics grid */}
            <div className="grid grid-cols-3 gap-1.5 mt-auto">
                {/* Valides */}
                <button
                    onClick={(e) => { e.stopPropagation(); router.push("/app/seo?filter=indexed"); }}
                    className="flex flex-col p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors text-left"
                >
                    <span className="text-[9px] uppercase font-semibold text-emerald-600/80 mb-0.5">
                        Valides
                    </span>
                    <span className="text-base font-bold text-emerald-600">{indexed}</span>
                </button>

                {/* Non indexées */}
                <button
                    onClick={(e) => { e.stopPropagation(); router.push("/app/seo?filter=not_indexed"); }}
                    className={cn(
                        "flex flex-col p-2 rounded-lg border transition-colors text-left",
                        notIndexed > 0
                            ? "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10"
                            : "bg-muted/30 border-transparent hover:bg-muted/50"
                    )}
                >
                    <span className={cn(
                        "text-[9px] uppercase font-semibold mb-0.5",
                        notIndexed > 0 ? "text-amber-600/80" : "text-muted-foreground"
                    )}>
                        Non idx.
                    </span>
                    <span className={cn(
                        "text-base font-bold",
                        notIndexed > 0 ? "text-amber-600" : "text-foreground"
                    )}>
                        {notIndexed}
                    </span>
                </button>

                {/* Erreurs */}
                <button
                    onClick={(e) => { e.stopPropagation(); router.push("/app/seo?filter=errors"); }}
                    className={cn(
                        "flex flex-col p-2 rounded-lg border transition-colors text-left",
                        errors > 0
                            ? "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10"
                            : "bg-muted/30 border-transparent hover:bg-muted/50"
                    )}
                >
                    <span className={cn(
                        "text-[9px] uppercase font-semibold mb-0.5",
                        errors > 0 ? "text-rose-600/80" : "text-muted-foreground"
                    )}>
                        Erreurs
                    </span>
                    <span className={cn(
                        "text-base font-bold",
                        errors > 0 ? "text-rose-600" : "text-foreground"
                    )}>
                        {errors}
                    </span>
                </button>
            </div>

            {/* Hover external link */}
            <div
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => router.push("/app/seo")}
            >
                <div className="p-1 rounded bg-muted/50 text-muted-foreground">
                    <ExternalLink className="w-3.5 h-3.5" />
                </div>
            </div>
        </div>
    );
}
