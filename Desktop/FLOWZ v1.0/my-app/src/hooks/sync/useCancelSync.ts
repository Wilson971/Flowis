import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

/**
 * useCancelSync - Cancel pending sync queue jobs for specific products
 */
export function useCancelSync() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ product_ids }: { product_ids: string[] }) => {
            if (!product_ids.length) return { success: true, cancelled: 0 };

            // Cancel pending/processing jobs for these products
            const { data, error } = await supabase
                .from('sync_queue')
                .update({
                    status: 'cancelled' as string,
                    completed_at: new Date().toISOString(),
                })
                .in('product_id', product_ids)
                .in('status', ['pending', 'processing'])
                .select('id');

            if (error) throw new Error(`Failed to cancel sync: ${error.message}`);

            const cancelled = data?.length ?? 0;

            // Reset product sync_status back to 'synced'
            if (cancelled > 0) {
                await supabase
                    .from('products')
                    .update({ sync_status: 'synced' })
                    .in('id', product_ids)
                    .eq('sync_status', 'pending_push');
            }

            return { success: true, cancelled };
        },
        onSuccess: (result) => {
            if (result.cancelled > 0) {
                toast.info(`${result.cancelled} synchronisation(s) annulée(s)`);
                queryClient.invalidateQueries({ queryKey: ['sync-queue'] });
                queryClient.invalidateQueries({ queryKey: ['products'] });
            }
        },
        onError: (error: Error) => {
            toast.error('Erreur lors de l\'annulation', {
                description: error.message,
            });
        },
    });
}
