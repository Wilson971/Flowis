"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShellAurora } from "@/components/layout/AuroraBackground";
import { cn } from "@/lib/utils";

interface GscIndexationSelectionBarProps {
    selectedCount: number;
    onDeselect: () => void;
    onBatchIndex: () => void;
    onBatchInspect?: () => void;
    isSubmitting?: boolean;
    isInspecting?: boolean;
    className?: string;
}

export function GscIndexationSelectionBar({
    selectedCount,
    onDeselect,
    onBatchIndex,
    onBatchInspect,
    isSubmitting = false,
    isInspecting = false,
    className,
}: GscIndexationSelectionBarProps) {
    const [mounted, setMounted] = useState(false);
    const [cardBounds, setCardBounds] = useState<{ left: number; width: string }>({ left: 0, width: "100%" });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || selectedCount === 0) return;

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
    }, [mounted, selectedCount]);

    if (!mounted || selectedCount === 0) return null;

    const content = (
        <AnimatePresence>
            {selectedCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{
                        type: "spring", stiffness: 350, damping: 25,
                        opacity: { duration: 0.2 },
                    }}
                    style={{
                        position: "fixed",
                        bottom: 0,
                        left: cardBounds.left,
                        width: cardBounds.width,
                        zIndex: 9999,
                        display: "flex",
                        justifyContent: "center",
                    }}
                    className="pointer-events-none"
                >
                    <div className="pointer-events-auto flex justify-center w-full max-w-[820px] px-0 sm:px-3">
                        <div className={cn(
                            "relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 p-3 px-4 sm:px-5 bg-zinc-950/95 backdrop-blur-2xl text-white border-none rounded-t-xl sm:rounded-t-2xl sm:rounded-b-none shadow-[0_-8px_30px_rgb(0,0,0,0.3)] w-full",
                            className,
                        )}>
                            {/* Border */}
                            <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-t-xl sm:rounded-t-2xl sm:rounded-b-none z-0" />

                            {/* Animated glow border */}
                            <motion.div
                                className="absolute inset-0 pointer-events-none border-[1.5px] border-white/40 rounded-t-xl sm:rounded-t-2xl sm:rounded-b-none z-[5]"
                                animate={{
                                    opacity: [0.1, 1, 0.1],
                                    boxShadow: [
                                        "0 0 0 rgba(255,255,255,0), inset 0 0 0 rgba(255,255,255,0)",
                                        "0 0 12px rgba(255,255,255,0.2), inset 0 0 12px rgba(255,255,255,0.1)",
                                        "0 0 0 rgba(255,255,255,0), inset 0 0 0 rgba(255,255,255,0)",
                                    ],
                                }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                            />

                            {/* Aurora */}
                            <motion.div
                                className="absolute inset-0 pointer-events-none"
                                animate={{ opacity: [0.4, 0.8, 0.4] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <ShellAurora position="top" opacity={0.4} />
                                <ShellAurora position="middle" opacity={0.3} />
                                <ShellAurora position="bottom" opacity={0.4} />
                            </motion.div>

                            {/* Left — count + deselect */}
                            <div className="relative z-10 flex items-center gap-4 w-full sm:w-auto">
                                <span className="bg-white/10 text-inherit text-xs font-bold px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                    {selectedCount} URL{selectedCount > 1 ? "s" : ""} sélectionnée{selectedCount > 1 ? "s" : ""}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onDeselect}
                                    className="h-8 px-3 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    <X className="h-3.5 w-3.5 mr-1.5" />
                                    Désélectionner
                                </Button>
                            </div>

                            {/* Right — actions */}
                            <div className="relative z-10 flex items-center justify-end gap-2 text-white w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-white/10 sm:border-none">
                                {onBatchInspect && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onBatchInspect}
                                        disabled={isInspecting || isSubmitting}
                                        className="h-9 px-4 text-xs font-semibold bg-white/10 text-white hover:bg-white/20 border-transparent rounded-xl transition-all"
                                    >
                                        <Search className="h-3.5 w-3.5 mr-2" />
                                        Inspecter
                                    </Button>
                                )}

                                <Button
                                    size="sm"
                                    onClick={onBatchIndex}
                                    disabled={isSubmitting || isInspecting}
                                    className="h-9 px-4 text-xs font-semibold bg-white text-zinc-900 hover:bg-zinc-200 rounded-xl shadow-sm transition-all flex-1 sm:flex-none"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Zap className="h-3.5 w-3.5 mr-2 animate-pulse" />
                                            Envoi en cours…
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="h-3.5 w-3.5 mr-2" />
                                            Indexer {selectedCount} page{selectedCount > 1 ? "s" : ""}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(content, document.body);
}
