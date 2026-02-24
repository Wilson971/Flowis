/**
 * useQuickUpdateProduct - Hook pour mise à jour partielle rapide
 *
 * Extracted from useProductSave.ts for single-responsibility.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { ContentData } from '@/types/productContent';
import type { ProductSavePayload } from './useProductSave';
import { computeDirtyFields } from './computeDirtyFields';

export function useQuickUpdateProduct() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({
            productId,
            field,
            value,
        }: {
            productId: string;
            field: keyof ProductSavePayload;
            value: unknown;
        }) => {
            // Récupérer et mettre à jour le working_content
            const { data: product } = await supabase
                .from('products')
                .select('working_content, store_snapshot_content')
                .eq('id', productId)
                .single();

            const working = (product?.working_content || {}) as ContentData;
            const snapshot = product?.store_snapshot_content as ContentData;

            const updatedWorking = { ...working, [field]: value };
            const dirtyFields = computeDirtyFields(updatedWorking, snapshot);

            // Defense-in-depth: scope update to authenticated user's tenant
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Authentication required');

            const { error } = await supabase
                .from('products')
                .update({
                    working_content: updatedWorking,
                    dirty_fields_content: dirtyFields,
                    working_content_updated_at: new Date().toISOString(),
                })
                .eq('id', productId)
                .eq('tenant_id', user.id);

            if (error) throw error;
            return { field, value };
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product-content', variables.productId] });
        },
    });
}
