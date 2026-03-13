import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { KeywordResearchRequest, KeywordResearchResponse } from '../types/keywords';

export function useKeywordResearch() {
  return useMutation({
    mutationFn: async (params: KeywordResearchRequest): Promise<KeywordResearchResponse> => {
      const res = await fetch('/api/seo/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || `Erreur ${res.status}`);
      }

      return res.json();
    },
    onError: (error: Error) => {
      toast.error('Erreur recherche mots-clés', {
        description: error.message,
      });
    },
  });
}
