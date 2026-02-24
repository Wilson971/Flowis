/**
 * useSyncJob - Hook pour gérer les jobs de synchronisation
 *
 * Ce hook fournit des fonctions pour:
 * - Récupérer un job de sync par ID
 * - Lister les jobs d'une boutique
 * - Démarrer, mettre en pause, reprendre et annuler une synchronisation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type {
    SyncJob,
    StartSyncOptions,
    SyncActionsState,
} from '@/types/sync';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook to fetch a specific sync job by ID
 */
export function useSyncJob(jobId: string | null) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['sync-job', jobId],
        queryFn: async () => {
            if (!jobId) return null;

            const { data, error } = await supabase
                .from('sync_jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (error) throw error;
            return data as SyncJob;
        },
        enabled: !!jobId,
    });
}

/**
 * Hook to fetch the latest sync job for a store
 */
export function useLatestSyncJob(storeId: string | null) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['sync-jobs', 'latest', storeId],
        queryFn: async () => {
            if (!storeId) return null;

            const { data, error } = await supabase
                .from('sync_jobs')
                .select('*')
                .eq('store_id', storeId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data as SyncJob | null;
        },
        enabled: !!storeId,
    });
}

/**
 * Hook to fetch all sync jobs for a store
 */
export function useSyncJobs(storeId: string | null, limit = 10) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['sync-jobs', storeId, limit],
        queryFn: async () => {
            if (!storeId) return [];

            const { data, error } = await supabase
                .from('sync_jobs')
                .select('*')
                .eq('store_id', storeId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data as SyncJob[];
        },
        enabled: !!storeId,
    });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook to start a new sync job
 */
export function useStartSync() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (options: StartSyncOptions) => {
            const {
                store_id,
                mode = 'full',
                limit,
                sync_categories = true,
                sync_products = true,
                sync_posts = false,
                sync_variations = true,
            } = options;

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            // Get store to find connection_id and platform
            const { data: store, error: storeError } = await supabase
                .from('stores')
                .select('id, platform, platform_connections(id)')
                .eq('id', store_id)
                .eq('tenant_id', user.id)
                .single();

            if (storeError || !store) throw new Error('Store non trouvé');

            const connectionId = (store.platform_connections as { id: string }[])?.[0]?.id;
            if (!connectionId) throw new Error('Aucune connexion trouvée pour ce store');

            // Try to use RPC function if available, otherwise create job directly
            try {
                const { data: jobId, error: rpcError } = await supabase.rpc('start_async_sync', {
                    p_tenant_id: user.id,
                    p_store_id: store_id,
                    p_connection_id: connectionId,
                    p_platform: store.platform || 'woocommerce',
                    p_job_type: 'import_products',
                    p_config: {
                        mode,
                        limit,
                        sync_categories,
                        sync_products,
                        sync_posts,
                        sync_variations,
                    },
                });

                if (rpcError) throw rpcError;

                // Fetch the created job
                const { data: job, error: jobError } = await supabase
                    .from('sync_jobs')
                    .select('*')
                    .eq('id', jobId)
                    .single();

                if (jobError) throw jobError;
                return job as SyncJob;
            } catch {
                // Fallback: Create job directly and call edge function
                const { data: job, error: insertError } = await supabase
                    .from('sync_jobs')
                    .insert({
                        store_id,
                        tenant_id: user.id,
                        connection_id: connectionId,
                        job_type: 'import_products',
                        status: 'pending',
                        current_phase: 'discovery',
                        total_products: 0,
                        synced_products: 0,
                        total_variations: 0,
                        synced_variations: 0,
                        total_categories: 0,
                        synced_categories: 0,
                        config: {
                            mode,
                            limit,
                            sync_categories,
                            sync_products,
                            sync_posts,
                            sync_variations,
                        },
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;

                // Call sync-manager edge function
                const { error: fnError } = await supabase.functions.invoke('sync-manager', {
                    body: {
                        storeId: store_id,
                        jobId: job.id,
                        types: 'all',
                        sync_type: mode,
                    },
                });

                if (fnError) {
                    // Update job as failed
                    await supabase
                        .from('sync_jobs')
                        .update({ status: 'failed', error_message: fnError.message })
                        .eq('id', job.id);
                    throw fnError;
                }

                return job as SyncJob;
            }
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['sync-jobs', 'latest', variables.store_id] });
            queryClient.invalidateQueries({ queryKey: ['sync-jobs', variables.store_id] });
            queryClient.invalidateQueries({ queryKey: ['sync-job', data.id] });

            toast.success('Synchronisation démarrée', {
                description: 'La synchronisation continue en arrière-plan',
            });
        },
        onError: (error: Error) => {
            toast.error(`Erreur lors du démarrage: ${error.message}`);
        },
    });
}

/**
 * Hook to pause a sync job
 */
export function usePauseSync() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (jobId: string) => {
            // Try RPC first
            try {
                const { error } = await supabase.rpc('pause_sync_job', {
                    p_job_id: jobId,
                });
                if (error) throw error;
            } catch {
                // Fallback: Update directly
                const { error } = await supabase
                    .from('sync_jobs')
                    .update({ status: 'paused', paused_at: new Date().toISOString() })
                    .eq('id', jobId);
                if (error) throw error;
            }

            // Fetch updated job
            const { data, error: fetchError } = await supabase
                .from('sync_jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (fetchError) throw fetchError;
            return data as SyncJob;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['sync-job', data.id] });
            queryClient.invalidateQueries({ queryKey: ['sync-jobs', 'latest', data.store_id] });
            toast.info('Synchronisation mise en pause');
        },
        onError: (error: Error) => {
            toast.error(`Erreur: ${error.message}`);
        },
    });
}

/**
 * Hook to resume a paused sync job
 */
export function useResumeSync() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (job: SyncJob) => {
            // Try RPC first
            try {
                const { error } = await supabase.rpc('resume_sync_job', {
                    p_job_id: job.id,
                });
                if (error) throw error;
            } catch {
                // Fallback: Update directly and call edge function
                const { error } = await supabase
                    .from('sync_jobs')
                    .update({ status: 'running', paused_at: null })
                    .eq('id', job.id);
                if (error) throw error;

                // Trigger edge function to continue
                await supabase.functions.invoke('sync-manager', {
                    body: {
                        storeId: job.store_id,
                        jobId: job.id,
                        resume: true,
                    },
                });
            }

            // Fetch updated job
            const { data: updatedJob, error: fetchError } = await supabase
                .from('sync_jobs')
                .select('*')
                .eq('id', job.id)
                .single();

            if (fetchError) throw fetchError;
            return updatedJob as SyncJob;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['sync-job', data.id] });
            queryClient.invalidateQueries({ queryKey: ['sync-jobs', 'latest', data.store_id] });
            toast.success('Synchronisation reprise', {
                description: 'La synchronisation reprend à partir du dernier point',
            });
        },
        onError: (error: Error) => {
            toast.error(`Erreur: ${error.message}`);
        },
    });
}

/**
 * Hook to cancel a sync job
 */
export function useCancelSyncJob() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (jobId: string) => {
            // Try RPC first
            try {
                const { error } = await supabase.rpc('cancel_sync_job', {
                    p_job_id: jobId,
                });
                if (error) throw error;
            } catch {
                // Fallback: Update directly
                const { error } = await supabase
                    .from('sync_jobs')
                    .update({
                        status: 'cancelled',
                        completed_at: new Date().toISOString(),
                    })
                    .eq('id', jobId);
                if (error) throw error;
            }

            // Fetch updated job
            const { data, error: fetchError } = await supabase
                .from('sync_jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (fetchError) throw fetchError;
            return data as SyncJob;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['sync-job', data.id] });
            queryClient.invalidateQueries({ queryKey: ['sync-jobs', 'latest', data.store_id] });
            toast.info('Synchronisation annulée');
        },
        onError: (error: Error) => {
            toast.error(`Erreur: ${error.message}`);
        },
    });
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Helper hook to get sync action availability
 */
export function useSyncActions(job: SyncJob | null | undefined): SyncActionsState {
    if (!job) {
        return {
            canStart: true,
            canPause: false,
            canResume: false,
            canCancel: false,
            isRunning: false,
            isPaused: false,
            isCompleted: false,
            isFailed: false,
        };
    }

    const isRunning = ['pending', 'discovering', 'fetching', 'saving', 'syncing', 'running', 'importing'].includes(job.status);
    const isPaused = job.status === 'paused';
    const isCompleted = job.status === 'completed';
    const isFailed = job.status === 'failed' || job.status === 'error';

    return {
        canStart: !isRunning && !isPaused,
        canPause: isRunning,
        canResume: isPaused,
        canCancel: isRunning || isPaused,
        isRunning,
        isPaused,
        isCompleted,
        isFailed,
    };
}
