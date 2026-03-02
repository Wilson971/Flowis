"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

export type ProductTab = "general" | "media" | "variations" | "seo";

interface TabItem {
  id: ProductTab;
  label: string;
  count?: number;
  hidden?: boolean;
}

interface ProductEditorTabsV2Props {
  activeTab: ProductTab;
  onTabChange: (tab: ProductTab) => void;
  tabs: TabItem[];
}

export const ProductEditorTabsV2 = ({
  activeTab,
  onTabChange,
  tabs,
}: ProductEditorTabsV2Props) => {
  const visibleTabs = tabs.filter((t) => !t.hidden);

  return (
    <div className="flex items-center gap-1 border-b border-border/40">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative px-3 py-2 text-[13px] font-medium transition-colors",
            activeTab === tab.id
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
          {tab.count != null && (
            <span className="ml-1.5 text-[10px] text-muted-foreground/60 tabular-nums">
              {tab.count}
            </span>
          )}
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeProductTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
              transition={motionTokens.transitions.fast}
            />
          )}
        </button>
      ))}
    </div>
  );
};
