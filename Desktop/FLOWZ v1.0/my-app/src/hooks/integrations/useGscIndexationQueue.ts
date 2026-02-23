/**
 * Hook for the indexation queue ("Pages en attente").
 */

import { useQuery } from '@tanstack/react-query';
import type { GscQueueStats, GscQueueItem } from '@/lib/gsc/types';

interface QueueResponse {
    stats: GscQueueStats;
    items: GscQueueItem[];
    total: number;
    page: number;
    per_page: number;
}

export function useGscIndexationQueue(
    siteId: string | null,
    page: number = 1,
    perPage: number = 50
) {
    const query = useQuery<QueueResponse>({
        queryKey: ['gsc-indexation-queue', siteId, page, perPage],
        queryFn: async () => {
            const params = new URLSearchParams({
                siteId: siteId!,
                page: String(page),
                perPage: String(perPage),
            });
            const res = await fetch(`/api/gsc/indexation/queue?${params}`);
            if (!res.ok) throw new Error('Failed to fetch queue');
            return res.json();
        },
        enabled: !!siteId,
        staleTime: 15_000,
    });

    return {
        stats: query.data?.stats || {
            total_submitted: 0,
            pending: 0,
            submitted: 0,
            failed: 0,
            daily_quota_used: 0,
            daily_quota_limit: 200,
        },
        items: query.data?.items || [],
        totalItems: query.data?.total || 0,
        isLoading: query.isLoading,
    };
}
