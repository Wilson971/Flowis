/**
 * usePermanentDeleteStore - Hook pour supprimer définitivement une boutique
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function usePermanentDeleteStore() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (storeId: string) => {
            // Try edge function first
            try {
                const { data, error } = await supabase.functions.invoke('permanent-delete-store', {
                    body: { store_id: storeId },
                });

                if (error) throw error;
                if (!data.success) throw new Error(data.error || 'Failed to delete store');

                return data;
            } catch {
                // Fallback: Delete directly (cascade should handle related data)
                // Get connection_id first
                const { data: store } = await supabase
                    .from('stores')
                    .select('connection_id')
                    .eq('id', storeId)
                    .single();

                // Delete products first (to avoid FK issues)
                await supabase
                    .from('products')
                    .delete()
                    .eq('store_id', storeId);

                // Delete categories
                await supabase
                    .from('categories')
                    .delete()
                    .eq('store_id', storeId);

                // Delete sync_jobs
                await supabase
                    .from('sync_jobs')
                    .delete()
                    .eq('store_id', storeId);

                // Delete store
                const { error } = await supabase
                    .from('stores')
                    .delete()
                    .eq('id', storeId);

                if (error) throw error;

                // Delete connection
                if (store?.connection_id) {
                    await supabase
                        .from('platform_connections')
                        .delete()
                        .eq('id', store.connection_id);
                }

                return { success: true };
            }
        },
        onSuccess: () => {
            toast.success('Boutique supprimée définitivement', {
                description: 'Toutes les données associées ont été supprimées.',
            });
            queryClient.invalidateQueries({ queryKey: ['stores'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
        onError: (error: Error) => {
            toast.error('Erreur de suppression', {
                description: error.message || 'Impossible de supprimer la boutique',
            });
        },
    });
}
