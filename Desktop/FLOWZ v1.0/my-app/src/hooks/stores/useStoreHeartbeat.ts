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
    HeartbeatLog,
} from '@/types/store';

// ============================================================================
// HEARTBEAT MUTATION
// ============================================================================

/**
 * Hook to check the connection health of a store
 */
interface HealthCheckResponse {
    success: boolean;
    health: ConnectionHealth;
    message: string;
    response_time_ms: number;
    store_name: string;
}

export function useStoreHeartbeat() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (storeId: string): Promise<HealthCheckResponse> => {
            const response = await fetch('/api/stores/health-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ store_id: storeId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erreur lors du test de connexion');
            }

            return data as HealthCheckResponse;
        },
        onSuccess: (data, storeId) => {
            // Invalidate stores query to refresh connection health status
            queryClient.invalidateQueries({ queryKey: ['stores'] });
            queryClient.invalidateQueries({ queryKey: ['connection-health', storeId] });

            if (data.health === 'healthy') {
                toast.success(`${data.store_name} — Connecté`, {
                    description: data.message,
                });
            } else {
                toast.error(`${data.store_name} — Hors ligne`, {
                    description: data.message,
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
// AUTO HEALTH CHECK — runs on mount + polls every 5 min
// ============================================================================

/**
 * Hook that checks health of all stores ONCE on page mount.
 * No polling — subsequent checks are manual via the "Tester maintenant" button.
 *
 * Why no polling:
 * - 5000 clients × ~7 stores × polling = hundreds of thousands of external API calls/hour
 * - WooCommerce/Shopify would rate-limit our users
 * - Health status rarely changes — a single check on page visit is enough
 *
 * Call this once in the Stores page.
 */
export function useAutoHealthCheck(storeIds: string[]) {
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: ['auto-health-check', ...storeIds],
        queryFn: async () => {
            if (!storeIds.length) return [];

            // Fire all health checks in parallel
            const results = await Promise.allSettled(
                storeIds.map(async (storeId) => {
                    const response = await fetch('/api/stores/health-check', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ store_id: storeId }),
                    });
                    const data = await response.json();
                    return { storeId, ...data } as HealthCheckResponse & { storeId: string };
                })
            );

            // Invalidate stores query so cards show fresh health status
            queryClient.invalidateQueries({ queryKey: ['stores'] });

            return results
                .filter((r): r is PromiseFulfilledResult<HealthCheckResponse & { storeId: string }> =>
                    r.status === 'fulfilled'
                )
                .map(r => r.value);
        },
        enabled: storeIds.length > 0,
        staleTime: 10 * 60 * 1000, // consider fresh for 10 min (no refetch if user navigates back quickly)
        refetchOnWindowFocus: false,
        refetchOnMount: 'always', // always check on page mount
    });
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
