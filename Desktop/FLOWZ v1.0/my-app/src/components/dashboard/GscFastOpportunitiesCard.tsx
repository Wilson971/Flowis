"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { styles, motionTokens } from "@/lib/design-system";
import { useGscConnection } from "@/hooks/integrations/useGscConnection";
import {
    useGscScoredOpportunities,
    type OpportunityCategory,
} from "@/hooks/integrations/useGscOpportunities";
import { useSelectedStore } from "@/contexts/StoreContext";
import { useRouter } from "next/navigation";
import {
    Zap,
    MousePointerClick,
    EyeOff,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Sparkles,
    Lightbulb,
    Link2,
    Target,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GscOpportunitiesSheet } from "./GscOpportunitiesSheet";
import type { ScoredOpportunity } from "@/lib/gsc/scoring";

// ============================================
// Constants
// ============================================

const VISIBLE_COUNT = 3;

const CATEGORY_TABS: { value: OpportunityCategory; label: string; icon: React.ReactNode }[] = [
    { value: "quick_wins", label: "Quick Wins", icon: <Zap className="w-3 h-3" /> },
    { value: "low_ctr", label: "Low CTR", icon: <MousePointerClick className="w-3 h-3" /> },
    { value: "no_clicks", label: "No Clicks", icon: <EyeOff className="w-3 h-3" /> },
];

// ============================================
// Score arc — tiny radial progress
// ============================================

function ScoreArc({ score, color }: { score: number; color: ScoredOpportunity['scoreColor'] }) {
    const radius = 12;
    const stroke = 2.5;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const strokeColor =
        color === 'success' ? 'hsl(var(--success))'
            : color === 'warning' ? 'hsl(var(--warning))'
                : 'hsl(var(--destructive))';

    return (
        <div className="relative w-8 h-8 shrink-0">
            <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
                <circle
                    cx="16" cy="16" r={radius}
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth={stroke}
                />
                <circle
                    cx="16" cy="16" r={radius}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-700 ease-out"
                />
            </svg>
            <span className={cn(
                "absolute inset-0 flex items-center justify-center text-[9px] font-black tabular-nums",
                color === 'success' && "text-success",
                color === 'warning' && "text-warning",
                color === 'error' && "text-destructive",
            )}>
                {score}
            </span>
        </div>
    );
}

// ============================================
// Trend chip
// ============================================

function TrendChip({ trend, delta }: { trend: ScoredOpportunity['trend']; delta: number | null }) {
    if (trend === 'new') {
        return (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold tracking-wider uppercase text-info bg-info/10 px-1.5 py-0.5 rounded-full border border-info/20">
                <Sparkles className="w-2.5 h-2.5" />
                New
            </span>
        );
    }

    if (trend === 'up') {
        return (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-success">
                <ArrowUpRight className="w-3 h-3" />
                {delta != null && Math.abs(delta) >= 1 ? Math.abs(Math.round(delta)) : ''}
            </span>
        );
    }

    if (trend === 'down') {
        return (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-destructive">
                <ArrowDownRight className="w-3 h-3" />
                {delta != null && Math.abs(delta) >= 1 ? Math.abs(Math.round(delta)) : ''}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center text-muted-foreground/40">
            <Minus className="w-2.5 h-2.5" />
        </span>
    );
}

// ============================================
// Opportunity row — premium
// ============================================

function OpportunityItem({
    opp,
    isNew,
    index,
    onClick,
}: {
    opp: ScoredOpportunity;
    isNew: boolean;
    index: number;
    onClick: () => void;
}) {
    return (
        <motion.button
            onClick={onClick}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: motionTokens.durations.normal,
                delay: 0.15 + index * motionTokens.staggerDelays.normal,
                ease: motionTokens.easings.smooth,
            }}
            className={cn(
                "group/item w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl",
                "border border-border/40 border-l-2",
                opp.scoreColor === 'success' && "border-l-success/60",
                opp.scoreColor === 'warning' && "border-l-warning/60",
                opp.scoreColor === 'error' && "border-l-destructive/60",
                "bg-muted/20 hover:bg-muted/50",
                "hover:-translate-y-0.5 hover:shadow-sm",
                "transition-all duration-200 ease-out text-left"
            )}
        >
            {/* Score arc */}
            <ScoreArc score={opp.score} color={opp.scoreColor} />

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold text-foreground truncate leading-tight group-hover/item:text-primary transition-colors">
                        {opp.query}
                    </span>
                    {(isNew || opp.trend === 'new') && (
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-info animate-pulse ring-2 ring-info/20" />
                    )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground/70 tabular-nums">
                        #{Math.round(opp.position)}
                    </span>
                    <TrendChip trend={opp.trend} delta={opp.trendDelta} />
                    <span className="text-[9px] text-muted-foreground/50 tabular-nums">
                        {opp.impressions.toLocaleString()} impr
                    </span>
                </div>
            </div>

            {/* Chevron */}
            <div className="shrink-0 w-5 h-5 rounded-lg flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all duration-200">
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover/item:text-primary" />
            </div>
        </motion.button>
    );
}

// ============================================
// Loading
// ============================================

function CardSkeleton() {
    return (
        <div className="flex flex-col h-full p-4 gap-3">
            <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-xl" />
                <div className="space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2.5 w-14" />
                </div>
            </div>
            <Skeleton className="h-7 w-full rounded-lg" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
            </div>
        </div>
    );
}

// ============================================
// Empty state
// ============================================

function EmptyState({ isConnected }: { isConnected: boolean }) {
    const router = useRouter();

    return (
        <div className="relative flex flex-col items-center justify-center p-6 h-full text-center space-y-4 overflow-hidden">
            {/* Ambient blob */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
            </div>

            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                {isConnected ? (
                    <Lightbulb className="h-5 w-5 text-primary" />
                ) : (
                    <Link2 className="h-5 w-5 text-primary" />
                )}
            </div>
            <div>
                <h3 className="text-sm font-semibold">
                    {isConnected ? "Opportunités" : "Google Search Console"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-[180px] leading-relaxed">
                    {isConnected
                        ? "Aucune opportunité détectée pour le moment."
                        : "Connectez GSC pour découvrir vos opportunités SEO."
                    }
                </p>
            </div>
            {!isConnected && (
                <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 rounded-lg gap-1.5"
                    onClick={() => router.push("/app/settings")}
                >
                    <Link2 className="w-3 h-3" />
                    Connecter GSC
                </Button>
            )}
        </div>
    );
}

// ============================================
// Main component
// ============================================

export function GscFastOpportunitiesCard() {
    const [activeCategory, setActiveCategory] = useState<OpportunityCategory>("quick_wins");
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetCategory, setSheetCategory] = useState<OpportunityCategory>("quick_wins");

    const { connections, isConnected, isLoading: connLoading } = useGscConnection({ linkedOnly: true });
    const { selectedStore } = useSelectedStore();

    const storeMatchedSite = selectedStore
        ? connections.find((c) => c.store_id === selectedStore.id)
        : null;
    const effectiveSiteId = storeMatchedSite?.site_id || connections[0]?.site_id || null;

    const { data: scored, isLoading: oppLoading } = useGscScoredOpportunities(
        isConnected ? effectiveSiteId : null
    );

    const isLoading = connLoading || oppLoading;

    const currentItems = useMemo(() => {
        if (!scored) return [];
        return scored[activeCategory] || [];
    }, [scored, activeCategory]);

    const visibleItems = currentItems.slice(0, VISIBLE_COUNT);
    const remainingCount = Math.max(0, currentItems.length - VISIBLE_COUNT);

    const openSheet = (cat: OpportunityCategory) => {
        setSheetCategory(cat);
        setSheetOpen(true);
    };

    if (isLoading) return <CardSkeleton />;

    if (!isConnected || !scored || scored.totalCount === 0) {
        return <EmptyState isConnected={isConnected} />;
    }

    const counts: Record<OpportunityCategory, number> = {
        quick_wins: scored.quick_wins.length,
        low_ctr: scored.low_ctr.length,
        no_clicks: scored.no_clicks.length,
    };

    const totalOpps = scored.totalCount;

    return (
        <>
            <div className="relative flex flex-col h-full overflow-hidden">
                {/* Ambient glow */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-warning/8 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/6 rounded-full blur-3xl" />
                </div>

                {/* ── Header ── */}
                <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
                    <div className="flex items-center gap-2.5">
                        <div className="relative shrink-0">
                            <div className="w-8 h-8 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground">
                                <Target className="w-4 h-4" />
                            </div>
                            {totalOpps > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-warning/60 animate-ping opacity-40" />
                                    <span className="relative inline-flex items-center justify-center rounded-full h-3.5 w-3.5 bg-warning text-[7px] font-black text-warning-foreground ring-2 ring-card">
                                        {totalOpps > 9 ? '9+' : totalOpps}
                                    </span>
                                </span>
                            )}
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold leading-none text-foreground">Opportunités</h3>
                            <p className="text-[9px] text-muted-foreground/60 mt-0.5 font-medium tracking-widest uppercase">
                                SEO Quick Wins
                            </p>
                        </div>
                    </div>
                </div>

                {/* Hairline separator */}
                <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

                {/* ── Pill toggle ── */}
                <div className="relative z-10 px-4 pt-2 pb-1">
                    <Tabs
                        value={activeCategory}
                        onValueChange={(v) => setActiveCategory(v as OpportunityCategory)}
                    >
                        <TabsList className="h-7 w-full p-0.5 bg-muted/40 rounded-lg border border-border/30">
                            {CATEGORY_TABS.map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className={cn(
                                        "flex-1 h-6 text-[10px] font-semibold rounded-md gap-1 px-1",
                                        "data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground",
                                        "transition-all duration-200"
                                    )}
                                >
                                    {tab.icon}
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    {counts[tab.value] > 0 && (
                                        <span className="text-[8px] tabular-nums text-muted-foreground/60 font-bold ml-0.5">
                                            {counts[tab.value]}
                                        </span>
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>

                {/* ── Items ── */}
                <div className="relative z-10 flex-1 flex flex-col gap-1.5 px-4 py-2 min-h-0">
                    {visibleItems.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-xs text-muted-foreground/60 text-center">
                                Aucune opportunité dans cette catégorie.
                            </p>
                        </div>
                    ) : (
                        visibleItems.map((opp, idx) => (
                            <OpportunityItem
                                key={opp.query}
                                opp={opp}
                                isNew={scored.newKeywords.has(opp.query.toLowerCase())}
                                index={idx}
                                onClick={() => openSheet(activeCategory)}
                            />
                        ))
                    )}
                </div>

                {/* ── Footer CTA — pinned bottom ── */}
                {remainingCount > 0 && (
                    <div className="relative z-10 px-4 pb-3 pt-1 mt-auto shrink-0 border-t border-border/20">
                        <button
                            onClick={() => openSheet(activeCategory)}
                            className={cn(
                                "w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg",
                                "text-[11px] font-medium text-muted-foreground",
                                "hover:text-primary hover:bg-muted/50",
                                "transition-all duration-200"
                            )}
                        >
                            Voir les {remainingCount} autres
                            <ChevronRight className="h-3 w-3" />
                        </button>
                    </div>
                )}
            </div>

            {/* Sheet */}
            <GscOpportunitiesSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                opportunities={scored[sheetCategory] || []}
                category={sheetCategory}
                newKeywords={scored.newKeywords}
            />
        </>
    );
}
