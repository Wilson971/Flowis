"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

interface HistoryEntry {
    date: string;
    total: number;
    indexed: number;
    not_indexed: number;
}

interface GscIndexationChartProps {
    data: HistoryEntry[];
}

export function GscIndexationChart({ data }: GscIndexationChartProps) {
    const formatted = data.map(d => ({
        ...d,
        label: new Date(d.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    }));

    return (
        <Card className="border-border/40">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                    Rapport sur l&apos;indexation au fil du temps
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                    Pages soumises et leur statut d&apos;indexation sur les 30 derniers jours.
                </p>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                {formatted.length === 0 ? (
                    <div className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">
                        Aucune donnee disponible. Lancez une inspection pour generer l&apos;historique.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={formatted} barGap={0} barCategoryGap="20%">
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    fontSize: 12,
                                    borderRadius: 8,
                                    border: "1px solid hsl(var(--border))",
                                    backgroundColor: "hsl(var(--card))",
                                }}
                            />
                            <Legend
                                iconSize={8}
                                wrapperStyle={{ fontSize: 11 }}
                            />
                            <Bar
                                dataKey="indexed"
                                stackId="a"
                                fill="hsl(var(--chart-2))"
                                name="Indexe"
                                radius={[0, 0, 0, 0]}
                            />
                            <Bar
                                dataKey="not_indexed"
                                stackId="a"
                                fill="hsl(var(--muted))"
                                name="Non indexe"
                                radius={[2, 2, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
