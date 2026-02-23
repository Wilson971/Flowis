/**
 * Hook for auto-indexation settings.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { GscIndexationSettings } from '@/lib/gsc/types';

export function useGscIndexationSettings(siteId: string | null) {
    const queryClient = useQueryClient();

    const settingsQuery = useQuery<GscIndexationSettings>({
        queryKey: ['gsc-indexation-settings', siteId],
        queryFn: async () => {
            const res = await fetch(`/api/gsc/indexation/settings?siteId=${siteId}`);
            if (!res.ok) throw new Error('Failed to fetch settings');
            return res.json();
        },
        enabled: !!siteId,
        staleTime: 60_000,
    });

    const updateMutation = useMutation({
        mutationFn: async (settings: GscIndexationSettings) => {
            const res = await fetch('/api/gsc/indexation/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId, ...settings }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Erreur sauvegarde');
            }
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['gsc-indexation-settings', siteId], data);
        },
    });

    return {
        settings: settingsQuery.data || { auto_index_new: false, auto_index_updated: false },
        isLoading: settingsQuery.isLoading,
        updateSettings: updateMutation.mutate,
        isUpdating: updateMutation.isPending,
    };
}
