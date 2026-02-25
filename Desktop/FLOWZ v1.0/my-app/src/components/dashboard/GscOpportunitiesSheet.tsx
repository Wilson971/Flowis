"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { styles, motionTokens } from "@/lib/design-system";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Sparkles,
    TrendingUp,
    MousePointerClick,
    EyeOff,
    ExternalLink,
    ChevronDown,
    ArrowUpDown,
    Zap,
    Lightbulb,
    Target,
} from "lucide-react";
import type { ScoredOpportunity } from "@/lib/gsc/scoring";
import { generateRecommendations, type SeoRecommendation } from "@/lib/gsc/scoring";
import type { OpportunityCategory } from "@/hooks/integrations/useGscOpportunities";

// ============================================
// Types
// ============================================

type SortField = 'score' | 'position' | 'impressions';
type SortOrder = 'asc' | 'desc';

interface GscOpportunitiesSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    opportunities: ScoredOpportunity[];
    category: OpportunityCategory;
    newKeywords: Set<string>;
}

// ============================================
// Constants
// ============================================

const CATEGORY_CONFIG: Record<OpportunityCategory, {
    label: string;
    icon: React.ReactNode;
    description: string;
    accentColor: string;
}> = {
    quick_wins: {
        label: "Quick Wins",
        icon: <Zap className="w-4 h-4" />,
        description: "Keywords en position 8-20 avec du volume — proches du top 10",
        accentColor: "text-warning",
    },
    low_ctr: {
        label: "Low CTR",
        icon: <MousePointerClick className="w-4 h-4" />,
        description: "Keywords en top 10 avec un CTR sous la moyenne",
        accentColor: "text-primary",
    },
    no_clicks: {
        label: "No Clicks",
        icon: <EyeOff className="w-4 h-4" />,
        description: "Keywords avec du volume d'impressions mais aucun clic",
        accentColor: "text-destructive",
    },
};

const SORT_OPTIONS: { field: SortField; label: string }[] = [
    { field: 'score', label: 'Score' },
    { field: 'position', label: 'Position' },
    { field: 'impressions', label: 'Impressions' },
];

// ============================================
// Score arc (larger for sheet)
// ============================================

function ScoreArc({ score, color, size = 36 }: { score: number; color: ScoredOpportunity['scoreColor']; size?: number }) {
    const radius = (size / 2) - 3;
    const stroke = 3;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const strokeColor =
        color === 'success' ? 'hsl(var(--success))'
            : color === 'warning' ? 'hsl(var(--warning))'
                : 'hsl(var(--destructive))';

    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth={stroke}
                />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
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
                "absolute inset-0 flex items-center justify-center text-[10px] font-black tabular-nums",
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
// Trend indicator
// ============================================

function TrendIndicator({ trend, delta }: { trend: ScoredOpportunity['trend']; delta: number | null }) {
    if (trend === 'new') {
        return (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold tracking-wider uppercase text-info bg-info/10 px-1.5 py-0.5 rounded-full border border-info/20">
                <Sparkles className="w-2.5 h-2.5" />
                Nouveau
            </span>
        );
    }

    if (trend === 'up') {
        return (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded-full">
                <ArrowUpRight className="w-3 h-3" />
                {delta != null ? Math.abs(delta).toFixed(1) : ''}
            </span>
        );
    }

    if (trend === 'down') {
        return (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
                <ArrowDownRight className="w-3 h-3" />
                {delta != null ? Math.abs(delta).toFixed(1) : ''}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            <Minus className="w-2.5 h-2.5" />
            Stable
        </span>
    );
}

// ============================================
// Recommendation
// ============================================

function RecommendationItem({ rec, index }: { rec: SeoRecommendation; index: number }) {
    const priorityConfig = {
        high: { color: 'text-destructive', bg: 'bg-destructive/10', label: 'Urgent' },
        medium: { color: 'text-warning', bg: 'bg-warning/10', label: 'Recommandé' },
        low: { color: 'text-muted-foreground', bg: 'bg-muted', label: 'Optionnel' },
    }[rec.priority];

    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05, duration: 0.2 }}
            className="flex items-start gap-2.5 py-2 px-2.5 rounded-lg hover:bg-muted/30 transition-colors"
        >
            <div className={cn("shrink-0 w-5 h-5 rounded-md flex items-center justify-center mt-0.5", priorityConfig.bg)}>
                <Lightbulb className={cn("w-3 h-3", priorityConfig.color)} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[13px] text-foreground leading-relaxed">{rec.text}</p>
                <span className={cn("text-[9px] font-bold tracking-wider uppercase mt-1 inline-block", priorityConfig.color)}>
                    {priorityConfig.label}
                </span>
            </div>
        </motion.div>
    );
}

// ============================================
// Opportunity row
// ============================================

function OpportunityRow({
    opp,
    isNew,
    isExpanded,
    onToggle,
    index,
}: {
    opp: ScoredOpportunity;
    isNew: boolean;
    isExpanded: boolean;
    onToggle: () => void;
    index: number;
}) {
    const recommendations = useMemo(() => generateRecommendations(opp), [opp]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: motionTokens.durations.normal,
                delay: index * 0.04,
                ease: motionTokens.easings.smooth,
            }}
            className={cn(
                "rounded-xl border transition-all duration-200",
                isExpanded
                    ? "border-border bg-muted/20 shadow-sm"
                    : "border-border/40 hover:border-border/70 hover:bg-muted/10"
            )}
        >
            {/* Main row */}
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-3 p-3 text-left"
            >
                {/* Score */}
                <ScoreArc score={opp.score} color={opp.scoreColor} size={40} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">{opp.query}</span>
                        {(isNew || opp.trend === 'new') && (
                            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-info animate-pulse ring-2 ring-info/20" />
                        )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{opp.page_url}</p>
                </div>

                {/* Metrics grid */}
                <div className="hidden sm:grid grid-cols-3 gap-3 shrink-0">
                    <div className="text-center">
                        <div className="text-[8px] font-bold tracking-widest uppercase text-muted-foreground/50 mb-0.5">Pos</div>
                        <div className="flex items-center justify-center gap-1">
                            <span className="text-sm font-black tabular-nums leading-none">#{Math.round(opp.position)}</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-[8px] font-bold tracking-widest uppercase text-muted-foreground/50 mb-0.5">Impr</div>
                        <span className="text-sm font-bold tabular-nums leading-none">{opp.impressions.toLocaleString()}</span>
                    </div>
                    <div className="text-center">
                        <div className="text-[8px] font-bold tracking-widest uppercase text-muted-foreground/50 mb-0.5">CTR</div>
                        <span className="text-sm font-bold tabular-nums leading-none">{(opp.ctr * 100).toFixed(1)}%</span>
                    </div>
                </div>

                {/* Expand */}
                <div className="shrink-0">
                    <ChevronDown className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform duration-200",
                        isExpanded && "rotate-180"
                    )} />
                </div>
            </button>

            {/* Expanded panel */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="px-3 pb-3">
                            {/* Hairline */}
                            <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mb-3" />

                            {/* Stats row (mobile + desktop enhancement) */}
                            <div className="flex items-center gap-2 flex-wrap mb-3">
                                <TrendIndicator trend={opp.trend} delta={opp.trendDelta} />
                                <span className="text-[10px] text-muted-foreground">·</span>
                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                    {opp.clicks} clic{opp.clicks !== 1 ? 's' : ''}
                                </span>
                                <span className="text-[10px] text-muted-foreground">·</span>
                                <a
                                    href={opp.page_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-medium"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Voir la page
                                </a>
                            </div>

                            {/* Recommendations */}
                            <div>
                                <h4 className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground/60 mb-1.5 px-2.5">
                                    Recommandations
                                </h4>
                                <div className="space-y-0.5">
                                    {recommendations.map((rec, i) => (
                                        <RecommendationItem key={i} rec={rec} index={i} />
                                    ))}
                                </div>
                            </div>

                            {/* AI button — Phase 2 */}
                            <div className="mt-3 px-2.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-1.5 rounded-xl h-9 text-xs border-dashed border-border/60"
                                    disabled
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                                    Optimiser avec l&apos;AI
                                    <Badge className={cn(
                                        styles.badge.base, styles.badge.sm,
                                        "bg-primary/10 text-primary border-primary/20 ml-auto"
                                    )}>
                                        Bientôt
                                    </Badge>
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ============================================
// Main sheet
// ============================================

export function GscOpportunitiesSheet({
    open,
    onOpenChange,
    opportunities,
    category,
    newKeywords,
}: GscOpportunitiesSheetProps) {
    const [sortField, setSortField] = useState<SortField>('score');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const config = CATEGORY_CONFIG[category];

    const sorted = useMemo(() => {
        const items = [...opportunities];
        items.sort((a, b) => {
            const multiplier = sortOrder === 'desc' ? -1 : 1;
            switch (sortField) {
                case 'score': return multiplier * (a.score - b.score);
                case 'position': return multiplier * (a.position - b.position);
                case 'impressions': return multiplier * (a.impressions - b.impressions);
                default: return 0;
            }
        });
        return items;
    }, [opportunities, sortField, sortOrder]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    // Aggregate stats
    const avgScore = opportunities.length > 0
        ? Math.round(opportunities.reduce((sum, o) => sum + o.score, 0) / opportunities.length)
        : 0;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-lg p-0 flex flex-col overflow-hidden"
            >
                {/* ── Header ── */}
                <SheetHeader className="relative p-6 pb-4 border-b border-border/30 shrink-0">
                    {/* Ambient glow */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
                    </div>

                    <div className="relative flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground">
                            {config.icon}
                        </div>
                        <div className="flex-1">
                            <SheetTitle className="text-base font-bold">{config.label}</SheetTitle>
                            <SheetDescription className="text-[11px] mt-0.5 leading-snug">{config.description}</SheetDescription>
                        </div>
                        {/* Aggregate score */}
                        <div className="text-center shrink-0">
                            <div className="text-[8px] font-bold tracking-widest uppercase text-muted-foreground/50">Score moy.</div>
                            <span className={cn(
                                "text-lg font-black tabular-nums leading-none",
                                avgScore >= 70 ? "text-success" : avgScore >= 40 ? "text-warning" : "text-destructive"
                            )}>
                                {avgScore}
                            </span>
                        </div>
                    </div>

                    {/* Sort controls */}
                    <div className="relative flex items-center gap-1.5 mt-3">
                        {SORT_OPTIONS.map((opt) => (
                            <button
                                key={opt.field}
                                onClick={() => toggleSort(opt.field)}
                                className={cn(
                                    "h-7 px-2.5 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-all duration-150",
                                    sortField === opt.field
                                        ? "bg-foreground text-background shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                {opt.label}
                                {sortField === opt.field && (
                                    <ArrowUpDown className="w-3 h-3" />
                                )}
                            </button>
                        ))}
                        <span className="ml-auto text-[10px] font-medium text-muted-foreground/60 tabular-nums">
                            {opportunities.length} résultat{opportunities.length > 1 ? 's' : ''}
                        </span>
                    </div>
                </SheetHeader>

                {/* ── List ── */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {sorted.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                                <TrendingUp className="w-5 h-5 text-muted-foreground/40" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">Aucune opportunité</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">dans cette catégorie.</p>
                        </div>
                    ) : (
                        sorted.map((opp, idx) => (
                            <OpportunityRow
                                key={opp.query}
                                opp={opp}
                                isNew={newKeywords.has(opp.query.toLowerCase())}
                                isExpanded={expandedIndex === idx}
                                onToggle={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                                index={idx}
                            />
                        ))
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
