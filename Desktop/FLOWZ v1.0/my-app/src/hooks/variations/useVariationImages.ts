/**
 * useVariationImages - Hook pour la gestion des images de variations
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface AssignImageParams {
    variationId: string;
    imageId: string; // ID from product_images table or similar
    imageUrl: string;
}

export function useVariationImages() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    const uploadImage = useMutation({
        mutationFn: async ({ file, productId }: { file: File, productId: string }) => {
            const fileName = `${productId}/${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage
                .from('product-images') // Bucket name
                .upload(fileName, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);

            return { path: data.path, publicUrl };
        }
    });

    const assignImageToVariation = useMutation({
        mutationFn: async ({ variationId, imageUrl }: AssignImageParams) => {
            const { error } = await supabase
                .from('product_variations')
                .update({ image_url: imageUrl }) // Assuming column exists
                .eq('id', variationId);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Image assignée');
            // Invalidate queries would go here
        },
        onError: (error) => {
            toast.error("Erreur lors de l'assignation");
            console.error(error);
        }
    });

    return {
        uploadImage,
        assignImageToVariation
    };
}
