"use client";

/**
 * BatchFloatingWidget
 *
 * Unified floating progress widget for Studio and Products batch jobs.
 * Renders as a stack of FABs (bottom-right), each expandable into a detail panel.
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
  Camera,
  Sparkles,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useBatchProgress as useStudioBatchProgress } from "@/features/photo-studio/hooks/useBatchStudioJobs";
import {
  useBatchProgress as useProductsBatchProgress,
  useBatchJobRealtime,
  useCancelBatchJob,
  useRetryBatchJob,
} from "@/hooks/products/useBatchProgress";
import type { StudioJobStatus } from "@/features/photo-studio/types/studio";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
import { useBatchFloating, type BatchType } from "./useBatchFloatingStore";

// ---------------------------------------------------------------------------
// Circular progress ring (SVG) — extracted from StudioProgressOverlay
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
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-muted/40"
          strokeWidth={strokeWidth}
        />
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
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Studio batch widget (delegates to existing polling hook)
// ---------------------------------------------------------------------------

function StudioBatchItem({ batchId, onClose }: { batchId: string; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [hasNotified, setHasNotified] = useState(false);

  const queryClient = useQueryClient();
  const { data: batchProgress } = useStudioBatchProgress(batchId);

  const progress = batchProgress?.progress ?? 0;
  const total = batchProgress?.total ?? 0;
  const completed = batchProgress?.completed ?? 0;
  const failed = batchProgress?.failed ?? 0;
  const running = batchProgress?.running ?? 0;
  const pending = batchProgress?.pending ?? 0;
  const isComplete = batchProgress?.isComplete ?? false;
  const jobs = batchProgress?.jobs ?? [];

  const statusColor = useMemo(() => {
    if (isComplete && failed === 0) return "success";
    if (isComplete && failed > 0 && completed > 0) return "warning";
    if (isComplete && completed === 0) return "destructive";
    return "primary";
  }, [isComplete, failed, completed]);

  useEffect(() => {
    if (!batchProgress || hasNotified || !isComplete) return;
    setHasNotified(true);
    if (failed === 0) {
      toast.success("Batch Photo Studio terminé", {
        description: `${completed}/${total} job(s) terminés sans erreur.`,
      });
    } else if (completed > 0) {
      toast.warning("Batch Photo Studio terminé avec erreurs", {
        description: `${completed} succès, ${failed} échec(s) sur ${total} job(s).`,
      });
    } else {
      toast.error("Batch Photo Studio échoué", {
        description: `Tous les ${total} job(s) ont échoué.`,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["studio-jobs"] });
  }, [batchProgress, hasNotified, isComplete, failed, completed, total, queryClient]);

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
      toast.success(`${failedJobs.length} job(s) relancés`);
      setHasNotified(false);
      queryClient.invalidateQueries({ queryKey: ["batch-studio-progress", batchId] });
    } catch {
      toast.error("Erreur de relance");
    }
  }, [batchProgress, batchId, queryClient]);

  const ACTION_LABELS: Record<string, string> = {
    remove_bg: "Suppr. fond",
    replace_bg: "Remplacement fond",
    enhance: "Amélioration",
    generate_angles: "Angles multiples",
    generate_scene: "Scène produit",
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

  return (
    <BatchWidgetShell
      expanded={expanded}
      setExpanded={setExpanded}
      onClose={onClose}
      progress={progress}
      isComplete={isComplete}
      failed={failed}
      completed={completed}
      total={total}
      running={running}
      pending={pending}
      statusColor={statusColor}
      typeIcon={<Camera className="h-3 w-3" />}
      typeLabel="Photo Studio"
      onRetryFailed={failed > 0 && isComplete ? handleRetryFailed : undefined}
    >
      {/* Job details */}
      {jobs.length > 0 && (
        <div className="px-4 pb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full justify-between text-xs text-muted-foreground h-7 px-2"
          >
            <span>Détail des jobs ({jobs.length})</span>
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
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
                              {job.product_title || job.product_id.slice(0, 8)}
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
    </BatchWidgetShell>
  );
}

// ---------------------------------------------------------------------------
// Products batch widget (delegates to existing realtime hook)
// ---------------------------------------------------------------------------

function ProductsBatchItem({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const {
    progress,
    processedItems,
    totalItems,
    failedItems,
    status,
    isComplete,
    isProcessing,
  } = useProductsBatchProgress(jobId);

  useBatchJobRealtime(jobId);

  const cancelJob = useCancelBatchJob();
  const retryJob = useRetryBatchJob();

  const statusColor = useMemo(() => {
    if (isComplete && failedItems === 0) return "success";
    if (isComplete && failedItems > 0 && processedItems > failedItems) return "warning";
    if (isComplete && processedItems === failedItems) return "destructive";
    return "primary";
  }, [isComplete, failedItems, processedItems]);

  const running = isProcessing ? 1 : 0;
  const pending = status === "pending" ? totalItems - processedItems : 0;

  return (
    <BatchWidgetShell
      expanded={expanded}
      setExpanded={setExpanded}
      onClose={onClose}
      progress={progress}
      isComplete={isComplete}
      failed={failedItems}
      completed={processedItems - failedItems}
      total={totalItems}
      running={running}
      pending={pending}
      statusColor={statusColor}
      typeIcon={<Sparkles className="h-3 w-3" />}
      typeLabel="Génération IA"
      onCancel={isProcessing ? () => cancelJob.mutate({ jobId }) : undefined}
      onRetryFailed={status === "failed" ? () => retryJob.mutate({ jobId }) : undefined}
    />
  );
}

// ---------------------------------------------------------------------------
// Shared widget shell (FAB + expanded panel)
// ---------------------------------------------------------------------------

interface BatchWidgetShellProps {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  onClose: () => void;
  progress: number;
  isComplete: boolean;
  failed: number;
  completed: number;
  total: number;
  running: number;
  pending: number;
  statusColor: "primary" | "success" | "warning" | "destructive";
  typeIcon: React.ReactNode;
  typeLabel: string;
  onCancel?: () => void;
  onRetryFailed?: () => void;
  children?: React.ReactNode;
}

function BatchWidgetShell({
  expanded,
  setExpanded,
  onClose,
  progress,
  isComplete,
  failed,
  completed,
  total,
  running,
  pending,
  statusColor,
  typeIcon,
  typeLabel,
  onCancel,
  onRetryFailed,
  children,
}: BatchWidgetShellProps) {
  // FAB mode
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
        title={`${typeLabel}: ${progress}% - ${completed + failed}/${total}`}
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
              <span className="text-[10px] font-bold text-foreground leading-none">
                {progress}%
              </span>
            )}
          </div>
        </CircularProgress>

        {/* Pulse ring for active batches */}
        {!isComplete && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Type badge */}
        <div className="absolute -top-1 -left-1 rounded-full bg-card border border-border shadow-sm p-0.5">
          {typeIcon}
        </div>

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

  // Expanded panel
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
              <span className="text-[9px] font-bold text-foreground">{progress}%</span>
            </CircularProgress>
            <div>
              <div className="flex items-center gap-1.5">
                {typeIcon}
                <p className="text-sm font-semibold text-foreground">
                  {isComplete ? "Batch terminé" : "Traitement en cours"}
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {typeLabel} — {completed + failed}/{total} job{total > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded(false)}
              title="Réduire"
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
              {failed} échec{failed > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Type-specific children (e.g. job list for studio) */}
        {children}

        {/* Actions */}
        {(isComplete || onCancel) && (
          <div className="px-4 pb-3 flex items-center gap-2">
            {onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="gap-1.5 text-xs flex-1 h-8"
              >
                <X className="h-3 w-3" />
                Annuler
              </Button>
            )}
            {onRetryFailed && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetryFailed}
                className="gap-1.5 text-xs flex-1 h-8"
              >
                <RefreshCw className="h-3 w-3" />
                Relancer {failed}
              </Button>
            )}
            {isComplete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs flex-1 h-8"
              >
                Fermer
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main floating container
// ---------------------------------------------------------------------------

export function BatchFloatingWidget() {
  const { batches, removeBatch } = useBatchFloating();

  if (batches.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9998] flex flex-col items-end gap-3">
      <AnimatePresence mode="popLayout">
        {batches.map((batch) =>
          batch.type === "studio" ? (
            <StudioBatchItem
              key={batch.id}
              batchId={batch.id}
              onClose={() => removeBatch(batch.id)}
            />
          ) : (
            <ProductsBatchItem
              key={batch.id}
              jobId={batch.id}
              onClose={() => removeBatch(batch.id)}
            />
          )
        )}
      </AnimatePresence>
    </div>
  );
}
