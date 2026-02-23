"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, X, RefreshCw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
import { ShellAurora } from "@/components/layout/AuroraBackground";
import { CONTENT_TYPES } from "./constants";
import { ContentTypeChip } from "./ContentTypeChip";
import { GenerateButton } from "./GenerateButton";
import { PanelHeader } from "./PanelHeader";
import type { BatchGenerationPanelProps } from "./types";

export function BatchGenerationPanel({
    isOpen = false,
    selectedCount,
    selectedTypes,
    forceRegenerate,
    isGenerating,
    isProcessingAltTexts,
    isProcessingBulkAction,
    progressMessage,
    altTextProgress,
    isCollapsed,
    isHidden,
    pendingApprovalsCount,
    syncableProductsCount,
    modelName = "Gemini 2.0 Flash",
    onToggleType,
    onForceRegenerateChange,
    onCollapseChange,
    onGenerate,
    onOpenSettings,
    onClose,
    onApproveAll,
    onRejectAll,
    onPushToStore,
    onCancelSync,
    onOpenBulkApproval,
}: BatchGenerationPanelProps) {
    const showForceRegenerate = selectedTypes.includes("alt_text");
    const canGenerate = selectedCount > 0 && selectedTypes.length > 0;

    const [cardBounds, setCardBounds] = useState<{ left: number | string; width: number | string }>({ left: 0, width: "100%" });

    useEffect(() => {
        if (!isOpen) return;

        const el = document.getElementById("main-content");
        if (!el) return;

        const updateBounds = () => {
            const rect = el.getBoundingClientRect();
            setCardBounds({ left: rect.left, width: `${rect.width}px` });
        };

        updateBounds();
        window.addEventListener("resize", updateBounds);

        const observer = new ResizeObserver(updateBounds);
        observer.observe(el);

        return () => {
            window.removeEventListener("resize", updateBounds);
            observer.disconnect();
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && selectedCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={
                        isHidden
                            ? { opacity: 0, scale: 0.95, y: 20, pointerEvents: "none" }
                            : { y: 0, opacity: 1, scale: 1, pointerEvents: "auto" }
                    }
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{
                        type: "spring", stiffness: 350, damping: 25,
                        opacity: { duration: 0.2 }
                    }}
                    style={{
                        position: "fixed",
                        bottom: 0,
                        left: cardBounds.left,
                        width: cardBounds.width,
                        transform: "none",
                        zIndex: 9999,
                        paddingBottom: isCollapsed ? 0 : "max(16px, env(safe-area-inset-bottom))",
                        display: "flex",
                        justifyContent: "center"
                    }}
                    className={cn(
                        "transition-all duration-300",
                        isHidden ? "pointer-events-none" : "pointer-events-auto"
                    )}
                >
                    <div className={cn("w-full max-w-[820px]", isCollapsed ? "px-0 sm:px-3" : "px-3")}>
                        <div className={cn(
                            "relative overflow-hidden transition-all duration-300 w-full",
                            isCollapsed
                                ? "bg-zinc-950/95 backdrop-blur-2xl text-white border-none shadow-[0_-8px_30px_rgb(0,0,0,0.3)] rounded-t-xl sm:rounded-t-2xl sm:rounded-b-none"
                                : "bg-card/90 backdrop-blur-2xl border border-border/50 shadow-2xl rounded-xl"
                        )}>
                            {/* Background effects */}
                            {isCollapsed ? (
                                <>
                                    {/* Basic Background Border */}
                                    <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-t-xl sm:rounded-t-2xl sm:rounded-b-none z-0" />

                                    {/* Animated Floating Glow Border */}
                                    <motion.div
                                        className="absolute inset-0 pointer-events-none border-[1.5px] border-white/40 rounded-t-xl sm:rounded-t-2xl sm:rounded-b-none z-[5]"
                                        animate={{
                                            opacity: [0.1, 1, 0.1],
                                            boxShadow: [
                                                "0 0 0 rgba(255,255,255,0), inset 0 0 0 rgba(255,255,255,0)",
                                                "0 0 12px rgba(255,255,255,0.2), inset 0 0 12px rgba(255,255,255,0.1)",
                                                "0 0 0 rgba(255,255,255,0), inset 0 0 0 rgba(255,255,255,0)"
                                            ]
                                        }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                    {/* Aurora background effects with a subtle pulse */}
                                    <motion.div
                                        className="absolute inset-0 pointer-events-none"
                                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <ShellAurora position="top" opacity={0.4} />
                                        <ShellAurora position="middle" opacity={0.3} />
                                        <ShellAurora position="bottom" opacity={0.4} />
                                    </motion.div>
                                </>
                            ) : (
                                <>
                                    {/* Glass reflection */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none" />
                                    {/* Primary accent glow */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/3 pointer-events-none" />
                                    {/* Border light effect */}
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, black 0%, transparent 50%)' }} />
                                </>
                            )}

                            <div className="relative z-10 w-full">
                                {/* ── Header ── */}
                                <PanelHeader
                                    selectedCount={selectedCount}
                                    isCollapsed={isCollapsed}
                                    isGenerating={isGenerating}
                                    isProcessingAltTexts={isProcessingAltTexts}
                                    isProcessingBulkAction={isProcessingBulkAction}
                                    progressMessage={progressMessage}
                                    canGenerate={canGenerate}
                                    onCollapseChange={onCollapseChange}
                                    onOpenSettings={onOpenSettings}
                                    onGenerate={onGenerate}
                                    onClose={onClose}
                                />

                                {/* ── Expandable Content ── */}
                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            {/* Divider */}
                                            <div className="mx-4 border-t border-border" />

                                            <div className="px-4 pt-4 pb-4 space-y-4">
                                                {/* Question heading */}
                                                <p className="text-sm font-medium text-foreground">
                                                    Que voulez-vous générer ?
                                                </p>

                                                {/* ── Content Type Chips Grid ── */}
                                                <div className="flex flex-wrap gap-2.5">
                                                    {CONTENT_TYPES.map((type) => (
                                                        <ContentTypeChip
                                                            key={type.id}
                                                            type={type}
                                                            isSelected={selectedTypes.includes(type.id)}
                                                            isGenerating={isGenerating}
                                                            onToggle={onToggleType}
                                                        />
                                                    ))}
                                                </div>

                                                {/* ── Force Regenerate (alt_text) ── */}
                                                {showForceRegenerate && (
                                                    <div
                                                        className={cn(
                                                            "flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-200 cursor-pointer",
                                                            forceRegenerate
                                                                ? "bg-warning/10 border-warning/30"
                                                                : "bg-card border-border hover:border-warning/20"
                                                        )}
                                                        onClick={() => !isGenerating && onForceRegenerateChange(!forceRegenerate)}
                                                    >
                                                        <Checkbox
                                                            id="force-regenerate"
                                                            checked={forceRegenerate}
                                                            onCheckedChange={(checked) => onForceRegenerateChange(!!checked)}
                                                            disabled={isGenerating}
                                                            className="flex-shrink-0 h-4 w-4"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <label
                                                                htmlFor="force-regenerate"
                                                                className={cn(
                                                                    "text-xs font-medium leading-none cursor-pointer",
                                                                    forceRegenerate ? "text-warning" : "text-muted-foreground"
                                                                )}
                                                            >
                                                                Forcer la regénération
                                                            </label>
                                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                                Régénère même les images ayant déjà un alt text
                                                            </p>
                                                        </div>
                                                        {forceRegenerate && (
                                                            <RefreshCw className="h-3.5 w-3.5 text-warning flex-shrink-0" />
                                                        )}
                                                    </div>
                                                )}

                                                {/* ── No type selected warning ── */}
                                                {!canGenerate && (
                                                    <div className="p-2.5 rounded-xl bg-warning/10 border border-warning/20">
                                                        <p className="text-xs text-warning font-medium">
                                                            Sélectionnez au moins un type de contenu
                                                        </p>
                                                    </div>
                                                )}

                                                {/* ── Alt Text Progress ── */}
                                                <AnimatePresence>
                                                    {isProcessingAltTexts && altTextProgress && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={motionTokens.transitions.default}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 relative overflow-hidden">
                                                                {/* Shimmer effect */}
                                                                <motion.div
                                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent pointer-events-none"
                                                                    animate={{ x: ["-100%", "200%"] }}
                                                                    transition={{
                                                                        duration: 2,
                                                                        repeat: Infinity,
                                                                        ease: "easeInOut"
                                                                    }}
                                                                />
                                                                <div className="relative z-10">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <motion.div
                                                                            className="p-1 rounded-lg bg-primary/10"
                                                                            animate={{ scale: [1, 1.1, 1] }}
                                                                            transition={{
                                                                                duration: 1.5,
                                                                                repeat: Infinity,
                                                                                ease: "easeInOut"
                                                                            }}
                                                                        >
                                                                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                                                                        </motion.div>
                                                                        <span className="text-xs font-medium text-foreground">
                                                                            Génération des alt texts
                                                                        </span>
                                                                    </div>
                                                                    <Progress value={altTextProgress.total > 0 ? (altTextProgress.current / altTextProgress.total) * 100 : 0} className="h-1.5" />
                                                                    <div className="flex justify-between mt-1.5">
                                                                        <p className="text-[10px] text-muted-foreground">
                                                                            {altTextProgress.message || `${altTextProgress.current}/${altTextProgress.total} images`}
                                                                        </p>
                                                                        {(altTextProgress.successCount > 0 || altTextProgress.errorCount > 0) && (
                                                                            <p className="text-[10px] flex items-center gap-2">
                                                                                <span className="text-success inline-flex items-center gap-0.5">
                                                                                    <Check className="h-2.5 w-2.5" />
                                                                                    {altTextProgress.successCount}
                                                                                </span>
                                                                                {altTextProgress.errorCount > 0 && (
                                                                                    <span className="text-destructive inline-flex items-center gap-0.5">
                                                                                        <X className="h-2.5 w-2.5" />
                                                                                        {altTextProgress.errorCount}
                                                                                    </span>
                                                                                )}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* ── Footer: Model info + Actions + Generate ── */}
                                                <div className="flex items-center justify-between pt-3 border-t border-border">
                                                    {/* Model indicator */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                                                        <span className="text-xs text-muted-foreground">
                                                            Modèle: <span className="font-medium text-foreground">{modelName}</span>
                                                        </span>
                                                    </div>

                                                    {/* Generate CTA */}
                                                    <div className="flex items-center gap-2">

                                                        {/* Generate CTA */}
                                                        <GenerateButton
                                                            canGenerate={canGenerate}
                                                            isGenerating={isGenerating}
                                                            isProcessingAltTexts={isProcessingAltTexts}
                                                            isProcessingBulkAction={isProcessingBulkAction}
                                                            progressMessage={progressMessage}
                                                            selectedCount={selectedCount}
                                                            onGenerate={onGenerate}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
