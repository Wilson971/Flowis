/**
 * useProduct - Hook pour récupérer un produit unique
 */
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Product } from '@/types/product';

export function useProduct(productId: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['product', productId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (error) throw error;
            return data as Product;
        },
        enabled: !!productId
    });
}
