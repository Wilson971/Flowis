"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { SeoScoreGauge } from "@/components/seo/SeoScoreGauge";
import { getScoreColorConfig, getScoreBadgeStyle, getScoreLabel } from "@/lib/seo/scoreColors";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

export const ScoreOverview = ({
    overallScore,
    fieldScores,
    issues,
    isAnalyzing,
}: {
    overallScore: number;
    fieldScores: Record<string, number>;
    issues: Array<{ field: string; severity: string; title?: string; description?: string }>;
    isAnalyzing: boolean;
}) => {
    const colorConfig = getScoreColorConfig(overallScore);
    const badgeStyle = getScoreBadgeStyle(overallScore);
    const criticalCount = issues.filter((i) => i.severity === "critical").length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;
    const infoCount = issues.filter((i) => i.severity === "info").length;

    // Key field scores for mini gauges
    const keyFields = [
        { key: "meta_title", label: "Meta Title" },
        { key: "meta_description", label: "Meta Desc" },
        { key: "title", label: "Titre H1" },
        { key: "description", label: "Description" },
        { key: "slug", label: "Slug" },
        { key: "images", label: "Images" },
    ];

    return (
        <div className="space-y-4">
            {/* Main score + mini field gauges */}
            <div className="flex items-center gap-6">
                {/* Main gauge */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <SeoScoreGauge score={overallScore} size="md" isLoading={isAnalyzing} />
                    <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider",
                        badgeStyle.text, badgeStyle.bg, badgeStyle.border
                    )}>
                        {getScoreLabel(overallScore)}
                    </span>
                </div>

                {/* Field scores grid */}
                <div className="flex-1 grid grid-cols-3 gap-2">
                    {keyFields.map(({ key, label }) => {
                        const score = fieldScores[key] || 0;
                        const cfg = getScoreColorConfig(score);
                        return (
                            <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/10">
                                <SeoScoreGauge score={score} size="sm" isLoading={isAnalyzing} />
                                <div className="min-w-0">
                                    <p className="text-[10px] font-medium text-muted-foreground truncate">{label}</p>
                                    <p className={cn("text-xs font-bold", cfg.text)}>{Math.round(score)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Issues summary */}
            {(criticalCount > 0 || warningCount > 0) && (
                <div className="flex items-center gap-2 flex-wrap">
                    {criticalCount > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/5 px-2.5 py-1 rounded-lg border border-destructive/10">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="font-bold">{criticalCount}</span>
                            <span>critique{criticalCount > 1 ? "s" : ""}</span>
                        </div>
                    )}
                    {warningCount > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/5 px-2.5 py-1 rounded-lg border border-amber-500/10">
                            <Info className="h-3 w-3" />
                            <span className="font-bold">{warningCount}</span>
                            <span>avertissement{warningCount > 1 ? "s" : ""}</span>
                        </div>
                    )}
                    {criticalCount === 0 && warningCount === 0 && overallScore >= 70 && (
                        <div className="flex items-center gap-1.5 text-xs text-success bg-success/5 px-2.5 py-1 rounded-lg border border-success/10">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Bon travail ! Votre fiche est bien optimisée.</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
