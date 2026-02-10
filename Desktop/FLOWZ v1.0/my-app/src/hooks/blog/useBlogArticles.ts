/**
 * useBlogArticles Hook
 *
 * Fetch and manage blog articles with filtering, pagination and stats
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { BlogArticle, BlogFilters, ArticleStatus } from '@/types/blog';

// ============================================================================
// QUERY KEY
// ============================================================================

export const blogArticlesKeys = {
  all: ['blog-articles'] as const,
  list: (storeId?: string, filters?: BlogFilters) =>
    [...blogArticlesKeys.all, storeId, filters] as const,
  detail: (id: string) => [...blogArticlesKeys.all, 'detail', id] as const,
  stats: (storeId?: string) => [...blogArticlesKeys.all, 'stats', storeId] as const,
};

// ============================================================================
// FETCH ARTICLES
// ============================================================================

interface UseBlogArticlesOptions {
  storeId?: string;
  filters?: BlogFilters;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

export function useBlogArticles(options: UseBlogArticlesOptions = {}) {
  const { storeId, filters, page = 1, pageSize = 25, enabled = true } = options;
  const supabase = createClient();

  return useQuery({
    queryKey: blogArticlesKeys.list(storeId, filters),
    queryFn: async () => {
      let query = supabase
        .from('blog_articles')
        .select('*', { count: 'exact' })
        .eq('archived', false)
        .neq('status', 'auto_draft'); // Exclude Flowriter auto-saves from normal listing

      // Filter by store
      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`
        );
      }

      // Sorting
      const sortBy = filters?.sortBy || 'updated_at';
      const sortOrder = filters?.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        articles: (data || []) as BlogArticle[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    enabled: enabled && !!storeId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// BLOG STATS
// ============================================================================

export function useBlogStats(storeId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: blogArticlesKeys.stats(storeId),
    queryFn: async () => {
      if (!storeId) {
        return {
          total: 0,
          published: 0,
          draft: 0,
          scheduled: 0,
          aiGenerated: 0,
          notOptimized: 0,
        };
      }

      const { data, error } = await supabase
        .from('blog_articles')
        .select('id, status, seo_score, metadata')
        .eq('store_id', storeId)
        .eq('archived', false)
        .neq('status', 'auto_draft'); // Exclude Flowriter auto-saves from stats

      if (error) throw error;

      const articles = data || [];

      return {
        total: articles.length,
        published: articles.filter(
          (a) => a.status === 'published' || a.status === 'publish'
        ).length,
        draft: articles.filter((a) => a.status === 'draft').length,
        scheduled: articles.filter(
          (a) => a.status === 'scheduled' || a.status === 'future'
        ).length,
        // Check ai_generated in metadata JSONB
        aiGenerated: articles.filter(
          (a) => (a.metadata as Record<string, unknown>)?.ai_generated === true
        ).length,
        notOptimized: articles.filter(
          (a) => !a.seo_score || a.seo_score < 50
        ).length,
      };
    },
    enabled: !!storeId,
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 15 * 1000, // Auto-refresh every 15 seconds
  });
}

// ============================================================================
// CREATE ARTICLE
// ============================================================================

interface CreateArticleParams {
  tenant_id: string;  // Required for RLS
  store_id: string;
  title: string;
  status?: ArticleStatus;
  content?: string;
  excerpt?: string;
  ai_generated?: boolean;
  generation_config?: Record<string, unknown>;
  // Additional metadata
  word_count?: number;
  // Source tracking (flowriter, manual, import, wordpress)
  source?: 'manual' | 'flowriter' | 'import' | 'wordpress';
  // FloWriter session ID for linking
  flowriter_session_id?: string;
}

export function useCreateBlogArticle() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (params: CreateArticleParams) => {
      const slug = params.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Generate excerpt from content if not provided
      const excerpt = params.excerpt || (params.content
        ? params.content.replace(/[#*`>\[\]]/g, '').slice(0, 200).trim() + '...'
        : '');

      // Store AI generation info and extra fields in metadata JSONB
      const metadata = {
        ai_generated: params.ai_generated ?? true,
        generation_config: params.generation_config,
        word_count: params.word_count,
      };

      // Insert with tenant_id from store (for RLS policy)
      const { data, error } = await supabase
        .from('blog_articles')
        .insert({
          tenant_id: params.tenant_id,  // From store's tenant_id
          store_id: params.store_id,
          title: params.title,
          slug,
          status: params.status || 'draft',
          content: params.content || '',
          excerpt,
          metadata,
          // Source tracking for FloWriter -> Editor link
          source: params.source || 'manual',
          flowriter_session_id: params.flowriter_session_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BlogArticle;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: blogArticlesKeys.all });
      toast.success('Article créé', {
        description: `"${data.title}" a été créé avec succès.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de créer l\'article.',
      });
    },
  });
}

// ============================================================================
// DELETE ARTICLE
// ============================================================================

export function useDeleteBlogArticle() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete - mark as archived
      const { error } = await supabase
        .from('blog_articles')
        .update({ archived: true })
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogArticlesKeys.all });
      toast.success('Article supprimé');
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de supprimer l\'article.',
      });
    },
  });
}

// ============================================================================
// BULK DELETE
// ============================================================================

export function useBulkDeleteBlogArticles() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('blog_articles')
        .update({ archived: true })
        .in('id', ids);

      if (error) throw error;
      return ids;
    },
    onSuccess: (ids) => {
      queryClient.invalidateQueries({ queryKey: blogArticlesKeys.all });
      toast.success(`${ids.length} articles supprimés`);
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de supprimer les articles.',
      });
    },
  });
}

// ============================================================================
// BULK UPDATE STATUS
// ============================================================================

interface BulkUpdateStatusParams {
  ids: string[];
  status: ArticleStatus;
}

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ ids, status }: BulkUpdateStatusParams) => {
      const updates: Record<string, unknown> = { status };

      // If publishing, set published_at
      if (status === 'published' || status === 'publish') {
        updates.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('blog_articles')
        .update(updates)
        .in('id', ids);

      if (error) throw error;
      return { ids, status };
    },
    onSuccess: ({ ids, status }) => {
      queryClient.invalidateQueries({ queryKey: blogArticlesKeys.all });
      toast.success(`${ids.length} articles mis à jour`, {
        description: `Statut changé en "${status}"`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de mettre à jour les articles.',
      });
    },
  });
}
