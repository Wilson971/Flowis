/**
 * useBlogGeneration - Hook pour générer du contenu via l'IA
 */
import { useMutation } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface GeneratePostParams {
    topic: string;
    tone?: string;
    keywords?: string[];
}

export function useBlogGeneration() {
    const supabase = createClient();

    const generatePost = useMutation({
        mutationFn: async ({ topic, tone = 'professional', keywords = [] }: GeneratePostParams) => {
            // Call Edge Function 'generate-blog-post'
            // For now, mocking the response or setting up logic
            // In real scenario:
            /*
            const { data, error } = await supabase.functions.invoke('generate-blog-post', {
                body: { topic, tone, keywords }
            });
            if (error) throw error;
            return data; 
            */

            // Mocking delay
            await new Promise(resolve => setTimeout(resolve, 3000));

            return {
                title: `Guide complet : ${topic}`,
                slug: topic.toLowerCase().replace(/ /g, '-'),
                content: `
                 <h2>Introduction</h2>
                 <p>Bienvenue dans ce guide complet sur <strong>${topic}</strong>.</p>
                 <p>Nous allons explorer les meilleures pratiques...</p>
                 <h3>Pourquoi c'est important ?</h3>
                 <p>Les mots-clés comme ${keywords.join(', ')} sont essentiels.</p>
               `,
                excerpt: `Découvrez tout savoir sur ${topic} dans cet article détaillé.`,
                headers: {
                    seo_title: `${topic} - Guide Ultime`,
                    seo_description: `Tout ce que vous devez savoir sur ${topic}.`
                }
            };
        },
        onSuccess: () => {
            toast.success('Contenu généré par l\'IA');
        },
        onError: (error) => {
            toast.error('Erreur lors de la génération');
            console.error(error);
        }
    });

    return {
        generatePost,
        isGenerating: generatePost.isPending
    };
}
