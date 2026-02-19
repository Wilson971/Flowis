/**
 * useVariationImages - Hook pour l'upload et la gestion des images de variations
 *
 * Fixes:
 * - Writes to `image` column (JSONB) instead of non-existent `image_url`
 * - Adds client-side compression via browser-image-compression
 * - Returns VariationImage object compatible with WooCommerce format
 */
import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import type { VariationImage } from "@/hooks/products/useProductVariations";

interface UseVariationImageUploadOptions {
    productId: string;
}

export function useVariationImageUpload({ productId }: UseVariationImageUploadOptions) {
    const supabase = createClient();
    const [uploadingVariationId, setUploadingVariationId] = useState<string | null>(null);

    const uploadImage = useCallback(
        async (file: File): Promise<VariationImage | null> => {
            try {
                // Compress the image before upload
                const compressed = await imageCompression(file, {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1200,
                    useWebWorker: true,
                });

                const ext = file.name.split(".").pop() || "jpg";
                const fileName = `${productId}/variations/${Date.now()}.${ext}`;

                const { data, error } = await supabase.storage
                    .from("product-images")
                    .upload(fileName, compressed, {
                        cacheControl: "3600",
                        upsert: false,
                    });

                if (error) throw error;

                const {
                    data: { publicUrl },
                } = supabase.storage.from("product-images").getPublicUrl(data.path);

                const variationImage: VariationImage = {
                    id: Date.now(),
                    src: publicUrl,
                    name: file.name,
                    alt: "",
                };

                return variationImage;
            } catch (err) {
                console.error("Variation image upload error:", err);
                toast.error("Erreur lors de l'upload de l'image");
                return null;
            }
        },
        [productId, supabase]
    );

    /**
     * Upload an image for a specific variation and update the local state.
     * Returns the VariationImage object to be set via updateVariationField.
     */
    const handleUpload = useCallback(
        async (
            localId: string,
            file: File,
            onSuccess: (localId: string, image: VariationImage) => void
        ) => {
            setUploadingVariationId(localId);
            try {
                const result = await uploadImage(file);
                if (result) {
                    onSuccess(localId, result);
                    toast.success("Image de variation mise à jour");
                }
            } finally {
                setUploadingVariationId(null);
            }
        },
        [uploadImage]
    );

    return {
        handleUpload,
        uploadingVariationId,
    };
}
