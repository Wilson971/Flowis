import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

interface ProductEditorLayoutProps {
    children: React.ReactNode;
    sidebar: React.ReactNode;
    className?: string;
}

export const ProductEditorLayout = ({
    children,
    sidebar,
    className = "",
}: ProductEditorLayoutProps) => {
    return (
        <motion.div
            variants={motionTokens.variants.staggerContainer}
            initial="hidden"
            animate="visible"
            className={cn("grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6", className)}
        >
            {/* Main Content */}
            <div className="min-w-0 space-y-6">
                {children}
            </div>

            {/* Sidebar */}
            <div className="min-w-0">
                <div className="xl:sticky xl:top-24">
                    {sidebar}
                </div>
            </div>
        </motion.div>
    );
};
