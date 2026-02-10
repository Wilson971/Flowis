/**
 * useProductRealtime - Hook pour les mises à jour temps réel de produits
 */

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

interface ProductPayload {
    id: string;
    store_id: string;
    status?: string;
    updated_at?: string;
    [key: string]: unknown;
}

type ProductChangeEvent = RealtimePostgresChangesPayload<ProductPayload>;

interface UseProductRealtimeOptions {
    storeId?: string;
    productId?: string;
    onUpdate?: (payload: ProductChangeEvent) => void;
    onInsert?: (payload: ProductChangeEvent) => void;
    onDelete?: (payload: ProductChangeEvent) => void;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook pour écouter les changements sur un produit spécifique
 */
export function useProductRealtime({
    productId,
    onUpdate,
    onInsert,
    onDelete,
}: UseProductRealtimeOptions = {}) {
    const queryClient = useQueryClient();
    const supabase = createClient();

    const handleChange = useCallback(
        (payload: ProductChangeEvent) => {
            const eventType = payload.eventType;
            const record = payload.new as ProductPayload | undefined;
            const oldRecord = payload.old as ProductPayload | undefined;

            console.log('[useProductRealtime] Event:', eventType, record?.id || oldRecord?.id);

            switch (eventType) {
                case 'UPDATE':
                    if (record?.id) {
                        queryClient.invalidateQueries({ queryKey: ['product', record.id] });
                        queryClient.invalidateQueries({ queryKey: ['product-content', record.id] });
                    }
                    onUpdate?.(payload);
                    break;

                case 'INSERT':
                    queryClient.invalidateQueries({ queryKey: ['products'] });
                    queryClient.invalidateQueries({ queryKey: ['product-stats'] });
                    onInsert?.(payload);
                    break;

                case 'DELETE':
                    if (oldRecord?.id) {
                        queryClient.removeQueries({ queryKey: ['product', oldRecord.id] });
                        queryClient.removeQueries({ queryKey: ['product-content', oldRecord.id] });
                    }
                    queryClient.invalidateQueries({ queryKey: ['products'] });
                    queryClient.invalidateQueries({ queryKey: ['product-stats'] });
                    onDelete?.(payload);
                    break;
            }
        },
        [queryClient, onUpdate, onInsert, onDelete]
    );

    useEffect(() => {
        if (!productId) return;

        const channel = supabase
            .channel(`product-${productId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'products',
                    filter: `id=eq.${productId}`,
                },
                handleChange
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [productId, supabase, handleChange]);
}

/**
 * Hook pour écouter les changements sur tous les produits d'une boutique
 */
export function useProductListRealtime({
    storeId,
    onUpdate,
    onInsert,
    onDelete,
}: UseProductRealtimeOptions = {}) {
    const queryClient = useQueryClient();
    const supabase = createClient();

    const handleChange = useCallback(
        (payload: ProductChangeEvent) => {
            const eventType = payload.eventType;
            const record = payload.new as ProductPayload | undefined;

            console.log('[useProductListRealtime] Event:', eventType, record?.id);

            switch (eventType) {
                case 'UPDATE':
                    // Invalider la liste pour mise à jour
                    queryClient.invalidateQueries({ queryKey: ['products', storeId] });
                    onUpdate?.(payload);
                    break;

                case 'INSERT':
                    queryClient.invalidateQueries({ queryKey: ['products', storeId] });
                    queryClient.invalidateQueries({ queryKey: ['product-stats', storeId] });
                    onInsert?.(payload);
                    break;

                case 'DELETE':
                    queryClient.invalidateQueries({ queryKey: ['products', storeId] });
                    queryClient.invalidateQueries({ queryKey: ['product-stats', storeId] });
                    onDelete?.(payload);
                    break;
            }
        },
        [queryClient, storeId, onUpdate, onInsert, onDelete]
    );

    useEffect(() => {
        if (!storeId) return;

        const channel = supabase
            .channel(`products-store-${storeId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'products',
                    filter: `store_id=eq.${storeId}`,
                },
                handleChange
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [storeId, supabase, handleChange]);
}

/**
 * Hook pour écouter les changements SEO d'un produit
 */
export function useSeoAnalysisRealtime(productId?: string) {
    const queryClient = useQueryClient();
    const supabase = createClient();

    useEffect(() => {
        if (!productId) return;

        const channel = supabase
            .channel(`seo-${productId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'product_seo_analysis',
                    filter: `product_id=eq.${productId}`,
                },
                (payload) => {
                    console.log('[useSeoAnalysisRealtime] SEO update for:', productId);
                    queryClient.invalidateQueries({ queryKey: ['seo-analysis', productId] });
                    queryClient.invalidateQueries({ queryKey: ['product', productId] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [productId, supabase, queryClient]);
}

/**
 * Hook pour écouter les jobs studio d'un produit
 */
export function useStudioJobsRealtime(productId?: string) {
    const queryClient = useQueryClient();
    const supabase = createClient();

    useEffect(() => {
        if (!productId) return;

        const channel = supabase
            .channel(`studio-jobs-${productId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'studio_jobs',
                    filter: `product_id=eq.${productId}`,
                },
                (payload) => {
                    console.log('[useStudioJobsRealtime] Studio job update for:', productId);
                    queryClient.invalidateQueries({ queryKey: ['studio-jobs', productId] });
                    queryClient.invalidateQueries({ queryKey: ['product', productId] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [productId, supabase, queryClient]);
}

/**
 * Hook combiné pour toutes les subscriptions d'un produit
 */
export function useProductFullRealtime(productId?: string, storeId?: string) {
    useProductRealtime({ productId });
    useSeoAnalysisRealtime(productId);
    useStudioJobsRealtime(productId);
}
