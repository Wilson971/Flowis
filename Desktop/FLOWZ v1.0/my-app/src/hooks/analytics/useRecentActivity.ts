/**
 * useRecentActivity - Hook pour récupérer le flux d'activité récent
 *
 * Reads from activity_log (unified feed) with fallback to sync_jobs
 * if the activity_log table doesn't exist yet (migration not applied).
 */
import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-config';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export type ActivityType = 'sync' | 'product_update' | 'error' | 'generation' | 'publication' | 'seo_analysis' | 'photo_studio';

export interface ActivityItem {
    id: string;
    type: ActivityType;
    title: string;
    description: string;
    timestamp: string;
    timeAgo: string;
    status: 'success' | 'warning' | 'error' | 'info';
}

export function useRecentActivity(storeId?: string, limit = 10) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['recent-activity', storeId, limit],
        queryFn: async (): Promise<ActivityItem[]> => {
            // Try activity_log first (unified feed)
            const activityResult = await fetchFromActivityLog(supabase, storeId, limit);
            if (activityResult !== null) return activityResult;

            // Fallback to sync_jobs if activity_log doesn't exist
            return fetchFromSyncJobs(supabase, storeId, limit);
        },
        staleTime: STALE_TIMES.LIST,
        enabled: true,
    });
}

async function fetchFromActivityLog(
    supabase: ReturnType<typeof createClient>,
    storeId: string | undefined,
    limit: number,
): Promise<ActivityItem[] | null> {
    let query = supabase
        .from('activity_log')
        .select('id, type, title, description, status, created_at, metadata')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (storeId) {
        query = query.eq('store_id', storeId);
    }

    const { data, error } = await query;

    // Table doesn't exist yet — return null to trigger fallback
    if (error) return null;

    return (data || []).map(row => ({
        id: row.id,
        type: row.type as ActivityType,
        title: row.title,
        description: row.description || '',
        timestamp: row.created_at,
        timeAgo: formatDistanceToNow(new Date(row.created_at), { addSuffix: true, locale: fr }),
        status: (row.status as ActivityItem['status']) || 'info',
    }));
}

async function fetchFromSyncJobs(
    supabase: ReturnType<typeof createClient>,
    storeId: string | undefined,
    limit: number,
): Promise<ActivityItem[]> {
    let query = supabase
        .from('sync_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (storeId) {
        query = query.eq('store_id', storeId);
    }

    const { data: jobs } = await query;

    return (jobs || []).map(job => ({
        id: job.id,
        type: (job.status === 'failed' ? 'error' : 'sync') as ActivityType,
        title: job.job_type === 'full_sync' ? 'Synchronisation complète' : 'Synchronisation partielle',
        description: `Job ${job.status === 'completed' ? 'terminé avec succès' : job.status} (${job.items_processed || 0} items)`,
        timestamp: job.created_at,
        timeAgo: formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: fr }),
        status: job.status === 'completed' ? 'success' : job.status === 'failed' ? 'error' : 'info',
    })).sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
}

