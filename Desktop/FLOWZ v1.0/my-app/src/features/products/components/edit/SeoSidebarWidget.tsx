"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { RefreshCw, ALargeSmall, FileText } from "lucide-react";
import { useProductEditContext } from "../../context/ProductEditContext";
import { SeoScoreGauge } from "@/components/seo/SeoScoreGauge";
import { cn } from "@/lib/utils";
import { getProductCardTheme } from "@/lib/design-system";
import { getScoreBadgeStyle } from "@/lib/seo/scoreColors";

export const SeoSidebarWidget = () => {
    const theme = getProductCardTheme('SeoSidebarWidget');
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
            transition={{ delay: 0.1, duration: 0.3 }}
        >
            <Card className={theme.container}>
                {/* Glass reflection */}
                <div className={theme.glassReflection} />
                {/* Gradient accent */}
                <div className={theme.gradientAccent} />

                <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5 relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={theme.iconContainer}>
                                <ALargeSmall className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                                    Référencement
                                </p>
                                <h3 className="text-sm font-extrabold tracking-tight text-foreground">
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
                                        "text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider",
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
                                <span className="font-bold shrink-0">{criticalIssues}</span>
                                <span>problèmes critiques à corriger</span>
                            </div>
                        )}

                        {warningIssues > 0 && criticalIssues === 0 && (
                            <div className="flex items-start gap-2 text-xs text-warning bg-warning/5 p-2 rounded border border-warning/10">
                                <span className="font-bold shrink-0">{warningIssues}</span>
                                <span>améliorations possibles</span>
                            </div>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs h-8"
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
