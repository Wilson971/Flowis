/**
 * useLinkSuggestions Hook
 *
 * Fetches semantically similar articles for internal linking suggestions.
 * Uses Google text-multilingual-embedding-002 + pgvector cosine similarity.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-config';
import type {
  LinkSuggestion,
  SuggestLinksResponse,
  InternalLink,
  ArticleLinkStats,
  InternalLinkStatus,
} from '@/types/linkbuilder';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const linkbuilderKeys = {
  all: ['linkbuilder'] as const,
  suggestions: (articleId: string) =>
    [...linkbuilderKeys.all, 'suggestions', articleId] as const,
  links: (articleId: string) =>
    [...linkbuilderKeys.all, 'links', articleId] as const,
  stats: (articleId: string) =>
    [...linkbuilderKeys.all, 'stats', articleId] as const,
};

// ============================================================================
// FETCH SUGGESTIONS (via API route → pgvector)
// ============================================================================

interface UseLinkSuggestionsOptions {
  articleId: string;
  storeId: string;
  threshold?: number;
  maxResults?: number;
  enabled?: boolean;
}

export function useLinkSuggestions(options: UseLinkSuggestionsOptions) {
  const { articleId, storeId, threshold = 0.65, maxResults = 10, enabled = true } = options;

  return useQuery({
    queryKey: linkbuilderKeys.suggestions(articleId),
    queryFn: async (): Promise<SuggestLinksResponse> => {
      const res = await fetch('/api/linkbuilder/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: articleId,
          store_id: storeId,
          threshold,
          max_results: maxResults,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
        throw new Error(err.error || `Erreur ${res.status}`);
      }

      return res.json();
    },
    enabled: enabled && !!articleId && !!storeId,
    staleTime: STALE_TIMES.DETAIL,
    gcTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// FETCH EXISTING LINKS for an article
// ============================================================================

export function useArticleLinks(articleId: string, enabled = true) {
  const supabase = createClient();

  return useQuery({
    queryKey: linkbuilderKeys.links(articleId),
    queryFn: async (): Promise<InternalLink[]> => {
      const { data, error } = await supabase
        .from('article_internal_links')
        .select('*')
        .eq('source_article_id', articleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as InternalLink[];
    },
    enabled: enabled && !!articleId,
    staleTime: STALE_TIMES.DETAIL,
  });
}

// ============================================================================
// FETCH LINK STATS
// ============================================================================

export function useArticleLinkStats(articleId: string, enabled = true) {
  const supabase = createClient();

  return useQuery({
    queryKey: linkbuilderKeys.stats(articleId),
    queryFn: async (): Promise<ArticleLinkStats> => {
      const { data, error } = await supabase.rpc('get_article_link_stats', {
        p_article_id: articleId,
      });

      if (error) throw error;

      // RPC returns array with single row
      const row = Array.isArray(data) ? data[0] : data;
      return {
        outgoing_links: Number(row?.outgoing_links ?? 0),
        incoming_links: Number(row?.incoming_links ?? 0),
        suggested_links: Number(row?.suggested_links ?? 0),
      };
    },
    enabled: enabled && !!articleId,
    staleTime: STALE_TIMES.DETAIL,
  });
}

// ============================================================================
// SAVE / UPDATE LINK
// ============================================================================

interface SaveLinkParams {
  source_article_id: string;
  target_article_id: string;
  anchor_text: string;
  context_snippet?: string;
  similarity_score?: number;
  status: InternalLinkStatus;
}

export function useSaveLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SaveLinkParams) => {
      const res = await fetch('/api/linkbuilder/save-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
        throw new Error(err.error || `Erreur ${res.status}`);
      }

      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: linkbuilderKeys.links(variables.source_article_id),
      });
      queryClient.invalidateQueries({
        queryKey: linkbuilderKeys.stats(variables.source_article_id),
      });

      const statusMsg: Record<InternalLinkStatus, string> = {
        suggested: 'Lien suggéré enregistré',
        accepted: 'Lien accepté',
        rejected: 'Lien rejeté',
        inserted: 'Lien inséré dans l\'article',
      };
      toast.success(statusMsg[variables.status]);
    },
    onError: (error: Error) => {
      toast.error('Erreur', { description: error.message });
    },
  });
}

// ============================================================================
// UPDATE LINK STATUS
// ============================================================================

interface UpdateLinkParams {
  id: string;
  status: InternalLinkStatus;
  anchor_text?: string;
  source_article_id: string; // for cache invalidation
}

export function useUpdateLinkStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, anchor_text }: UpdateLinkParams) => {
      const res = await fetch('/api/linkbuilder/save-link', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, anchor_text }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
        throw new Error(err.error || `Erreur ${res.status}`);
      }

      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: linkbuilderKeys.links(variables.source_article_id),
      });
      queryClient.invalidateQueries({
        queryKey: linkbuilderKeys.stats(variables.source_article_id),
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur', { description: error.message });
    },
  });
}
