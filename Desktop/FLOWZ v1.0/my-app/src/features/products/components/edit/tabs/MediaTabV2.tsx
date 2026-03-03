"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { motion } from "framer-motion";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { Camera, ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
import { ProductFormValues, ProductImage as SchemaImage } from "../../../schemas/product-schema";
import {
    ProductImageGallery,
    ProductImage,
    UploadingItem
} from "@/components/products/ProductImageGallery";
import { useProductEditContext } from "../../../context/ProductEditContext";
import { isFieldValidatedByAI } from "@/lib/productHelpers";
import { SceneStudioDialog, type StudioProduct } from "@/features/photo-studio/components/SceneStudioDialog";
import { ImageAltSuggestionModal, type ImageAltItem } from "@/components/products/ui/ImageAltSuggestionModal";

/**
 * MediaTabV2
 *
 * Vercel Pro card shell wrapping the full media tab logic:
 * - Upload with compression
 * - Drag & drop
 * - Alt text editing
 * - AI alt text approval
 * - Photo Studio integration
 */
export const MediaTabV2 = () => {
    const { control, setValue, getValues } = useFormContext<ProductFormValues>();
    const { productId, product, remainingProposals, draftActions, contentBuffer, generationManifest } = useProductEditContext();
    const isValidated = (field: string) => isFieldValidatedByAI(generationManifest, field);

    const watchedImages = useWatch({ control, name: "images" }) || [];
    const [uploadingItems, setUploadingItems] = useState<UploadingItem[]>([]);
    const [studioOpen, setStudioOpen] = useState(false);
    const [altModalOpen, setAltModalOpen] = useState(false);

    const hasAltDraft = remainingProposals.includes("images");

    // Build alt text comparison data for the modal
    const altSuggestionImages: ImageAltItem[] = useMemo(() => {
        if (!hasAltDraft || !contentBuffer?.draft_generated_content?.images) return [];
        if (!watchedImages || watchedImages.length === 0) return [];

        const draftImages = contentBuffer.draft_generated_content.images as Array<{ id?: string; src?: string; alt?: string }>;

        return draftImages
            .map((draftImg, index) => {
                const currentImg = watchedImages.find(
                    (img) => img.src && draftImg.src && img.src === draftImg.src
                ) || watchedImages[index];
                if (!currentImg) return null;

                const currentAlt = currentImg.alt || "";
                const suggestedAlt = draftImg.alt || "";

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

    // Convert form images to gallery format
    const galleryImages: ProductImage[] = watchedImages.map((img: SchemaImage, index: number) => ({
        id: `${img.id?.toString() || 'img'}-${index}`,
        url: img.src || '',
        alt: img.alt || '',
        order: img.order ?? index,
        isPrimary: img.isPrimary ?? index === 0,
        name: img.name || '',
    }));

    // Handle image changes
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

    // Handle upload with compression
    const handleUpload = useCallback(async (files: File[]) => {
        const compressionOptions = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
        };

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
                setUploadingItems(prev =>
                    prev.map(item =>
                        item.id === uploadId
                            ? { ...item, status: 'uploading' as const, progress: 20 }
                            : item
                    )
                );

                const compressedFile = await imageCompression(file, compressionOptions);

                setUploadingItems(prev =>
                    prev.map(item =>
                        item.id === uploadId
                            ? { ...item, progress: 50 }
                            : item
                    )
                );

                const fileExt = file.name.split('.').pop();
                const fileName = `${productId}/${Date.now()}-${i}.${fileExt}`;

                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();

                const { data, error } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, compressedFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (error) throw error;

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
                    url: publicUrl,
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

        if (uploadedImages.length > 0) {
            handleImagesChange([...galleryImages, ...uploadedImages]);
        }

        setTimeout(() => {
            setUploadingItems(prev =>
                prev.filter(item => item.status !== 'completed')
            );
        }, 2000);

    }, [galleryImages, handleImagesChange, productId]);

    // Update alt text
    const handleUpdateAlt = useCallback((image: ProductImage, alt: string) => {
        const updated = galleryImages.map(img =>
            img.id === image.id ? { ...img, alt } : img
        );
        handleImagesChange(updated);
    }, [galleryImages, handleImagesChange]);

    // Delete an image
    const handleDelete = useCallback(async (image: ProductImage) => {
        const filtered = galleryImages.filter(img => img.id !== image.id);
        handleImagesChange(filtered);
    }, [galleryImages, handleImagesChange]);

    return (
        <motion.div
            {...motionTokens.variants.slideUp}
            className="space-y-4"
        >
            {/* Vercel Pro Card Shell */}
            <div id="field-images" className={cn(
                "rounded-xl border border-border/40 bg-card relative group overflow-hidden"
            )}>
                <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />
                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-3 p-6 pb-4 border-b border-border/30">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
                            <ImageIcon className="h-[18px] w-[18px] text-foreground/70" />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Media</h3>
                            <p className="text-xs text-muted-foreground">Images et galerie du produit</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
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
                    </div>
                </div>
            </div>

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
