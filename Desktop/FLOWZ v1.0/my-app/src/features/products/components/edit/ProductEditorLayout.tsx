import React from "react";
import { motion } from "framer-motion";

interface ProductEditorLayoutProps {
    children: React.ReactNode;
    sidebar: React.ReactNode;
    className?: string;
}

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            delayChildren: 0.1,
            staggerChildren: 0.1
        }
    }
};

export const ProductEditorLayout = ({
    children,
    sidebar,
    className = "",
}: ProductEditorLayoutProps) => {
    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className={`grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 ${className}`}
        >
            {/* Main Content */}
            <div className="space-y-6">
                {children}
            </div>

            {/* Sidebar */}
            <div>
                {sidebar}
            </div>
        </motion.div>
    );
};
