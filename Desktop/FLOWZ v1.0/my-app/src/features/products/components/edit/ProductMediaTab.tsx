"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { motion } from "framer-motion";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { Camera, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductFormValues, ProductImage as SchemaImage } from "../../schemas/product-schema";
import {
    ProductImageGallery,
    ProductImage,
    UploadingItem
} from "@/components/products/ProductImageGallery";
import { useProductEditContext } from "../../context/ProductEditContext";
import { SceneStudioDialog, type StudioProduct } from "@/features/photo-studio/components/SceneStudioDialog";
import { ImageAltSuggestionModal, type ImageAltItem } from "@/components/products/ui/ImageAltSuggestionModal";

/**
 * ProductMediaTab
 *
 * Onglet médias avec galerie d'images complète:
 * - Upload avec compression
 * - Drag & drop
 * - Édition alt text
 * - Approbation IA des alt texts
 */
export const ProductMediaTab = () => {
    const { control, setValue, getValues } = useFormContext<ProductFormValues>();
    const { productId, product, remainingProposals, draftActions, contentBuffer } = useProductEditContext();

    const watchedImages = useWatch({ control, name: "images" }) || [];
    const [uploadingItems, setUploadingItems] = useState<UploadingItem[]>([]);
    const [studioOpen, setStudioOpen] = useState(false);
    const [altModalOpen, setAltModalOpen] = useState(false);

    const hasAltDraft = remainingProposals.includes("images");

    // Build alt text comparison data for the modal
    // IMPORTANT: Use watchedImages (reactive via useWatch) instead of getValues("images")
    // to ensure the memo recomputes when form images are populated after initial render.
    const altSuggestionImages: ImageAltItem[] = useMemo(() => {
        if (!hasAltDraft || !contentBuffer?.draft_generated_content?.images) return [];
        if (!watchedImages || watchedImages.length === 0) return [];

        const draftImages = contentBuffer.draft_generated_content.images as Array<{ id?: string; src?: string; alt?: string }>;

        return draftImages
            .map((draftImg, index) => {
                // Match by src URL first (stable across formats), fall back to index
                const currentImg = watchedImages.find(
                    (img) => img.src && draftImg.src && img.src === draftImg.src
                ) || watchedImages[index];
                if (!currentImg) return null;

                const currentAlt = currentImg.alt || "";
                const suggestedAlt = draftImg.alt || "";

                // Only include images where alt text actually differs
                if (!suggestedAlt || currentAlt === suggestedAlt) return null;

                return {
                    id: `${currentImg.id?.toString() || 'img'}-alt-${index}`,
                    src: currentImg.src || "",
                    currentAlt,
                    suggestedAlt,
                };
            })
            .filter((item): item is ImageAltItem => item !== null);
    }, [hasAltDraft, contentBuffer, watchedImages]);

    // Handle accepting a single image's alt text
    const handleAcceptSingleAlt = useCallback(async (imageIndex: number, editedAlt?: string) => {
        const currentImages = getValues("images") || [];
        const altItem = altSuggestionImages[imageIndex];
        if (!altItem) return;

        // Find the form image matching this alt item
        const formIndex = currentImages.findIndex(img => img.id?.toString() === altItem.id || img.src === altItem.src);
        if (formIndex === -1) return;

        const newAlt = editedAlt ?? altItem.suggestedAlt;
        const updatedImages = [...currentImages];
        updatedImages[formIndex] = { ...updatedImages[formIndex], alt: newAlt };
        setValue("images", updatedImages, { shouldDirty: true });
    }, [altSuggestionImages, getValues, setValue]);

    // Handle rejecting a single image's alt text (no-op locally, just visual)
    const handleRejectSingleAlt = useCallback(async (_imageIndex: number) => {
        // Individual rejection is visual-only in the modal
    }, []);

    // Accept all image alt texts and clear the draft
    const handleAcceptAllAlts = useCallback(async () => {
        const currentImages = getValues("images") || [];
        const draftImages = contentBuffer?.draft_generated_content?.images as Array<{ alt?: string }> | undefined;
        if (!draftImages) return;

        const updatedImages = currentImages.map((img, index) => {
            const draftAlt = draftImages[index]?.alt;
            if (draftAlt && draftAlt !== (img.alt || "")) {
                return { ...img, alt: draftAlt };
            }
            return img;
        });

        setValue("images", updatedImages, { shouldDirty: true });

        // Accept on the server to clear the draft
        await draftActions.handleAcceptField("images");
        toast.success("Alt texts acceptés", { description: "Tous les alt texts ont été mis à jour." });
    }, [contentBuffer, draftActions, getValues, setValue]);

    // Reject all alt texts
    const handleRejectAllAlts = useCallback(async () => {
        await draftActions.handleRejectField("images");
        toast.info("Alt texts rejetés", { description: "Les suggestions ont été supprimées." });
    }, [draftActions]);

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
            {/* AI Alt Text Suggestions Banner */}
            {hasAltDraft && altSuggestionImages.length > 0 && (
                <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">
                            {altSuggestionImages.length} suggestion{altSuggestionImages.length > 1 ? "s" : ""} alt text
                        </span>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAltModalOpen(true)}
                        className="gap-1.5 h-7 px-2.5 text-xs font-semibold border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        Voir les suggestions
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
                actionButton={
                    studioProduct ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setStudioOpen(true)}
                            className="gap-2 bg-success/5 text-success border-success/[0.02] hover:bg-success/15 hover:text-success/90 hover:border-success/20 transition-all h-8 px-3 text-xs"
                        >
                            <Camera className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Photo Studio AI</span>
                        </Button>
                    ) : undefined
                }
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

            {/* Image Alt Text Suggestion Modal */}
            <ImageAltSuggestionModal
                open={altModalOpen}
                onOpenChange={setAltModalOpen}
                productTitle={product?.title || "Sans titre"}
                images={altSuggestionImages}
                onAcceptImage={handleAcceptSingleAlt}
                onRejectImage={handleRejectSingleAlt}
                onAcceptAll={handleAcceptAllAlts}
                onRejectAll={handleRejectAllAlts}
                isProcessing={draftActions.isAccepting || draftActions.isRejecting}
            />
        </motion.div>
    );
};
