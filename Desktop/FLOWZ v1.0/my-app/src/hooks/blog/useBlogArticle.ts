/**
 * useBlogArticle Hook
 *
 * Fetch and manage a single blog article with optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { blogArticlesKeys } from './useBlogArticles';
import type { BlogArticle, BlogFormData } from '@/types/blog';

// ============================================================================
// FETCH SINGLE ARTICLE
// ============================================================================

interface UseBlogArticleOptions {
  enabled?: boolean;
}

export function useBlogArticle(id?: string, options: UseBlogArticleOptions = {}) {
  const { enabled = true } = options;
  const supabase = createClient();

  return useQuery({
    queryKey: blogArticlesKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('blog_articles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as BlogArticle;
    },
    enabled: enabled && !!id,
    staleTime: STALE_TIMES.STATIC,
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// UPDATE ARTICLE
// ============================================================================

export class StaleArticleError extends Error {
  constructor() {
    super('L\'article a été modifié par un autre utilisateur. Veuillez recharger la page.');
    this.name = 'StaleArticleError';
  }
}

interface UpdateArticleParams {
  id: string;
  updates: Partial<BlogFormData>;
  expectedUpdatedAt?: string;
}

// Valid blog_articles DB columns (excludes id, created_at which are immutable)
const BLOG_ARTICLE_COLUMNS = new Set([
  'title', 'slug', 'content', 'excerpt', 'status', 'author', 'category',
  'tags', 'seo_score', 'featured_image_url', 'metadata', 'published_at',
  'updated_at', 'editorial_lock', 'external_updated_at', 'archived',
  'blog_id', 'wordpress_post_id', 'date_gmt', 'modified_gmt',
  'comment_status', 'ping_status', 'format', 'sticky', 'parent_id',
  'menu_order', 'seo_title', 'seo_description', 'seo_keywords',
  'seo_canonical_url', 'seo_og_image', 'seo_schema_type', 'post_type',
  'blog_external_id', 'link',
]);

export function useUpdateBlogArticle() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, updates, expectedUpdatedAt }: UpdateArticleParams) => {
      // Filter to valid DB columns only (form may have extra UI-only fields)
      const updateData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (BLOG_ARTICLE_COLUMNS.has(key)) {
          updateData[key] = value;
        }
      }

      if (updates.title && !updates.slug) {
        updateData.slug = updates.title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }

      // Set published_at if publishing
      if (
        (updates.status === 'published' || updates.status === 'publish') &&
        !updates.published_at
      ) {
        updateData.published_at = new Date().toISOString();
      }

      updateData.updated_at = new Date().toISOString();

      let query = supabase
        .from('blog_articles')
        .update(updateData)
        .eq('id', id);

      if (expectedUpdatedAt) {
        query = query.eq('updated_at', expectedUpdatedAt);
      }

      const { data, error } = await query.select();

      if (error) throw error;

      if (!data || data.length === 0) {
        if (expectedUpdatedAt) {
          throw new StaleArticleError();
        }
        throw new Error('Article introuvable.');
      }

      return data[0] as BlogArticle;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: blogArticlesKeys.detail(id) });

      // Snapshot previous value
      const previousArticle = queryClient.getQueryData<BlogArticle>(
        blogArticlesKeys.detail(id)
      );

      // Optimistically update
      if (previousArticle) {
        queryClient.setQueryData(blogArticlesKeys.detail(id), {
          ...previousArticle,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousArticle };
    },
    onError: (error: unknown, { id }, context) => {
      // Rollback on error
      if (context?.previousArticle) {
        queryClient.setQueryData(blogArticlesKeys.detail(id), context.previousArticle);
      }
      const message = error instanceof Error
        ? error.message
        : (error as { message?: string })?.message || 'Impossible de sauvegarder l\'article.';
      toast.error('Erreur de sauvegarde', { description: message });
    },
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData(blogArticlesKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: blogArticlesKeys.all });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// ============================================================================
// AUTO-SAVE HOOK
// ============================================================================

import { useRef, useCallback, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';

interface UseAutoSaveOptions {
  articleId: string;
  enabled?: boolean;
  debounceMs?: number;
  onSaveStart?: () => void;
  onSaveComplete?: () => void;
  onSaveError?: (error: Error) => void;
}

export function useAutoSave(options: UseAutoSaveOptions) {
  const {
    articleId,
    enabled = true,
    debounceMs = 3000,
    onSaveStart,
    onSaveComplete,
    onSaveError,
  } = options;

  const updateMutation = useUpdateBlogArticle();
  const pendingChangesRef = useRef<Partial<BlogFormData> | null>(null);
  const isSavingRef = useRef(false);

  const performSave = useCallback(async () => {
    if (!pendingChangesRef.current || !enabled || isSavingRef.current) return;

    const changes = pendingChangesRef.current;
    pendingChangesRef.current = null;
    isSavingRef.current = true;

    onSaveStart?.();

    try {
      await updateMutation.mutateAsync({ id: articleId, updates: changes });
      onSaveComplete?.();
    } catch (error) {
      onSaveError?.(error as Error);
      // Restore pending changes on error
      pendingChangesRef.current = changes;
    } finally {
      isSavingRef.current = false;
    }
  }, [articleId, enabled, updateMutation, onSaveStart, onSaveComplete, onSaveError]);

  const debouncedSave = useDebouncedCallback(performSave, debounceMs);

  const queueSave = useCallback(
    (updates: Partial<BlogFormData>) => {
      pendingChangesRef.current = {
        ...pendingChangesRef.current,
        ...updates,
      };
      debouncedSave();
    },
    [debouncedSave]
  );

  const flushSave = useCallback(async () => {
    debouncedSave.cancel();
    await performSave();
  }, [debouncedSave, performSave]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (pendingChangesRef.current) {
        flushSave();
      }
    };
  }, [flushSave]);

  return {
    queueSave,
    flushSave,
    isSaving: updateMutation.isPending || isSavingRef.current,
    hasPendingChanges: !!pendingChangesRef.current,
  };
}

// ============================================================================
// DUPLICATE ARTICLE
// ============================================================================

export function useDuplicateBlogArticle() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Fetch original
      const { data: original, error: fetchError } = await supabase
        .from('blog_articles')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Create duplicate
      const { id: _, created_at, updated_at, published_at, ...rest } = original;

      const { data, error } = await supabase
        .from('blog_articles')
        .insert({
          ...rest,
          title: `${original.title} (copie)`,
          slug: `${original.slug}-copy-${Date.now()}`,
          status: 'draft',
          published_at: null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BlogArticle;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: blogArticlesKeys.all });
      toast.success('Article dupliqué', {
        description: `"${data.title}" a été créé.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de dupliquer l\'article.',
      });
    },
  });
}
