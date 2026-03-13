import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function useDeleteKeyword() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_keywords')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-keywords'] });
      toast.success('Mot-clé supprimé');
    },
    onError: (error: Error) => {
      toast.error('Erreur suppression mot-clé', {
        description: error.message,
      });
    },
  });
}
