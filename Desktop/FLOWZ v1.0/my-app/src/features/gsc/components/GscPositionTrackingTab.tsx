"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, ArrowDown, Minus, TrendingUp, Info, AlertCircle } from "lucide-react";
import { useGscPositionTracking } from "@/hooks/integrations/useGscPositionTracking";
import { GscPositionBadge } from "./shared/GscPositionBadge";
import { GscEmptyTab } from "./shared/GscEmptyTab";
import type { GscPositionChange } from "@/lib/gsc/types";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

function DeltaArrow({ change }: { change: GscPositionChange }) {
    if (change.direction === 'up') {
        return (
            <span className="inline-flex items-center gap-0.5 text-emerald-500 font-medium">
                <ArrowUp className="h-3 w-3" />
                <span className="tabular-nums">+{change.delta.toFixed(1)}</span>
            </span>
        );
    }
    if (change.direction === 'down') {
        return (
            <span className="inline-flex items-center gap-0.5 text-red-500 font-medium">
                <ArrowDown className="h-3 w-3" />
                <span className="tabular-nums">{change.delta.toFixed(1)}</span>
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-0.5 text-muted-foreground">
            <Minus className="h-3 w-3" />
            <span className="tabular-nums">0.0</span>
        </span>
    );
}

interface Props {
    siteId: string | null;
}

export function GscPositionTrackingTab({ siteId }: Props) {
    const { positions, daily, isLoading, has7dData } = useGscPositionTracking(siteId);

    const improved = positions.filter(p => p.direction === 'up').length;
    const declined = positions.filter(p => p.direction === 'down').length;
    const stable = positions.filter(p => p.direction === 'stable').length;

    if (!siteId) return <GscEmptyTab icon={TrendingUp} title="Aucun site" description="Selectionnez un site GSC." />;

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 rounded-xl" />
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
                </div>
                <Skeleton className="h-[260px] rounded-xl" />
                <Skeleton className="h-[200px] rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Info / Warning banner */}
            {!has7dData ? (
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-xs">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    <div>
                        <p className="font-medium text-amber-600">Donnees 7 jours non disponibles</p>
                        <p className="text-muted-foreground mt-0.5">
                            Synchronisez avec la periode &quot;7 jours&quot; pour comparer les positions.
                            Cliquez sur &quot;Synchroniser&quot; apres avoir selectionne 7j dans l&apos;onglet Vue d&apos;ensemble.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-2 rounded-xl bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    Comparaison des positions moyennes : 7 derniers jours vs 28 derniers jours
                </div>
            )}

            {/* Mini KPIs */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Ameliores", value: improved, color: "text-emerald-500", bg: "bg-emerald-500/10", icon: ArrowUp },
                    { label: "Degrades", value: declined, color: "text-red-500", bg: "bg-red-500/10", icon: ArrowDown },
                    { label: "Stables", value: stable, color: "text-muted-foreground", bg: "bg-muted/30", icon: Minus },
                ].map(k => (
                    <Card key={k.label} className="border-border/40">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", k.bg)}>
                                <k.icon className={cn("h-4 w-4", k.color)} />
                            </div>
                            <div>
                                <div className={cn("text-xl font-bold tabular-nums", k.color)}>{k.value}</div>
                                <div className="text-[11px] text-muted-foreground">{k.label}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Position chart */}
            {daily.length > 0 && (
                <Card className="border-border/40">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Position moyenne du site (28 derniers jours)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={daily}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                                <XAxis
                                    dataKey="stat_date"
                                    tickFormatter={(v: string) => new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                    tick={{ fontSize: 10 }}
                                    stroke="hsl(var(--muted-foreground))"
                                />
                                <YAxis
                                    reversed
                                    domain={['auto', 'auto']}
                                    tick={{ fontSize: 10 }}
                                    stroke="hsl(var(--muted-foreground))"
                                />
                                <Tooltip
                                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                                    formatter={(v: number) => [v.toFixed(1), 'Position']}
                                    labelFormatter={(l: string) => new Date(l).toLocaleDateString('fr-FR')}
                                />
                                <Line type="monotone" dataKey="position" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Position changes table */}
            <Card className="border-border/40">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Variations de positions par mot-cle</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {positions.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-8 text-center">
                            {has7dData ? "Pas de mots-cles communs entre les 2 periodes." : "Synchronisez les donnees 7j pour voir les variations."}
                        </p>
                    ) : (
                        <div>
                            <div className="grid grid-cols-[1fr_60px_60px_70px_70px] gap-2 px-4 py-2.5 border-b border-border/30 text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/20">
                                <span>Mot-cle</span>
                                <span className="text-right">Pos. 28j</span>
                                <span className="text-right">Pos. 7j</span>
                                <span className="text-right">Delta</span>
                                <span className="text-right">Impr. 7j</span>
                            </div>
                            {positions.map((p, i) => (
                                <div key={`${p.query}-${i}`} className="grid grid-cols-[1fr_60px_60px_70px_70px] gap-2 px-4 py-2.5 hover:bg-muted/20 transition-colors text-xs items-center border-b border-border/10 last:border-0">
                                    <span className="truncate font-medium">{p.query}</span>
                                    <span className="text-right">
                                        <GscPositionBadge position={p.position_28d} />
                                    </span>
                                    <span className="text-right">
                                        <GscPositionBadge position={p.position_7d} />
                                    </span>
                                    <span className="text-right">
                                        <DeltaArrow change={p} />
                                    </span>
                                    <span className="text-right tabular-nums text-muted-foreground">{p.impressions_7d}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
