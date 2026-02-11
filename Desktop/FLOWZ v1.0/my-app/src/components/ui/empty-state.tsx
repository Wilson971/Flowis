"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
import { Button } from "./button";

/**
 * EmptyState Component
 *
 * A consistent empty state pattern for pages, tables, and lists.
 * Animated entry with optional CTA button.
 *
 * @example
 * <EmptyState
 *   icon={<Package className="h-10 w-10" />}
 *   title="Aucun produit"
 *   description="Ajoutez votre premier produit pour commencer."
 *   action={{ label: "Ajouter un produit", onClick: () => {} }}
 * />
 */

interface EmptyStateAction {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost" | "glow";
}

interface EmptyStateProps {
    /** Icon displayed above the title */
    icon: React.ReactNode;
    /** Main heading */
    title: string;
    /** Supporting description */
    description?: string;
    /** Optional CTA button */
    action?: EmptyStateAction;
    /** Additional CSS classes */
    className?: string;
}

export const EmptyState = ({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) => {
    return (
        <motion.div
            className={cn(
                "flex flex-col items-center justify-center py-16 px-6 text-center",
                className
            )}
            variants={motionTokens.variants.fadeInScale}
            initial="hidden"
            animate="visible"
        >
            <div className="mb-4 text-muted-foreground/40">{icon}</div>

            <h3 className="text-lg font-semibold text-foreground mb-1">
                {title}
            </h3>

            {description && (
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    {description}
                </p>
            )}

            {action && (
                <Button
                    variant={action.variant || "default"}
                    onClick={action.onClick}
                >
                    {action.label}
                </Button>
            )}
        </motion.div>
    );
};
