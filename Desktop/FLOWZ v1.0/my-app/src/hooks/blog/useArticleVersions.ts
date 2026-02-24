/**
 * useArticleVersions Hook
 *
 * Manage article version history:
 * - Fetch versions for an article
 * - Create new versions (auto-save, manual, publish)
 * - Compare versions
 * - Restore previous versions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export type VersionTrigger = 'auto_save' | 'manual_save' | 'publish' | 'restore';

export interface ArticleVersion {
  id: string;
  article_id: string;
  version_number: number;
  title: string;
  content: string;
  excerpt: string | null;
  trigger_type: VersionTrigger;
  created_at: string;
  created_by: string | null;
  metadata: Record<string, unknown> | null;
}

export interface CreateVersionParams {
  article_id: string;
  title: string;
  content: string;
  excerpt?: string;
  trigger_type: VersionTrigger;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const articleVersionsKeys = {
  all: ['article-versions'] as const,
  list: (articleId: string) => [...articleVersionsKeys.all, 'list', articleId] as const,
  detail: (versionId: string) => [...articleVersionsKeys.all, 'detail', versionId] as const,
  compare: (versionId1: string, versionId2: string) =>
    [...articleVersionsKeys.all, 'compare', versionId1, versionId2] as const,
};

// ============================================================================
// FETCH VERSIONS
// ============================================================================

interface UseArticleVersionsOptions {
  articleId: string;
  enabled?: boolean;
  limit?: number;
}

export function useArticleVersions(options: UseArticleVersionsOptions) {
  const { articleId, enabled = true, limit = 50 } = options;
  const supabase = createClient();

  return useQuery({
    queryKey: articleVersionsKeys.list(articleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_versions')
        .select('*')
        .eq('article_id', articleId)
        .order('version_number', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as ArticleVersion[];
    },
    enabled: enabled && !!articleId,
    staleTime: STALE_TIMES.LIST,
  });
}

// ============================================================================
// FETCH SINGLE VERSION
// ============================================================================

export function useArticleVersion(versionId: string, enabled = true) {
  const supabase = createClient();

  return useQuery({
    queryKey: articleVersionsKeys.detail(versionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (error) throw error;
      return data as ArticleVersion;
    },
    enabled: enabled && !!versionId,
  });
}

// ============================================================================
// CREATE VERSION
// ============================================================================

export function useCreateArticleVersion() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (params: CreateVersionParams) => {
      // Get current max version number
      const { data: latestVersion } = await supabase
        .from('article_versions')
        .select('version_number')
        .eq('article_id', params.article_id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      const nextVersionNumber = (latestVersion?.version_number || 0) + 1;

      // Insert new version
      const { data, error } = await supabase
        .from('article_versions')
        .insert({
          article_id: params.article_id,
          version_number: nextVersionNumber,
          title: params.title,
          content: params.content,
          excerpt: params.excerpt || null,
          trigger_type: params.trigger_type,
          metadata: params.metadata || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update article's current_version
      await supabase
        .from('blog_articles')
        .update({ current_version: nextVersionNumber })
        .eq('id', params.article_id);

      return data as ArticleVersion;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: articleVersionsKeys.list(data.article_id),
      });

      // Only show toast for manual saves and publishes
      if (data.trigger_type === 'manual_save') {
        toast.success('Version sauvegardee', {
          description: `Version ${data.version_number} creee.`,
        });
      } else if (data.trigger_type === 'publish') {
        toast.success('Version publiee', {
          description: `Version ${data.version_number} publiee avec succes.`,
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: 'Impossible de creer la version.',
      });
    },
  });
}

// ============================================================================
// RESTORE VERSION
// ============================================================================

export function useRestoreArticleVersion() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const createVersion = useCreateArticleVersion();

  return useMutation({
    mutationFn: async ({
      versionId,
      articleId,
    }: {
      versionId: string;
      articleId: string;
    }) => {
      // Fetch the version to restore
      const { data: versionToRestore, error: fetchError } = await supabase
        .from('article_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (fetchError || !versionToRestore) {
        throw new Error('Version introuvable');
      }

      // Create a new version from the restored content (to preserve history)
      await createVersion.mutateAsync({
        article_id: articleId,
        title: versionToRestore.title,
        content: versionToRestore.content,
        excerpt: versionToRestore.excerpt || undefined,
        trigger_type: 'restore',
        metadata: {
          restored_from_version: versionToRestore.version_number,
          restored_from_id: versionId,
        },
      });

      // Update the article with restored content
      const { data, error } = await supabase
        .from('blog_articles')
        .update({
          title: versionToRestore.title,
          content: versionToRestore.content,
          excerpt: versionToRestore.excerpt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', articleId)
        .select()
        .single();

      if (error) throw error;
      return {
        article: data,
        restoredVersion: versionToRestore as ArticleVersion,
      };
    },
    onSuccess: ({ restoredVersion }) => {
      queryClient.invalidateQueries({ queryKey: articleVersionsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['blog-articles'] });

      toast.success('Version restauree', {
        description: `L'article a ete restaure a la version ${restoredVersion.version_number}.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de restaurer la version.',
      });
    },
  });
}

// ============================================================================
// COMPARE VERSIONS
// ============================================================================

export function useCompareVersions(versionId1: string, versionId2: string, enabled = true) {
  const supabase = createClient();

  return useQuery({
    queryKey: articleVersionsKeys.compare(versionId1, versionId2),
    queryFn: async () => {
      const [{ data: version1, error: error1 }, { data: version2, error: error2 }] =
        await Promise.all([
          supabase.from('article_versions').select('*').eq('id', versionId1).single(),
          supabase.from('article_versions').select('*').eq('id', versionId2).single(),
        ]);

      if (error1 || error2) {
        throw new Error('Impossible de charger les versions a comparer');
      }

      return {
        version1: version1 as ArticleVersion,
        version2: version2 as ArticleVersion,
      };
    },
    enabled: enabled && !!versionId1 && !!versionId2,
  });
}

// ============================================================================
// DELETE OLD VERSIONS (Keep last N)
// ============================================================================

export function useCleanupOldVersions() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      articleId,
      keepCount = 20,
    }: {
      articleId: string;
      keepCount?: number;
    }) => {
      // Get versions to keep (most recent N)
      const { data: versionsToKeep } = await supabase
        .from('article_versions')
        .select('id')
        .eq('article_id', articleId)
        .order('version_number', { ascending: false })
        .limit(keepCount);

      const keepIds = (versionsToKeep || []).map((v) => v.id);

      if (keepIds.length === 0) return { deleted: 0 };

      // Delete older versions
      const { error, count } = await supabase
        .from('article_versions')
        .delete({ count: 'exact' })
        .eq('article_id', articleId)
        .not('id', 'in', `(${keepIds.join(',')})`);

      if (error) throw error;

      return { deleted: count || 0 };
    },
    onSuccess: ({ deleted }) => {
      if (deleted > 0) {
        queryClient.invalidateQueries({ queryKey: articleVersionsKeys.all });
        toast.success(`${deleted} ancienne(s) version(s) supprimee(s)`);
      }
    },
    onError: (error: Error) => {
      console.error('Error cleaning up versions:', error);
    },
  });
}

// ============================================================================
// HOOK FOR VERSION MANAGEMENT IN EDITOR
// ============================================================================

interface UseVersionManagerOptions {
  articleId: string;
  enabled?: boolean;
  autoSaveInterval?: number; // ms between auto-saves that create versions
}

export function useVersionManager(options: UseVersionManagerOptions) {
  const { articleId, enabled = true, autoSaveInterval = 5 * 60 * 1000 } = options; // 5 min default

  const versions = useArticleVersions({ articleId, enabled });
  const createVersion = useCreateArticleVersion();
  const restoreVersion = useRestoreArticleVersion();

  // Get latest version
  const latestVersion = versions.data?.[0];

  // Get version count
  const versionCount = versions.data?.length || 0;

  // Check if can create version (rate limiting for auto-saves)
  const canCreateAutoVersion = (): boolean => {
    if (!latestVersion) return true;

    const lastCreated = new Date(latestVersion.created_at);
    const now = new Date();
    const timeSinceLastVersion = now.getTime() - lastCreated.getTime();

    return timeSinceLastVersion >= autoSaveInterval;
  };

  return {
    versions: versions.data || [],
    isLoading: versions.isLoading,
    latestVersion,
    versionCount,
    canCreateAutoVersion,
    createVersion: createVersion.mutateAsync,
    restoreVersion: restoreVersion.mutateAsync,
    isCreating: createVersion.isPending,
    isRestoring: restoreVersion.isPending,
    refetch: versions.refetch,
  };
}
