"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface HistoryEntry {
    date: string;
    total: number;
    indexed: number;
    not_indexed: number;
    intentional_exclusions?: number;
}

interface GscIndexationChartProps {
    data: HistoryEntry[];
}

type RangeDays = 0 | 7 | 14 | 30;

const RANGES: { label: string; days: RangeDays }[] = [
    { label: "Auj.", days: 0 },
    { label: "7j",   days: 7 },
    { label: "14j",  days: 14 },
    { label: "30j",  days: 30 },
];

interface TooltipPayloadItem {
    dataKey: string;
    value: number;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;

    const indexed    = payload.find(p => p.dataKey === "indexed")?.value    ?? 0;
    const notIndexed = payload.find(p => p.dataKey === "not_indexed")?.value ?? 0;
    // Use the total field passed as invisible area — gives sitemap total as denominator
    const totalFromPayload = payload.find(p => p.dataKey === "total")?.value;
    const total = (totalFromPayload != null && totalFromPayload > 0)
        ? totalFromPayload
        : indexed + notIndexed;
    const rate = total > 0 ? Math.round((indexed / total) * 100) : 0;

    return (
        <div className="rounded-2xl border border-white/[0.08] bg-[#111113] shadow-2xl p-3.5 min-w-[170px] text-xs backdrop-blur-sm">
            <p className="text-[11px] font-medium text-[#52525b] mb-2.5 uppercase tracking-wider">{label}</p>
            <div className="space-y-2">
                <div className="flex items-center justify-between gap-6">
                    <span className="flex items-center gap-2 text-[#71717a]">
                        <span className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_6px_#22c55e80]" />
                        Indexées
                    </span>
                    <span className="font-bold text-white tabular-nums">{indexed}</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                    <span className="flex items-center gap-2 text-[#71717a]">
                        <span className="w-2 h-2 rounded-full bg-[#f59e0b] shadow-[0_0_6px_#f59e0b80]" />
                        Non indexées
                    </span>
                    <span className="font-bold text-white tabular-nums">{notIndexed}</span>
                </div>
                <div className="h-px bg-white/[0.06] my-1" />
                <div className="flex items-center justify-between gap-6">
                    <span className="text-[#52525b]">Taux</span>
                    <span className={cn(
                        "font-bold text-sm",
                        rate >= 80 ? "text-[#22c55e]" : rate >= 50 ? "text-[#f59e0b]" : "text-[#ef4444]"
                    )}>
                        {rate}%
                    </span>
                </div>
            </div>
        </div>
    );
}

export function GscIndexationChart({ data }: GscIndexationChartProps) {
    const [range, setRange] = useState<RangeDays>(30);

    // For "Auj." (days === 0): show only the last available data point as snapshot
    const isSnapshot = range === 0;

    const dateFormat: Intl.DateTimeFormatOptions =
        range === 7  ? { weekday: "short", day: "numeric" } :
        range === 14 ? { day: "numeric", month: "short" } :
                       { day: "numeric", month: "short" };

    const tickInterval =
        range === 7  ? 0 :
        range === 14 ? 1 :
                       4;

    const filtered = isSnapshot
        ? [data.at(-1)].filter((d): d is HistoryEntry => d != null)
        : data
            .slice(-range)
            .map(d => ({
                ...d,
                label: new Date(d.date).toLocaleDateString("fr-FR", dateFormat),
                rate: d.total > 0 ? Math.round((d.indexed / d.total) * 100) : 0,
            }));

    const chartEntries = isSnapshot
        ? []
        : (filtered as Array<HistoryEntry & { label: string; rate: number }>);

    // Pad to at least 2 points so AreaChart renders a line
    const chartData = chartEntries.length === 1
        ? [{ ...chartEntries[0], label: "" }, chartEntries[0]]
        : chartEntries;

    const lastEntry  = filtered.at(-1);
    const prevEntry  = isSnapshot ? undefined : (filtered as Array<HistoryEntry & { rate: number }>).at(-2);
    const lastRate   = lastEntry
        ? (lastEntry.total > 0 ? Math.round((lastEntry.indexed / lastEntry.total) * 100) : 0)
        : 0;
    const prevRate   = prevEntry
        ? (prevEntry.total > 0 ? Math.round((prevEntry.indexed / prevEntry.total) * 100) : lastRate)
        : lastRate;
    const deltaRate  = lastRate - prevRate;  // in percentage points

    const lastIndexed    = lastEntry?.indexed    ?? 0;
    const lastNotIndexed = lastEntry?.not_indexed ?? 0;

    const prevIndexed   = prevEntry?.indexed ?? lastIndexed;
    const deltaCount    = lastIndexed - prevIndexed;  // in URL count

    const avgRate = chartEntries.length > 0
        ? Math.round(chartEntries.reduce((s, d) => s + d.rate, 0) / chartEntries.length)
        : lastRate;

    const allValues = chartData.flatMap(d => [d.indexed, d.not_indexed]);
    const yMax = allValues.length > 0 ? Math.max(...allValues) : 10;
    const yDomain: [number, number] = [0, Math.ceil(yMax * 1.15)];

    const snapshotDate = lastEntry
        ? new Date(lastEntry.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
        : null;

    return (
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#111113] to-[#0d0d0f] overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-semibold text-white tracking-tight">
                            Indexation au fil du temps
                        </h3>
                        <p className="text-[11px] text-[#52525b] mt-0.5">
                            {isSnapshot && snapshotDate
                                ? `Snapshot du ${snapshotDate}`
                                : "Évolution du taux par jour"}
                        </p>
                    </div>
                    {/* Range pills */}
                    <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]">
                        {RANGES.map(({ label, days }) => (
                            <button
                                key={days}
                                onClick={() => setRange(days)}
                                className={cn(
                                    "px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-150",
                                    range === days
                                        ? "bg-white/[0.08] text-white shadow-sm"
                                        : "text-[#52525b] hover:text-[#a1a1aa]"
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI strip */}
                {filtered.length > 0 && (
                    <div className="flex items-center gap-5 mt-4">
                        {/* Rate + delta pp */}
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-white tracking-tight tabular-nums">
                                {lastRate}%
                            </span>
                            {!isSnapshot && (
                                <span className={cn(
                                    "text-xs font-semibold mb-1 tabular-nums",
                                    deltaRate > 0 ? "text-[#22c55e]" : deltaRate < 0 ? "text-[#ef4444]" : "text-[#52525b]"
                                )}>
                                    {deltaRate > 0 ? `▲ +${deltaRate}pp` : deltaRate < 0 ? `▼ ${deltaRate}pp` : "—"}
                                </span>
                            )}
                        </div>

                        <div className="h-8 w-px bg-white/[0.06]" />

                        {/* Indexed + delta count */}
                        <div>
                            <p className="text-[10px] text-[#52525b] uppercase tracking-wider mb-0.5">Indexées</p>
                            <div className="flex items-baseline gap-1.5">
                                <p className="text-sm font-bold text-[#22c55e] tabular-nums">{lastIndexed}</p>
                                {!isSnapshot && deltaCount !== 0 && (
                                    <span className={cn(
                                        "text-[10px] font-semibold tabular-nums",
                                        deltaCount > 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                                    )}>
                                        {deltaCount > 0 ? `▲ +${deltaCount}` : `▼ ${deltaCount}`}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Not indexed */}
                        <div>
                            <p className="text-[10px] text-[#52525b] uppercase tracking-wider mb-0.5">En attente</p>
                            <p className="text-sm font-bold text-[#f59e0b] tabular-nums">{lastNotIndexed}</p>
                        </div>

                        {!isSnapshot && (
                            <>
                                <div className="h-8 w-px bg-white/[0.06]" />
                                {/* Average */}
                                <div>
                                    <p className="text-[10px] text-[#52525b] uppercase tracking-wider mb-0.5">Moyenne</p>
                                    <p className="text-sm font-bold text-[#a1a1aa] tabular-nums">{avgRate}%</p>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Chart area */}
            <div className="px-1 pb-4">
                {isSnapshot ? (
                    /* Snapshot mode: no line chart, show breakdown cards instead */
                    lastEntry ? (
                        <div className="mx-4 mb-2 grid grid-cols-3 gap-3">
                            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
                                <p className="text-[10px] text-[#52525b] uppercase tracking-wider mb-1">Indexées</p>
                                <p className="text-xl font-bold text-[#22c55e] tabular-nums">{lastEntry.indexed}</p>
                                <p className="text-[10px] text-[#3f3f46] mt-0.5">
                                    {lastEntry.total > 0 ? Math.round((lastEntry.indexed / lastEntry.total) * 100) : 0}% du total
                                </p>
                            </div>
                            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
                                <p className="text-[10px] text-[#52525b] uppercase tracking-wider mb-1">En attente</p>
                                <p className="text-xl font-bold text-[#f59e0b] tabular-nums">{lastEntry.not_indexed}</p>
                                <p className="text-[10px] text-[#3f3f46] mt-0.5">problèmes actifs</p>
                            </div>
                            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
                                <p className="text-[10px] text-[#52525b] uppercase tracking-wider mb-1">Total sitemap</p>
                                <p className="text-xl font-bold text-white tabular-nums">{lastEntry.total}</p>
                                {(lastEntry.intentional_exclusions ?? 0) > 0 && (
                                    <p className="text-[10px] text-[#3f3f46] mt-0.5">
                                        {lastEntry.intentional_exclusions} exclues
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[140px] gap-3 text-[#3f3f46]">
                            <p className="text-xs font-medium text-[#52525b]">Aucune donnée aujourd&apos;hui</p>
                            <p className="text-[11px] text-[#3f3f46]">Lancez une inspection pour générer un snapshot</p>
                        </div>
                    )
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[200px] gap-3 text-[#3f3f46]">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <rect width="40" height="40" rx="20" fill="currentColor" fillOpacity="0.08" />
                            <path d="M10 28l6-8 5 6 5-10 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="text-center">
                            <p className="text-xs font-medium text-[#52525b]">Aucune donnée</p>
                            <p className="text-[11px] text-[#3f3f46] mt-0.5">Lancez une inspection pour générer l&apos;historique</p>
                        </div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                            <defs>
                                <linearGradient id="fillIndexed" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%"   stopColor="#22c55e" stopOpacity={0.25} />
                                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                                </linearGradient>
                                <linearGradient id="fillNotIndexed" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%"   stopColor="#f59e0b" stopOpacity={0.20} />
                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                                </linearGradient>
                                <filter id="glow-green">
                                    <feGaussianBlur stdDeviation="2" result="blur" />
                                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                </filter>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="1 4"
                                stroke="rgba(255,255,255,0.04)"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 10, fill: "#3f3f46" }}
                                axisLine={false}
                                tickLine={false}
                                dy={6}
                                interval={tickInterval}
                                minTickGap={range === 30 ? 40 : 20}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: "#3f3f46" }}
                                axisLine={false}
                                tickLine={false}
                                width={28}
                                domain={yDomain}
                                allowDataOverflow={false}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }}
                            />
                            {/* Invisible area for total — makes it available in tooltip payload */}
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="none"
                                fill="none"
                                dot={false}
                                activeDot={false}
                                legendType="none"
                            />
                            <Area
                                type="monotone"
                                dataKey="indexed"
                                stroke="#22c55e"
                                strokeWidth={2}
                                fill="url(#fillIndexed)"
                                dot={false}
                                activeDot={{ r: 4, fill: "#22c55e", stroke: "#111113", strokeWidth: 2 }}
                                name="Indexées"
                            />
                            <Area
                                type="monotone"
                                dataKey="not_indexed"
                                stroke="#f59e0b"
                                strokeWidth={1.5}
                                fill="url(#fillNotIndexed)"
                                dot={false}
                                activeDot={{ r: 3, fill: "#f59e0b", stroke: "#111113", strokeWidth: 2 }}
                                name="Non indexées"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Footer legend — only for line chart view */}
            {!isSnapshot && (
                <div className="flex items-center gap-5 px-5 pb-4">
                    <span className="flex items-center gap-1.5 text-[11px] text-[#52525b]">
                        <span className="w-3 h-[2px] rounded-full bg-[#22c55e] inline-block" />
                        Indexées
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-[#52525b]">
                        <span className="w-3 h-[2px] rounded-full bg-[#f59e0b] inline-block" />
                        Non indexées
                    </span>
                </div>
            )}
        </div>
    );
}
