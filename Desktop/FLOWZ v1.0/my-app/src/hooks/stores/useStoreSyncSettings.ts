/**
 * useStoreSyncSettings - Hook pour gérer les paramètres de synchronisation d'une boutique
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { StoreSyncSettings } from '@/types/store';

const DEFAULT_SYNC_SETTINGS: StoreSyncSettings = {
    auto_sync_enabled: false,
    sync_interval_hours: 24,
    sync_products: true,
    sync_categories: true,
    sync_variations: true,
    sync_posts: false,
    notify_on_complete: true,
    notify_on_error: true,
};

/**
 * Hook to get sync settings for a store
 */
export function useStoreSyncSettings(storeId: string | null) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['store-sync-settings', storeId],
        queryFn: async (): Promise<StoreSyncSettings> => {
            if (!storeId) return DEFAULT_SYNC_SETTINGS;

            const { data, error } = await supabase
                .from('stores')
                .select('metadata')
                .eq('id', storeId)
                .single();

            if (error) throw error;

            const metadata = data?.metadata as Record<string, unknown> | null;
            const syncSettings = metadata?.sync_settings as Partial<StoreSyncSettings> | undefined;

            return {
                ...DEFAULT_SYNC_SETTINGS,
                ...syncSettings,
            };
        },
        enabled: !!storeId,
    });
}

/**
 * Hook to update sync settings for a store
 */
export function useUpdateStoreSyncSettings() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({
            storeId,
            settings,
        }: {
            storeId: string;
            settings: Partial<StoreSyncSettings>;
        }) => {
            // Get current metadata
            const { data: store, error: fetchError } = await supabase
                .from('stores')
                .select('metadata')
                .eq('id', storeId)
                .single();

            if (fetchError) throw fetchError;

            const currentMetadata = (store?.metadata as Record<string, unknown>) || {};
            const currentSyncSettings = (currentMetadata.sync_settings as Partial<StoreSyncSettings>) || {};

            // Merge settings
            const newMetadata = {
                ...currentMetadata,
                sync_settings: {
                    ...DEFAULT_SYNC_SETTINGS,
                    ...currentSyncSettings,
                    ...settings,
                },
            };

            // Update store
            const { error } = await supabase
                .from('stores')
                .update({
                    metadata: newMetadata,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', storeId);

            if (error) throw error;

            return newMetadata.sync_settings as StoreSyncSettings;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['store-sync-settings', variables.storeId] });
            queryClient.invalidateQueries({ queryKey: ['store', variables.storeId] });
            toast.success('Paramètres de synchronisation mis à jour');
        },
        onError: (error: Error) => {
            toast.error('Erreur de mise à jour', {
                description: error.message,
            });
        },
    });
}

/**
 * Hook to toggle auto-sync quickly
 */
export function useToggleAutoSync() {
    const updateSettings = useUpdateStoreSyncSettings();

    return {
        toggle: (storeId: string, enabled: boolean) =>
            updateSettings.mutate({
                storeId,
                settings: { auto_sync_enabled: enabled },
            }),
        isPending: updateSettings.isPending,
    };
}
