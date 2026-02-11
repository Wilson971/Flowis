"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

/**
 * AI Indicator Components
 *
 * Visual indicators for AI-powered features:
 * - AIStreamingCursor: blinking cursor during text generation
 * - AIOrbIndicator: pulsating orb for processing state
 * - AIProgressBar: glass progress bar with shimmer effect
 */

// ============================================
// AI STREAMING CURSOR
// ============================================

interface AIStreamingCursorProps {
    className?: string;
    /** Color variant */
    variant?: "primary" | "success" | "muted";
}

const cursorColors = {
    primary: "bg-primary shadow-[0_0_8px_var(--glow-primary)]",
    success: "bg-success shadow-[0_0_8px_var(--glow-success)]",
    muted: "bg-muted-foreground",
} as const;

export const AIStreamingCursor = ({
    className,
    variant = "primary",
}: AIStreamingCursorProps) => {
    const prefersReducedMotion = useReducedMotion();

    return (
        <motion.span
            className={cn(
                "inline-block w-0.5 h-5 rounded-full align-middle",
                cursorColors[variant],
                className
            )}
            animate={
                prefersReducedMotion
                    ? { opacity: 1 }
                    : { opacity: [1, 0.3, 1] }
            }
            transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        />
    );
};

// ============================================
// AI ORB INDICATOR
// ============================================

interface AIOrbIndicatorProps {
    className?: string;
    /** Size of the orb */
    size?: "sm" | "md" | "lg";
    /** Whether the orb is actively processing */
    active?: boolean;
}

const orbSizes = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
} as const;

export const AIOrbIndicator = ({
    className,
    size = "md",
    active = true,
}: AIOrbIndicatorProps) => {
    const prefersReducedMotion = useReducedMotion();

    return (
        <div className={cn("relative flex items-center justify-center", orbSizes[size], className)}>
            {/* Outer ring */}
            <motion.div
                className="absolute inset-0 rounded-full border border-primary/30"
                animate={
                    active && !prefersReducedMotion
                        ? { scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }
                        : { scale: 1, opacity: 0.4 }
                }
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Middle ring */}
            <motion.div
                className="absolute inset-[15%] rounded-full border border-primary/50"
                animate={
                    active && !prefersReducedMotion
                        ? { scale: [1, 1.2, 1], opacity: [0.6, 0.2, 0.6] }
                        : { scale: 1, opacity: 0.6 }
                }
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3,
                }}
            />

            {/* Core orb */}
            <motion.div
                className="absolute inset-[30%] rounded-full bg-primary shadow-glow-sm"
                animate={
                    active && !prefersReducedMotion
                        ? { scale: [0.9, 1.1, 0.9] }
                        : { scale: 1 }
                }
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
        </div>
    );
};

// ============================================
// AI PROGRESS BAR
// ============================================

interface AIProgressBarProps {
    /** Progress value 0-100 */
    value: number;
    /** Additional CSS classes */
    className?: string;
    /** Show shimmer effect when in progress */
    shimmer?: boolean;
    /** Size variant */
    size?: "sm" | "md";
}

export const AIProgressBar = ({
    value,
    className,
    shimmer = true,
    size = "md",
}: AIProgressBarProps) => {
    const clampedValue = Math.min(100, Math.max(0, value));
    const isComplete = clampedValue >= 100;

    return (
        <div
            className={cn(
                "w-full rounded-full overflow-hidden bg-muted/50 backdrop-blur-sm border border-border/30",
                size === "sm" ? "h-1.5" : "h-2.5",
                className
            )}
        >
            <motion.div
                className={cn(
                    "h-full rounded-full relative",
                    isComplete
                        ? "bg-success"
                        : "bg-primary"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${clampedValue}%` }}
                transition={{
                    duration: motionTokens.durations.normal,
                    ease: motionTokens.easings.smooth,
                }}
            >
                {/* Shimmer overlay */}
                {shimmer && !isComplete && (
                    <div className="absolute inset-0 overflow-hidden rounded-full">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </div>
                )}
            </motion.div>
        </div>
    );
};
