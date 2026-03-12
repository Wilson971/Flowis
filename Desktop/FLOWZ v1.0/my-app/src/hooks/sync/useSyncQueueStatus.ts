/**
 * useSyncQueueStatus - Real-time sync queue monitoring
 *
 * Subscribes to sync_queue changes and provides live status updates.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
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
 * Uses separate count queries per status to avoid iterating data rows.
 */
export function useSyncQueueStats(storeId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['sync-queue-stats', storeId],
    queryFn: async (): Promise<SyncQueueStats> => {
      const statuses = ['pending', 'processing', 'completed', 'failed', 'dead_letter'] as const;

      const counts = await Promise.all(
        statuses.map(async (status) => {
          let query = supabase
            .from('sync_queue')
            .select('id', { count: 'exact', head: true })
            .eq('status', status);

          if (storeId) {
            query = query.eq('store_id', storeId);
          }

          const { count, error } = await query;
          if (error) return 0;
          return count ?? 0;
        })
      );

      const [pending, processing, completed, failed, deadLetter] = counts;

      return {
        pending,
        processing,
        completed,
        failed,
        deadLetter,
        total: pending + processing + completed + failed + deadLetter,
      };
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
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['sync-queue-stats', storeId] });
    queryClient.invalidateQueries({ queryKey: ['sync-queue-jobs', storeId] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }, [queryClient, storeId]);

  useEffect(() => {
    const newChannel = supabase
      .channel(`sync-queue-changes:${storeId ?? 'all'}`)
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
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          // Silently ignore channel errors
        }
      });

    channelRef.current = newChannel;

    return () => {
      newChannel.unsubscribe();
      supabase.removeChannel(newChannel);
      channelRef.current = null;
    };
  }, [supabase, storeId, handleChange]);

  return { channel: channelRef.current };
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
