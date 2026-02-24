"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import { GscPositionBadge } from "../shared/GscPositionBadge";
import type { GscPositionChange } from "@/lib/gsc/types";

interface Props {
    changes: GscPositionChange[];
    isLoading: boolean;
}

export function KeywordsTopMovers({ changes, isLoading }: Props) {
    const { gainers, losers } = useMemo(() => {
        const sorted = [...changes].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
        return {
            gainers: sorted.filter(c => c.direction === 'up').slice(0, 5),
            losers: sorted.filter(c => c.direction === 'down').slice(0, 5),
        };
    }, [changes]);

    if (isLoading) return null;
    if (gainers.length === 0 && losers.length === 0) return null;

    return (
        <Card className="border-border/40">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Top movers
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">
                    Comparaison positions 7j vs 28j
                </p>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Gainers */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 mb-2">
                            <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-xs font-medium text-emerald-500">Meilleurs gains</span>
                        </div>
                        {gainers.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground">Aucun gain</p>
                        ) : (
                            gainers.map((c, i) => (
                                <div key={`g-${i}`} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/20 transition-colors">
                                    <span className="text-xs truncate flex-1 font-medium">{c.query}</span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <GscPositionBadge position={c.position_7d} />
                                        <span className={cn("text-xs font-medium tabular-nums text-emerald-500")}>
                                            +{c.delta.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Losers */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 mb-2">
                            <ArrowDown className="h-3.5 w-3.5 text-red-500" />
                            <span className="text-xs font-medium text-red-500">Plus grosses pertes</span>
                        </div>
                        {losers.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground">Aucune perte</p>
                        ) : (
                            losers.map((c, i) => (
                                <div key={`l-${i}`} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/20 transition-colors">
                                    <span className="text-xs truncate flex-1 font-medium">{c.query}</span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <GscPositionBadge position={c.position_7d} />
                                        <span className={cn("text-xs font-medium tabular-nums text-red-500")}>
                                            {c.delta.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
