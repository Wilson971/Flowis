/**
 * Products Page Header V2 — Vercel Pro Pattern
 * With Vercel-style underline tabs (layoutId)
 */

"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/design-system";

type NavTab = {
  id: string;
  label: string;
  count?: number;
};

type ProductsPageHeaderV2Props = {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  tabs?: NavTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
};

export const ProductsPageHeaderV2 = ({
  title,
  description,
  breadcrumbs = [],
  tabs,
  activeTab,
  onTabChange,
  className,
}: ProductsPageHeaderV2Props) => {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Breadcrumb */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title & Description */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{description}</p>
        )}
      </div>

      {/* Vercel Pro Tabs with layoutId underline */}
      {tabs && tabs.length > 0 && onTabChange && (
        <div className="flex items-center gap-1 border-b border-border/40">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative px-3 py-2 text-[13px] font-medium transition-colors flex items-center gap-2",
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  "h-5 rounded-full px-1.5 text-[10px] font-medium border-0 inline-flex items-center justify-center min-w-[20px]",
                  activeTab === tab.id
                    ? "bg-foreground/10 text-foreground"
                    : "bg-muted/60 text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="productsActiveTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
                  transition={motionTokens.transitions.fast}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
