"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { motion } from "framer-motion";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductFormValues, ProductImage as SchemaImage } from "../../schemas/product-schema";
import {
    ProductImageGallery,
    ProductImage,
    UploadingItem
} from "@/components/products/ProductImageGallery";
import { useProductEditContext } from "../../context/ProductEditContext";
import { SceneStudioDialog, type StudioProduct } from "@/features/photo-studio/components/SceneStudioDialog";

/**
 * ProductMediaTab
 * 
 * Onglet médias avec galerie d'images complète:
 * - Upload avec compression
 * - Drag & drop
 * - Édition alt text
 */
export const ProductMediaTab = () => {
    const { control, setValue, getValues } = useFormContext<ProductFormValues>();
    const { productId, product } = useProductEditContext();

    const watchedImages = useWatch({ control, name: "images" }) || [];
    const [uploadingItems, setUploadingItems] = useState<UploadingItem[]>([]);
    const [studioOpen, setStudioOpen] = useState(false);

    // Build StudioProduct for the dialog
    const studioProduct: StudioProduct | null = useMemo(() => {
        if (!product) return null;
        const metadata = product.metadata as Record<string, unknown> | undefined;
        const metaImages = (metadata?.images as Array<{ id?: string; src?: string; alt?: string }>) || [];
        return {
            id: product.id,
            name: product.title,
            images: metaImages.map((img, i) => ({
                id: img.id?.toString() || `img-${i}`,
                src: img.src || product.image_url || '',
                alt: img.alt || product.title,
            })),
            category: (metadata?.categories as Array<{ name: string }>)?.[0]?.name,
            store_id: (product as Record<string, unknown>).store_id as string | undefined,
        };
    }, [product]);

    // Handle saving a generated image from the Studio to the product form
    const handleStudioSaveImage = useCallback(async (imageUrl: string, _productId: string) => {
        const currentImages = getValues("images") || [];
        const newImage: SchemaImage = {
            id: `studio-${Date.now()}`,
            src: imageUrl,
            alt: '',
            order: currentImages.length,
            isPrimary: currentImages.length === 0,
            name: 'Studio Generated',
        };
        setValue("images", [...currentImages, newImage], { shouldDirty: true });
        toast.success("Image ajoutee", { description: "L'image generee a ete ajoutee a la galerie." });
    }, [getValues, setValue]);

    // Convertir les images du formulaire vers le format de la galerie
    // IMPORTANT: Utiliser index dans l'ID pour éviter les clés React dupliquées
    // Les images WooCommerce peuvent avoir le même ID si elles sont réutilisées
    const galleryImages: ProductImage[] = watchedImages.map((img: SchemaImage, index: number) => ({
        id: `${img.id?.toString() || 'img'}-${index}`,
        url: img.src || '',
        alt: img.alt || '',
        order: img.order ?? index,
        isPrimary: img.isPrimary ?? index === 0,
        name: img.name || '',
    }));

    // Gérer le changement d'images
    const handleImagesChange = useCallback((newImages: ProductImage[]) => {
        const formImages: SchemaImage[] = newImages.map((img, index) => ({
            id: img.id,
            src: img.url,
            alt: img.alt || '',
            order: index,
            isPrimary: index === 0,
            name: img.name || '',
        }));

        setValue("images", formImages, { shouldDirty: true });
    }, [setValue]);

    // Gérer l'upload avec compression
    const handleUpload = useCallback(async (files: File[]) => {
        const compressionOptions = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
        };

        // Créer des items d'upload pour afficher la progression
        const newUploadingItems: UploadingItem[] = files.map((file, index) => ({
            id: `upload-${Date.now()}-${index}`,
            file,
            progress: 0,
            status: 'pending' as const,
        }));

        setUploadingItems(prev => [...prev, ...newUploadingItems]);

        const uploadedImages: ProductImage[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const uploadId = newUploadingItems[i].id;

            try {
                // Mettre à jour le statut
                setUploadingItems(prev =>
                    prev.map(item =>
                        item.id === uploadId
                            ? { ...item, status: 'uploading' as const, progress: 20 }
                            : item
                    )
                );

                // Compresser l'image
                const compressedFile = await imageCompression(file, compressionOptions);

                setUploadingItems(prev =>
                    prev.map(item =>
                        item.id === uploadId
                            ? { ...item, progress: 50 }
                            : item
                    )
                );

                // Upload vers Supabase Storage
                // Générer un nom de fichier unique
                const fileExt = file.name.split('.').pop();
                const fileName = `${productId}/${Date.now()}-${i}.${fileExt}`;

                // On suppose l'existence d'un client supabase accessible (via import)
                // Comme on est dans un composant "use client", on peut importer createClient
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();

                const { data, error } = await supabase.storage
                    .from('product-images') // Bucket name
                    .upload(fileName, compressedFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (error) throw error;

                // Récupérer l'URL publique
                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName);

                setUploadingItems(prev =>
                    prev.map(item =>
                        item.id === uploadId
                            ? { ...item, progress: 100, status: 'completed' as const }
                            : item
                    )
                );

                uploadedImages.push({
                    id: `new-${Date.now()}-${i}`,
                    url: publicUrl, // URL persistante
                    alt: '',
                    order: galleryImages.length + i,
                    isPrimary: galleryImages.length === 0 && i === 0,
                    name: file.name
                });

            } catch (error) {
                console.error('Erreur compression/upload:', error);
                setUploadingItems(prev =>
                    prev.map(item =>
                        item.id === uploadId
                            ? { ...item, status: 'error' as const, error: 'Erreur upload' }
                            : item
                    )
                );
                toast.error(`Erreur d'upload: ${file.name}`);
            }
        }

        // Ajouter les images uploadées
        if (uploadedImages.length > 0) {
            handleImagesChange([...galleryImages, ...uploadedImages]);
        }

        // Nettoyer les items terminés après 2 secondes
        setTimeout(() => {
            setUploadingItems(prev =>
                prev.filter(item => item.status !== 'completed')
            );
        }, 2000);

    }, [galleryImages, handleImagesChange, productId]);

    // Mettre à jour le texte alt
    const handleUpdateAlt = useCallback((image: ProductImage, alt: string) => {
        const updated = galleryImages.map(img =>
            img.id === image.id ? { ...img, alt } : img
        );
        handleImagesChange(updated);
    }, [galleryImages, handleImagesChange]);

    // Supprimer une image
    const handleDelete = useCallback(async (image: ProductImage) => {
        // TODO: Supprimer de Supabase Storage si nécessaire
        const filtered = galleryImages.filter(img => img.id !== image.id);
        handleImagesChange(filtered);
    }, [galleryImages, handleImagesChange]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="space-y-4"
        >
            {/* Studio Button */}
            {studioProduct && (
                <div className="flex justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setStudioOpen(true)}
                        className="gap-2 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                    >
                        <Camera className="h-4 w-4" />
                        Ouvrir le Studio
                    </Button>
                </div>
            )}

            <ProductImageGallery
                images={galleryImages}
                uploadingItems={uploadingItems}
                onImagesChange={handleImagesChange}
                onUpload={handleUpload}
                onUpdateAlt={handleUpdateAlt}
                onDelete={handleDelete}
                maxImages={15}
                productTitle={product?.title}
                productId={productId}
                allowDelete={true}
                allowReorder={true}
                showPrimaryBadge={true}
            />

            {/* Scene Studio Dialog */}
            {studioProduct && (
                <SceneStudioDialog
                    open={studioOpen}
                    onOpenChange={setStudioOpen}
                    product={studioProduct}
                    onSaveImage={handleStudioSaveImage}
                />
            )}
        </motion.div>
    );
};
