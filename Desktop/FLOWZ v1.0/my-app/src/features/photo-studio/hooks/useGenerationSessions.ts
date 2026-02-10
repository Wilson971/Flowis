/**
 * useGenerationSessions Hooks
 *
 * CRUD hooks for the `generation_sessions` table using TanStack Query.
 * Manages photo studio generation sessions per product with optimistic
 * cache invalidation on mutations.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface GenerationSession {
  id: string;
  user_id: string;
  product_id: string;
  source_image_url: string | null;
  generated_image_url: string | null;
  prompt_used: string | null;
  preset_name: string | null;
  settings: Record<string, unknown> | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGenerationSessionInput {
  product_id: string;
  source_image_url?: string | null;
  generated_image_url?: string | null;
  prompt_used?: string | null;
  preset_name?: string | null;
  settings?: Record<string, unknown> | null;
  is_published?: boolean;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const generationSessionsKeys = {
  all: ['generation-sessions'] as const,
  byProduct: (productId: string) =>
    ['generation-sessions', productId] as const,
};

// ============================================================================
// QUERY: List sessions for a product
// ============================================================================

export function useGenerationSessions(productId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: generationSessionsKeys.byProduct(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generation_sessions')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GenerationSession[];
    },
    enabled: !!productId,
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000, // 5 minutes
  });
}

// ============================================================================
// MUTATION: Create a new session
// ============================================================================

export function useCreateGenerationSession() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: CreateGenerationSessionInput) => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error('Utilisateur non authentifie.');
      }

      const { data, error } = await supabase
        .from('generation_sessions')
        .insert({
          user_id: userData.user.id,
          product_id: input.product_id,
          source_image_url: input.source_image_url ?? null,
          generated_image_url: input.generated_image_url ?? null,
          prompt_used: input.prompt_used ?? null,
          preset_name: input.preset_name ?? null,
          settings: input.settings ?? null,
          is_published: input.is_published ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as GenerationSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: generationSessionsKeys.byProduct(data.product_id),
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur de creation', {
        description:
          error.message || 'Impossible de creer la session de generation.',
      });
    },
  });
}

// ============================================================================
// MUTATION: Publish a session (set is_published = true)
// ============================================================================

interface PublishSessionInput {
  sessionId: string;
  productId: string;
}

export function usePublishGenerationSession() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ sessionId }: PublishSessionInput) => {
      const { data, error } = await supabase
        .from('generation_sessions')
        .update({
          is_published: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data as GenerationSession;
    },
    onMutate: async ({ sessionId, productId }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: generationSessionsKeys.byProduct(productId),
      });

      // Snapshot previous sessions for rollback
      const previousSessions = queryClient.getQueryData<GenerationSession[]>(
        generationSessionsKeys.byProduct(productId)
      );

      // Optimistic update
      if (previousSessions) {
        queryClient.setQueryData(
          generationSessionsKeys.byProduct(productId),
          previousSessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  is_published: true,
                  updated_at: new Date().toISOString(),
                }
              : session
          )
        );
      }

      return { previousSessions };
    },
    onError: (error: Error, { productId }, context) => {
      // Rollback
      if (context?.previousSessions) {
        queryClient.setQueryData(
          generationSessionsKeys.byProduct(productId),
          context.previousSessions
        );
      }
      toast.error('Erreur de publication', {
        description:
          error.message || 'Impossible de publier cette generation.',
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: generationSessionsKeys.byProduct(data.product_id),
      });
      toast.success('Image publiee', {
        description: 'L\'image generee a ete publiee avec succes.',
      });
    },
  });
}

// ============================================================================
// MUTATION: Delete a session
// ============================================================================

interface DeleteSessionInput {
  sessionId: string;
  productId: string;
}

export function useDeleteGenerationSession() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ sessionId }: DeleteSessionInput) => {
      const { error } = await supabase
        .from('generation_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      return sessionId;
    },
    onMutate: async ({ sessionId, productId }) => {
      await queryClient.cancelQueries({
        queryKey: generationSessionsKeys.byProduct(productId),
      });

      const previousSessions = queryClient.getQueryData<GenerationSession[]>(
        generationSessionsKeys.byProduct(productId)
      );

      // Optimistic removal
      if (previousSessions) {
        queryClient.setQueryData(
          generationSessionsKeys.byProduct(productId),
          previousSessions.filter((session) => session.id !== sessionId)
        );
      }

      return { previousSessions };
    },
    onError: (error: Error, { productId }, context) => {
      if (context?.previousSessions) {
        queryClient.setQueryData(
          generationSessionsKeys.byProduct(productId),
          context.previousSessions
        );
      }
      toast.error('Erreur de suppression', {
        description:
          error.message || 'Impossible de supprimer cette session.',
      });
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({
        queryKey: generationSessionsKeys.byProduct(productId),
      });
      toast.success('Session supprimee', {
        description: 'La session de generation a ete supprimee.',
      });
    },
  });
}
