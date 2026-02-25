/**
 * Main hook for the indexation feature.
 * Provides overview stats, paginated URL list, inspect & submit mutations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['gsc-indexation-overview', siteId] });
            queryClient.invalidateQueries({ queryKey: ['gsc-indexation-urls', siteId] });
            if (data?.inspected > 0) {
                toast.success(`${data.inspected} URL${data.inspected > 1 ? 's' : ''} inspectée${data.inspected > 1 ? 's' : ''}`);
            }
        },
        onError: (err: Error) => {
            toast.error('Échec de l\'inspection', { description: err.message });
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
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['gsc-indexation-queue', siteId] });

            const { submitted = 0, queued = 0, failed = 0, quota_remaining } = data;

            if (submitted > 0 && failed === 0 && queued === 0) {
                toast.success(
                    `${submitted} URL${submitted > 1 ? 's' : ''} soumise${submitted > 1 ? 's' : ''} à Google`,
                    { description: `Quota restant : ${quota_remaining}/jour` }
                );
            } else if (submitted > 0 && queued > 0) {
                toast.success(
                    `${submitted} URL${submitted > 1 ? 's' : ''} soumise${submitted > 1 ? 's' : ''} · ${queued} en file d'attente`,
                    { description: `Quota journalier atteint — les ${queued} restantes seront soumises demain` }
                );
            } else if (queued > 0 && submitted === 0) {
                toast.info(
                    `${queued} URL${queued > 1 ? 's' : ''} ajoutée${queued > 1 ? 's' : ''} en file d'attente`,
                    { description: 'Quota journalier atteint — soumission automatique demain' }
                );
            }

            if (failed > 0) {
                toast.warning(`${failed} URL${failed > 1 ? 's' : ''} en échec`, {
                    description: 'Vérifiez la file d\'attente pour les détails',
                });
            }
        },
        onError: (err: Error) => {
            toast.error('Échec de la soumission', { description: err.message });
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
