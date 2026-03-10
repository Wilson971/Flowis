/**
 * useStoreRealtime — Subscribe to live sync progress via Supabase Realtime
 *
 * Channel: `sync:{store_id}`
 * Payload: SyncProgressPayload
 *
 * Usage:
 *   const { progress, isActive } = useStoreRealtime(store.id)
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SyncProgressPayload } from '@/types/store'

interface UseStoreRealtimeReturn {
    progress: SyncProgressPayload | null
    isActive: boolean
    clearProgress: () => void
}

export function useStoreRealtime(storeId: string | null): UseStoreRealtimeReturn {
    const [progress, setProgress] = useState<SyncProgressPayload | null>(null)
    const [isActive, setIsActive] = useState(false)
    const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
    const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const supabase = createClient()

    const clearProgress = useCallback(() => {
        setProgress(null)
        setIsActive(false)
    }, [])

    useEffect(() => {
        if (!storeId) return

        const channelName = `sync:${storeId}`

        // Cleanup previous subscription
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current)
        }

        const channel = supabase
            .channel(channelName)
            .on('broadcast', { event: 'progress' }, ({ payload }) => {
                const data = payload as SyncProgressPayload

                setProgress(data)

                if (data.status === 'running') {
                    setIsActive(true)
                } else {
                    // Terminal state — keep progress visible briefly then clear
                    setIsActive(false)
                    if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
                    clearTimerRef.current = setTimeout(() => {
                        setProgress(null)
                        clearTimerRef.current = null
                    }, 3_000)
                }
            })
            .subscribe()

        channelRef.current = channel

        return () => {
            supabase.removeChannel(channel)
            channelRef.current = null
            if (clearTimerRef.current) {
                clearTimeout(clearTimerRef.current)
                clearTimerRef.current = null
            }
        }
    }, [storeId]) // eslint-disable-line react-hooks/exhaustive-deps

    return { progress, isActive, clearProgress }
}

/**
 * useStoreSyncJobStatus — Poll latest sync_job status for a store
 * Used for last-sync timestamp + badge on the card
 */
import { useQuery } from '@tanstack/react-query'
import { STALE_TIMES } from '@/lib/query-config'

export interface LatestSyncJob {
    id: string
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
    type: 'manual' | 'auto'
    entities: string[]
    started_at: string | null
    completed_at: string | null
    error_message: string | null
    synced_products: number
    synced_categories: number
    failed_items: number
}

export function useLatestSyncJob(storeId: string | null) {
    const supabase = createClient()

    return useQuery({
        queryKey: ['latest-sync-job', storeId],
        queryFn: async (): Promise<LatestSyncJob | null> => {
            if (!storeId) return null

            const { data, error } = await supabase
                .from('sync_jobs')
                .select(
                    'id, status, type, entities, started_at, completed_at, error_message, synced_products, synced_categories, failed_items'
                )
                .eq('store_id', storeId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (error) throw error
            return data as LatestSyncJob | null
        },
        enabled: !!storeId,
        staleTime: STALE_TIMES.DETAIL,
        refetchInterval: (query) => {
            // Poll every 3s if a sync is running, otherwise use staleTime
            const data = query.state.data as LatestSyncJob | null
            return data?.status === 'running' ? 3_000 : false
        },
    })
}
