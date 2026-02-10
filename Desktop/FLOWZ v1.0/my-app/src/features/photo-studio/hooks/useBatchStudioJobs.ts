/**
 * useBatchStudioJobs - Batch operations for studio jobs
 *
 * Provides:
 * - useCreateBatchJobs()          - Create multiple studio jobs with a shared batch_id
 * - useBatchProgress(batchId)     - Poll batch progress and compute aggregated stats
 *
 * After batch creation, jobs are automatically dispatched to
 * /api/photo-studio/process-job for server-side Gemini processing.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { BatchAction, StudioJobStatus } from '../types/studio';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateBatchJobsParams {
  productIds: string[];
  action: BatchAction;
  presetSettings?: Record<string, unknown>;
  /** Optional per-product input URLs, keyed by product ID */
  inputUrls?: Record<string, string[]>;
}

export interface BatchProgressData {
  total: number;
  completed: number;
  failed: number;
  running: number;
  pending: number;
  /** Percentage 0-100 */
  progress: number;
  isComplete: boolean;
  jobs: StudioJobStatus[];
}

// ============================================================================
// HELPERS
// ============================================================================

function batchProgressKey(batchId: string | null) {
  return ['batch-studio-progress', batchId] as const;
}

/**
 * Process studio jobs sequentially by calling the server-side API.
 * Each job is dispatched to /api/photo-studio/process-job.
 * Runs in the background — errors are logged but don't block the UI.
 */
async function dispatchJobProcessing(jobs: StudioJobStatus[]) {
  for (const job of jobs) {
    try {
      const res = await fetch('/api/photo-studio/process-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error(
          `[Studio Batch] Job ${job.id} processing failed:`,
          data.error || res.statusText
        );
      }
    } catch (err) {
      console.error(`[Studio Batch] Job ${job.id} dispatch error:`, err);
    }
  }
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create multiple studio jobs sharing a common batch_id.
 * Inserts one row per productId. Returns the generated batch_id.
 * After creation, automatically dispatches job processing.
 */
export function useCreateBatchJobs() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (params: CreateBatchJobsParams) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifie');

      // 1. Create parent batch_jobs row first (FK requirement)
      const { data: batchRow, error: batchError } = await supabase
        .from('batch_jobs')
        .insert({
          tenant_id: user.id,
          content_types: {},
          settings: params.presetSettings ?? {},
          status: 'pending' as const,
          total_items: params.productIds.length,
        })
        .select('id')
        .single();

      if (batchError) throw batchError;

      const batchId = batchRow.id as string;

      // 2. Create studio_jobs referencing the batch
      const rows = params.productIds.map((productId) => ({
        tenant_id: user.id,
        product_id: productId,
        batch_id: batchId,
        action: params.action,
        status: 'pending' as const,
        input_urls: params.inputUrls?.[productId] ?? [],
        preset_json: params.presetSettings ?? {},
      }));

      const { data, error } = await supabase
        .from('studio_jobs')
        .insert(rows)
        .select();

      if (error) throw error;

      return {
        batchId,
        jobs: (data || []) as StudioJobStatus[],
        count: rows.length,
      };
    },
    onSuccess: (result) => {
      // Invalidate per-product queries for all affected products
      for (const job of result.jobs) {
        queryClient.invalidateQueries({
          queryKey: ['studio-jobs', job.product_id],
        });
      }
      queryClient.invalidateQueries({
        queryKey: batchProgressKey(result.batchId),
      });

      toast.success(`${result.count} job(s) studio lances`, {
        description: `Batch ${result.batchId.slice(0, 8)}...`,
      });

      // Fire-and-forget: dispatch jobs for server-side processing.
      // The polling UI will reflect progress as each job completes.
      dispatchJobProcessing(result.jobs);
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la creation du batch', {
        description: error.message,
      });
    },
  });
}

// ============================================================================
// QUERIES
// ============================================================================

/** Columns needed for progress polling (excludes large output_urls) */
const PROGRESS_SELECT_COLUMNS =
  'id, product_id, action, status, input_urls, error_message, created_at, batch_id';

/**
 * Poll studio_jobs by batch_id and return aggregated progress.
 * Polls every 3 seconds while the batch is not complete.
 * Excludes output_urls to keep polling payloads small.
 */
export function useBatchProgress(batchId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: batchProgressKey(batchId),
    queryFn: async (): Promise<BatchProgressData> => {
      if (!batchId) {
        return {
          total: 0,
          completed: 0,
          failed: 0,
          running: 0,
          pending: 0,
          progress: 0,
          isComplete: true,
          jobs: [],
        };
      }

      const { data, error } = await supabase
        .from('studio_jobs')
        .select(PROGRESS_SELECT_COLUMNS)
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const jobs = (data || []) as unknown as StudioJobStatus[];
      const total = jobs.length;
      const completed = jobs.filter((j) => j.status === 'done').length;
      const failed = jobs.filter((j) => j.status === 'failed').length;
      const running = jobs.filter((j) => j.status === 'running').length;
      const pending = jobs.filter((j) => j.status === 'pending').length;

      const finishedCount = completed + failed;
      const progress = total > 0 ? Math.round((finishedCount / total) * 100) : 0;
      const isComplete = total > 0 && finishedCount === total;

      return {
        total,
        completed,
        failed,
        running,
        pending,
        progress,
        isComplete,
        jobs,
      };
    },
    enabled: !!batchId,
    refetchInterval: (query) => {
      const result = query.state.data as BatchProgressData | undefined;
      if (!result || result.isComplete) return false;
      return 3000;
    },
  });
}
