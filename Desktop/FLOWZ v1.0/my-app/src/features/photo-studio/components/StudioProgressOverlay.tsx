"use client";

/**
 * StudioProgressOverlay
 *
 * Persistent floating overlay (bottom-right) showing batch progress.
 * Two states: collapsed (mini-pill) and expanded (full card).
 * Does not interrupt selection/editing flow.
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Camera,
  ChevronUp,
  ChevronDown,
  X,
  Sparkles,
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
// Single batch progress widget
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
  const { data: batchProgress, isLoading } = useBatchProgress(batchId);

  const progress = batchProgress?.progress ?? 0;
  const total = batchProgress?.total ?? 0;
  const completed = batchProgress?.completed ?? 0;
  const failed = batchProgress?.failed ?? 0;
  const running = batchProgress?.running ?? 0;
  const pending = batchProgress?.pending ?? 0;
  const isComplete = batchProgress?.isComplete ?? false;
  const jobs = batchProgress?.jobs ?? [];

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
    } catch (err) {
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
  // Collapsed (mini pill)
  // -----------------------------------------------------------------------
  if (!expanded) {
    return (
      <motion.button
        variants={motionTokens.variants.slideUp}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={motionTokens.transitions.spring}
        onClick={() => setExpanded(true)}
        className={cn(
          "flex items-center gap-2 rounded-full border border-border bg-card shadow-xl px-4 py-2 backdrop-blur-lg",
          "hover:shadow-2xl transition-shadow duration-200"
        )}
      >
        {isComplete ? (
          failed > 0 ? (
            <XCircle className="h-4 w-4 text-destructive" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-success" />
          )
        ) : (
          <Camera className="h-4 w-4 text-primary animate-pulse" />
        )}

        <span className="text-sm font-medium">
          {completed + failed}/{total}
        </span>

        {/* Mini progress ring */}
        <div className="relative h-5 w-5">
          <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              className="stroke-muted"
              strokeWidth="2"
            />
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              className="stroke-primary"
              strokeWidth="2"
              strokeDasharray={`${(progress / 100) * 50.3} 50.3`}
              strokeLinecap="round"
            />
          </svg>
        </div>

        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
      </motion.button>
    );
  }

  // -----------------------------------------------------------------------
  // Expanded (full card)
  // -----------------------------------------------------------------------
  return (
    <motion.div
      variants={motionTokens.variants.fadeInScale}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={motionTokens.transitions.spring}
      className="w-[360px]"
    >
      <Card className="shadow-xl rounded-2xl border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                isComplete
                  ? failed > 0
                    ? "bg-destructive/10"
                    : "bg-success/10"
                  : "bg-primary/10"
              )}
            >
              {isComplete ? (
                failed > 0 ? (
                  <XCircle className="h-4 w-4 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                )
              ) : (
                <Camera className="h-4 w-4 text-primary animate-pulse" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">
                {isComplete ? "Batch termine" : "Traitement en cours..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded(false)}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <CardContent className="space-y-3 pb-4">
          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">
                {completed + failed}/{total} ({progress}%)
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Stats badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
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
                {pending} en attente
              </Badge>
            )}
            {failed > 0 && (
              <Badge variant="destructive" size="sm">
                {failed} echec(s)
              </Badge>
            )}
          </div>

          {/* Toggle details */}
          {jobs.length > 0 && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full justify-between text-xs text-muted-foreground h-7"
              >
                Detail des jobs ({jobs.length})
                {showDetails ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    variants={motionTokens.variants.slideUp}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <ScrollArea className="h-[180px] mt-2">
                      <div className="space-y-1">
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
                                <p className="text-xs text-muted-foreground">
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
            <div className="flex items-center gap-2 pt-1">
              {failed > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryFailed}
                  className="gap-1.5 text-xs flex-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Relancer {failed} echec(s)
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs flex-1"
              >
                Fermer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main overlay
// ---------------------------------------------------------------------------

export function StudioProgressOverlay({
  batchIds,
  onCloseBatch,
}: StudioProgressOverlayProps) {
  if (batchIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
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
