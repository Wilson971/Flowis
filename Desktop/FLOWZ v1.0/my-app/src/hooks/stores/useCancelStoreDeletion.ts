/**
 * useCancelStoreDeletion - Hook pour annuler la suppression planifiée d'une boutique
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function useCancelStoreDeletion() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (storeId: string) => {
            // Try edge function first
            try {
                const { data, error } = await supabase.functions.invoke('cancel-store-deletion', {
                    body: { store_id: storeId },
                });

                if (error) throw error;
                if (!data.success) throw new Error(data.error || 'Failed to cancel deletion');

                return data;
            } catch {
                // Fallback: Cancel deletion directly
                const { error } = await supabase
                    .from('stores')
                    .update({
                        status: 'active',
                        active: true,
                        deletion_scheduled_at: null,
                        deletion_execute_at: null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', storeId);

                if (error) throw error;

                return { success: true };
            }
        },
        onSuccess: () => {
            toast.success('Suppression annulée', {
                description: 'La boutique ne sera pas supprimée.',
            });
            queryClient.invalidateQueries({ queryKey: ['stores'] });
        },
        onError: (error: Error) => {
            toast.error('Erreur', {
                description: error.message || 'Impossible d\'annuler la suppression',
            });
        },
    });
}
