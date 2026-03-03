'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { STALE_TIMES } from '@/lib/query-config';

export interface SearchResult {
  id: string;
  type: 'product' | 'article' | 'category' | 'store';
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href: string;
}

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ['global-search', query],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!query || query.length < 2) return [];
      const supabase = createClient();

      const [products, articles] = await Promise.all([
        supabase
          .from('products')
          .select('id, title, image_url')
          .ilike('title', `%${query}%`)
          .limit(5),
        supabase
          .from('blog_posts')
          .select('id, title, featured_image_url')
          .ilike('title', `%${query}%`)
          .limit(5),
      ]);

      return [
        ...(products.data?.map((p) => ({
          id: p.id,
          type: 'product' as const,
          title: p.title || 'Sans titre',
          imageUrl: p.image_url,
          href: `/app/products/${p.id}/edit`,
        })) ?? []),
        ...(articles.data?.map((a) => ({
          id: a.id,
          type: 'article' as const,
          title: a.title || 'Sans titre',
          imageUrl: a.featured_image_url,
          href: `/app/blog/editor/${a.id}`,
        })) ?? []),
      ];
    },
    enabled: query.length >= 2,
    staleTime: STALE_TIMES.REALTIME,
  });
}
