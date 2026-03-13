import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { SavedKeyword } from '../types/keywords';

interface UseSavedKeywordsParams {
  productId?: string;
  articleId?: string;
}

function savedKeywordsKey(filters?: UseSavedKeywordsParams) {
  return ['saved-keywords', filters] as const;
}

export { savedKeywordsKey };

export function useSavedKeywords(filters?: UseSavedKeywordsParams) {
  const supabase = createClient();

  return useQuery({
    queryKey: savedKeywordsKey(filters),
    queryFn: async () => {
      let query = supabase
        .from('saved_keywords')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }
      if (filters?.articleId) {
        query = query.eq('article_id', filters.articleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SavedKeyword[];
    },
  });
}
