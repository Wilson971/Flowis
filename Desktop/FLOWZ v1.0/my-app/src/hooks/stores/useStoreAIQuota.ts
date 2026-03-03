/**
 * useStoreAIQuota — Scope 5
 *
 * Retourne le quota IA mensuel d'une boutique :
 * - usage courant + limite
 * - % consommé
 * - répartition par feature (flowriter / photo_studio)
 * - date de reset
 */

import { useQuery } from '@tanstack/react-query'
import { STALE_TIMES } from '@/lib/query-config'
import { createClient } from '@/lib/supabase/client'
import type { StoreAIQuota, StoreAIQuotaByFeature } from '@/types/store'

function currentMonth(): string {
    return new Date().toISOString().slice(0, 7)
}

function nextMonthStart(): string {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString()
}

export function useStoreAIQuota(storeId: string | null) {
    const supabase = createClient()

    return useQuery({
        queryKey: ['store-ai-quota', storeId],
        queryFn: async (): Promise<StoreAIQuota | null> => {
            if (!storeId) return null

            const month = currentMonth()

            const [quotaResult, usageResult] = await Promise.all([
                // Current quota row
                supabase
                    .from('store_quotas')
                    .select('monthly_limit, current_usage, period_start, alert_80_sent, alert_95_sent')
                    .eq('store_id', storeId)
                    .maybeSingle(),

                // Usage breakdown by feature via RPC
                supabase.rpc('get_store_ai_usage', {
                    p_store_id: storeId,
                    p_month: month,
                }),
            ])

            const quota = quotaResult.data
            const used = quota?.current_usage ?? 0
            const limit = quota?.monthly_limit ?? 500
            const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0

            // Build per-feature breakdown
            const byFeature: StoreAIQuotaByFeature = { flowriter: 0, photo_studio: 0 }
            if (usageResult.data && Array.isArray(usageResult.data)) {
                for (const row of usageResult.data as Array<{ feature: string; credits_used: number }>) {
                    byFeature[row.feature] = Number(row.credits_used) || 0
                }
            }

            return {
                storeId,
                used,
                limit,
                percent,
                byFeature,
                periodStart: quota?.period_start ?? null,
                resetDate: nextMonthStart(),
                alert80Sent: quota?.alert_80_sent ?? false,
                alert95Sent: quota?.alert_95_sent ?? false,
            }
        },
        enabled: !!storeId,
        staleTime: STALE_TIMES.STATIC,
    })
}
