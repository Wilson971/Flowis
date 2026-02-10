import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SyncJob, SyncLog } from '@/types/sync';

// Statuts actifs (sync en cours)
const ACTIVE_STATUSES = ['pending', 'discovering', 'syncing', 'products', 'variations', 'categories'];

export function useSyncProgress(storeId: string | null) {
    const [activeJob, setActiveJob] = useState<SyncJob | null>(null);
    const [logs, setLogs] = useState<SyncLog[]>([]);
    const supabase = createClient();

    // Fetch le job le plus récent (actif ou terminé récemment)
    const fetchLatestJob = useCallback(async () => {
        if (!storeId) return;

        const { data } = await supabase
            .from('sync_jobs')
            .select('*')
            .eq('store_id', storeId)
            .order('started_at', { ascending: false })
            .limit(1)
            .single();

        if (data) {
            setActiveJob(data as SyncJob);
            // Load logs for this job
            const { data: logData } = await supabase
                .from('sync_logs')
                .select('*')
                .eq('job_id', data.id)
                .order('created_at', { ascending: true })
                .limit(50);
            if (logData) setLogs(logData as SyncLog[]);
        }
    }, [storeId, supabase]);

    // Subscribe to active jobs for this store
    useEffect(() => {
        if (!storeId) return;

        fetchLatestJob();

        // Subscribe to changes on sync_jobs
        const jobChannel = supabase
            .channel(`sync_jobs:${storeId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'sync_jobs',
                    filter: `store_id=eq.${storeId}`
                },
                (payload) => {
                    console.log('Sync Job Update:', payload);
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const job = payload.new as SyncJob;
                        setActiveJob(job);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(jobChannel);
        }
    }, [storeId, fetchLatestJob]);

    // Separate subscription for logs if we have an active job
    useEffect(() => {
        if (!activeJob) return;

        const logChannel = supabase
            .channel(`sync_logs:${activeJob.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'sync_logs',
                    filter: `job_id=eq.${activeJob.id}`
                },
                (payload) => {
                    const newLog = payload.new as SyncLog;
                    setLogs(prev => [...prev, newLog]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(logChannel);
        }
    }, [activeJob?.id]);

    return { activeJob, logs };
}
