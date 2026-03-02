"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { RefreshCw, ALargeSmall, FileText } from "lucide-react";
import { useProductEditContext } from "../../context/ProductEditContext";
import { SeoScoreGauge } from "@/components/seo/SeoScoreGauge";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
import { getScoreBadgeStyle } from "@/lib/seo/scoreColors";

export const SeoSidebarWidget = () => {
    const { seoAnalysis, runSeoAnalysis } = useProductEditContext();

    if (!seoAnalysis) return null;

    const { overallScore, issues, isAnalyzing } = seoAnalysis;

    // Count issues by severity
    const criticalIssues = issues.filter((i) => i.severity === "critical").length;
    const warningIssues = issues.filter((i) => i.severity === "warning").length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={motionTokens.transitions.fast}
        >
            <Card className="rounded-xl border border-border/40 bg-card relative group overflow-hidden">
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />

                <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5 relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
                                <ALargeSmall className="h-[18px] w-[18px] text-foreground/70" />
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-0.5">
                                    Référencement
                                </p>
                                <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                                    Score SEO
                                </h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isAnalyzing && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
                            {(() => {
                                const badgeStyle = getScoreBadgeStyle(overallScore);
                                return (
                                    <span className={cn(
                                        "text-[10px] font-semibold tracking-tight tabular-nums px-2 py-0.5 rounded-lg border uppercase tracking-wider",
                                        badgeStyle.text, badgeStyle.bg, badgeStyle.border
                                    )}>
                                        {overallScore}/100
                                    </span>
                                );
                            })()}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 flex flex-col items-center gap-4 relative z-10">

                    <div className="relative">
                        <SeoScoreGauge score={overallScore} size="md" isLoading={isAnalyzing} />
                    </div>

                    <div className="w-full space-y-3">
                        {issues.length === 0 && overallScore > 0 && (
                            <p className="text-xs text-center text-success font-medium bg-success/5 p-2 rounded">
                                Excellent travail ! Votre fiche est optimisée.
                            </p>
                        )}

                        {criticalIssues > 0 && (
                            <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 p-2 rounded border border-destructive/10">
                                <span className="font-semibold tracking-tight shrink-0 tabular-nums">{criticalIssues}</span>
                                <span>problèmes critiques à corriger</span>
                            </div>
                        )}

                        {warningIssues > 0 && criticalIssues === 0 && (
                            <div className="flex items-start gap-2 text-xs text-warning bg-warning/5 p-2 rounded border border-warning/10">
                                <span className="font-semibold tracking-tight shrink-0 tabular-nums">{warningIssues}</span>
                                <span>améliorations possibles</span>
                            </div>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-[10px] h-8 font-semibold tracking-tight uppercase tracking-wider bg-muted/60 hover:bg-muted/80 border border-border/40 text-muted-foreground hover:text-foreground transition-colors shadow-sm"
                            onClick={() => runSeoAnalysis?.()}
                            disabled={isAnalyzing}
                        >
                            <RefreshCw className={cn("mr-2 h-3 w-3", isAnalyzing && "animate-spin")} />
                            Détails & Analyse
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};
