"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import type { GscDailyStats } from "@/lib/gsc/types";
import type { MetricKey } from "./GscKpiCards";

interface GscPerformanceChartProps {
    data: GscDailyStats[];
    visibleMetrics: Record<MetricKey, boolean>;
}

const COLORS: Record<MetricKey, string> = {
    clicks: "#4285f4",
    impressions: "#5e35b1",
    ctr: "#00897b",
    position: "#e65100",
};

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-border/50 bg-popover px-3 py-2 shadow-lg">
            <p className="text-xs font-medium text-muted-foreground mb-1">
                {formatDate(label)}
            </p>
            {payload.map((entry: any) => (
                <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
                    <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-muted-foreground">{entry.name} :</span>
                    <span className="font-semibold tabular-nums">
                        {entry.dataKey === "ctr"
                            ? `${(entry.value * 100).toFixed(2)}%`
                            : entry.dataKey === "position"
                                ? entry.value.toFixed(1)
                                : entry.value.toLocaleString("fr-FR")}
                    </span>
                </div>
            ))}
        </div>
    );
}

export function GscPerformanceChart({ data, visibleMetrics }: GscPerformanceChartProps) {
    const chartData = data.map((d) => ({
        ...d,
        dateLabel: formatDate(d.stat_date),
    }));

    // Count visible left-axis metrics to decide if we show tick labels
    const visibleLeft = [visibleMetrics.clicks, visibleMetrics.impressions, visibleMetrics.ctr].filter(Boolean).length;
    const showLeftTicks = visibleLeft === 1;

    return (
        <Card className="border-border/40">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                    Performances Google Search
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradClicks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={COLORS.clicks} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={COLORS.clicks} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradImpressions" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={COLORS.impressions} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={COLORS.impressions} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradCtr" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={COLORS.ctr} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={COLORS.ctr} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradPosition" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={COLORS.position} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={COLORS.position} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="hsl(var(--border))"
                                strokeOpacity={0.3}
                                vertical={false}
                            />
                            <XAxis
                                dataKey="stat_date"
                                tickFormatter={formatDate}
                                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                tickLine={false}
                                axisLine={false}
                                interval="preserveStartEnd"
                            />

                            {/* Each metric gets its own Y axis so scales don't clash */}
                            <YAxis
                                yAxisId="clicks"
                                hide={!visibleMetrics.clicks || !showLeftTicks}
                                tick={{ fontSize: 10, fill: COLORS.clicks }}
                                tickLine={false}
                                axisLine={false}
                                width={showLeftTicks ? 45 : 0}
                            />
                            <YAxis
                                yAxisId="impressions"
                                hide={!visibleMetrics.impressions || !showLeftTicks}
                                tick={{ fontSize: 10, fill: COLORS.impressions }}
                                tickLine={false}
                                axisLine={false}
                                width={showLeftTicks ? 45 : 0}
                            />
                            <YAxis
                                yAxisId="ctr"
                                hide={!visibleMetrics.ctr || !showLeftTicks}
                                tick={{ fontSize: 10, fill: COLORS.ctr }}
                                tickLine={false}
                                axisLine={false}
                                width={showLeftTicks ? 45 : 0}
                            />
                            <YAxis
                                yAxisId="position"
                                orientation="right"
                                reversed
                                hide={!visibleMetrics.position}
                                tick={{ fontSize: 10, fill: COLORS.position }}
                                tickLine={false}
                                axisLine={false}
                                width={visibleMetrics.position ? 35 : 0}
                                domain={[0, "auto"]}
                            />

                            <Tooltip content={<CustomTooltip />} />

                            {visibleMetrics.clicks && (
                                <Area
                                    yAxisId="clicks"
                                    type="monotone"
                                    dataKey="clicks"
                                    name="Clics"
                                    stroke={COLORS.clicks}
                                    strokeWidth={2}
                                    fill="url(#gradClicks)"
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                />
                            )}
                            {visibleMetrics.impressions && (
                                <Area
                                    yAxisId="impressions"
                                    type="monotone"
                                    dataKey="impressions"
                                    name="Impressions"
                                    stroke={COLORS.impressions}
                                    strokeWidth={2}
                                    fill="url(#gradImpressions)"
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                />
                            )}
                            {visibleMetrics.ctr && (
                                <Area
                                    yAxisId="ctr"
                                    type="monotone"
                                    dataKey="ctr"
                                    name="CTR"
                                    stroke={COLORS.ctr}
                                    strokeWidth={2}
                                    fill="url(#gradCtr)"
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                />
                            )}
                            {visibleMetrics.position && (
                                <Area
                                    yAxisId="position"
                                    type="monotone"
                                    dataKey="position"
                                    name="Position"
                                    stroke={COLORS.position}
                                    strokeWidth={2}
                                    fill="url(#gradPosition)"
                                    baseValue="dataMax"
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
