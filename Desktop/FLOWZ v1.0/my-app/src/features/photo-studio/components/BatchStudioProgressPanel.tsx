"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Camera,
  RefreshCw,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useBatchProgress,
  type BatchProgressData,
} from "@/features/photo-studio/hooks/useBatchStudioJobs";
import type { StudioJobStatus } from "@/features/photo-studio/types/studio";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

// ============================================================================
// TYPES
// ============================================================================

interface BatchStudioProgressPanelProps {
  batchId: string;
  onClose: () => void;
  onComplete?: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const ACTION_LABELS: Record<string, string> = {
  remove_bg: "Suppr. arriere-plan",
  replace_bg: "Remplacement fond",
  enhance: "Amelioration",
  generate_angles: "Angles multiples",
  generate_scene: "Scene produit",
};

function getStatusIcon(status: StudioJobStatus["status"]) {
  switch (status) {
    case "done":
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "running":
      return (
        <RefreshCw className="h-4 w-4 text-info animate-spin" />
      );
    case "pending":
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusBadge(status: StudioJobStatus["status"]) {
  switch (status) {
    case "done":
      return <Badge variant="success">Termine</Badge>;
    case "failed":
      return <Badge variant="destructive">Echoue</Badge>;
    case "running":
      return <Badge variant="info">En cours</Badge>;
    case "pending":
    default:
      return <Badge variant="neutral">En attente</Badge>;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BatchStudioProgressPanel({
  batchId,
  onClose,
  onComplete,
}: BatchStudioProgressPanelProps) {
  const [hasNotified, setHasNotified] = useState(false);

  const queryClient = useQueryClient();
  const { data: batchProgress, isLoading } = useBatchProgress(batchId);

  // --------------------------------------------------------------------------
  // COMPLETION NOTIFICATION
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (!batchProgress || hasNotified) return;

    if (batchProgress.isComplete) {
      setHasNotified(true);

      const { completed, failed, total } = batchProgress;

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

      // Invalidate product-related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["studio-jobs"] });

      onComplete?.();
    }
  }, [batchProgress, hasNotified, queryClient, onComplete]);

  // --------------------------------------------------------------------------
  // RETRY FAILED JOBS
  // --------------------------------------------------------------------------

  const handleRetryFailed = useCallback(async () => {
    if (!batchProgress) return;

    const failedJobs = batchProgress.jobs.filter(
      (j) => j.status === "failed"
    );
    if (failedJobs.length === 0) return;

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("studio_jobs")
        .update({ status: "pending", error_message: null })
        .in(
          "id",
          failedJobs.map((j) => j.id)
        );

      if (error) throw error;

      toast.success("Jobs relances", {
        description: `${failedJobs.length} job(s) remis en file d'attente.`,
      });

      // Reset notification so we get alerted again on completion
      setHasNotified(false);

      // Refresh batch progress
      queryClient.invalidateQueries({
        queryKey: ["batch-studio-progress", batchId],
      });
    } catch (err) {
      toast.error("Erreur de relance", {
        description:
          err instanceof Error ? err.message : "Erreur inconnue",
      });
    }
  }, [batchProgress, batchId, queryClient]);

  // --------------------------------------------------------------------------
  // DERIVED STATE
  // --------------------------------------------------------------------------

  const progress = batchProgress?.progress ?? 0;
  const total = batchProgress?.total ?? 0;
  const completed = batchProgress?.completed ?? 0;
  const failed = batchProgress?.failed ?? 0;
  const running = batchProgress?.running ?? 0;
  const pending = batchProgress?.pending ?? 0;
  const isComplete = batchProgress?.isComplete ?? false;
  const jobs = batchProgress?.jobs ?? [];

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <AnimatePresence>
      <motion.div
        variants={motionTokens.variants.fadeInScale}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={motionTokens.transitions.fast}
      >
        <Card className="border-border shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    isComplete
                      ? failed > 0
                        ? "bg-destructive/10"
                        : "bg-success/10"
                      : "bg-primary/10"
                  )}
                >
                  {isComplete ? (
                    failed > 0 ? (
                      <XCircle className="h-5 w-5 text-destructive" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    )
                  ) : (
                    <Camera className="h-5 w-5 text-primary animate-pulse" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold">
                    {isComplete
                      ? "Batch termine"
                      : "Traitement en cours..."}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Batch {batchId.slice(0, 8)}...
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Summary badges */}
                {completed > 0 && (
                  <Badge variant="success">
                    {completed} OK
                  </Badge>
                )}
                {failed > 0 && (
                  <Badge variant="destructive">
                    {failed} echec(s)
                  </Badge>
                )}
                {running > 0 && (
                  <Badge variant="info">
                    {running} en cours
                  </Badge>
                )}

                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Progression globale
                </span>
                <span className="font-medium">
                  {completed + failed}/{total} ({progress}%)
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-lg border border-border bg-muted/30 p-2 text-center">
                <p className="text-lg font-bold text-success">
                  {completed}
                </p>
                <p className="text-xs text-muted-foreground">
                  Succes
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2 text-center">
                <p className="text-lg font-bold text-info">
                  {running}
                </p>
                <p className="text-xs text-muted-foreground">
                  En cours
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2 text-center">
                <p className="text-lg font-bold text-muted-foreground">
                  {pending}
                </p>
                <p className="text-xs text-muted-foreground">
                  En attente
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2 text-center">
                <p className="text-lg font-bold text-destructive">
                  {failed}
                </p>
                <p className="text-xs text-muted-foreground">
                  Echecs
                </p>
              </div>
            </div>

            {/* Job list */}
            {jobs.length > 0 && (
              <div>
                <Label className="text-xs font-medium mb-2 block">
                  Detail des jobs ({jobs.length})
                </Label>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-1.5">
                    {jobs.map((job) => (
                      <motion.div
                        key={job.id}
                        variants={motionTokens.variants.slideLeft}
                        initial="hidden"
                        animate="visible"
                        className={cn(
                          "flex items-center justify-between rounded-lg border border-border px-3 py-2",
                          job.status === "done" && "bg-success/5",
                          job.status === "failed" && "bg-destructive/5",
                          job.status === "running" && "bg-info/5",
                          job.status === "pending" && "bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {getStatusIcon(job.status)}
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">
                              {job.product_title || job.product_id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ACTION_LABELS[job.action] || job.action}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {job.error_message && (
                            <span
                              className="text-xs text-destructive max-w-[150px] truncate"
                              title={job.error_message}
                            >
                              {job.error_message}
                            </span>
                          )}
                          {getStatusBadge(job.status)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Loading state */}
            {isLoading && jobs.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Chargement du batch...
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {isComplete
                  ? "Tous les jobs sont termines"
                  : "Actualisation automatique toutes les 3s"}
              </p>

              <div className="flex items-center gap-2">
                {failed > 0 && isComplete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetryFailed}
                    className="gap-1.5 text-xs"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Relancer {failed} echec(s)
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-xs"
                >
                  {isComplete ? "Fermer" : "Masquer"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
