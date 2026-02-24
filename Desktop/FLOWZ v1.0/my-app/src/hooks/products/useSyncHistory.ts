/**
 * useSyncHistory - Hook pour récupérer l'historique de synchronisation d'un produit
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-config';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface SyncHistoryEntry {
    id: string;
    action: string;
    success: boolean;
    metadata: Record<string, unknown> | null;
    created_at: string;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Récupère les dernières entrées d'historique de sync pour un produit
 */
export function useSyncHistory(productId?: string, limit = 20) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['sync-history', productId, limit],
        queryFn: async (): Promise<SyncHistoryEntry[]> => {
            if (!productId) return [];

            const { data, error } = await supabase
                .from('sync_audit_log')
                .select('id, action, success, metadata, created_at')
                .contains('entity_ids', [productId])
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return (data || []) as SyncHistoryEntry[];
        },
        enabled: !!productId,
        staleTime: STALE_TIMES.DETAIL,
    });
}
