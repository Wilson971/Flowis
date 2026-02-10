/**
 * useBlogPosts - Hook pour la gestion des articles de blog
 *
 * FIXED: Migrated from 'blog_posts' (empty table) to 'blog_articles' (actual data)
 * Added store_id filter for multi-store support
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { BlogPost, CreateBlogPostParams } from '@/types/blog';
import { toast } from 'sonner';
import { blogArticlesKeys } from './useBlogArticles';

export function useBlogPosts(storeId?: string) {
    const supabase = createClient();
    const queryClient = useQueryClient();

    const { data: posts = [], isLoading } = useQuery({
        queryKey: ['blog-posts', storeId],
        queryFn: async () => {
            let query = supabase
                .from('blog_articles')  // FIXED: Use blog_articles instead of blog_posts
                .select('*')
                .eq('archived', false)
                .neq('status', 'auto_draft')
                .order('created_at', { ascending: false });

            // FIXED: Add store_id filter
            if (storeId) {
                query = query.eq('store_id', storeId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as BlogPost[];
        },
        enabled: !!storeId, // Only fetch when storeId is provided
    });

    const createPost = useMutation({
        mutationFn: async (params: CreateBlogPostParams) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Non authentifié");

            if (!storeId && !params.store_id) {
                throw new Error("store_id requis pour créer un article");
            }

            const slug = params.slug || params.title.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');

            const { data, error } = await supabase
                .from('blog_articles')  // FIXED: Use blog_articles
                .insert({
                    title: params.title,
                    slug,
                    status: params.status || 'draft',
                    author_id: user.id,
                    store_id: params.store_id || storeId,
                    tenant_id: user.id,
                    content: '',
                    excerpt: '',
                    tags: [],
                    archived: false,
                })
                .select()
                .single();

            if (error) throw error;
            return data as BlogPost;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blog-posts', storeId] });
            queryClient.invalidateQueries({ queryKey: blogArticlesKeys.all });
            toast.success('Article créé avec succès');
        },
        onError: (error) => {
            toast.error("Erreur lors de la création de l'article");
            console.error(error);
        }
    });

    const deletePost = useMutation({
        mutationFn: async (id: string) => {
            // Soft delete by setting archived = true
            const { error } = await supabase
                .from('blog_articles')  // FIXED: Use blog_articles
                .update({ archived: true })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blog-posts', storeId] });
            queryClient.invalidateQueries({ queryKey: blogArticlesKeys.all });
            toast.success('Article supprimé');
        }
    });

    return {
        posts,
        isLoading,
        createPost,
        deletePost
    };
}
