/**
 * useStores - Hook principal pour la gestion des boutiques
 *
 * Fournit:
 * - useStores() - Liste des boutiques
 * - useStore(id) - Boutique par ID
 * - useActiveStore() - Boutique active
 * - useCreateStore() - Créer une boutique
 * - useUpdateStore() - Modifier une boutique
 * - useDeleteStore() - Supprimer une boutique
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type {
    Store,
    CreateStoreParams,
    UpdateStoreParams,
} from '@/types/store';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch all stores for the current user
 */
export function useStores() {
    const supabase = createClient();

    return useQuery({
        queryKey: ['stores'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            const { data, error } = await supabase
                .from('stores')
                .select(`
                    *,
                    platform_connections(
                        id,
                        shop_url,
                        platform,
                        credentials_encrypted,
                        connection_health,
                        last_heartbeat_at,
                        heartbeat_error,
                        last_sync_at
                    )
                `)
                .eq('tenant_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Normalize structure
            return (data || []).map(store => {
                const connection = Array.isArray(store.platform_connections)
                    ? store.platform_connections[0]
                    : store.platform_connections;

                let shopUrl = connection?.shop_url;
                if (!shopUrl && connection?.credentials_encrypted) {
                    const creds = connection.credentials_encrypted as Record<string, unknown>;
                    shopUrl = creds.shop_url as string;
                }

                return {
                    ...store,
                    platform_connections: connection ? {
                        ...connection,
                        shop_url: shopUrl || connection.shop_url
                    } : null
                } as Store;
            });
        },
    });
}

/**
 * Fetch a single store by ID
 */
export function useStore(storeId: string | null) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['store', storeId],
        queryFn: async () => {
            if (!storeId) return null;

            const { data, error } = await supabase
                .from('stores')
                .select(`
                    *,
                    platform_connections(
                        id,
                        shop_url,
                        platform,
                        credentials_encrypted,
                        connection_health,
                        last_heartbeat_at,
                        last_sync_at
                    )
                `)
                .eq('id', storeId)
                .single();

            if (error) throw error;

            const connection = Array.isArray(data.platform_connections)
                ? data.platform_connections[0]
                : data.platform_connections;

            return {
                ...data,
                platform_connections: connection
            } as Store;
        },
        enabled: !!storeId,
    });
}

/**
 * Fetch the active store (if any)
 */
export function useActiveStore() {
    const supabase = createClient();

    return useQuery({
        queryKey: ['active-store'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('stores')
                .select('*')
                .eq('active', true)
                .maybeSingle();

            if (error) throw error;
            return data as Store | null;
        },
    });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new store with platform connection
 */
export function useCreateStore() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (params: CreateStoreParams) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            // Try to use setup-store edge function if available
            try {
                const { data, error } = await supabase.functions.invoke('setup-store', {
                    body: {
                        name: params.name,
                        platform: params.platform,
                        shop_url: params.shop_url,
                        credentials: params.credentials,
                        description: params.description,
                    },
                });

                if (error) throw error;
                if (!data.success) throw new Error(data.error || 'Failed to create store');

                return data.store as Store;
            } catch {
                // Fallback: Create directly in database
                // 1. Create platform connection
                const { data: connection, error: connError } = await supabase
                    .from('platform_connections')
                    .insert({
                        tenant_id: user.id,
                        platform: params.platform,
                        shop_url: params.shop_url,
                        credentials_encrypted: params.credentials,
                        connection_health: 'unknown',
                    })
                    .select()
                    .single();

                if (connError) throw connError;

                // 2. Create store
                const { data: store, error: storeError } = await supabase
                    .from('stores')
                    .insert({
                        tenant_id: user.id,
                        name: params.name,
                        platform: params.platform,
                        description: params.description,
                        connection_id: connection.id,
                        active: true,
                    })
                    .select()
                    .single();

                if (storeError) {
                    // Cleanup connection on store creation failure
                    await supabase.from('platform_connections').delete().eq('id', connection.id);
                    throw storeError;
                }

                return store as Store;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stores'] });
            toast.success('Boutique créée', {
                description: 'Votre boutique a été créée avec succès',
            });
        },
        onError: (error: Error) => {
            toast.error('Erreur de création', {
                description: error.message,
            });
        },
    });
}

/**
 * Update an existing store
 */
export function useUpdateStore() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: UpdateStoreParams) => {
            const { data, error } = await supabase
                .from('stores')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Store;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['stores'] });
            queryClient.invalidateQueries({ queryKey: ['store', data.id] });
            queryClient.invalidateQueries({ queryKey: ['active-store'] });
            toast.success('Boutique mise à jour');
        },
        onError: (error: Error) => {
            toast.error('Erreur de mise à jour', {
                description: error.message,
            });
        },
    });
}

/**
 * Delete a store immediately (use with caution)
 */
export function useDeleteStore() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (storeId: string) => {
            // Get store to find connection_id
            const { data: store } = await supabase
                .from('stores')
                .select('connection_id')
                .eq('id', storeId)
                .single();

            // Delete store (cascade should handle related data)
            const { error } = await supabase
                .from('stores')
                .delete()
                .eq('id', storeId);

            if (error) throw error;

            // Also delete connection if exists
            if (store?.connection_id) {
                await supabase
                    .from('platform_connections')
                    .delete()
                    .eq('id', store.connection_id);
            }

            return storeId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stores'] });
            toast.success('Boutique supprimée');
        },
        onError: (error: Error) => {
            toast.error('Erreur de suppression', {
                description: error.message,
            });
        },
    });
}
