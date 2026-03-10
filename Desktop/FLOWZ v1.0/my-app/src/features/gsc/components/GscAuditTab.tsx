"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ShieldCheck,
    AlertTriangle,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    Clock,
    Globe,
    FileSearch,
    Zap,
    BarChart3,
} from "lucide-react";
import { useGscAudit, useRunSeoAudit } from "@/hooks/integrations/useGscAudit";
import type { AuditCategory, AuditSeverity, SeoAuditIssue } from "@/hooks/integrations/useGscAudit";
import { GscEmptyTab } from "./shared/GscEmptyTab";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
}

function getScoreColor(score: number): string {
    if (score >= 75) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
}

function getScoreBg(score: number): string {
    if (score >= 75) return "bg-success";
    if (score >= 50) return "bg-warning";
    return "bg-destructive";
}

function getScoreLabel(score: number): string {
    if (score >= 75) return "Bon";
    if (score >= 50) return "Moyen";
    return "Critique";
}

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<AuditCategory, { label: string; icon: typeof Globe; scoreKey: string }> = {
    technical:    { label: "Technique",    icon: Globe,       scoreKey: "score_technical" },
    on_page:      { label: "On-page",      icon: FileSearch,  scoreKey: "score_on_page" },
    quick_wins:   { label: "Quick Wins",   icon: Zap,         scoreKey: "score_quick_wins" },
    performance:  { label: "Performance",  icon: BarChart3,   scoreKey: "score_performance" },
};

const SEVERITY_CONFIG: Record<AuditSeverity, {
    icon: typeof CheckCircle2;
    label: string;
    badgeClass: string;
    iconClass: string;
    borderClass: string;
}> = {
    critical: {
        icon: AlertCircle,
        label: "Critique",
        badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
        iconClass: "text-destructive",
        borderClass: "border-l-red-500",
    },
    warning: {
        icon: AlertTriangle,
        label: "Avertissement",
        badgeClass: "bg-warning/10 text-warning border-warning/20",
        iconClass: "text-warning",
        borderClass: "border-l-amber-500",
    },
    ok: {
        icon: CheckCircle2,
        label: "OK",
        badgeClass: "bg-success/10 text-success border-success/20",
        iconClass: "text-success",
        borderClass: "border-l-emerald-500",
    },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
    const color = getScoreColor(score);
    const bg = getScoreBg(score);
    const label = getScoreLabel(score);

    return (
        <div className="flex flex-col items-center gap-3 py-2">
            <div className="relative h-24 w-24 flex items-center justify-center">
                {/* Circular background */}
                <svg className="absolute inset-0" viewBox="0 0 96 96" fill="none">
                    <circle cx="48" cy="48" r="40" strokeWidth="8" className="stroke-muted" />
                    <circle
                        cx="48" cy="48" r="40"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
                        transform="rotate(-90 48 48)"
                        className={cn(
                            "transition-all duration-700",
                            score >= 75 ? "stroke-emerald-500" : score >= 50 ? "stroke-amber-500" : "stroke-red-500"
                        )}
                    />
                </svg>
                <div className="flex flex-col items-center">
                    <span className={cn("text-2xl font-bold tabular-nums", color)}>{score}</span>
                    <span className="text-[10px] text-muted-foreground">/100</span>
                </div>
            </div>
            <div className="flex flex-col items-center gap-1">
                <span className={cn("text-sm font-semibold", color)}>{label}</span>
                <div className="flex items-center gap-1.5">
                    <div className={cn("h-2 w-2 rounded-full", bg)} />
                    <span className="text-xs text-muted-foreground">Score SEO global</span>
                </div>
            </div>
        </div>
    );
}

function CategoryScore({ category, score, maxScore }: {
    category: AuditCategory;
    score: number;
    maxScore: number;
}) {
    const cfg = CATEGORY_CONFIG[category];
    const pct = Math.round((score / maxScore) * 100);

    return (
        <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                <cfg.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{cfg.label}</span>
                    <span className={cn("text-xs tabular-nums font-semibold", getScoreColor(pct))}>
                        {score}/{maxScore}
                    </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                        className={cn("h-full rounded-full transition-all duration-500", getScoreBg(pct))}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

function IssueItem({ issue }: { issue: SeoAuditIssue }) {
    const sev = SEVERITY_CONFIG[issue.severity];
    const Icon = sev.icon;

    return (
        <div className={cn(
            "flex gap-3 p-3 rounded-lg border-l-[3px] bg-card hover:bg-muted/20 transition-colors",
            sev.borderClass,
            "border border-border/40"
        )}>
            <Icon className={cn("h-4 w-4 flex-shrink-0 mt-0.5", sev.iconClass)} />
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                    <span className="text-sm font-medium">{issue.title}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {issue.affected_count > 0 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 tabular-nums">
                                {issue.affected_count} page{issue.affected_count > 1 ? "s" : ""}
                            </Badge>
                        )}
                        <Badge className={cn("text-[10px] px-1.5 border", sev.badgeClass)}>
                            {sev.label}
                        </Badge>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {issue.description}
                </p>
            </div>
        </div>
    );
}

function IssueGroup({ severity, issues }: { severity: AuditSeverity; issues: SeoAuditIssue[] }) {
    if (issues.length === 0) return null;
    const sev = SEVERITY_CONFIG[severity];
    const Icon = sev.icon;

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", sev.iconClass)} />
                <span className="text-sm font-semibold">{sev.label}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5">{issues.length}</Badge>
            </div>
            <div className="space-y-2 pl-1">
                {issues.map((issue) => (
                    <IssueItem key={issue.id} issue={issue} />
                ))}
            </div>
        </div>
    );
}

function AuditSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-48 rounded-xl lg:col-span-2" />
            </div>
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
    siteId: string | null;
}

export function GscAuditTab({ siteId }: Props) {
    const { data: audit, isLoading } = useGscAudit(siteId);
    const { mutate: runAudit, isPending: isRunning } = useRunSeoAudit(siteId);

    if (!siteId) {
        return (
            <GscEmptyTab
                icon={ShieldCheck}
                title="Aucun site sélectionné"
                description="Sélectionnez un site GSC pour lancer un audit SEO."
            />
        );
    }

    if (isLoading) return <AuditSkeleton />;

    const criticals = audit?.issues.filter(i => i.severity === "critical") ?? [];
    const warnings  = audit?.issues.filter(i => i.severity === "warning")  ?? [];
    const oks       = audit?.issues.filter(i => i.severity === "ok")       ?? [];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Audit SEO</span>
                    {audit?.created_at && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Dernier audit : {formatRelativeTime(audit.created_at)}
                        </span>
                    )}
                </div>
                <Button
                    size="sm"
                    onClick={() => runAudit({})}
                    disabled={isRunning}
                    className="gap-1.5 h-8 text-xs"
                >
                    <RefreshCw className={cn("h-3.5 w-3.5", isRunning && "animate-spin")} />
                    {isRunning ? "Analyse en cours..." : audit ? "Relancer l'audit" : "Lancer l'audit"}
                </Button>
            </div>

            {/* No audit yet */}
            {!audit && !isRunning && (
                <Card className="border-border/40">
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center gap-4 py-10">
                            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                                <ShieldCheck className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold">Aucun audit disponible</h3>
                                <p className="text-xs text-muted-foreground max-w-sm">
                                    Lancez votre premier audit SEO pour analyser l&apos;état de votre site :
                                    indexation, opportunités, CTR et performance globale.
                                </p>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => runAudit({})}
                                disabled={isRunning}
                                className="gap-1.5"
                            >
                                <RefreshCw className={cn("h-3.5 w-3.5", isRunning && "animate-spin")} />
                                {isRunning ? "Analyse en cours..." : "Lancer l'audit"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Running state overlay */}
            {isRunning && (
                <Card className="border-border/40 border-primary/30">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 py-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">Analyse SEO en cours…</p>
                                <p className="text-xs text-muted-foreground">
                                    Vérification de l&apos;indexation, des keywords et des opportunités
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Results */}
            {audit && (
                <>
                    {/* Score + Category breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Global score */}
                        <Card className="border-border/40">
                            <CardContent className="p-6 flex items-center justify-center">
                                <ScoreGauge score={audit.score} />
                            </CardContent>
                        </Card>

                        {/* Category breakdown */}
                        <Card className="border-border/40 lg:col-span-2">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold">
                                    Détail par catégorie
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <CategoryScore category="technical"   score={audit.score_technical}   maxScore={40} />
                                <CategoryScore category="on_page"     score={audit.score_on_page}     maxScore={30} />
                                <CategoryScore category="quick_wins"  score={audit.score_quick_wins}  maxScore={20} />
                                <CategoryScore category="performance" score={audit.score_performance} maxScore={10} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Summary stats */}
                    {audit.summary && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label: "URLs indexées",     value: `${audit.summary.indexed_urls}/${audit.summary.total_urls}` },
                                { label: "Quick Wins",        value: audit.summary.quick_wins_count },
                                { label: "CTR faible",        value: audit.summary.low_ctr_count },
                                { label: "CTR moyen",         value: audit.summary.avg_ctr ? `${(audit.summary.avg_ctr * 100).toFixed(1)}%` : "—" },
                            ].map(({ label, value }) => (
                                <Card key={label} className="border-border/40">
                                    <CardContent className="p-3">
                                        <div className="text-lg font-bold tabular-nums">{value}</div>
                                        <div className="text-[11px] text-muted-foreground">{label}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Issues list */}
                    <Card className="border-border/40">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <CardTitle className="text-sm font-semibold">
                                    Problèmes détectés
                                </CardTitle>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {criticals.length > 0 && (
                                        <span className="flex items-center gap-1">
                                            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                                            {criticals.length} critique{criticals.length > 1 ? "s" : ""}
                                        </span>
                                    )}
                                    {warnings.length > 0 && (
                                        <span className="flex items-center gap-1">
                                            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                                            {warnings.length} avertissement{warnings.length > 1 ? "s" : ""}
                                        </span>
                                    )}
                                    {oks.length > 0 && (
                                        <span className="flex items-center gap-1">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                                            {oks.length} OK
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <IssueGroup severity="critical" issues={criticals} />
                            <IssueGroup severity="warning"  issues={warnings} />
                            <IssueGroup severity="ok"       issues={oks} />
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
