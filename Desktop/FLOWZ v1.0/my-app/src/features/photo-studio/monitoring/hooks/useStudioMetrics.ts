import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { StudioStats } from '../types'

export function useStudioMetrics(from: Date, to: Date) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['studio-metrics', from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase.rpc('get_studio_stats', {
        p_tenant_id: user.id,
        p_from: from.toISOString().slice(0, 10),
        p_to: to.toISOString().slice(0, 10),
      })
      if (error) throw error
      return data as StudioStats
    },
    staleTime: 60_000,
  })
}
