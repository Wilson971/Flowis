"use client";

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

interface Props {
    distribution: { bucket: string; count: number }[];
}

const BUCKET_COLORS: Record<string, string> = {
    "1-3": "hsl(160, 60%, 45%)",
    "4-10": "hsl(142, 50%, 50%)",
    "11-20": "hsl(35, 92%, 50%)",
    "21-50": "hsl(20, 80%, 55%)",
    "51+": "hsl(0, 70%, 55%)",
};

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
