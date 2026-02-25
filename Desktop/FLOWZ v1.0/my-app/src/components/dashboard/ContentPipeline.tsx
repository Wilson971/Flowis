"use client";

import { motion } from "framer-motion";
import { FileText, ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motionTokens, styles } from "@/lib/design-system";
import { AnimatedCounter } from "./AnimatedCounter";

interface ContentPipelineProps {
  draftsCount: number;
  reviewCount?: number;
  scheduledCount?: number;
  publishedCount: number;
  lastCreated?: string;
  onViewDrafts?: () => void;
  onCreateArticle?: () => void;
  className?: string;
}

interface PipelineStage {
  label: string;
  count: number;
  color: string;
  bgColor: string;
}

export function ContentPipeline({
  draftsCount,
  reviewCount = 0,
  scheduledCount = 0,
  publishedCount,
  lastCreated,
  onViewDrafts,
  onCreateArticle,
  className,
}: ContentPipelineProps) {
  const total = draftsCount + reviewCount + scheduledCount + publishedCount;

  const stages: PipelineStage[] = [
    { label: "Brouillons", count: draftsCount, color: "bg-signal-warning", bgColor: "bg-signal-warning/10" },
    { label: "Révision", count: reviewCount, color: "bg-info", bgColor: "bg-info/10" },
    { label: "Planifiés", count: scheduledCount, color: "bg-primary", bgColor: "bg-primary/10" },
    { label: "Publiés", count: publishedCount, color: "bg-signal-success", bgColor: "bg-signal-success/10" },
  ];

  const publishRate = total > 0 ? Math.round((publishedCount / total) * 100) : 0;

  return (
    <div className={cn("p-4 h-full flex flex-col group", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn(styles.iconContainer.sm, "bg-muted text-muted-foreground border border-border group-hover:text-foreground transition-colors")}>
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className={styles.text.labelSmall}>Blog</p>
            <h3 className={styles.text.h4}>Pipeline Contenu</h3>
          </div>
        </div>
        <span className="text-xs font-bold tabular-nums text-foreground bg-muted/50 px-2 py-0.5 rounded-lg">
          {total} total
        </span>
      </div>

      {/* Segmented progress bar */}
      <div className="h-2.5 rounded-full bg-muted/40 overflow-hidden flex mb-3">
        {stages.map((stage, i) => {
          const width = total > 0 ? (stage.count / total) * 100 : 0;
          if (width === 0) return null;
          return (
            <motion.div
              key={stage.label}
              className={cn("h-full first:rounded-l-full last:rounded-r-full", stage.color)}
              initial={{ width: 0 }}
              animate={{ width: `${width}%` }}
              transition={{
                duration: motionTokens.durations.slowest,
                delay: 0.3 + i * 0.1,
                ease: motionTokens.easings.smooth,
              }}
              title={`${stage.label}: ${stage.count}`}
            />
          );
        })}
      </div>

      {/* Stage breakdown */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {stages.map((stage, i) => (
          <motion.div
            key={stage.label}
            className={cn(
              "text-center p-1.5 rounded-lg border border-border/30",
              stage.bgColor
            )}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: motionTokens.durations.normal,
              delay: 0.4 + i * 0.08,
            }}
          >
            <AnimatedCounter
              value={stage.count}
              delay={0.5 + i * 0.1}
              className="text-sm text-foreground block"
            />
            <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
              {stage.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Contextual alert */}
      {draftsCount > 3 && (
        <motion.div
          className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-[11px] text-primary font-medium leading-relaxed">
            {draftsCount} brouillons en attente — Publiez-en {Math.min(5, draftsCount)} pour booster votre SEO de ~{Math.min(draftsCount * 2, 12)} pts
          </p>
        </motion.div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-2 border-t border-border/30 flex items-center justify-between">
        {lastCreated && (
          <span className="text-[11px] text-muted-foreground">
            Dernier: {lastCreated}
          </span>
        )}
        <div className="flex items-center gap-2">
          {draftsCount > 0 && onViewDrafts && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[11px] font-semibold gap-1 hover:text-primary p-0 hover:bg-transparent"
              onClick={onViewDrafts}
            >
              Brouillons <ArrowRight className="h-3 w-3" />
            </Button>
          )}
          {onCreateArticle && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[11px] font-semibold gap-1 hover:text-primary p-0 hover:bg-transparent"
              onClick={onCreateArticle}
            >
              Rédiger <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
