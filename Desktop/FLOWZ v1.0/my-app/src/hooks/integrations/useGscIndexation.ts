/**
 * Main hook for the indexation feature.
 * Provides overview stats, paginated URL list, inspect & submit mutations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-config';
import type {
    GscIndexationOverview,
    GscIndexationUrl,
    GscIndexationVerdict,
    GscUrlFilterRule,
} from '@/lib/gsc/types';

interface UseGscIndexationOptions {
    page?: number;
    perPage?: number;
    verdict?: GscIndexationVerdict | null;
    search?: string;
    filterRule?: GscUrlFilterRule | null;
    filterValue?: string;
    source?: string | null;
}

export function useGscIndexation(
    siteId: string | null,
    options: UseGscIndexationOptions = {}
) {
    const queryClient = useQueryClient();
    const { page = 1, perPage = 50, verdict, search, filterRule, filterValue, source } = options;

    // Overview stats
    const overviewQuery = useQuery<GscIndexationOverview>({
        queryKey: ['gsc-indexation-overview', siteId],
        queryFn: async () => {
            const res = await fetch(`/api/gsc/indexation/overview?siteId=${siteId}`);
            if (!res.ok) throw new Error('Failed to fetch overview');
            return res.json();
        },
        enabled: !!siteId,
        staleTime: STALE_TIMES.LIST,
    });

    // Paginated URL list
    const urlsQuery = useQuery<{ urls: GscIndexationUrl[]; total: number }>({
        queryKey: ['gsc-indexation-urls', siteId, page, perPage, verdict, search, filterRule, filterValue, source],
        queryFn: async () => {
            const params = new URLSearchParams({
                siteId: siteId!,
                page: String(page),
                perPage: String(perPage),
            });
            if (verdict) params.set('verdict', verdict);
            if (search) params.set('search', search);
            if (filterRule) params.set('filterRule', filterRule);
            if (filterValue) params.set('filterValue', filterValue);
            if (source) params.set('source', source);

            const res = await fetch(`/api/gsc/indexation/urls?${params}`);
            if (!res.ok) throw new Error('Failed to fetch URLs');
            return res.json();
        },
        enabled: !!siteId,
        staleTime: STALE_TIMES.LIST,
        placeholderData: (prev) => prev,
    });

    // Inspect mutation
    const inspectMutation = useMutation({
        mutationFn: async (urls?: string[]) => {
            const res = await fetch('/api/gsc/indexation/inspect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siteId,
                    urls: urls && urls.length > 0 ? urls : undefined,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Erreur inspection');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gsc-indexation-overview', siteId] });
            queryClient.invalidateQueries({ queryKey: ['gsc-indexation-urls', siteId] });
        },
    });

    // Submit mutation
    const submitMutation = useMutation({
        mutationFn: async (urls: string[]) => {
            const res = await fetch('/api/gsc/indexation/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId, urls }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Erreur soumission');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gsc-indexation-queue', siteId] });
        },
    });

    return {
        // Overview
        overview: overviewQuery.data,
        isOverviewLoading: overviewQuery.isLoading,

        // URLs
        urls: urlsQuery.data?.urls || [],
        totalUrls: urlsQuery.data?.total || 0,
        isUrlsLoading: urlsQuery.isLoading,

        // Inspect
        inspect: inspectMutation.mutate,
        isInspecting: inspectMutation.isPending,
        inspectResult: inspectMutation.data,

        // Submit
        submit: submitMutation.mutate,
        isSubmitting: submitMutation.isPending,
        submitResult: submitMutation.data,
    };
}
