/**
 * useArticleSchedules Hook
 *
 * Manage advanced article scheduling:
 * - Schedule publish/republish/unpublish
 * - Series scheduling
 * - Track schedule status
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export type ScheduleType = 'publish' | 'republish' | 'unpublish' | 'series';
export type ScheduleStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ArticleSchedule {
  id: string;
  article_id: string;
  schedule_type: ScheduleType;
  scheduled_at: string;
  status: ScheduleStatus;
  executed_at: string | null;
  error_message: string | null;
  platforms: string[];
  options: Record<string, unknown>;
  created_at: string;
}

export interface CreateScheduleParams {
  article_id: string;
  schedule_type: ScheduleType;
  scheduled_at: Date;
  platforms?: string[];
  options?: Record<string, unknown>;
}

export interface UpdateScheduleParams {
  id: string;
  updates: Partial<Pick<ArticleSchedule, 'scheduled_at' | 'platforms' | 'options' | 'status'>>;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const articleSchedulesKeys = {
  all: ['article-schedules'] as const,
  list: (articleId: string) => [...articleSchedulesKeys.all, 'list', articleId] as const,
  pending: () => [...articleSchedulesKeys.all, 'pending'] as const,
  detail: (id: string) => [...articleSchedulesKeys.all, 'detail', id] as const,
};

// ============================================================================
// FETCH SCHEDULES FOR ARTICLE
// ============================================================================

interface UseArticleSchedulesOptions {
  articleId: string;
  enabled?: boolean;
}

export function useArticleSchedules(options: UseArticleSchedulesOptions) {
  const { articleId, enabled = true } = options;
  const supabase = createClient();

  return useQuery({
    queryKey: articleSchedulesKeys.list(articleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_schedules')
        .select('*')
        .eq('article_id', articleId)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return (data || []) as ArticleSchedule[];
    },
    enabled: enabled && !!articleId,
    staleTime: STALE_TIMES.LIST,
  });
}

// ============================================================================
// FETCH PENDING SCHEDULES
// ============================================================================

export function usePendingSchedules() {
  const supabase = createClient();

  return useQuery({
    queryKey: articleSchedulesKeys.pending(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('article_schedules')
        .select(`
          *,
          blog_articles!inner (
            id,
            title,
            author_id
          )
        `)
        .eq('status', 'pending')
        .eq('blog_articles.author_id', user.id)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return (data || []) as (ArticleSchedule & { blog_articles: { id: string; title: string } })[];
    },
    staleTime: STALE_TIMES.DETAIL,
  });
}

// ============================================================================
// GET NEXT SCHEDULED ACTION
// ============================================================================

export function useNextScheduledAction(articleId: string, enabled = true) {
  const supabase = createClient();

  return useQuery({
    queryKey: [...articleSchedulesKeys.list(articleId), 'next'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_schedules')
        .select('*')
        .eq('article_id', articleId)
        .eq('status', 'pending')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .single();

      // If no pending schedule, return null (not an error)
      if (error && error.code === 'PGRST116') {
        return null;
      }

      if (error) throw error;
      return data as ArticleSchedule;
    },
    enabled: enabled && !!articleId,
    staleTime: STALE_TIMES.LIST,
  });
}

// ============================================================================
// CREATE SCHEDULE
// ============================================================================

export function useCreateArticleSchedule() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (params: CreateScheduleParams) => {
      const { data, error } = await supabase
        .from('article_schedules')
        .insert({
          article_id: params.article_id,
          schedule_type: params.schedule_type,
          scheduled_at: params.scheduled_at.toISOString(),
          platforms: params.platforms || ['flowz'],
          options: params.options || {},
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // If scheduling a publish, update article status to 'scheduled'
      if (params.schedule_type === 'publish') {
        await supabase
          .from('blog_articles')
          .update({
            status: 'scheduled',
            scheduled_at: params.scheduled_at.toISOString(),
          })
          .eq('id', params.article_id);
      }

      return data as ArticleSchedule;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: articleSchedulesKeys.all });
      queryClient.invalidateQueries({ queryKey: ['blog-articles'] });

      const typeLabels: Record<ScheduleType, string> = {
        publish: 'Publication',
        republish: 'Republication',
        unpublish: 'Depublication',
        series: 'Serie',
      };

      toast.success(`${typeLabels[data.schedule_type]} planifiee`, {
        description: `Prevu pour le ${new Date(data.scheduled_at).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de creer la planification.',
      });
    },
  });
}

// ============================================================================
// UPDATE SCHEDULE
// ============================================================================

export function useUpdateArticleSchedule() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateScheduleParams) => {
      const updateData: Record<string, unknown> = {};

      if (updates.scheduled_at) {
        updateData.scheduled_at = new Date(updates.scheduled_at).toISOString();
      }
      if (updates.platforms) {
        updateData.platforms = updates.platforms;
      }
      if (updates.options) {
        updateData.options = updates.options;
      }
      if (updates.status) {
        updateData.status = updates.status;
      }

      const { data, error } = await supabase
        .from('article_schedules')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ArticleSchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleSchedulesKeys.all });
      toast.success('Planification mise a jour');
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de mettre a jour la planification.',
      });
    },
  });
}

// ============================================================================
// CANCEL SCHEDULE
// ============================================================================

export function useCancelArticleSchedule() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      // Get schedule to check type
      const { data: schedule } = await supabase
        .from('article_schedules')
        .select('article_id, schedule_type')
        .eq('id', scheduleId)
        .single();

      // Update status to cancelled
      const { error } = await supabase
        .from('article_schedules')
        .update({ status: 'cancelled' })
        .eq('id', scheduleId);

      if (error) throw error;

      // If cancelling a publish schedule, revert article status to draft
      if (schedule?.schedule_type === 'publish') {
        await supabase
          .from('blog_articles')
          .update({
            status: 'draft',
            scheduled_at: null,
          })
          .eq('id', schedule.article_id);
      }

      return scheduleId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleSchedulesKeys.all });
      queryClient.invalidateQueries({ queryKey: ['blog-articles'] });
      toast.success('Planification annulee');
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible d\'annuler la planification.',
      });
    },
  });
}

// ============================================================================
// DELETE SCHEDULE
// ============================================================================

export function useDeleteArticleSchedule() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase
        .from('article_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;
      return scheduleId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleSchedulesKeys.all });
      toast.success('Planification supprimee');
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de supprimer la planification.',
      });
    },
  });
}

// ============================================================================
// COMBINED HOOK FOR ARTICLE EDITOR
// ============================================================================

interface UseScheduleManagerOptions {
  articleId: string;
  enabled?: boolean;
}

export function useScheduleManager(options: UseScheduleManagerOptions) {
  const { articleId, enabled = true } = options;

  const schedules = useArticleSchedules({ articleId, enabled });
  const nextSchedule = useNextScheduledAction(articleId, enabled);
  const createSchedule = useCreateArticleSchedule();
  const updateSchedule = useUpdateArticleSchedule();
  const cancelSchedule = useCancelArticleSchedule();
  const deleteSchedule = useDeleteArticleSchedule();

  // Get pending schedules
  const pendingSchedules = schedules.data?.filter((s) => s.status === 'pending') || [];

  // Check if article has pending publish
  const hasPendingPublish = pendingSchedules.some((s) => s.schedule_type === 'publish');

  return {
    // Data
    schedules: schedules.data || [],
    pendingSchedules,
    nextSchedule: nextSchedule.data,
    isLoading: schedules.isLoading,

    // Flags
    hasPendingPublish,
    hasSchedules: (schedules.data?.length || 0) > 0,

    // Actions
    createSchedule: createSchedule.mutateAsync,
    updateSchedule: updateSchedule.mutateAsync,
    cancelSchedule: cancelSchedule.mutateAsync,
    deleteSchedule: deleteSchedule.mutateAsync,

    // Loading states
    isCreating: createSchedule.isPending,
    isUpdating: updateSchedule.isPending,
    isCancelling: cancelSchedule.isPending,
    isDeleting: deleteSchedule.isPending,

    // Refetch
    refetch: schedules.refetch,
  };
}
