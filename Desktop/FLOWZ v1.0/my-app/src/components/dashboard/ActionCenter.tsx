"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  ArrowRight,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motionTokens, styles } from "@/lib/design-system";
import { useActionCenter } from "@/hooks/dashboard/useActionCenter";
import { ActionCenterSheet } from "./ActionCenterSheet";
import type { ActionItem, ActionPriority } from "@/hooks/dashboard/useActionCenter";

interface ActionCenterProps {
  storeId: string | null;
  isDisconnected?: boolean;
  draftsCount?: number;
  seoScore?: number;
  opportunitiesCount?: number;
  productsWithoutDescription?: number;
  className?: string;
}

const getPriorityIndicator = (priority: ActionPriority) => {
  switch (priority) {
    case "critical":
      return "border-l-destructive";
    case "high":
      return "border-l-signal-warning";
    case "medium":
      return "border-l-primary";
    default:
      return "border-l-transparent";
  }
};

function ActionRow({ action, index }: { action: ActionItem; index: number }) {
  const Icon = action.icon;

  const sharedContent = (
    <>
      <div
        className={cn(
          "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200",
          action.mode === "inline"
            ? "bg-destructive/10 border border-destructive/20 text-destructive"
            : "bg-muted/50 border border-border/50 text-muted-foreground group-hover/action:text-primary group-hover/action:bg-primary/10 group-hover/action:border-primary/20"
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="text-sm font-semibold text-foreground group-hover/action:text-primary transition-colors truncate">
            {action.title}
          </h4>
          {action.badge && (
            <Badge
              variant={action.badgeVariant}
              className="text-[9px] px-1.5 py-0 h-4 font-bold uppercase tracking-wider"
            >
              {action.badge}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-[11px] text-muted-foreground truncate">
            {action.description}
          </p>
          {action.impact && (
            <span className="text-[10px] font-medium text-primary shrink-0 hidden lg:inline">
              {action.impact}
            </span>
          )}
        </div>
      </div>
    </>
  );

  // Inline mode: action button instead of navigation
  if (action.mode === "inline") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: motionTokens.durations.normal,
          delay: 0.3 + index * motionTokens.staggerDelays.normal,
          ease: motionTokens.easings.smooth,
        }}
      >
        <div
          className={cn(
            "relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl",
            "bg-muted/30 border border-border/50 border-l-2",
            getPriorityIndicator(action.priority)
          )}
        >
          {sharedContent}
          <Button
            size="sm"
            variant="destructive"
            className="shrink-0 h-6 text-[10px] px-2 rounded-lg font-semibold"
            disabled={action.isActioning}
            onClick={() => action.onAction?.()}
          >
            {action.isActioning ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              action.cta
            )}
          </Button>
        </div>
      </motion.div>
    );
  }

  // Link mode: navigation (original behavior)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionTokens.durations.normal,
        delay: 0.3 + index * motionTokens.staggerDelays.normal,
        ease: motionTokens.easings.smooth,
      }}
    >
      <Link
        href={action.href || "#"}
        className={cn(
          "group/action relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl",
          "bg-muted/30 border border-border/50 border-l-2",
          getPriorityIndicator(action.priority),
          "hover:bg-muted/60 hover:border-border",
          "hover:-translate-y-0.5 hover:shadow-sm",
          "transition-all duration-200 ease-out"
        )}
      >
        {sharedContent}
        <div className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center bg-transparent group-hover/action:bg-primary group-hover/action:shadow-sm transition-all duration-200">
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover/action:text-primary-foreground transition-colors" />
        </div>
      </Link>
    </motion.div>
  );
}

export function ActionCenter({
  storeId,
  isDisconnected = false,
  draftsCount = 0,
  seoScore = 0,
  opportunitiesCount = 0,
  productsWithoutDescription = 0,
  className,
}: ActionCenterProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const { topActions, totalCount, grouped, resolvedCount } = useActionCenter({
    storeId,
    isDisconnected,
    draftsCount,
    seoScore,
    opportunitiesCount,
    productsWithoutDescription,
  });

  return (
    <div className={cn("p-4 h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
          <Zap className="h-4 w-4" />
        </div>
        <div>
          <p className={cn(styles.text.labelSmall, "text-primary")}>Priorités</p>
          <h3 className={styles.text.h4}>
            Actions
            {totalCount > 0 && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                · {totalCount} en attente
              </span>
            )}
          </h3>
        </div>
      </div>

      {/* Actions list */}
      <div className="space-y-1.5 flex-1">
        {topActions.map((action, index) => (
          <ActionRow key={action.id} action={action} index={index} />
        ))}
      </div>

      {/* Footer: "Voir tout" */}
      {totalCount > 4 && (
        <button
          onClick={() => setSheetOpen(true)}
          className={cn(
            "mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg",
            "text-xs font-medium text-muted-foreground",
            "hover:text-primary hover:bg-muted/50",
            "transition-all duration-200"
          )}
        >
          Voir tout ({totalCount})
          <ChevronRight className="h-3 w-3" />
        </button>
      )}

      {/* Sheet */}
      <ActionCenterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        grouped={grouped}
        resolvedCount={resolvedCount}
      />
    </div>
  );
}
