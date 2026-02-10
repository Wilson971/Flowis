/**
 * useBlogPost - Hook pour un article unique et ses mises à jour
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { BlogPost } from '@/types/blog';
import { toast } from 'sonner';

export function useBlogPost(id: string) {
    const supabase = createClient();
    const queryClient = useQueryClient();

    const { data: post, isLoading } = useQuery({
        queryKey: ['blog-post', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as BlogPost;
        },
        enabled: !!id && id !== 'new'
    });

    const updatePost = useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: Partial<BlogPost> }) => {
            const { error } = await supabase
                .from('blog_posts')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['blog-post', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
            toast.success('Article mis à jour');
        },
        onError: (error) => {
            toast.error('Erreur de sauvegarde');
            console.error(error);
        }
    });

    return {
        post,
        isLoading,
        updatePost
    };
}
