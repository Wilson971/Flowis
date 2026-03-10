"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
} from "recharts";
import { resolveAllPositionColors } from "@/lib/design-system/tokens/gsc";

interface Props {
    distribution: { bucket: string; count: number }[];
}

function CustomTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="rounded-xl border border-border/50 bg-popover px-3 py-2 shadow-lg">
            <p className="text-xs font-medium mb-0.5">Position {d.bucket}</p>
            <p className="text-xs text-muted-foreground">
                <span className="font-semibold tabular-nums text-foreground">{d.count}</span> mots-cles
            </p>
        </div>
    );
}

export function KeywordsPositionDistribution({ distribution }: Props) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const BUCKET_COLORS = useMemo(() => resolveAllPositionColors(), []);
    const hasData = distribution.some(d => d.count > 0);

    return (
        <Card className="border-border/40">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Repartition des positions
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                {!hasData ? (
                    <p className="text-xs text-muted-foreground py-8 text-center">Aucune donnee</p>
                ) : (
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distribution} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="hsl(var(--border))"
                                    strokeOpacity={0.3}
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="bucket"
                                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={35}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                                    {distribution.map((entry) => (
                                        <Cell
                                            key={entry.bucket}
                                            fill={BUCKET_COLORS[entry.bucket] || "hsl(var(--primary))"}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
