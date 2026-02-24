"use client";

import { motion } from "framer-motion";
import { FileText, ArrowRight, PenLine } from "lucide-react";
import { motionTokens, styles } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./AnimatedCounter";
import { Button } from "../ui/button";

type BlogContentCardProps = {
  publishedCount: number;
  draftsCount: number;
  lastCreated: string;
  onCreateArticle?: () => void;
};

/**
 * BlogContentCard - Premium blog statistics card
 *
 * Features: mini donut chart for ratio, animated counters,
 * clean metric layout with premium hover states.
 */
export const BlogContentCard = ({
  publishedCount,
  draftsCount,
  lastCreated,
  onCreateArticle,
}: BlogContentCardProps) => {
  const total = publishedCount + draftsCount;
  const publishedRatio = total > 0 ? (publishedCount / total) * 100 : 0;

  // Mini donut chart calculations
  const donutSize = 48;
  const donutStroke = 5;
  const donutRadius = (donutSize - donutStroke) / 2;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutOffset = donutCircumference - (publishedRatio / 100) * donutCircumference;

  return (
    <div className="h-full p-4 flex flex-col justify-between group">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className={cn(styles.iconContainer.md, styles.iconContainer.muted, "border border-border group-hover:text-foreground transition-colors")}>
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className={cn(styles.text.labelSmall)}>
            Blog
          </p>
          <h3 className={styles.text.h4}>
            Contenu
          </h3>
        </div>
      </div>

      {/* Main content: Donut + Metrics */}
      <div className="flex items-center gap-4 mb-2">
        {/* Mini donut chart */}
        <div className="relative shrink-0">
          <svg width={donutSize} height={donutSize} viewBox={`0 0 ${donutSize} ${donutSize}`} className="-rotate-90">
            <circle
              cx={donutSize / 2}
              cy={donutSize / 2}
              r={donutRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth={donutStroke}
              className="text-muted/30"
            />
            <motion.circle
              cx={donutSize / 2}
              cy={donutSize / 2}
              r={donutRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth={donutStroke}
              strokeLinecap="round"
              className="text-primary"
              strokeDasharray={donutCircumference}
              initial={{ strokeDashoffset: donutCircumference }}
              animate={{ strokeDashoffset: donutOffset }}
              transition={{
                duration: motionTokens.durations.slowest + motionTokens.durations.slow,
                delay: motionTokens.durations.slow,
                ease: motionTokens.easings.smooth,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold tabular-nums text-foreground">
              {Math.round(publishedRatio)}%
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div className="flex-1 space-y-2">
          <div className="flex items-baseline gap-2">
            <AnimatedCounter
              value={publishedCount}
              delay={motionTokens.durations.slow}
              className="text-2xl text-foreground"
            />
            <span className="text-xs text-muted-foreground font-medium">publiés</span>
          </div>
          <div className="flex items-center gap-1.5">
            <PenLine className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              <AnimatedCounter
                value={draftsCount}
                delay={motionTokens.durations.slow}
                className="font-semibold text-foreground text-xs"
              />
              {" "}brouillons
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-border/30 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium truncate max-w-[130px]">
          Dernier: {lastCreated}
        </span>
        {onCreateArticle && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs font-semibold gap-1 hover:text-primary p-0 hover:bg-transparent"
            onClick={onCreateArticle}
          >
            Rédiger <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};
