/**
 * useRecentActivity - Hook pour récupérer le flux d'activité récent
 */
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export type ActivityType = 'sync' | 'product_update' | 'error' | 'generation';

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
            // Build query with optional store filter
            let query = supabase
                .from('sync_jobs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            // Filter by store if storeId provided
            if (storeId) {
                query = query.eq('store_id', storeId);
            }

            const { data: jobs } = await query;

            const activities: ActivityItem[] = [];

            // Map jobs to activities
            jobs?.forEach(job => {
                activities.push({
                    id: job.id,
                    type: job.status === 'failed' ? 'error' : 'sync',
                    title: job.job_type === 'full_sync' ? 'Synchronisation complète' : 'Synchronisation partielle',
                    description: `Job ${job.status === 'completed' ? 'terminé avec succès' : job.status} (${job.items_processed || 0} items)`,
                    timestamp: job.created_at,
                    timeAgo: formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: fr }),
                    status: job.status === 'completed' ? 'success' : job.status === 'failed' ? 'error' : 'info',
                });
            });

            return activities.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
        },
        staleTime: 30 * 1000,
        enabled: true, // Always enabled, will show all activities if no storeId
    });
}

