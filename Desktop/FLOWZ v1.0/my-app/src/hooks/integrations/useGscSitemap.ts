/**
 * Hook for sitemap URL management.
 * - Fetches paginated sitemap URLs from gsc_sitemap_urls via GET /api/gsc/sitemap
 * - Provides mutation to refresh (parse + upsert) via POST /api/gsc/sitemap
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { STALE_TIMES } from '@/lib/query-config';
import type { GscUrlSource } from '@/lib/gsc/types';

export interface GscSitemapUrl {
    id: string;
    url: string;
    source: GscUrlSource;
    lastmod: string | null;
    is_active: boolean;
    last_seen_at: string;
}

export interface GscSitemapStats {
    sitemap: number;
    product: number;
    blog: number;
}

export interface GscSitemapRefreshResult {
    total: number;
    from_sitemap: number;
    from_products: number;
    from_blog: number;
    new: number;
    removed: number;
}

const PER_PAGE = 50;

export function useGscSitemap(siteId: string | null) {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [source, setSource] = useState<GscUrlSource | undefined>(undefined);
    const [search, setSearch] = useState('');

    const urlsQuery = useQuery({
        queryKey: ['gsc-sitemap', siteId, page, source, search],
        queryFn: async () => {
            const params = new URLSearchParams({
                siteId: siteId!,
                page: String(page),
                perPage: String(PER_PAGE),
            });
            if (source) params.set('source', source);
            if (search) params.set('search', search);

            const res = await fetch(`/api/gsc/sitemap?${params}`);
            if (!res.ok) throw new Error('Failed to fetch sitemap URLs');
            return res.json() as Promise<{
                urls: GscSitemapUrl[];
                total: number;
                stats: GscSitemapStats;
            }>;
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
            return res.json() as Promise<GscSitemapRefreshResult>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gsc-sitemap', siteId] });
            queryClient.invalidateQueries({ queryKey: ['gsc-indexation-overview', siteId] });
            queryClient.invalidateQueries({ queryKey: ['gsc-indexation-urls', siteId] });
            setPage(1);
        },
    });

    const totalPages = Math.max(1, Math.ceil((urlsQuery.data?.total ?? 0) / PER_PAGE));

    return {
        // Data
        urls: urlsQuery.data?.urls ?? [],
        total: urlsQuery.data?.total ?? 0,
        stats: urlsQuery.data?.stats ?? { sitemap: 0, product: 0, blog: 0 },
        // Loading
        isLoading: urlsQuery.isLoading,
        // Pagination
        page,
        setPage,
        totalPages,
        perPage: PER_PAGE,
        // Filters
        source,
        setSource: (s: GscUrlSource | undefined) => { setSource(s); setPage(1); },
        search,
        setSearch: (s: string) => { setSearch(s); setPage(1); },
        // Refresh
        refreshSitemap: refreshMutation.mutate,
        isRefreshing: refreshMutation.isPending,
        refreshResult: refreshMutation.data,
        refreshError: refreshMutation.error,
    };
}
