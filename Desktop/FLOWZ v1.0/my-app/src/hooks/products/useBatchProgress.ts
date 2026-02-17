/**
 * useBatchProgress - Hook pour le suivi de progression des jobs batch
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface BatchJob {
    id: string;
    tenant_id: string;
    store_id?: string;
    content_types: Record<string, boolean>;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'partial';
    total_items: number;
    processed_items: number;
    successful_items: number;
    failed_items: number;
    settings: Record<string, unknown>;
    error_message?: string;
    created_at: string;
    updated_at: string;
    started_at?: string;
    completed_at?: string;
}

export interface BatchJobItem {
    id: string;
    batch_job_id: string;
    product_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error_message?: string;
    retry_count: number;
    generated_content?: Record<string, unknown>;
    field_proposals?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook pour récupérer un job batch par ID
 */
export function useBatchJobStatus(jobId?: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['batch-job', jobId],
        queryFn: async () => {
            if (!jobId) return null;

            const { data, error } = await supabase
                .from('batch_jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (error) throw error;
            return data as BatchJob;
        },
        enabled: !!jobId,
        staleTime: 1000, // Deduplicate concurrent requests from multiple components
        refetchInterval: (query) => {
            const data = query.state.data as BatchJob | null;
            // Polling tant que le job est en cours
            if (data?.status === 'running' || data?.status === 'pending') {
                return 2000;
            }
            return false;
        },
    });
}

/**
 * Hook pour la progression simplifiée
 */
export function useBatchProgress(jobId?: string) {
    const { data: job, isLoading, error } = useBatchJobStatus(jobId);

    return {
        isLoading,
        error,
        job,
        progress: job?.total_items ? Math.round((job.processed_items / job.total_items) * 100) : 0,
        processedItems: job?.processed_items || 0,
        totalItems: job?.total_items || 0,
        failedItems: job?.failed_items || 0,
        status: job?.status || 'pending',
        isComplete: job?.status === 'completed' || job?.status === 'failed' || job?.status === 'partial',
        isProcessing: job?.status === 'running',
        isPending: job?.status === 'pending',
        isFailed: job?.status === 'failed',
    };
}

/**
 * Hook pour la liste des jobs batch récents
 */
export function useBatchJobs(storeId?: string, limit = 20) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['batch-jobs', storeId, limit],
        queryFn: async () => {
            let query = supabase
                .from('batch_jobs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (storeId) {
                query = query.eq('store_id', storeId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return (data || []) as BatchJob[];
        },
    });
}

/**
 * Hook pour les jobs en cours
 */
export function useActiveJobs(storeId?: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['active-batch-jobs', storeId],
        queryFn: async () => {
            let query = supabase
                .from('batch_jobs')
                .select('*')
                .in('status', ['pending', 'running'])
                .order('created_at', { ascending: false });

            if (storeId) {
                query = query.eq('store_id', storeId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return (data || []) as BatchJob[];
        },
        staleTime: 2000, // Deduplicate across multiple components
        refetchInterval: 5000, // Refresh toutes les 5s
    });
}

/**
 * Hook pour les détails d'un job (avec items)
 */
export function useBatchJobDetails(jobId?: string) {
    const supabase = createClient();

    const jobQuery = useBatchJobStatus(jobId);

    const itemsQuery = useQuery({
        queryKey: ['batch-job-items', jobId],
        queryFn: async () => {
            if (!jobId) return [];

            const { data, error } = await supabase
                .from('batch_job_items')
                .select('*, products(title, sku)')
                .eq('batch_job_id', jobId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return (data || []) as (BatchJobItem & { products: { title: string; sku: string } })[];
        },
        enabled: !!jobId,
    });

    return {
        job: jobQuery.data,
        items: itemsQuery.data || [],
        isLoading: jobQuery.isLoading || itemsQuery.isLoading,
        error: jobQuery.error || itemsQuery.error,
    };
}

/**
 * Hook pour annuler un job
 */
export function useCancelBatchJob() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ jobId }: { jobId: string }) => {
            const { error } = await supabase
                .from('batch_jobs')
                .update({ status: 'cancelled' })
                .eq('id', jobId)
                .in('status', ['pending', 'running']);

            if (error) throw error;
            return { jobId };
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['batch-job', variables.jobId] });
            queryClient.invalidateQueries({ queryKey: ['batch-jobs'] });
            queryClient.invalidateQueries({ queryKey: ['active-batch-jobs'] });
            toast.success('Job annulé');
        },
        onError: (error: Error) => {
            toast.error('Erreur', { description: error.message });
        },
    });
}

/**
 * Hook pour retenter un job échoué
 */
export function useRetryBatchJob() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ jobId }: { jobId: string }) => {
            // Reset failed items to pending and reset batch job status
            const { error: itemsError } = await supabase
                .from('batch_job_items')
                .update({ status: 'pending', error_message: null })
                .eq('batch_job_id', jobId)
                .eq('status', 'failed');

            if (itemsError) throw itemsError;

            const { error: jobError } = await supabase
                .from('batch_jobs')
                .update({ status: 'pending', error_message: null, completed_at: null })
                .eq('id', jobId);

            if (jobError) throw jobError;
            return { jobId };
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['batch-job', variables.jobId] });
            queryClient.invalidateQueries({ queryKey: ['batch-jobs'] });
            queryClient.invalidateQueries({ queryKey: ['active-batch-jobs'] });
            toast.success('Job relancé');
        },
        onError: (error: Error) => {
            toast.error('Erreur', { description: error.message });
        },
    });
}

/**
 * Hook Realtime pour les jobs batch
 */
export function useBatchJobRealtime(jobId?: string) {
    const queryClient = useQueryClient();
    const supabase = createClient();

    useEffect(() => {
        if (!jobId) return;

        const channel = supabase
            .channel(`batch-job-${jobId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'batch_jobs',
                    filter: `id=eq.${jobId}`,
                },
                (payload) => {
                    const newData = payload.new as BatchJob;
                    queryClient.setQueryData(['batch-job', jobId], newData);

                    if (newData.status === 'completed') {
                        toast.success('Génération terminée', {
                            description: `${newData.successful_items || newData.processed_items} produit(s) traité(s)`,
                        });
                    } else if (newData.status === 'failed') {
                        toast.error('Génération échouée', {
                            description: newData.error_message || 'Erreur inconnue',
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [jobId, supabase, queryClient]);
}
