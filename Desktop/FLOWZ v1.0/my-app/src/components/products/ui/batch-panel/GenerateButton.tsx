"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GenerateButtonProps } from "./types";

export function GenerateButton({
    canGenerate,
    isGenerating,
    isProcessingAltTexts,
    isProcessingBulkAction,
    progressMessage,
    selectedCount,
    onGenerate,
}: GenerateButtonProps) {
    return (
        <Button
            size="sm"
            disabled={!canGenerate || isGenerating || isProcessingBulkAction}
            onClick={onGenerate}
            className={cn(
                "gap-2.5 px-5 h-9 font-bold text-xs rounded-xl relative overflow-hidden",
                "bg-primary text-primary-foreground",
                "shadow-sm shadow-primary/20",
                "hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25",
                "active:scale-[0.98]",
                "transition-all duration-200",
                "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-sm",
                isGenerating && "animate-pulse"
            )}
        >
            {isProcessingAltTexts ? (
                <>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                        <ImageIcon className="h-3.5 w-3.5" />
                    </motion.div>
                    <span>Alt texts...</span>
                </>
            ) : isGenerating ? (
                <>
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 180, 360]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <Zap className="h-3.5 w-3.5" />
                    </motion.div>
                    <span className="inline-block min-w-[100px] text-left">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={progressMessage}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.2 }}
                                className="block truncate"
                            >
                                {progressMessage}
                            </motion.span>
                        </AnimatePresence>
                    </span>
                </>
            ) : (
                <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Générer ({selectedCount})</span>
                </>
            )}
        </Button>
    );
}
