"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { styles } from "@/lib/design-system";
import { Search, Target, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { useGscKeywords } from "@/hooks/integrations/useGscKeywords";
import { useGscConnection } from "@/hooks/integrations/useGscConnection";
import type { GscDateRange, GscKeywordData } from "@/lib/gsc/types";

interface GscKeywordsPanelProps {
    pageUrl: string | null | undefined;
    onSetFocusKeyword?: (keyword: string) => void;
}

export function GscKeywordsPanel({ pageUrl, onSetFocusKeyword }: GscKeywordsPanelProps) {
    const [dateRange, setDateRange] = useState<GscDateRange>("last_28_days");
    const [expanded, setExpanded] = useState(false);
    const { isConnected, isLoading: isConnLoading } = useGscConnection();
    const { data: keywords, isLoading } = useGscKeywords(pageUrl, dateRange);

    // Don't render if GSC not connected
    if (isConnLoading || !isConnected) return null;

    // Don't render if no page URL
    if (!pageUrl) return null;

    const hasKeywords = keywords && keywords.length > 0;
    const displayedKeywords = expanded ? keywords : keywords?.slice(0, 5);

    return (
        <Card className={cn(styles.card.base)}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Search className="h-4 w-4 text-primary" />
                        Mots-clés Google
                    </CardTitle>
                    <div className="flex items-center gap-1">
                        <Button
                            variant={dateRange === "last_7_days" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-5 px-1.5 text-[10px]"
                            onClick={() => setDateRange("last_7_days")}
                        >
                            7j
                        </Button>
                        <Button
                            variant={dateRange === "last_28_days" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-5 px-1.5 text-[10px]"
                            onClick={() => setDateRange("last_28_days")}
                        >
                            28j
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {isLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-8 bg-muted/20 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : !hasKeywords ? (
                    <p className="text-xs text-muted-foreground py-2">
                        Aucun mot-clé trouvé pour cette URL. Les données GSC ont un délai de 2-3 jours.
                    </p>
                ) : (
                    <div className="space-y-1">
                        {/* Header */}
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-[10px] text-muted-foreground font-medium px-2 pb-1">
                            <span>Mot-clé</span>
                            <span className="text-right w-10">Clics</span>
                            <span className="text-right w-12">Impr.</span>
                            <span className="text-right w-10">Pos.</span>
                        </div>

                        {/* Keywords */}
                        {displayedKeywords?.map((kw: GscKeywordData, i: number) => (
                            <button
                                key={`${kw.query}-${i}`}
                                onClick={() => onSetFocusKeyword?.(kw.query)}
                                className={cn(
                                    "w-full grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-2 py-1.5 rounded-lg text-left",
                                    "hover:bg-muted/20 transition-colors duration-200 group"
                                )}
                                title={`Définir "${kw.query}" comme focus keyword`}
                            >
                                <span className="text-xs truncate group-hover:text-primary transition-colors">
                                    {kw.query}
                                </span>
                                <span className="text-[11px] text-right w-10 font-medium tabular-nums">
                                    {kw.clicks}
                                </span>
                                <span className="text-[11px] text-right w-12 text-muted-foreground tabular-nums">
                                    {kw.impressions >= 1000
                                        ? `${(kw.impressions / 1000).toFixed(1)}k`
                                        : kw.impressions}
                                </span>
                                <PositionBadge position={kw.position} />
                            </button>
                        ))}

                        {/* Show more/less */}
                        {keywords && keywords.length > 5 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-6 text-[10px] text-muted-foreground mt-1"
                                onClick={() => setExpanded(!expanded)}
                            >
                                {expanded ? (
                                    <>
                                        <ChevronUp className="h-3 w-3 mr-1" />
                                        Réduire
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-3 w-3 mr-1" />
                                        Voir les {keywords.length - 5} autres
                                    </>
                                )}
                            </Button>
                        )}

                        {/* Hint */}
                        <p className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            Cliquez pour définir comme focus keyword
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function PositionBadge({ position }: { position: number }) {
    const rounded = Math.round(position * 10) / 10;
    const color = position <= 3
        ? "text-emerald-600"
        : position <= 10
            ? "text-green-600"
            : position <= 20
                ? "text-amber-600"
                : "text-muted-foreground";

    return (
        <span className={cn("text-[11px] text-right w-10 font-medium tabular-nums", color)}>
            {rounded}
        </span>
    );
}
