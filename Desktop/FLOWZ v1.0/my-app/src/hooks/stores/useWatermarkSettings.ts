/**
 * useWatermarkSettings - Hook pour gérer les paramètres de watermark d'une boutique
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { WatermarkSettings, WatermarkPosition } from '@/types/store';

const DEFAULT_WATERMARK_SETTINGS: WatermarkSettings = {
    enabled: false,
    image_url: null,
    text: null,
    position: 'bottom-right',
    opacity: 80,
    size: 20,
    padding: 10,
};

/**
 * Hook to get watermark settings for a store
 */
export function useWatermarkSettings(storeId: string | null) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['watermark-settings', storeId],
        queryFn: async (): Promise<WatermarkSettings> => {
            if (!storeId) return DEFAULT_WATERMARK_SETTINGS;

            const { data, error } = await supabase
                .from('stores')
                .select('metadata')
                .eq('id', storeId)
                .single();

            if (error) throw error;

            const metadata = data?.metadata as Record<string, unknown> | null;
            const watermarkSettings = metadata?.watermark_settings as Partial<WatermarkSettings> | undefined;

            return {
                ...DEFAULT_WATERMARK_SETTINGS,
                ...watermarkSettings,
            };
        },
        enabled: !!storeId,
    });
}

/**
 * Hook to update watermark settings for a store
 */
export function useUpdateWatermarkSettings() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({
            storeId,
            settings,
        }: {
            storeId: string;
            settings: Partial<WatermarkSettings>;
        }) => {
            // Get current metadata
            const { data: store, error: fetchError } = await supabase
                .from('stores')
                .select('metadata')
                .eq('id', storeId)
                .single();

            if (fetchError) throw fetchError;

            const currentMetadata = (store?.metadata as Record<string, unknown>) || {};
            const currentWatermark = (currentMetadata.watermark_settings as Partial<WatermarkSettings>) || {};

            // Merge settings
            const newMetadata = {
                ...currentMetadata,
                watermark_settings: {
                    ...DEFAULT_WATERMARK_SETTINGS,
                    ...currentWatermark,
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

            return newMetadata.watermark_settings as WatermarkSettings;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['watermark-settings', variables.storeId] });
            queryClient.invalidateQueries({ queryKey: ['store', variables.storeId] });
            toast.success('Paramètres de watermark mis à jour');
        },
        onError: (error: Error) => {
            toast.error('Erreur de mise à jour', {
                description: error.message,
            });
        },
    });
}

/**
 * Hook to toggle watermark quickly
 */
export function useToggleWatermark() {
    const updateSettings = useUpdateWatermarkSettings();

    return {
        toggle: (storeId: string, enabled: boolean) =>
            updateSettings.mutate({
                storeId,
                settings: { enabled },
            }),
        isPending: updateSettings.isPending,
    };
}

/**
 * Hook to upload watermark image
 */
export function useUploadWatermarkImage() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({
            storeId,
            file,
        }: {
            storeId: string;
            file: File;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${storeId}/watermark_${Date.now()}.${fileExt}`;
            const filePath = `watermarks/${fileName}`;

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('store-assets')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('store-assets')
                .getPublicUrl(filePath);

            // Update watermark settings with new image URL
            const { data: store, error: fetchError } = await supabase
                .from('stores')
                .select('metadata')
                .eq('id', storeId)
                .single();

            if (fetchError) throw fetchError;

            const currentMetadata = (store?.metadata as Record<string, unknown>) || {};
            const currentWatermark = (currentMetadata.watermark_settings as Partial<WatermarkSettings>) || {};

            const newMetadata = {
                ...currentMetadata,
                watermark_settings: {
                    ...DEFAULT_WATERMARK_SETTINGS,
                    ...currentWatermark,
                    image_url: publicUrl,
                },
            };

            const { error: updateError } = await supabase
                .from('stores')
                .update({
                    metadata: newMetadata,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', storeId);

            if (updateError) throw updateError;

            return publicUrl;
        },
        onSuccess: (url, variables) => {
            queryClient.invalidateQueries({ queryKey: ['watermark-settings', variables.storeId] });
            toast.success('Image de watermark uploadée');
        },
        onError: (error: Error) => {
            toast.error('Erreur d\'upload', {
                description: error.message,
            });
        },
    });
}

// Position grid labels
export const WATERMARK_POSITIONS: { value: WatermarkPosition; label: string }[] = [
    { value: 'top-left', label: 'Haut gauche' },
    { value: 'top-center', label: 'Haut centre' },
    { value: 'top-right', label: 'Haut droite' },
    { value: 'center-left', label: 'Centre gauche' },
    { value: 'center', label: 'Centre' },
    { value: 'center-right', label: 'Centre droite' },
    { value: 'bottom-left', label: 'Bas gauche' },
    { value: 'bottom-center', label: 'Bas centre' },
    { value: 'bottom-right', label: 'Bas droite' },
];
