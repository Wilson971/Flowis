/**
 * useWorkspace - Hook pour la gestion du workspace courant
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Workspace } from '@/types/workspace'

export function useWorkspace() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const workspaceQuery = useQuery({
    queryKey: ['workspace'],
    queryFn: async (): Promise<Workspace> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (error) throw error
      return data as Workspace
    },
  })

  const updateWorkspace = useMutation({
    mutationFn: async (updates: Partial<Omit<Workspace, 'id' | 'owner_id' | 'created_at'>>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('workspaces')
        .update(updates)
        .eq('owner_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace'] })
      toast.success('Workspace mis à jour')
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la mise à jour', {
        description: error.message,
      })
    },
  })

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const workspace = workspaceQuery.data
      if (!workspace) throw new Error('Workspace not found')

      const fileExt = file.name.split('.').pop()
      const filePath = `${workspace.id}/logo_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('workspace-assets')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('workspace-assets')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('workspaces')
        .update({ logo_url: publicUrl })
        .eq('id', workspace.id)

      if (updateError) throw updateError

      return publicUrl
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace'] })
      toast.success('Logo mis à jour')
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de l\'upload du logo', {
        description: error.message,
      })
    },
  })

  return {
    workspace: workspaceQuery.data,
    isLoading: workspaceQuery.isLoading,
    error: workspaceQuery.error,
    updateWorkspace,
    uploadLogo,
  }
}
