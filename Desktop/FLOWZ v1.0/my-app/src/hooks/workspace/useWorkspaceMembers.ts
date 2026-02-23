/**
 * useWorkspaceMembers - Hook pour la gestion des membres du workspace
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type {
  WorkspaceMember,
  InviteMemberParams,
  UpdateMemberRoleParams,
  RemoveMemberParams,
  WorkspaceRole,
} from '@/types/workspace'

export function useWorkspaceMembers(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: async (): Promise<WorkspaceMember[]> => {
      if (!workspaceId) return []

      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          *,
          profile:user_id (
            full_name,
            email,
            avatar_url,
            job_title
          )
        `)
        .eq('workspace_id', workspaceId)
        .neq('status', 'suspended')
        .order('role', { ascending: true })

      if (error) throw error

      return (data || []).map((member: any) => ({
        ...member,
        profile: member.profile || undefined,
      })) as WorkspaceMember[]
    },
    enabled: !!workspaceId,
  })
}

export function useInviteMember() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ workspaceId, email, role }: InviteMemberParams) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Look up user by email in profiles
      const { data: targetProfile, error: lookupError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', email)
        .single()

      if (lookupError || !targetProfile) {
        throw new Error(`Aucun utilisateur trouvé avec l'email ${email}`)
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('workspace_members')
        .select('id, status')
        .eq('workspace_id', workspaceId)
        .eq('user_id', targetProfile.id)
        .single()

      if (existing && existing.status === 'active') {
        throw new Error('Cet utilisateur est déjà membre du workspace')
      }

      // If previously removed, re-activate
      if (existing && existing.status === 'suspended') {
        const { error: updateError } = await supabase
          .from('workspace_members')
          .update({
            role: role as WorkspaceRole,
            status: 'active',
            invited_by: user.id,
            invited_at: new Date().toISOString(),
            accepted_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (updateError) throw updateError
        return
      }

      // Insert new member
      const { error: insertError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: targetProfile.id,
          role: role as WorkspaceRole,
          status: 'active',
          invited_by: user.id,
          accepted_at: new Date().toISOString(),
        })

      if (insertError) throw insertError
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', variables.workspaceId] })
      toast.success('Membre ajouté avec succès')
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de l\'invitation', {
        description: error.message,
      })
    },
  })
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ memberId, workspaceId, role }: UpdateMemberRoleParams) => {
      // Guard: Cannot change owner role
      const { data: member } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('id', memberId)
        .single()

      if (member?.role === 'owner') {
        throw new Error('Impossible de modifier le rôle du propriétaire')
      }

      // Guard: Cannot promote to owner
      if (role === 'owner') {
        throw new Error('Le transfert de propriété n\'est pas disponible')
      }

      const { error } = await supabase
        .from('workspace_members')
        .update({ role: role as WorkspaceRole })
        .eq('id', memberId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', variables.workspaceId] })
      toast.success('Rôle mis à jour')
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la mise à jour du rôle', {
        description: error.message,
      })
    },
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ memberId, workspaceId }: RemoveMemberParams) => {
      // Guard: Cannot remove owner
      const { data: member } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('id', memberId)
        .single()

      if (member?.role === 'owner') {
        throw new Error('Impossible de retirer le propriétaire du workspace')
      }

      const { error } = await supabase
        .from('workspace_members')
        .update({ status: 'suspended' as const })
        .eq('id', memberId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', variables.workspaceId] })
      toast.success('Membre retiré du workspace')
    },
    onError: (error: Error) => {
      toast.error('Erreur lors du retrait', {
        description: error.message,
      })
    },
  })
}
