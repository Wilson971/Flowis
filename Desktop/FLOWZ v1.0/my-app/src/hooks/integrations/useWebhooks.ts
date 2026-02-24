/**
 * useWebhooks — CRUD hooks for the webhooks table
 * Events: sync.completed, sync.failed, product.updated, article.published, batch.completed
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { STALE_TIMES } from '@/lib/query-config'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth/AuthContext'

export interface Webhook {
  id: string
  tenant_id: string
  url: string
  events: string[]
  secret: string
  active: boolean
  last_triggered_at: string | null
  created_at: string
}

export const WEBHOOK_EVENTS = [
  { value: 'sync.completed', label: 'Synchronisation réussie' },
  { value: 'sync.failed', label: 'Synchronisation échouée' },
  { value: 'product.updated', label: 'Produit mis à jour' },
  { value: 'article.published', label: 'Article publié' },
  { value: 'batch.completed', label: 'Traitement en lot terminé' },
] as const

export function useWebhooks() {
  const supabase = createClient()
  const { user } = useAuth()

  return useQuery({
    queryKey: ['webhooks', user?.id],
    queryFn: async (): Promise<Webhook[]> => {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as Webhook[]
    },
    enabled: !!user,
    staleTime: STALE_TIMES.LIST,
  })
}

export function useCreateWebhook() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ url, events }: { url: string; events: string[] }) => {
      if (!user) throw new Error('Non authentifié')
      if (!url.startsWith('https://')) throw new Error('L\'URL doit commencer par https://')
      if (events.length === 0) throw new Error('Sélectionnez au moins un événement')

      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          tenant_id: user.id,
          url,
          events,
          active: true,
        })
        .select()
        .single()

      if (error) throw error
      return data as Webhook
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      toast.success('Webhook créé', { description: 'L\'endpoint est prêt à recevoir des événements.' })
    },
    onError: (err: Error) => {
      toast.error('Erreur de création', { description: err.message })
    },
  })
}

export function useDeleteWebhook() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (webhookId: string) => {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      toast.success('Webhook supprimé')
    },
    onError: (err: Error) => {
      toast.error('Erreur de suppression', { description: err.message })
    },
  })
}

export function useToggleWebhook() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('webhooks')
        .update({ active })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    },
    onError: (err: Error) => {
      toast.error('Erreur', { description: err.message })
    },
  })
}
