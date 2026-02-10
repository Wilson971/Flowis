/**
 * useReconnectStore - Hook pour reconnecter une boutique
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { ReconnectStoreParams } from '@/types/store';

export function useReconnectStore() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ storeId, credentials }: ReconnectStoreParams) => {
            // Try edge function first
            try {
                const { data, error } = await supabase.functions.invoke('reconnect-store', {
                    body: { store_id: storeId, credentials },
                });

                if (error) throw error;
                if (!data.success) throw new Error(data.error || 'Failed to reconnect store');

                return data;
            } catch {
                // Fallback: Update credentials directly
                const { data: store } = await supabase
                    .from('stores')
                    .select('connection_id')
                    .eq('id', storeId)
                    .single();

                if (!store?.connection_id) {
                    throw new Error('No connection found for this store');
                }

                // Update connection credentials
                const { error: connError } = await supabase
                    .from('platform_connections')
                    .update({
                        credentials_encrypted: credentials,
                        connection_health: 'unknown',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', store.connection_id);

                if (connError) throw connError;

                // Reactivate store
                const { error: storeError } = await supabase
                    .from('stores')
                    .update({
                        active: true,
                        status: 'active',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', storeId);

                if (storeError) throw storeError;

                return { success: true };
            }
        },
        onSuccess: () => {
            toast.success('Boutique reconnectée', {
                description: 'Les synchronisations sont de nouveau actives.',
            });
            queryClient.invalidateQueries({ queryKey: ['stores'] });
        },
        onError: (error: Error) => {
            toast.error('Erreur de reconnexion', {
                description: error.message || 'Impossible de reconnecter la boutique',
            });
        },
    });
}
