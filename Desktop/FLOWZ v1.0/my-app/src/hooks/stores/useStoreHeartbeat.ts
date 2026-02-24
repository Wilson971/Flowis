/**
 * useStoreHeartbeat - Hook pour vérifier la santé des connexions boutiques
 *
 * Fournit:
 * - useStoreHeartbeat() - Mutation pour tester la connexion
 * - useConnectionHealth(storeId) - État de santé d'une boutique
 * - useHeartbeatLogs(storeId) - Historique des heartbeats
 * - useCheckAllStoresHealth() - Vérifier toutes les boutiques
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type {
    ConnectionHealth,
    HeartbeatResult,
    HeartbeatResponse,
    HeartbeatLog,
} from '@/types/store';

// ============================================================================
// HEARTBEAT MUTATION
// ============================================================================

/**
 * Hook to check the connection health of a store
 */
export function useStoreHeartbeat() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (storeId?: string): Promise<HeartbeatResponse> => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                throw new Error('Non authentifié');
            }

            const response = await supabase.functions.invoke('store-heartbeat', {
                body: { store_id: storeId },
            });

            if (response.error) {
                throw new Error(response.error.message || 'Erreur lors du test de connexion');
            }

            return response.data as HeartbeatResponse;
        },
        onSuccess: (data, storeId) => {
            // Invalidate stores query to refresh connection health status
            queryClient.invalidateQueries({ queryKey: ['stores'] });
            if (storeId) {
                queryClient.invalidateQueries({ queryKey: ['connection-health', storeId] });
            }

            // Show toast based on results
            if (data.unhealthy_count > 0) {
                toast.error('Problème de connexion détecté', {
                    description: `${data.unhealthy_count} boutique(s) avec des problèmes de connexion.`,
                });
            } else if (data.healthy_count > 0) {
                toast.success('Connexion vérifiée ✓', {
                    description: storeId
                        ? `La connexion est fonctionnelle (${data.results[0]?.response_time_ms}ms)`
                        : `${data.healthy_count} boutique(s) connectée(s) correctement.`,
                });
            }
        },
        onError: (error: Error) => {
            toast.error('Erreur de test', {
                description: error.message,
            });
        },
    });
}

// ============================================================================
// CONNECTION HEALTH QUERY
// ============================================================================

/**
 * Hook to get the connection health status for a specific store
 */
export function useConnectionHealth(storeId: string | null | undefined) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['connection-health', storeId],
        queryFn: async () => {
            if (!storeId) return null;

            const { data, error } = await supabase
                .from('stores')
                .select(`
                    id,
                    platform_connections(
                        connection_health,
                        last_heartbeat_at,
                        heartbeat_error
                    )
                `)
                .eq('id', storeId)
                .single();

            if (error) throw error;

            const connection = Array.isArray(data.platform_connections)
                ? data.platform_connections[0]
                : data.platform_connections;

            return {
                health: (connection?.connection_health as ConnectionHealth) || 'unknown',
                lastHeartbeat: connection?.last_heartbeat_at as string | null,
                error: connection?.heartbeat_error as string | null,
            };
        },
        enabled: !!storeId,
        staleTime: STALE_TIMES.STATIC,
    });
}

// ============================================================================
// HEARTBEAT LOGS QUERY
// ============================================================================

/**
 * Hook to get heartbeat history logs for a store
 */
export function useHeartbeatLogs(storeId: string | null | undefined, limit = 10) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['heartbeat-logs', storeId, limit],
        queryFn: async () => {
            if (!storeId) return [];

            const { data, error } = await supabase
                .from('heartbeat_logs')
                .select('*')
                .eq('store_id', storeId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                // Table might not exist, return empty array
                console.warn('Heartbeat logs table not found:', error.message);
                return [];
            }
            return data as HeartbeatLog[];
        },
        enabled: !!storeId,
        staleTime: STALE_TIMES.DETAIL,
    });
}

// ============================================================================
// CHECK ALL STORES HEALTH
// ============================================================================

/**
 * Hook to check all stores' health at once
 */
export function useCheckAllStoresHealth() {
    const heartbeat = useStoreHeartbeat();

    return {
        checkAll: () => heartbeat.mutate(undefined),
        isChecking: heartbeat.isPending,
        results: heartbeat.data,
        error: heartbeat.error,
    };
}

// ============================================================================
// HEALTH STATUS HELPERS
// ============================================================================

export function getHealthColor(health: ConnectionHealth): string {
    switch (health) {
        case 'healthy':
            return 'text-green-500';
        case 'unhealthy':
            return 'text-red-500';
        default:
            return 'text-gray-400';
    }
}

export function getHealthBgColor(health: ConnectionHealth): string {
    switch (health) {
        case 'healthy':
            return 'bg-green-100 dark:bg-green-900/30';
        case 'unhealthy':
            return 'bg-red-100 dark:bg-red-900/30';
        default:
            return 'bg-gray-100 dark:bg-gray-900/30';
    }
}

export function getHealthLabel(health: ConnectionHealth): string {
    switch (health) {
        case 'healthy':
            return 'Connecté';
        case 'unhealthy':
            return 'Problème de connexion';
        default:
            return 'Non vérifié';
    }
}
