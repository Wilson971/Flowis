import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SyncJob, SyncLog } from '@/types/sync';

export function useSyncProgress(storeId: string | null) {
    const [activeJob, setActiveJob] = useState<SyncJob | null>(null);
    const [logs, setLogs] = useState<SyncLog[]>([]);
    const supabase = createClient();
    // Track storeId to prevent stale fetches from overwriting state
    const storeIdRef = useRef(storeId);
    storeIdRef.current = storeId;

    // Reset state when storeId changes or becomes null (modal closed)
    useEffect(() => {
        if (!storeId) {
            setActiveJob(null);
            setLogs([]);
        }
    }, [storeId]);

    // Fetch latest job + subscribe to changes
    useEffect(() => {
        if (!storeId) return;

        let isMounted = true;

        // Fetch latest job inline (no useCallback dependency)
        const fetchLatestJob = async () => {
            const { data } = await supabase
                .from('sync_jobs')
                .select('*')
                .eq('store_id', storeId)
                .order('started_at', { ascending: false })
                .limit(1)
                .single();

            // Guard: only set state if still mounted AND storeId hasn't changed
            if (!isMounted || storeIdRef.current !== storeId) return;

            if (data) {
                setActiveJob(data as SyncJob);
                const { data: logData } = await supabase
                    .from('sync_logs')
                    .select('*')
                    .eq('job_id', data.id)
                    .order('created_at', { ascending: true })
                    .limit(50);

                if (isMounted && storeIdRef.current === storeId && logData) {
                    setLogs(logData as SyncLog[]);
                }
            }
        };

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
                    if (!isMounted) return;
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        setActiveJob(payload.new as SyncJob);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR') {
                    console.warn('[useSyncProgress] Job channel error for store', storeId);
                }
            });

        return () => {
            isMounted = false;
            jobChannel.unsubscribe();
            supabase.removeChannel(jobChannel);
        };
    }, [storeId]); // Stable deps — no fetchLatestJob

    // Separate subscription for logs — keyed by activeJob.id
    useEffect(() => {
        if (!activeJob?.id) return;

        const jobId = activeJob.id;

        const logChannel = supabase
            .channel(`sync_logs:${jobId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'sync_logs',
                    filter: `job_id=eq.${jobId}`
                },
                (payload) => {
                    const newLog = payload.new as SyncLog;
                    setLogs(prev => [...prev, newLog]);
                }
            )
            .subscribe();

        return () => {
            logChannel.unsubscribe();
            supabase.removeChannel(logChannel);
        };
    }, [activeJob?.id]);

    return { activeJob, logs };
}
