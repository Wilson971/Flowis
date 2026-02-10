"use client";

import { useState, useCallback } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { ProductImage } from "../types";

interface UseImageGalleryOptions {
    images: ProductImage[];
    onImagesChange: (images: ProductImage[]) => void;
    maxImages: number;
}

/**
 * Hook personnalisé pour la logique métier de la galerie d'images
 */
export const useImageGallery = ({
    images,
    onImagesChange,
    maxImages,
}: UseImageGalleryOptions) => {
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);

    // Images triées par ordre
    const sortedImages = [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Image principale (première de la liste triée)
    const primaryImage = sortedImages[0] ?? null;

    // Images de la galerie (sans l'image principale)
    const galleryImages = sortedImages.slice(1);

    // Définir une image comme principale
    const setPrimaryImage = useCallback((imageId: string | number) => {
        const updatedImages = images.map((img) => ({
            ...img,
            isPrimary: img.id === imageId,
            order: img.id === imageId ? 0 : (img.order ?? 0) + 1,
        }));

        // Re-trier pour mettre la nouvelle principale en premier
        const sorted = updatedImages.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        // Réassigner les ordres séquentiellement
        const reordered = sorted.map((img, index) => ({
            ...img,
            order: index,
            isPrimary: index === 0,
        }));

        onImagesChange(reordered);
    }, [images, onImagesChange]);

    // Supprimer une image
    const deleteImage = useCallback((imageId: string | number) => {
        const filtered = images.filter((img) => img.id !== imageId);

        // Réassigner les ordres
        const reordered = filtered.map((img, index) => ({
            ...img,
            order: index,
            isPrimary: index === 0,
        }));

        onImagesChange(reordered);
    }, [images, onImagesChange]);

    // Réordonner les images (après drag & drop)
    const reorderImages = useCallback((oldIndex: number, newIndex: number) => {
        const reordered = arrayMove(sortedImages, oldIndex, newIndex);

        // Réassigner les ordres et isPrimary
        const updated = reordered.map((img, index) => ({
            ...img,
            order: index,
            isPrimary: index === 0,
        }));

        onImagesChange(updated);
    }, [sortedImages, onImagesChange]);

    // Ouvrir le preview (par ID)
    const openPreview = useCallback((imageId: string | number) => {
        const index = sortedImages.findIndex((img) => img.id === imageId);
        if (index !== -1) {
            setPreviewIndex(index);
        }
    }, [sortedImages]);

    // Naviguer dans le preview
    const navigatePreview = useCallback((direction: 'prev' | 'next') => {
        if (previewIndex === null) return;

        const newIndex = direction === 'next'
            ? (previewIndex + 1) % sortedImages.length
            : (previewIndex - 1 + sortedImages.length) % sortedImages.length;

        setPreviewIndex(newIndex);
    }, [previewIndex, sortedImages.length]);

    // Fermer le preview
    const closePreview = useCallback(() => {
        setPreviewIndex(null);
    }, []);

    // Peut-on ajouter plus d'images ?
    const canAddMore = images.length < maxImages;

    return {
        sortedImages,
        primaryImage,
        galleryImages,
        previewIndex,
        setPrimaryImage,
        deleteImage,
        reorderImages,
        openPreview,
        navigatePreview,
        closePreview,
        canAddMore,
    };
};
