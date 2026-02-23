"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CheckCircle, AlertCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGscIndexationQueue } from "@/hooks/integrations/useGscIndexationQueue";
import type { GscQueueItem } from "@/lib/gsc/types";

interface GscIndexationQueueTabProps {
    siteId: string | null;
}

export function GscIndexationQueueTab({ siteId }: GscIndexationQueueTabProps) {
    const { stats, items, totalItems, isLoading } = useGscIndexationQueue(siteId);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
                </div>
                <Skeleton className="h-[300px] rounded-xl" />
            </div>
        );
    }

    const totalAll = stats.submitted + stats.pending + stats.failed;

    return (
        <div className="space-y-4">
            {/* Explainer */}
            <Card className="border-border/40 bg-muted/30">
                <CardContent className="p-4">
                    <h4 className="text-xs font-semibold mb-1">Quelle est cette page ?</h4>
                    <p className="text-xs text-muted-foreground">
                        Quand vous soumettez des pages a Google, elles sont placees dans une file d&apos;attente.
                        Le quota est de {stats.daily_quota_limit} soumissions par jour.
                        Si vous soumettez plus de pages, elles seront traitees les jours suivants.
                    </p>
                </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-4">
                <KpiCard
                    icon={Send}
                    label="Pages soumises"
                    value={stats.submitted}
                    total={totalAll}
                    color="text-emerald-500"
                />
                <KpiCard
                    icon={Clock}
                    label="En file d'attente"
                    value={stats.pending}
                    total={totalAll}
                    color="text-amber-500"
                />
                <KpiCard
                    icon={AlertCircle}
                    label="Echouees"
                    value={stats.failed}
                    total={totalAll}
                    color="text-destructive"
                />
            </div>

            {/* Quota indicator */}
            <Card className="border-border/40">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium">Quota journalier</span>
                        <span className="text-xs text-muted-foreground">
                            {stats.daily_quota_used} / {stats.daily_quota_limit}
                        </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${Math.min((stats.daily_quota_used / stats.daily_quota_limit) * 100, 100)}%` }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Queue items */}
            <Card className="border-border/40">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">
                        Historique des soumissions ({totalItems})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    {items.length === 0 ? (
                        <div className="text-center py-8 text-xs text-muted-foreground">
                            Aucune page soumise pour le moment.
                        </div>
                    ) : (
                        <div className="divide-y divide-border/30">
                            {items.map((item) => (
                                <QueueItemRow key={item.id} item={item} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function KpiCard({
    icon: Icon,
    label,
    value,
    total,
    color,
}: {
    icon: typeof Send;
    label: string;
    value: number;
    total: number;
    color: string;
}) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <Card className="border-border/40">
            <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Icon className={cn("h-4 w-4", color)} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold">{value}</span>
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                </div>
            </CardContent>
        </Card>
    );
}

function QueueItemRow({ item }: { item: GscQueueItem }) {
    const relativePath = item.url.replace(/^https?:\/\/[^/]+/, '') || '/';
    const timeAgo = getRelativeTime(item.created_at);

    return (
        <div className="flex items-center gap-3 py-2.5 px-2">
            {item.status === 'submitted' && (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            )}
            {item.status === 'pending' && (
                <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            )}
            {item.status === 'failed' && (
                <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
            )}
            {item.status === 'quota_exceeded' && (
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}

            <span className="text-xs font-mono truncate flex-1">{relativePath}</span>

            <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo}</span>
        </div>
    );
}

function getRelativeTime(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return "a l'instant";
    if (diffMin < 60) return `il y a ${diffMin}min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays < 30) return `il y a ${diffDays}j`;
    return `il y a ${Math.floor(diffDays / 30)} mois`;
}
