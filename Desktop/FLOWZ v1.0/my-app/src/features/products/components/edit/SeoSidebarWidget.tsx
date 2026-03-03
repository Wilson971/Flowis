"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ALargeSmall, ArrowRight } from "lucide-react";
import { useProductEditContext } from "../../context/ProductEditContext";
import { SeoScoreGauge } from "@/components/seo/SeoScoreGauge";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
import { getScoreBadgeStyle } from "@/lib/seo/scoreColors";
import { SeoDetailSheet } from "./SeoDetailSheet";

export const SeoSidebarWidget = () => {
    const { seoAnalysis } = useProductEditContext();
    const [sheetOpen, setSheetOpen] = useState(false);

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
                                    Referencement
                                </p>
                                <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                                    Score SEO
                                </h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
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
                            <p className="text-xs text-center text-success font-medium bg-success/5 p-2 rounded-lg">
                                Excellent travail ! Votre fiche est optimisee.
                            </p>
                        )}

                        {criticalIssues > 0 && (
                            <button
                                type="button"
                                onClick={() => setSheetOpen(true)}
                                className="w-full flex items-center gap-2 text-xs text-destructive bg-destructive/5 p-2 rounded-lg border border-destructive/10 hover:bg-destructive/10 transition-colors group/issue cursor-pointer"
                            >
                                <span className="font-semibold tracking-tight shrink-0 tabular-nums">{criticalIssues}</span>
                                <span className="flex-1 text-left">problemes critiques a corriger</span>
                                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover/issue:opacity-100 group-hover/issue:translate-x-0 transition-all duration-200" />
                            </button>
                        )}

                        {warningIssues > 0 && criticalIssues === 0 && (
                            <button
                                type="button"
                                onClick={() => setSheetOpen(true)}
                                className="w-full flex items-center gap-2 text-xs text-warning bg-warning/5 p-2 rounded-lg border border-warning/10 hover:bg-warning/10 transition-colors group/issue cursor-pointer"
                            >
                                <span className="font-semibold tracking-tight shrink-0 tabular-nums">{warningIssues}</span>
                                <span className="flex-1 text-left">ameliorations possibles</span>
                                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover/issue:opacity-100 group-hover/issue:translate-x-0 transition-all duration-200" />
                            </button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* SEO Detail Sheet */}
            <SeoDetailSheet open={sheetOpen} onOpenChange={setSheetOpen} />
        </motion.div>
    );
};
