/**
 * useWorkspaceMembers - Hook pour la gestion des membres du workspace
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type {
  WorkspaceMember,
  WorkspaceInvitation,
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

export function useWorkspaceInvitations(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['workspace-invitations', workspaceId],
    queryFn: async (): Promise<WorkspaceInvitation[]> => {
      if (!workspaceId) return []

      const { data, error } = await supabase
        .from('workspace_invitations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as WorkspaceInvitation[]
    },
    enabled: !!workspaceId,
  })
}

export function useInviteMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ workspaceId, email, role }: InviteMemberParams) => {
      const res = await fetch('/api/workspace/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, email, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'invitation')
      }

      return data as { type: 'direct' | 'invitation'; warning?: string }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', variables.workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['workspace-invitations', variables.workspaceId] })
      if (result?.type === 'invitation') {
        if (result.warning) {
          toast.warning('Invitation créée', {
            description: result.warning,
          })
        } else {
          toast.success('Invitation envoyée par email', {
            description: `${variables.email} recevra un lien pour rejoindre le workspace`,
          })
        }
      } else {
        toast.success('Membre ajouté avec succès')
      }
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de l\'invitation', {
        description: error.message,
      })
    },
  })
}

export function useCancelInvitation() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ invitationId, workspaceId }: { invitationId: string; workspaceId: string }) => {
      const { error } = await supabase
        .from('workspace_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invitations', variables.workspaceId] })
      toast.success('Invitation annulée')
    },
    onError: (error: Error) => {
      toast.error('Erreur', { description: error.message })
    },
  })
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ memberId, workspaceId, role }: UpdateMemberRoleParams) => {
      const { data: member } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('id', memberId)
        .single()

      if (member?.role === 'owner') {
        throw new Error('Impossible de modifier le rôle du propriétaire')
      }

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
        .update({ status: 'suspended' })
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
