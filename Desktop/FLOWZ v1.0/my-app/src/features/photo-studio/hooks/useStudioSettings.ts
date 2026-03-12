import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface StudioSettings {
  quality: 'low' | 'medium' | 'high'
  temperature: number
  variants: number
  autoClassify: boolean
  presetAutoSelect: boolean
  confidenceThreshold: number
  monthlyQuota: number
  alertThreshold: number
  exportFormat: 'png' | 'jpg' | 'webp'
  exportResolution: number
  includeMetadata: boolean
}

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  quality: 'high',
  temperature: 0.7,
  variants: 3,
  autoClassify: true,
  presetAutoSelect: true,
  confidenceThreshold: 0.6,
  monthlyQuota: 100,
  alertThreshold: 0.8,
  exportFormat: 'png',
  exportResolution: 2048,
  includeMetadata: true,
}

export function useStudioSettings() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: settings = DEFAULT_STUDIO_SETTINGS, isLoading } = useQuery({
    queryKey: ['studio-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data } = await supabase
        .from('profiles')
        .select('studio_settings')
        .eq('id', user.id)
        .single()
      return {
        ...DEFAULT_STUDIO_SETTINGS,
        ...(data?.studio_settings as Partial<StudioSettings> | null),
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<StudioSettings>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const merged = { ...settings, ...updates }
      const { error } = await supabase
        .from('profiles')
        .update({ studio_settings: merged as unknown as Record<string, unknown> })
        .eq('id', user.id)
      if (error) throw error
      return merged
    },
    onSuccess: (merged) => {
      queryClient.setQueryData(['studio-settings'], merged)
    },
  })

  return { settings, isLoading, updateSettings }
}
