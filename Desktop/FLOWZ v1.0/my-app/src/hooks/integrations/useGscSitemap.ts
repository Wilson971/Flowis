/**
 * Hook for sitemap URL management.
 * Fetches cached sitemap URLs and provides a mutation to refresh from remote.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-config';

export function useGscSitemap(siteId: string | null) {
    const queryClient = useQueryClient();

    const sitemapQuery = useQuery({
        queryKey: ['gsc-sitemap', siteId],
        queryFn: async () => {
            const res = await fetch(`/api/gsc/indexation/urls?siteId=${siteId}&perPage=1&page=1`);
            if (!res.ok) throw new Error('Failed to fetch sitemap status');
            const data = await res.json();
            return { total: data.total as number };
        },
        enabled: !!siteId,
        staleTime: STALE_TIMES.DETAIL,
    });

    const refreshMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/gsc/sitemap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Erreur refresh sitemap');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gsc-sitemap', siteId] });
            queryClient.invalidateQueries({ queryKey: ['gsc-indexation-overview', siteId] });
            queryClient.invalidateQueries({ queryKey: ['gsc-indexation-urls', siteId] });
        },
    });

    return {
        total: sitemapQuery.data?.total || 0,
        isLoading: sitemapQuery.isLoading,
        refreshSitemap: refreshMutation.mutate,
        isRefreshing: refreshMutation.isPending,
        refreshResult: refreshMutation.data,
    };
}
