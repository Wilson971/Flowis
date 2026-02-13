"use client";

/**
 * StudioProgressOverlay
 *
 * Chat-widget-style floating progress monitor.
 *
 * Two modes:
 * 1. **Minimized (FAB)**: Small circular button at bottom-right with an
 *    animated SVG progress ring showing completion %. Takes zero layout space.
 * 2. **Expanded (Modal panel)**: Slides up from the FAB position showing full
 *    batch details, job list, retry/close actions. Overlays on top of content.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useBatchProgress,
} from "@/features/photo-studio/hooks/useBatchStudioJobs";
import type { StudioJobStatus } from "@/features/photo-studio/types/studio";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StudioProgressOverlayProps {
  batchIds: string[];
  onCloseBatch: (batchId: string) => void;
}

// ---------------------------------------------------------------------------
// Circular progress ring (SVG)
// ---------------------------------------------------------------------------

function CircularProgress({
  value,
  size = 48,
  strokeWidth = 3,
  className,
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-muted/40"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-primary"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single batch widget
// ---------------------------------------------------------------------------

function BatchProgressWidget({
  batchId,
  onClose,
}: {
  batchId: string;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [hasNotified, setHasNotified] = useState(false);

  const queryClient = useQueryClient();
  const { data: batchProgress } = useBatchProgress(batchId);

  const progress = batchProgress?.progress ?? 0;
  const total = batchProgress?.total ?? 0;
  const completed = batchProgress?.completed ?? 0;
  const failed = batchProgress?.failed ?? 0;
  const running = batchProgress?.running ?? 0;
  const pending = batchProgress?.pending ?? 0;
  const isComplete = batchProgress?.isComplete ?? false;
  const jobs = batchProgress?.jobs ?? [];

  // Status color
  const statusColor = useMemo(() => {
    if (isComplete && failed === 0) return "success";
    if (isComplete && failed > 0 && completed > 0) return "warning";
    if (isComplete && completed === 0) return "destructive";
    return "primary";
  }, [isComplete, failed, completed]);

  // Completion notification
  useEffect(() => {
    if (!batchProgress || hasNotified || !isComplete) return;
    setHasNotified(true);

    if (failed === 0) {
      toast.success("Batch termine avec succes", {
        description: `${completed}/${total} job(s) termines sans erreur.`,
      });
    } else if (completed > 0) {
      toast.warning("Batch termine avec erreurs", {
        description: `${completed} succes, ${failed} echec(s) sur ${total} job(s).`,
      });
    } else {
      toast.error("Batch echoue", {
        description: `Tous les ${total} job(s) ont echoue.`,
      });
    }

    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["studio-jobs"] });
  }, [batchProgress, hasNotified, isComplete, failed, completed, total, queryClient]);

  // Retry failed
  const handleRetryFailed = useCallback(async () => {
    if (!batchProgress) return;
    const failedJobs = batchProgress.jobs.filter((j) => j.status === "failed");
    if (failedJobs.length === 0) return;

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("studio_jobs")
        .update({ status: "pending", error_message: null })
        .in("id", failedJobs.map((j) => j.id));

      if (error) throw error;
      toast.success(`${failedJobs.length} job(s) relances`);
      setHasNotified(false);
      queryClient.invalidateQueries({
        queryKey: ["batch-studio-progress", batchId],
      });
    } catch {
      toast.error("Erreur de relance");
    }
  }, [batchProgress, batchId, queryClient]);

  const ACTION_LABELS: Record<string, string> = {
    remove_bg: "Suppr. fond",
    replace_bg: "Remplacement fond",
    enhance: "Amelioration",
    generate_angles: "Angles multiples",
    generate_scene: "Scene produit",
  };

  function getStatusIcon(status: StudioJobStatus["status"]) {
    switch (status) {
      case "done":
        return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
      case "failed":
        return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      case "running":
        return <RefreshCw className="h-3.5 w-3.5 text-info animate-spin" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  }

  // -----------------------------------------------------------------------
  // Minimized FAB (circular progress ring + %)
  // -----------------------------------------------------------------------
  if (!expanded) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={motionTokens.transitions.spring}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setExpanded(true)}
        className={cn(
          "relative group rounded-full shadow-xl border border-border/60",
          "bg-card/95 backdrop-blur-xl",
          "hover:shadow-2xl hover:border-primary/30",
          "transition-shadow duration-300",
          "cursor-pointer",
          !isComplete && "ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
        )}
        title={`Photo Studio: ${progress}% - ${completed + failed}/${total}`}
      >
        <CircularProgress value={progress} size={56} strokeWidth={3}>
          <div className="flex flex-col items-center justify-center">
            {isComplete ? (
              failed > 0 ? (
                <XCircle className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-success" />
              )
            ) : (
              <>
                <span className="text-[10px] font-bold text-foreground leading-none">
                  {progress}%
                </span>
              </>
            )}
          </div>
        </CircularProgress>

        {/* Pulse ring for active batches */}
        {!isComplete && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Status dot */}
        <div
          className={cn(
            "absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card",
            statusColor === "primary" && "bg-primary",
            statusColor === "success" && "bg-emerald-500",
            statusColor === "warning" && "bg-amber-500",
            statusColor === "destructive" && "bg-destructive"
          )}
        />
      </motion.button>
    );
  }

  // -----------------------------------------------------------------------
  // Expanded modal panel (slides up from FAB position)
  // -----------------------------------------------------------------------
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={motionTokens.transitions.spring}
      className="w-[340px]"
    >
      <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Gradient top accent */}
        <div
          className={cn(
            "h-1",
            statusColor === "primary" && "bg-primary",
            statusColor === "success" && "bg-emerald-500",
            statusColor === "warning" && "bg-amber-500",
            statusColor === "destructive" && "bg-destructive"
          )}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <CircularProgress value={progress} size={36} strokeWidth={2.5}>
              <span className="text-[9px] font-bold text-foreground">
                {progress}%
              </span>
            </CircularProgress>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {isComplete ? "Batch termine" : "Traitement en cours"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {completed + failed}/{total} job{total > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded(false)}
              title="Reduire"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onClose}
              title="Fermer"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-3">
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Stats badges */}
        <div className="px-4 pb-3 flex items-center gap-1.5 flex-wrap">
          {completed > 0 && (
            <Badge variant="success" size="sm">
              {completed} OK
            </Badge>
          )}
          {running > 0 && (
            <Badge variant="info" size="sm">
              {running} en cours
            </Badge>
          )}
          {pending > 0 && (
            <Badge variant="secondary" size="sm">
              {pending} attente
            </Badge>
          )}
          {failed > 0 && (
            <Badge variant="destructive" size="sm">
              {failed} echec{failed > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Job details toggle */}
        {jobs.length > 0 && (
          <div className="px-4 pb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full justify-between text-xs text-muted-foreground h-7 px-2"
            >
              <span>Detail des jobs ({jobs.length})</span>
              {showDetails ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <ScrollArea className="h-[160px] mt-2">
                    <div className="space-y-1 pr-2">
                      {jobs.map((job) => (
                        <div
                          key={job.id}
                          className={cn(
                            "flex items-center justify-between rounded-lg border border-border px-2.5 py-1.5",
                            job.status === "done" && "bg-success/5",
                            job.status === "failed" && "bg-destructive/5",
                            job.status === "running" && "bg-info/5",
                            job.status === "pending" && "bg-muted/50"
                          )}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {getStatusIcon(job.status)}
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">
                                {job.product_title ||
                                  job.product_id.slice(0, 8)}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {ACTION_LABELS[job.action] || job.action}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Actions */}
        {isComplete && (
          <div className="px-4 pb-3 flex items-center gap-2">
            {failed > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryFailed}
                className="gap-1.5 text-xs flex-1 h-8"
              >
                <RefreshCw className="h-3 w-3" />
                Relancer {failed}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs flex-1 h-8"
            >
              Fermer
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main overlay container
// ---------------------------------------------------------------------------

export function StudioProgressOverlay({
  batchIds,
  onCloseBatch,
}: StudioProgressOverlayProps) {
  if (batchIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9998] flex flex-col items-end gap-3">
      <AnimatePresence mode="popLayout">
        {batchIds.map((batchId) => (
          <BatchProgressWidget
            key={batchId}
            batchId={batchId}
            onClose={() => onCloseBatch(batchId)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
