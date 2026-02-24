"use client";

import { useGscConnection } from "@/hooks/integrations/useGscConnection";
import { useGscOpportunities } from "@/hooks/integrations/useGscOpportunities";
import { useSelectedStore } from "@/contexts/StoreContext";
import { Zap, ExternalLink, ArrowRight, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export function GscFastOpportunitiesCard() {
    const router = useRouter();
    const { connections, isConnected, isLoading: connLoading } = useGscConnection({ linkedOnly: true });
    const { selectedStore } = useSelectedStore();

    const storeMatchedSite = selectedStore
        ? connections.find(c => c.store_id === selectedStore.id)
        : null;
    const effectiveSiteId = storeMatchedSite?.site_id || connections[0]?.site_id || null;

    const { data: opportunities, isLoading: oppLoading } = useGscOpportunities(
        isConnected ? effectiveSiteId : null,
        "last_28_days"
    );

    const isLoading = connLoading || oppLoading;

    if (isLoading) {
        return (
            <div className="flex flex-col h-full justify-between p-4">
                <div className="flex justify-between items-center mb-6">
                    <Skeleton className="h-6 w-1/3" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        );
    }

    if (!isConnected || !opportunities || !opportunities.quick_wins || opportunities.quick_wins.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-6 h-full text-center space-y-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold">Opportunités Rapides</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                        Aucune opportunité rapide détectée pour le moment.
                    </p>
                </div>
            </div>
        );
    }

    const topOpportunities = opportunities.quick_wins.slice(0, 3);

    return (
        <div
            className="flex flex-col h-full p-4 cursor-pointer group bg-card rounded-xl border border-border/40 hover:border-primary/50 transition-colors"
            onClick={() => router.push("/app/seo")}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg text-amber-500 bg-amber-500/10">
                        <Zap className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold text-sm">Opportunités Rapides</h3>
                </div>
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wider uppercase border-amber-500/20 text-amber-600 bg-amber-500/5">
                    Positions 11-20
                </Badge>
            </div>

            <div className="flex-1 flex flex-col space-y-1.5 mt-1">
                {topOpportunities.map((opp, idx) => (
                    <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/50 transition-colors"
                    >
                        <div className="flex flex-col min-w-0 pr-3">
                            <span className="text-sm font-medium truncate text-foreground mb-1">
                                {opp.query}
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] tracking-wider uppercase font-semibold text-muted-foreground bg-background border px-1.5 py-0.5 rounded-sm">
                                    Pos: {Math.round(opp.position)}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Potentiel élevé
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/app/seo`);
                            }}
                        >
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-1 rounded bg-muted/50 text-muted-foreground">
                    <ExternalLink className="w-3.5 h-3.5" />
                </div>
            </div>
        </div>
    );
}
