"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

interface ProductEditorLayoutV2Props {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  className?: string;
}

export const ProductEditorLayoutV2 = ({
  children,
  sidebar,
  className,
}: ProductEditorLayoutV2Props) => {
  return (
    <motion.div
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
      className={cn(
        "grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6",
        className
      )}
    >
      <motion.div variants={motionTokens.variants.staggerItem} className="space-y-6 min-w-0">
        {children}
      </motion.div>

      <motion.div variants={motionTokens.variants.staggerItem}>
        <div className="xl:sticky xl:top-20 space-y-4">
          {sidebar}
        </div>
      </motion.div>
    </motion.div>
  );
};
