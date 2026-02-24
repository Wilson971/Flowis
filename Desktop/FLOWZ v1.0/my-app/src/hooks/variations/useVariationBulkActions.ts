/**
 * useVariationBulkActions - Hook pour les actions de masse sur les variations
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface BulkActionParams {
    variationIds: string[];
    action: 'update_price' | 'update_stock' | 'delete' | 'toggle_status';
    value?: any;
    productId: string; // Parent ID for cache invalidation
}

export function useVariationBulkActions() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    const bulkUpdate = useMutation({
        mutationFn: async ({ variationIds, action, value, productId }: BulkActionParams) => {
            if (!variationIds.length) return;

            let updates: any = {};

            switch (action) {
                case 'update_price':
                    // increase by %, decrease by %, or set fixed
                    // value format: { type: 'percentage' | 'fixed', amount: number, operation: 'increase' | 'decrease' | 'set' }
                    if (value.operation === 'set') {
                        updates = { price: value.amount };
                    }
                    // Note: Percentage updates require reading current values first or using SQL logic not easily available via simple JS client update
                    // For simplicity, we assume 'set' for now or handle complex logic in Edge Function
                    break;
                case 'update_stock':
                    updates = { stock_quantity: value };
                    break;
                case 'toggle_status':
                    updates = { status: value }; // 'publish' | 'private'
                    break;
                case 'delete':
                    // Handled separately
                    break;
            }

            if (action === 'delete') {
                const { error } = await supabase
                    .from('product_variations') // Assuming table exists or will be created
                    .delete()
                    .in('id', variationIds);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('product_variations')
                    .update(updates)
                    .in('id', variationIds);
                if (error) throw error;
            }

            return { productId };
        },
        onSuccess: (data) => {
            if (data?.productId) {
                queryClient.invalidateQueries({ queryKey: ['product-variations', data.productId] });
            }
            toast.success('Actions appliquées avec succès');
        },
        onError: (error) => {
            toast.error('Erreur lors de l\'application des actions');
        }
    });

    return {
        bulkUpdate
    };
}
