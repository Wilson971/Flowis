import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { SearchIntent } from '../types/keywords';

interface SaveKeywordParams {
  keyword: string;
  search_volume?: number | null;
  keyword_difficulty?: number | null;
  cpc?: number | null;
  intent?: SearchIntent | null;
  source?: string | null;
  product_id?: string | null;
  article_id?: string | null;
}

export function useSaveKeyword() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (params: SaveKeywordParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('saved_keywords')
        .upsert(
          {
            tenant_id: user.id,
            keyword: params.keyword,
            search_volume: params.search_volume ?? null,
            keyword_difficulty: params.keyword_difficulty ?? null,
            cpc: params.cpc ?? null,
            intent: params.intent ?? null,
            source: params.source ?? null,
            product_id: params.product_id ?? null,
            article_id: params.article_id ?? null,
          },
          { onConflict: 'tenant_id,keyword' },
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-keywords'] });
      toast.success('Mot-clé sauvegardé');
    },
    onError: (error: Error) => {
      toast.error('Erreur sauvegarde mot-clé', {
        description: error.message,
      });
    },
  });
}
