"use client";

import React from "react";
import { motion } from "framer-motion";
import { RefreshCw, ALargeSmall, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProductEditContext } from "../../../context/ProductEditContext";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

export const SeoWidgetV2 = () => {
    const { seoAnalysis, runSeoAnalysis } = useProductEditContext();

    if (!seoAnalysis) return null;

    const { overallScore, issues, isAnalyzing } = seoAnalysis;

    const criticalIssues = issues.filter((i) => i.severity === "critical").length;
    const warningIssues = issues.filter((i) => i.severity === "warning").length;

    return (
        <motion.div {...motionTokens.variants.staggerItem}>
            <div className="rounded-xl border border-border/40 bg-card relative group overflow-hidden">
                <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />
                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-3 p-6 pb-4">
                        <div className="h-10 w-10 rounded-xl bg-muted/60 ring-1 ring-border/50 flex items-center justify-center shrink-0">
                            <ALargeSmall className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                                Référencement
                            </p>
                            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                                Score SEO
                            </h3>
                        </div>
                    </div>

                    {/* Score */}
                    <div className="px-6 pb-4">
                        <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                            {overallScore}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">/100</span>
                    </div>

                    {/* Issues */}
                    <div className="px-6 pb-4 space-y-2">
                        {issues.length === 0 && overallScore > 0 && (
                            <div className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2">
                                <span className="text-[11px] text-muted-foreground">
                                    Excellent travail ! Fiche optimisée.
                                </span>
                            </div>
                        )}

                        {criticalIssues > 0 && (
                            <div className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2">
                                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                                <span className="text-[11px] text-muted-foreground">Problèmes critiques</span>
                                <span className="text-[11px] font-medium text-foreground ml-auto tabular-nums">
                                    {criticalIssues}
                                </span>
                            </div>
                        )}

                        {warningIssues > 0 && (
                            <div className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2">
                                <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                                <span className="text-[11px] text-muted-foreground">Améliorations possibles</span>
                                <span className="text-[11px] font-medium text-foreground ml-auto tabular-nums">
                                    {warningIssues}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Button */}
                    <div className="px-6 pb-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-7 text-[11px] rounded-lg font-medium bg-muted/60 hover:bg-muted/80 border border-border/40 text-muted-foreground hover:text-foreground"
                            onClick={() => runSeoAnalysis?.()}
                            disabled={isAnalyzing}
                        >
                            <RefreshCw className={cn("mr-2 h-3 w-3", isAnalyzing && "animate-spin")} />
                            Détails & Analyse
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
