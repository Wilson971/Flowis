"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Percent } from "lucide-react";
import {
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import type { GscKeywordExplorerRow } from "@/lib/gsc/types";

interface Props {
    keywords: GscKeywordExplorerRow[];
}

function CustomTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="rounded-xl border border-border/50 bg-popover px-3 py-2 shadow-lg max-w-[240px]">
            <p className="text-xs font-medium truncate mb-1">{d.query}</p>
            <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Position</span>
                    <span className="font-semibold tabular-nums">{d.position.toFixed(1)}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">CTR</span>
                    <span className="font-semibold tabular-nums">{(d.ctr * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Impressions</span>
                    <span className="font-semibold tabular-nums">{d.impressions.toLocaleString("fr-FR")}</span>
                </div>
            </div>
        </div>
    );
}

export function KeywordsCtrVsPosition({ keywords }: Props) {
    const data = useMemo(() =>
        keywords
            .filter(k => k.impressions > 0)
            .slice(0, 100)
            .map(k => ({
                query: k.query,
                position: k.position,
                ctr: k.ctr,
                ctrPercent: k.ctr * 100,
                impressions: k.impressions,
            })),
        [keywords]
    );

    const maxImpressions = useMemo(() => Math.max(...data.map(d => d.impressions), 1), [data]);

    return (
        <Card className="border-border/40">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Percent className="h-4 w-4 text-primary" />
                    CTR vs Position
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">
                    Taille des bulles = impressions
                </p>
            </CardHeader>
            <CardContent className="pt-0">
                {data.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-8 text-center">Aucune donnee</p>
                ) : (
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="hsl(var(--border))"
                                    strokeOpacity={0.3}
                                />
                                <XAxis
                                    dataKey="position"
                                    type="number"
                                    name="Position"
                                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 'auto']}
                                    label={{ value: "Position", position: "insideBottom", offset: -2, fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                />
                                <YAxis
                                    dataKey="ctrPercent"
                                    type="number"
                                    name="CTR %"
                                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={40}
                                    tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                                    label={{ value: "CTR", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                />
                                <ZAxis
                                    dataKey="impressions"
                                    type="number"
                                    range={[30, 300]}
                                    domain={[0, maxImpressions]}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Scatter
                                    data={data}
                                    fill="hsl(217, 91%, 60%)"
                                    fillOpacity={0.5}
                                    stroke="hsl(217, 91%, 60%)"
                                    strokeOpacity={0.8}
                                />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
