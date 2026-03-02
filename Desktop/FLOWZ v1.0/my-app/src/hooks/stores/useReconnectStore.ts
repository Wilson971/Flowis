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
                // Get store with its connection_id
                const { data: store } = await supabase
                    .from('stores')
                    .select('id, connection_id, tenant_id')
                    .eq('id', storeId)
                    .single();

                if (!store) throw new Error('Store not found');

                if (store.connection_id) {
                    // Update existing connection
                    const { error: connError } = await supabase
                        .from('platform_connections')
                        .update({
                            credentials_encrypted: credentials,
                            connection_health: 'unknown',
                        })
                        .eq('id', store.connection_id);

                    if (connError) throw connError;
                } else {
                    // No connection exists yet — create one and link it
                    const { data: newConn, error: connError } = await supabase
                        .from('platform_connections')
                        .insert({
                            tenant_id: store.tenant_id,
                            platform: 'woocommerce',
                            credentials_encrypted: credentials,
                            connection_health: 'unknown',
                        })
                        .select('id')
                        .single();

                    if (connError) throw connError;

                    // Link connection to store
                    const { error: linkError } = await supabase
                        .from('stores')
                        .update({ connection_id: newConn.id })
                        .eq('id', storeId);

                    if (linkError) throw linkError;
                }

                // Reactivate store
                const { error: storeError } = await supabase
                    .from('stores')
                    .update({
                        active: true,
                        connection_status: 'connected',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', storeId);

                if (storeError) throw storeError;

                return { success: true };
            }
        },
        onSuccess: () => {
            toast.success('Identifiants mis à jour', {
                description: 'Les clés API WooCommerce ont été enregistrées.',
            });
            queryClient.invalidateQueries({ queryKey: ['stores'] });
        },
        onError: (error: Error) => {
            toast.error('Erreur de mise à jour', {
                description: error.message || 'Impossible de mettre à jour les identifiants',
            });
        },
    });
}
