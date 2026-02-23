"use client";

import { useGscConnection } from "@/hooks/integrations/useGscConnection";
import { useGscIndexation } from "@/hooks/integrations/useGscIndexation";
import { useSelectedStore } from "@/contexts/StoreContext";
import { ShieldCheck, ShieldAlert, FileSearch, ArrowRight, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function GscIndexationStatusCard() {
    const router = useRouter();
    const { connections, isConnected, isLoading: connLoading } = useGscConnection({ linkedOnly: true });
    const { selectedStore } = useSelectedStore();

    const storeMatchedSite = selectedStore
        ? connections.find(c => c.store_id === selectedStore.id)
        : null;
    const effectiveSiteId = storeMatchedSite?.site_id || connections[0]?.site_id || null;

    const { overview, isOverviewLoading } = useGscIndexation(isConnected ? effectiveSiteId : null);

    const isLoading = connLoading || isOverviewLoading;

    if (isLoading) {
        return (
            <div className="flex flex-col h-full justify-between p-4">
                <div className="flex justify-between items-center mb-4">
                    <Skeleton className="h-6 w-1/2" />
                </div>
                <div className="flex-1 flex flex-col justify-center gap-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-8 w-24 mx-auto" />
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
                        Les données d'indexation ne sont pas disponibles.
                    </p>
                </div>
            </div>
        );
    }

    const total = overview.total || 0;
    const indexed = overview.indexed || 0;
    const errors = overview.errors || 0;
    const notIndexed = overview.not_indexed || 0;

    // Calculate percentage safely
    const percentage = total > 0 ? Math.round((indexed / total) * 100) : 0;

    const isHealthy = percentage > 80 && errors === 0;

    return (
        <div
            className="flex flex-col h-full p-4 cursor-pointer group"
            onClick={() => router.push("/app/seo")}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "p-1.5 rounded-lg text-white",
                        isHealthy ? "bg-emerald-500" : "bg-primary"
                    )}>
                        {isHealthy ? <ShieldCheck className="w-4 h-4" /> : <FileSearch className="w-4 h-4" />}
                    </div>
                    <h3 className="font-semibold text-sm">Indexation</h3>
                </div>
                <span className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider bg-muted/50 px-2 py-0.5 rounded-full">
                    Aperçu
                </span>
            </div>

            <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-end justify-between mb-1">
                    <span className="text-2xl font-bold tracking-tight">
                        {percentage}%
                    </span>
                    <span className="text-xs font-medium text-muted-foreground mb-1">
                        indexées
                    </span>
                </div>

                <Progress value={percentage} className="h-2 mb-2" indicatorClassName={cn(isHealthy ? "bg-emerald-500" : "bg-primary")} />

                <div className="grid grid-cols-2 gap-2 mt-auto">
                    <div className="flex flex-col p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <span className="text-[10px] uppercase font-semibold text-emerald-600/80 mb-1">
                            Valides
                        </span>
                        <span className="text-lg font-bold text-emerald-600">
                            {indexed}
                        </span>
                    </div>

                    <div className={cn(
                        "flex flex-col p-2 rounded-lg border",
                        errors > 0
                            ? "bg-rose-500/5 border-rose-500/20"
                            : notIndexed > 0
                                ? "bg-amber-500/5 border-amber-500/20"
                                : "bg-muted/30 border-transparent"
                    )}>
                        <span className={cn(
                            "text-[10px] uppercase font-semibold mb-1",
                            errors > 0 ? "text-rose-600/80" : "text-amber-600/80"
                        )}>
                            {errors > 0 ? "Erreurs" : "Non indexées"}
                        </span>
                        <span className={cn(
                            "text-lg font-bold",
                            errors > 0 ? "text-rose-600" : "text-amber-600"
                        )}>
                            {errors > 0 ? errors : notIndexed}
                        </span>
                    </div>
                </div>
            </div>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-1 rounded bg-muted/50 text-muted-foreground">
                    <ExternalLink className="w-3.5 h-3.5" />
                </div>
            </div>
        </div>
    );
}
