"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
import { CONTENT_TYPE_ICONS } from "./constants";
import type { ContentType } from "./types";

interface ContentTypeChipProps {
    type: ContentType;
    isSelected: boolean;
    isGenerating: boolean;
    onToggle: (typeId: string) => void;
}

export function ContentTypeChip({ type, isSelected, isGenerating, onToggle }: ContentTypeChipProps) {
    const Icon = CONTENT_TYPE_ICONS[type.id] || FileText;

    return (
        <motion.button
            type="button"
            onClick={() => !isGenerating && onToggle(type.id)}
            disabled={isGenerating}
            whileTap={motionTokens.variants.tap}
            className={cn(
                "relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all duration-200",
                "cursor-pointer select-none overflow-hidden",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isSelected
                    ? "bg-primary/5 border-primary/40 shadow-sm backdrop-blur-sm"
                    : "bg-card/80 border-border hover:border-primary/25 hover:bg-primary/[0.02] backdrop-blur-sm"
            )}
        >
            {/* Glass shine on selected */}
            {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
            )}

            {/* Icon container */}
            <div className={cn(
                "relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200",
                isSelected
                    ? "bg-primary/15 backdrop-blur-sm"
                    : "bg-muted/80"
            )}>
                <Icon className={cn(
                    "h-4 w-4 transition-colors duration-200 relative z-10",
                    isSelected ? "text-primary" : "text-muted-foreground"
                )} />
            </div>

            {/* Label */}
            <span className={cn(
                "text-xs font-medium whitespace-nowrap transition-colors duration-200",
                isSelected ? "text-foreground" : "text-muted-foreground"
            )}>
                {type.label}
            </span>

            {/* Active dot indicator */}
            {isSelected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={motionTokens.transitions.spring}
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card"
                />
            )}
        </motion.button>
    );
}
