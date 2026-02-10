import React from "react";
import { motion } from "framer-motion";

interface AnimatedTransitionProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

export function AnimatedTransition({ children, className, delay = 0 }: AnimatedTransitionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -10 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                delay: delay
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
