/**
 * useStudioJobs - CRUD + polling hooks for studio_jobs table
 *
 * Provides:
 * - useStudioJobs(productId)   - List jobs for a product with smart polling
 * - useCreateStudioJob()       - Create a new studio job
 * - useUpdateStudioJob()       - Update a job status / output
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { StudioJobStatus, BatchAction } from '../types/studio';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateStudioJobParams {
  product_id: string;
  action: BatchAction;
  input_urls: string[];
  batch_id?: string;
  preset_settings?: Record<string, unknown>;
}

export interface UpdateStudioJobParams {
  id: string;
  status?: StudioJobStatus['status'];
  output_urls?: string[];
  error_message?: string | null;
}

// ============================================================================
// HELPERS
// ============================================================================

function studioJobsKey(productId: string) {
  return ['studio-jobs', productId] as const;
}

/**
 * Returns true when at least one job is in a pending or running state,
 * indicating the query should continue polling.
 */
function hasActiveJobs(jobs: StudioJobStatus[] | undefined): boolean {
  if (!jobs || jobs.length === 0) return false;
  return jobs.some(
    (job) => job.status === 'pending' || job.status === 'running'
  );
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch studio jobs for a given product.
 * Automatically polls every 3 seconds when any job is pending or running.
 */
export function useStudioJobs(productId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: studioJobsKey(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studio_jobs')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as StudioJobStatus[];
    },
    enabled: !!productId,
    refetchInterval: (query) => {
      if (typeof document !== 'undefined' && document.hidden) return false;
      const jobs = query.state.data as StudioJobStatus[] | undefined;
      return hasActiveJobs(jobs) ? 3000 : false;
    },
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new studio job.
 */
export function useCreateStudioJob() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (params: CreateStudioJobParams) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifie');

      const { data, error } = await supabase
        .from('studio_jobs')
        .insert({
          tenant_id: user.id,
          product_id: params.product_id,
          action: params.action,
          status: 'pending' as const,
          input_urls: params.input_urls,
          batch_id: params.batch_id ?? null,
          preset_json: params.preset_settings ?? {},
        })
        .select()
        .single();

      if (error) throw error;
      return data as StudioJobStatus;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: studioJobsKey(data.product_id),
      });
      toast.success('Job studio lance');
    },
    onError: (error: Error) => {
      toast.error('Erreur de creation du job', {
        description: error.message,
      });
    },
  });
}

/**
 * Update an existing studio job (status, output, error).
 */
export function useUpdateStudioJob() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateStudioJobParams) => {
      const { data, error } = await supabase
        .from('studio_jobs')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as StudioJobStatus;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: studioJobsKey(data.product_id),
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur de mise a jour du job', {
        description: error.message,
      });
    },
  });
}
