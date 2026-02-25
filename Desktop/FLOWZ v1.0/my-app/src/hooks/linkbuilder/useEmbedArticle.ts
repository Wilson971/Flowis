/**
 * useEmbedArticle Hook
 *
 * Generates or refreshes the embedding vector for an article.
 * Also handles bulk embedding for all articles in a store.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { linkbuilderKeys } from './useLinkSuggestions';
import { blogArticlesKeys } from '@/hooks/blog/useBlogArticles';
import type { EmbedArticleResponse, BulkEmbedResponse } from '@/types/linkbuilder';
import { toast } from 'sonner';

// ============================================================================
// EMBED SINGLE ARTICLE
// ============================================================================

export function useEmbedArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articleId: string): Promise<EmbedArticleResponse> => {
      const res = await fetch('/api/linkbuilder/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
        throw new Error(err.error || `Erreur ${res.status}`);
      }

      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate suggestions to re-fetch with updated embedding
      queryClient.invalidateQueries({
        queryKey: linkbuilderKeys.suggestions(data.article_id),
      });
      toast.success('Embedding mis à jour', {
        description: 'Les suggestions de liens seront recalculées.',
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur d\'embedding', { description: error.message });
    },
  });
}

// ============================================================================
// BULK EMBED ALL ARTICLES
// ============================================================================

export function useBulkEmbed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storeId: string): Promise<BulkEmbedResponse> => {
      const res = await fetch('/api/linkbuilder/bulk-embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: storeId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
        throw new Error(err.error || `Erreur ${res.status}`);
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: linkbuilderKeys.all });
      queryClient.invalidateQueries({ queryKey: blogArticlesKeys.all });

      if (data.embedded > 0) {
        toast.success('Embeddings générés', {
          description: `${data.embedded}/${data.total} articles indexés pour le maillage interne.`,
        });
      } else if (data.total === 0) {
        toast.info('Tous les articles sont déjà indexés.');
      }

      if (data.failed > 0) {
        toast.warning(`${data.failed} articles n'ont pas pu être indexés.`);
      }
    },
    onError: (error: Error) => {
      toast.error('Erreur d\'indexation', { description: error.message });
    },
  });
}
