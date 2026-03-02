"use client";

import React from "react";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/design-system";
import { Search } from "lucide-react";
import { ProductSeoTab } from "../seo-tab/ProductSeoTab";

export const SeoTabV2 = () => {
  return (
    <motion.div
      variants={motionTokens.variants.slideUp}
      initial="hidden"
      animate="visible"
    >
      <div className="rounded-xl border border-border/40 bg-card relative group overflow-hidden">
        <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 p-6 pb-4 border-b border-border/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
              <Search className="h-[18px] w-[18px] text-foreground/70" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold tracking-tight text-foreground">SEO</h3>
              <p className="text-xs text-muted-foreground">Optimisation pour les moteurs de recherche</p>
            </div>
          </div>
          <div className="p-6">
            <ProductSeoTab />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
