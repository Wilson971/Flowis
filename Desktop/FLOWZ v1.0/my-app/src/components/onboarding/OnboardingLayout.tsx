import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OnboardingLayoutProps {
    children: React.ReactNode;
    className?: string;
    step?: number;
    totalSteps?: number;
}

export function OnboardingLayout({
    children,
    className,
    step,
    totalSteps
}: OnboardingLayoutProps) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] opacity-30 animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] opacity-30 animate-pulse delay-75" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={cn(
                    "relative z-10 w-full max-w-4xl p-6",
                    className
                )}
            >
                {/* Optional Progress Bar/Indicator */}
                {(step && totalSteps) && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-secondary/50 rounded-full mb-8 overflow-hidden max-w-md mx-auto relative -translate-y-12">
                        <motion.div
                            className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${(step / totalSteps) * 100}%` }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                        />
                    </div>
                )}

                {children}
            </motion.div>
        </div>
    );
}
