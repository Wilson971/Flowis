"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Zap, MousePointerClick, EyeOff, Copy, Lightbulb, TrendingUp, ArrowRight } from "lucide-react";
import { useGscOpportunities } from "@/hooks/integrations/useGscOpportunities";
import { GscDateRangePicker } from "./shared/GscDateRangePicker";
import { GscPositionBadge } from "./shared/GscPositionBadge";
import { GscEmptyTab } from "./shared/GscEmptyTab";
import type { GscDateRange, GscOpportunityKeyword, GscCannibalizationEntry } from "@/lib/gsc/types";

function extractPath(url: string): string {
    try { return new URL(url).pathname.replace(/\/$/, "") || "/"; } catch { return url; }
}

// ============================================================================
// Summary Cards
// ============================================================================

function OpportunitySummaryCards({ data }: { data: { quick_wins: number; low_ctr: number; no_clicks: number; cannibalization: number } }) {
    const cards = [
        { label: "Quick Wins", value: data.quick_wins, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10", desc: "Proches du top 3" },
        { label: "CTR Faible", value: data.low_ctr, icon: MousePointerClick, color: "text-red-500", bg: "bg-red-500/10", desc: "Bien places mais peu cliques" },
        { label: "Sans Clics", value: data.no_clicks, icon: EyeOff, color: "text-violet-500", bg: "bg-violet-500/10", desc: "Vus mais jamais cliques" },
        { label: "Cannibalisation", value: data.cannibalization, icon: Copy, color: "text-orange-500", bg: "bg-orange-500/10", desc: "Pages en concurrence" },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c) => (
                <Card key={c.label} className="border-border/40">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", c.bg)}>
                                <c.icon className={cn("h-4 w-4", c.color)} />
                            </div>
                            <div className={cn("text-2xl font-bold tabular-nums", c.color)}>{c.value}</div>
                        </div>
                        <div className="text-xs font-medium">{c.label}</div>
                        <div className="text-[10px] text-muted-foreground">{c.desc}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// ============================================================================
// Opportunity Section
// ============================================================================

function OpportunitySection({ title, description, icon: Icon, color, items, actionLabel }: {
    title: string;
    description: string;
    icon: typeof Zap;
    color: string;
    items: GscOpportunityKeyword[];
    actionLabel: string;
}) {
    if (items.length === 0) return null;

    return (
        <Card className="border-border/40">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", color)} />
                        {title}
                        <Badge variant="secondary" className="text-[10px] px-1.5">{items.length}</Badge>
                    </CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardHeader>
            <CardContent className="pt-0">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_140px_60px_70px_50px_50px] gap-2 px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground border-b border-border/20">
                    <span>Mot-cle</span>
                    <span>Page</span>
                    <span className="text-right">Clics</span>
                    <span className="text-right">Impr.</span>
                    <span className="text-right">CTR</span>
                    <span className="text-right">Pos.</span>
                </div>
                {items.map((kw, i) => (
                    <div key={`${kw.query}-${i}`} className="grid grid-cols-[1fr_140px_60px_70px_50px_50px] gap-2 px-2 py-2 hover:bg-muted/20 rounded-lg transition-colors text-xs items-center">
                        <div className="min-w-0">
                            <span className="font-medium truncate block">{kw.query}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate" title={kw.page_url}>
                            {extractPath(kw.page_url)}
                        </span>
                        <span className="text-right tabular-nums font-medium">{kw.clicks}</span>
                        <span className="text-right tabular-nums text-muted-foreground">
                            {kw.impressions >= 1000 ? `${(kw.impressions / 1000).toFixed(1)}k` : kw.impressions}
                        </span>
                        <span className="text-right tabular-nums text-muted-foreground">
                            {(kw.ctr * 100).toFixed(1)}%
                        </span>
                        <span className="text-right">
                            <GscPositionBadge position={kw.position} />
                        </span>
                    </div>
                ))}
                <div className="mt-2 px-2">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-medium">{actionLabel}</span>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Main Tab
// ============================================================================

interface Props {
    siteId: string | null;
}

export function GscOpportunitesTab({ siteId }: Props) {
    const [dateRange, setDateRange] = useState<GscDateRange>("last_28_days");
    const { data, isLoading } = useGscOpportunities(siteId, dateRange);

    if (!siteId) return <GscEmptyTab icon={Lightbulb} title="Aucun site" description="Selectionnez un site GSC." />;

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
                {[1, 2].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
        );
    }

    const quickWins = data?.quick_wins || [];
    const lowCtr = data?.low_ctr || [];
    const noClicks = data?.no_clicks || [];
    const cannibalization = data?.cannibalization || [];

    return (
        <div className="space-y-4">
            {/* Header with date picker */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Opportunites SEO detectees</span>
                    <span className="text-xs text-muted-foreground">
                        CTR moyen du site : {data?.avg_ctr ? (data.avg_ctr * 100).toFixed(2) : '—'}%
                    </span>
                </div>
                <GscDateRangePicker value={dateRange} onChange={setDateRange} />
            </div>

            {/* Summary cards */}
            <OpportunitySummaryCards data={{
                quick_wins: quickWins.length,
                low_ctr: lowCtr.length,
                no_clicks: noClicks.length,
                cannibalization: cannibalization.length,
            }} />

            {/* Sections */}
            <OpportunitySection
                title="Quick Wins"
                description="Mots-cles en position 4-20 avec beaucoup d'impressions. Un petit effort de SEO pourrait les amener en top 3."
                icon={Zap}
                color="text-amber-500"
                items={quickWins}
                actionLabel="Optimisez le contenu et les meta pour gagner des positions"
            />

            <OpportunitySection
                title="CTR Faible"
                description="Deja en top 3 mais le CTR est bien en dessous de la moyenne du site. Le titre ou la meta-description ne convainc pas."
                icon={MousePointerClick}
                color="text-red-500"
                items={lowCtr}
                actionLabel="Ameliorez vos titres et meta-descriptions pour attirer plus de clics"
            />

            <OpportunitySection
                title="Sans Clics"
                description="Beaucoup d'impressions mais 0 clic. Le snippet n'est pas attractif ou le mot-cle ne correspond pas a l'intention."
                icon={EyeOff}
                color="text-violet-500"
                items={noClicks}
                actionLabel="Revoir l'adequation contenu / intention de recherche"
            />

            {/* Cannibalization */}
            {cannibalization.length > 0 && (
                <Card className="border-border/40">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Copy className="h-4 w-4 text-orange-500" />
                                Cannibalisation
                                <Badge variant="secondary" className="text-[10px] px-1.5">{cannibalization.length}</Badge>
                            </CardTitle>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Plusieurs pages de votre site se positionnent sur le meme mot-cle, diluant votre autorite SEO.
                        </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <Accordion type="multiple" className="w-full">
                            {cannibalization.map((entry: GscCannibalizationEntry, i: number) => (
                                <AccordionItem key={`${entry.query}-${i}`} value={`${entry.query}-${i}`} className="border-border/20">
                                    <AccordionTrigger className="text-xs py-2.5 hover:no-underline">
                                        <div className="flex items-center gap-3 w-full pr-2">
                                            <span className="font-semibold">{entry.query}</span>
                                            <Badge variant="outline" className="text-[9px] px-1.5 text-orange-500 border-orange-500/30">
                                                {entry.page_count} pages
                                            </Badge>
                                            <span className="text-muted-foreground tabular-nums ml-auto">
                                                {entry.total_impressions} impressions
                                            </span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-3">
                                        <div className="rounded-lg border border-border/20 overflow-hidden">
                                            <div className="grid grid-cols-[1fr_60px_70px_50px] gap-2 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/20">
                                                <span>Page</span>
                                                <span className="text-right">Clics</span>
                                                <span className="text-right">Impr.</span>
                                                <span className="text-right">Pos.</span>
                                            </div>
                                            {entry.pages.map((p, j) => (
                                                <div key={j} className="grid grid-cols-[1fr_60px_70px_50px] gap-2 px-3 py-2 text-xs items-center border-t border-border/10">
                                                    <span className="truncate text-primary/80" title={p.page_url}>{extractPath(p.page_url)}</span>
                                                    <span className="text-right tabular-nums">{p.clicks}</span>
                                                    <span className="text-right tabular-nums text-muted-foreground">{p.impressions}</span>
                                                    <span className="text-right"><GscPositionBadge position={p.position} /></span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1 px-1">
                                            <ArrowRight className="h-3 w-3" />
                                            Consolidez ces pages ou ajoutez des canonicals pour concentrer l&apos;autorite
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            )}

            {quickWins.length === 0 && lowCtr.length === 0 && noClicks.length === 0 && cannibalization.length === 0 && (
                <GscEmptyTab
                    icon={Lightbulb}
                    title="Aucune opportunite detectee"
                    description="Les seuils d'analyse n'ont identifie aucune opportunite. Synchronisez plus de donnees ou ajustez la periode."
                />
            )}
        </div>
    );
}
