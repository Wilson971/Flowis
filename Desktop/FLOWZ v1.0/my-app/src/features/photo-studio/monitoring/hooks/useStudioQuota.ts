import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { StudioQuota } from '../types'

export function useStudioQuota() {
  const supabase = createClient()
  const currentMonth = new Date().toISOString().slice(0, 7) + '-01'

  const { data: quota, isLoading } = useQuery({
    queryKey: ['studio-quota', currentMonth],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data } = await supabase
        .from('studio_quotas')
        .select('generations_used, generations_limit, cost_usd, month')
        .eq('tenant_id', user.id).eq('month', currentMonth).single()
      return (data as StudioQuota) ?? {
        generations_used: 0, generations_limit: 100, cost_usd: 0, month: currentMonth,
      }
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const usagePercent = quota ? (quota.generations_used / quota.generations_limit) * 100 : 0
  const isNearLimit = usagePercent >= 80
  const isQuotaExceeded = quota ? quota.generations_used >= quota.generations_limit : false

  return { quota, isLoading, usagePercent, isNearLimit, isQuotaExceeded }
}
