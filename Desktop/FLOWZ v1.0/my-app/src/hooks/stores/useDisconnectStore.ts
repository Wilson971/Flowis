/**
 * useDisconnectStore - Hook pour déconnecter une boutique
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { DisconnectStoreParams } from '@/types/store';

export function useDisconnectStore() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ storeId, force = false }: DisconnectStoreParams) => {
            // Try edge function first
            try {
                const { data, error } = await supabase.functions.invoke('disconnect-store', {
                    body: { store_id: storeId, force },
                });

                if (error) throw error;
                if (!data.success) throw new Error(data.error || 'Failed to disconnect store');

                return data;
            } catch {
                // Fallback: Update store status directly
                const { error } = await supabase
                    .from('stores')
                    .update({
                        active: false,
                        status: 'disconnected',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', storeId);

                if (error) throw error;

                // Update connection health
                const { data: store } = await supabase
                    .from('stores')
                    .select('connection_id')
                    .eq('id', storeId)
                    .single();

                if (store?.connection_id) {
                    await supabase
                        .from('platform_connections')
                        .update({
                            connection_health: 'unknown',
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', store.connection_id);
                }

                return { success: true };
            }
        },
        onSuccess: () => {
            toast.success('Boutique déconnectée', {
                description: 'Les synchronisations sont désactivées jusqu\'à reconnexion.',
            });
            queryClient.invalidateQueries({ queryKey: ['stores'] });
        },
        onError: (error: Error) => {
            // Handle special case of active jobs
            if (error.message.includes('active_jobs_running')) {
                toast.error('Synchronisations en cours', {
                    description: 'Des synchronisations sont en cours. Attendez leur fin ou forcez la déconnexion.',
                });
            } else {
                toast.error('Erreur de déconnexion', {
                    description: error.message || 'Impossible de déconnecter la boutique',
                });
            }
        },
    });
}
