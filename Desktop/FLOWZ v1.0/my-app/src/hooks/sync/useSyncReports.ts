/**
 * useSyncReports - Hook pour récupérer les rapports de synchronisation
 *
 * Fournit l'accès aux logs et statistiques des syncs passées.
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { SyncJob, SyncLog } from '@/types/sync';

// ============================================================================
// Types
// ============================================================================

export interface SyncReport {
    job: SyncJob;
    logs: SyncLog[];
    summary: {
        totalProducts: number;
        successProducts: number;
        failedProducts: number;
        totalCategories: number;
        successCategories: number;
        totalVariations: number;
        successVariations: number;
        durationSeconds: number;
        errorCount: number;
        warningCount: number;
    };
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch sync reports for a store
 */
export function useSyncReports(storeId: string | null, limit = 10) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['sync-reports', storeId, limit],
        queryFn: async (): Promise<SyncReport[]> => {
            if (!storeId) return [];

            // Fetch completed sync jobs
            const { data: jobs, error: jobsError } = await supabase
                .from('sync_jobs')
                .select('*')
                .eq('store_id', storeId)
                .in('status', ['completed', 'failed'])
                .order('completed_at', { ascending: false })
                .limit(limit);

            if (jobsError) throw jobsError;
            if (!jobs || jobs.length === 0) return [];

            // Fetch logs for each job
            const reports: SyncReport[] = await Promise.all(
                (jobs as SyncJob[]).map(async (job) => {
                    const { data: logs } = await supabase
                        .from('sync_logs')
                        .select('*')
                        .eq('job_id', job.id)
                        .order('created_at', { ascending: true });

                    const syncLogs = (logs || []) as SyncLog[];

                    // Calculate summary from logs
                    const errorCount = syncLogs.filter(l => l.type === 'error').length;
                    const warningCount = syncLogs.filter(l => l.type === 'warning').length;

                    // Calculate duration
                    let durationSeconds = 0;
                    if (job.started_at && job.completed_at) {
                        const start = new Date(job.started_at).getTime();
                        const end = new Date(job.completed_at).getTime();
                        durationSeconds = Math.round((end - start) / 1000);
                    }

                    return {
                        job,
                        logs: syncLogs,
                        summary: {
                            totalProducts: job.total_products,
                            successProducts: job.synced_products,
                            failedProducts: job.total_products - job.synced_products,
                            totalCategories: job.total_categories,
                            successCategories: job.synced_categories,
                            totalVariations: job.total_variations,
                            successVariations: job.synced_variations,
                            durationSeconds,
                            errorCount,
                            warningCount,
                        },
                    };
                })
            );

            return reports;
        },
        enabled: !!storeId,
    });
}

/**
 * Hook to fetch a single sync report by job ID
 */
export function useSyncReport(jobId: string | null) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['sync-report', jobId],
        queryFn: async (): Promise<SyncReport | null> => {
            if (!jobId) return null;

            // Fetch the job
            const { data: job, error: jobError } = await supabase
                .from('sync_jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (jobError) throw jobError;
            if (!job) return null;

            // Fetch logs
            const { data: logs } = await supabase
                .from('sync_logs')
                .select('*')
                .eq('job_id', jobId)
                .order('created_at', { ascending: true });

            const syncLogs = (logs || []) as SyncLog[];
            const syncJob = job as SyncJob;

            // Calculate summary
            const errorCount = syncLogs.filter(l => l.type === 'error').length;
            const warningCount = syncLogs.filter(l => l.type === 'warning').length;

            let durationSeconds = 0;
            if (syncJob.started_at && syncJob.completed_at) {
                const start = new Date(syncJob.started_at).getTime();
                const end = new Date(syncJob.completed_at).getTime();
                durationSeconds = Math.round((end - start) / 1000);
            }

            return {
                job: syncJob,
                logs: syncLogs,
                summary: {
                    totalProducts: syncJob.total_products,
                    successProducts: syncJob.synced_products,
                    failedProducts: syncJob.total_products - syncJob.synced_products,
                    totalCategories: syncJob.total_categories,
                    successCategories: syncJob.synced_categories,
                    totalVariations: syncJob.total_variations,
                    successVariations: syncJob.synced_variations,
                    durationSeconds,
                    errorCount,
                    warningCount,
                },
            };
        },
        enabled: !!jobId,
    });
}

/**
 * Hook to fetch sync logs for a job (with realtime updates if job is active)
 */
export function useSyncLogs(jobId: string | null) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['sync-logs', jobId],
        queryFn: async (): Promise<SyncLog[]> => {
            if (!jobId) return [];

            const { data, error } = await supabase
                .from('sync_logs')
                .select('*')
                .eq('job_id', jobId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return (data || []) as SyncLog[];
        },
        enabled: !!jobId,
        refetchInterval: (query) => {
            if (typeof document !== 'undefined' && document.hidden) return false;
            // Auto-refetch every 2s if job might still be active
            return query.state.data && query.state.data.length > 0 ? 2000 : false;
        },
    });
}

/**
 * Hook to get sync statistics for a store
 */
export function useSyncStats(storeId: string | null) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['sync-stats', storeId],
        queryFn: async () => {
            if (!storeId) return null;

            // Get last 30 days of sync jobs
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: jobs, error } = await supabase
                .from('sync_jobs')
                .select('*')
                .eq('store_id', storeId)
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;

            const syncJobs = (jobs || []) as SyncJob[];

            // Calculate statistics
            const totalSyncs = syncJobs.length;
            const successfulSyncs = syncJobs.filter(j => j.status === 'completed').length;
            const failedSyncs = syncJobs.filter(j => j.status === 'failed').length;

            const totalProductsSynced = syncJobs.reduce((sum, j) => sum + (j.synced_products || 0), 0);
            const totalCategoriesSynced = syncJobs.reduce((sum, j) => sum + (j.synced_categories || 0), 0);

            // Average sync duration
            let avgDuration = 0;
            const completedJobs = syncJobs.filter(j => j.started_at && j.completed_at);
            if (completedJobs.length > 0) {
                const totalDuration = completedJobs.reduce((sum, j) => {
                    const start = new Date(j.started_at!).getTime();
                    const end = new Date(j.completed_at!).getTime();
                    return sum + (end - start);
                }, 0);
                avgDuration = Math.round(totalDuration / completedJobs.length / 1000);
            }

            // Last sync
            const lastSync = syncJobs[0] || null;

            return {
                totalSyncs,
                successfulSyncs,
                failedSyncs,
                successRate: totalSyncs > 0 ? Math.round((successfulSyncs / totalSyncs) * 100) : 0,
                totalProductsSynced,
                totalCategoriesSynced,
                avgDurationSeconds: avgDuration,
                lastSync,
                lastSyncAt: lastSync?.completed_at || lastSync?.started_at || null,
            };
        },
        enabled: !!storeId,
    });
}
