/**
 * useSyncQueueStatus - Real-time sync queue monitoring
 *
 * Subscribes to sync_queue changes and provides live status updates.
 */

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export interface SyncQueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  deadLetter: number;
  total: number;
}

export interface SyncQueueJob {
  id: string;
  product_id: string;
  store_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter';
  direction: 'push' | 'pull';
  dirty_fields: string[];
  attempt_count: number;
  max_attempts: number;
  last_error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

// ============================================================================
// HOOK: useSyncQueueStats
// ============================================================================

/**
 * Get sync queue statistics for a store (or all stores).
 */
export function useSyncQueueStats(storeId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['sync-queue-stats', storeId],
    queryFn: async (): Promise<SyncQueueStats> => {
      let query = supabase
        .from('sync_queue')
        .select('status', { count: 'exact' });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Count by status
      const stats: SyncQueueStats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        deadLetter: 0,
        total: 0,
      };

      if (data) {
        for (const item of data as { status: string }[]) {
          stats.total++;
          switch (item.status) {
            case 'pending':
              stats.pending++;
              break;
            case 'processing':
              stats.processing++;
              break;
            case 'completed':
              stats.completed++;
              break;
            case 'failed':
              stats.failed++;
              break;
            case 'dead_letter':
              stats.deadLetter++;
              break;
          }
        }
      }

      return stats;
    },
    refetchInterval: (query) => {
      if (typeof document !== 'undefined' && document.hidden) return false;
      const data = query.state.data as SyncQueueStats | undefined;
      const hasActive = (data?.pending ?? 0) > 0 || (data?.processing ?? 0) > 0;
      return hasActive ? 5000 : false;
    },
  });
}

// ============================================================================
// HOOK: useSyncQueueRealtime
// ============================================================================

/**
 * Subscribe to real-time sync queue changes.
 */
export function useSyncQueueRealtime(storeId?: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const handleChange = useCallback(() => {
    // Invalidate queries on any change
    queryClient.invalidateQueries({ queryKey: ['sync-queue-stats', storeId] });
    queryClient.invalidateQueries({ queryKey: ['sync-queue-jobs', storeId] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }, [queryClient, storeId]);

  useEffect(() => {
    // Subscribe to sync_queue changes
    const newChannel = supabase
      .channel('sync-queue-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sync_queue',
          ...(storeId ? { filter: `store_id=eq.${storeId}` } : {}),
        },
        handleChange
      )
      .subscribe();

    setChannel(newChannel);

    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel);
      }
    };
  }, [supabase, storeId, handleChange]);

  return { channel };
}

// ============================================================================
// HOOK: useSyncQueueJobs
// ============================================================================

/**
 * Get active sync queue jobs.
 */
export function useSyncQueueJobs(storeId?: string, statusFilter?: string[]) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['sync-queue-jobs', storeId, statusFilter],
    queryFn: async (): Promise<SyncQueueJob[]> => {
      let query = supabase
        .from('sync_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      if (statusFilter && statusFilter.length > 0) {
        query = query.in('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []) as SyncQueueJob[];
    },
    refetchInterval: (query) => {
      if (typeof document !== 'undefined' && document.hidden) return false;
      const data = query.state.data as SyncQueueJob[] | undefined;
      const hasActive = data?.some(j => j.status === 'pending' || j.status === 'processing');
      return hasActive ? 3000 : false;
    },
  });
}

// ============================================================================
// HOOK: usePendingSyncCount
// ============================================================================

/**
 * Get count of pending sync jobs for badge display.
 */
export function usePendingSyncCount(storeId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['pending-sync-count', storeId],
    queryFn: async (): Promise<number> => {
      let query = supabase
        .from('sync_queue')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'processing']);

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { count, error } = await query;

      if (error) {
        return 0;
      }

      return count || 0;
    },
    refetchInterval: (query) => {
      if (typeof document !== 'undefined' && document.hidden) return false;
      const count = query.state.data as number | undefined;
      return (count ?? 0) > 0 ? 5000 : false;
    },
  });
}
