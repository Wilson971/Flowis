"use client"

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

/**
 * BentoGrid Component
 *
 * A responsive CSS Grid container with stagger animations.
 * Use with BentoCell children for flexible dashboard layouts.
 *
 * @example
 * <BentoGrid columns={3}>
 *   <BentoCell>Card 1</BentoCell>
 *   <BentoCell colSpan={2}>Wide Card</BentoCell>
 *   <BentoCell colSpan={3}>Full Width</BentoCell>
 * </BentoGrid>
 */

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
  /** Number of columns at lg breakpoint (default 3) */
  columns?: 2 | 3 | 4;
  /** Gap size (default "default") */
  gap?: "tight" | "default" | "loose";
}

const gapMap = {
  tight: "gap-2",
  default: "gap-3",
  loose: "gap-4",
} as const;

const colsMap = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
} as const;

export const BentoGrid = ({
  children,
  className,
  columns = 3,
  gap = "default",
}: BentoGridProps) => {
  return (
    <motion.div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 auto-rows-min",
        colsMap[columns],
        gapMap[gap],
        className
      )}
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
};

interface BentoCellProps {
  children: React.ReactNode;
  className?: string;
  /** Column span (1-4) */
  colSpan?: 1 | 2 | 3 | 4;
  /** Row span (1-2) */
  rowSpan?: 1 | 2;
  /** Custom stagger index */
  index?: number;
}

export const BentoCell = ({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
  index,
}: BentoCellProps) => {
  return (
    <motion.div
      className={cn(
        colSpan === 2 && "md:col-span-2",
        colSpan === 3 && "md:col-span-2 lg:col-span-3",
        colSpan === 4 && "md:col-span-2 lg:col-span-4",
        rowSpan === 2 && "row-span-2",
        className
      )}
      variants={motionTokens.variants.staggerItem}
      custom={index}
    >
      {children}
    </motion.div>
  );
};
