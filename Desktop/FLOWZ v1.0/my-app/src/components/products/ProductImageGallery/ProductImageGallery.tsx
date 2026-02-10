"use client";

import React, { useState, useCallback } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Trash2, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { ProductImage, ProductImageGalleryProps, UploadingItem } from "./types";
import { useImageGallery } from "./hooks/useImageGallery";
import { validateImageFiles } from "./utils/imageValidation";
import { ImageThumbnail } from "./ImageThumbnail";
import { AddImageButton } from "./AddImageButton";

/**
 * ProductImageGallery
 * 
 * Galerie d'images produit avec:
 * - Drag & drop pour réordonnancement
 * - Upload avec compression
 * - Édition alt text
 * - Sélection multiple
 */
export const ProductImageGallery = ({
    images,
    uploadingItems = [],
    onImagesChange,
    onUpload,
    onUpdateAlt,
    onDownload,
    onDelete,
    maxImages = 15,
    isLoading = false,
    isDisabled = false,
    allowDelete = true,
    allowReorder = true,
    showPrimaryBadge = true,
    productTitle,
    productId,
}: ProductImageGalleryProps) => {
    // États locaux
    const [selectedImages, setSelectedImages] = useState<Set<string | number>>(new Set());
    const [imageToDelete, setImageToDelete] = useState<string | number | null>(null);
    const [imagesToDelete, setImagesToDelete] = useState<(string | number)[] | null>(null);
    const [editingAltImage, setEditingAltImage] = useState<ProductImage | null>(null);
    const [editingAltText, setEditingAltText] = useState("");

    // Hook personnalisé pour la logique
    const {
        sortedImages,
        primaryImage,
        setPrimaryImage,
        deleteImage,
        reorderImages,
        openPreview,
        canAddMore,
    } = useImageGallery({
        images,
        onImagesChange,
        maxImages,
    });

    // Configuration des sensors pour drag & drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Gérer la fin du drag
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = sortedImages.findIndex((img) => img.id === active.id);
            const newIndex = sortedImages.findIndex((img) => img.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                reorderImages(oldIndex, newIndex);
            }
        }
    };

    // Gérer l'upload avec validation
    const handleFilesSelected = async (files: File[]) => {
        const validation = validateImageFiles(files, {
            maxCount: maxImages,
            currentCount: images.length,
        });

        if (validation.errors.length > 0) {
            validation.errors.forEach((error) => {
                toast.error("Erreur de validation", {
                    description: error.message,
                });
            });
        }

        if (validation.validFiles.length > 0) {
            try {
                await onUpload(validation.validFiles);
                toast.success("Images ajoutées", {
                    description: `${validation.validFiles.length} image(s) ajoutée(s)`,
                });
            } catch (error) {
                toast.error("Erreur d'upload", {
                    description: "Impossible d'ajouter les images",
                });
            }
        }
    };

    // Gérer la sélection
    const handleToggleSelection = (imageId: string | number) => {
        setSelectedImages((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(imageId)) {
                newSet.delete(imageId);
            } else {
                newSet.add(imageId);
            }
            return newSet;
        });
    };

    // Supprimer une image (avec confirmation)
    const handleDeleteRequest = (imageId: string | number) => {
        if (!allowDelete || isDisabled) return;
        setImageToDelete(imageId);
    };

    const handleConfirmDelete = async () => {
        if (!imageToDelete) return;

        const imageToDeleteObj = images.find((img) => img.id === imageToDelete);
        if (!imageToDeleteObj) {
            setImageToDelete(null);
            return;
        }

        try {
            if (onDelete) {
                await onDelete(imageToDeleteObj);
            } else {
                deleteImage(imageToDelete);
            }
            toast.success("Image supprimée");
            setImageToDelete(null);
        } catch (error) {
            toast.error("Erreur de suppression");
        }
    };

    // Suppression groupée
    const handleDeleteSelected = () => {
        if (selectedImages.size === 0) return;
        setImagesToDelete(Array.from(selectedImages));
    };

    const handleConfirmBatchDelete = async () => {
        if (!imagesToDelete || imagesToDelete.length === 0) return;

        try {
            const imagesToDeleteObjs = images.filter((img) => imagesToDelete.includes(img.id));

            if (onDelete) {
                for (const img of imagesToDeleteObjs) {
                    await onDelete(img);
                }
            } else {
                for (const id of imagesToDelete) {
                    deleteImage(id);
                }
            }

            toast.success(`${imagesToDelete.length} image(s) supprimée(s)`);
            setImagesToDelete(null);
            setSelectedImages(new Set());
        } catch (error) {
            toast.error("Erreur de suppression");
        }
    };

    // Édition alt text
    const handleEditAlt = (imageId: string | number) => {
        const image = images.find((img) => img.id === imageId);
        if (image) {
            setEditingAltImage(image);
            setEditingAltText(image.alt || "");
        }
    };

    const handleSaveAlt = () => {
        if (!editingAltImage) return;

        if (onUpdateAlt) {
            onUpdateAlt(editingAltImage, editingAltText);
        } else {
            const updatedImages = images.map((img) =>
                img.id === editingAltImage.id ? { ...img, alt: editingAltText } : img
            );
            onImagesChange(updatedImages);
        }

        toast.success("Texte alternatif mis à jour");
        setEditingAltImage(null);
        setEditingAltText("");
    };

    // Télécharger
    const handleDownload = (imageId: string | number) => {
        const image = images.find((img) => img.id === imageId);
        if (image) {
            if (onDownload) {
                onDownload(image);
            } else {
                const link = document.createElement("a");
                link.href = image.url || image.src || "";
                link.download = image.alt || "image";
                link.click();
            }
        }
    };

    // Calculer le pourcentage d'images avec alt
    const imagesWithAlt = images.filter((img) => img.alt && img.alt.trim().length > 0).length;
    const altPercentage = images.length > 0 ? Math.round((imagesWithAlt / images.length) * 100) : 0;

    return (
        <>
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden card-elevated">
                {/* Header - Refined Two-Line Pattern */}
                <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5 bg-muted/20">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                                <ImageIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                                    Galerie Média
                                </p>
                                <h3 className="text-sm font-extrabold tracking-tight text-foreground">
                                    Images du produit
                                </h3>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-3 text-xs">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none mb-1">Capacité</span>
                                    <span className="font-mono text-foreground font-bold">
                                        {images.length} / {maxImages}
                                    </span>
                                </div>

                                {images.length > 0 && (
                                    <>
                                        <div className="w-px h-6 bg-border/20" />
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none mb-1">Optimisation Alt</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className={cn(
                                                    "h-1 w-12 rounded-full overflow-hidden bg-muted"
                                                )}>
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-500",
                                                            altPercentage === 100
                                                                ? "bg-success"
                                                                : altPercentage >= 50
                                                                    ? "bg-warning"
                                                                    : "bg-destructive"
                                                        )}
                                                        style={{ width: `${altPercentage}%` }}
                                                    />
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-bold tabular-nums",
                                                    altPercentage === 100 ? "text-success" : "text-muted-foreground"
                                                )}>
                                                    {altPercentage}%
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {selectedImages.size > 0 && (
                                <Badge variant="secondary" className="h-6 px-2 text-[10px] font-bold bg-primary/10 text-primary border-primary/20 uppercase tracking-widest">
                                    {selectedImages.size} Sélection
                                </Badge>
                            )}

                            {uploadingItems.length > 0 && (
                                <Badge className="h-6 px-2 text-[10px] font-bold bg-info/10 text-info border-info/20 uppercase tracking-widest animate-pulse">
                                    {uploadingItems.length} Upload
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={sortedImages.map((img) => img.id)}
                            strategy={rectSortingStrategy}
                        >
                            <div className={cn(
                                "grid gap-3",
                                "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
                            )}>
                                {/* Images */}
                                {sortedImages.map((image, index) => {
                                    const isPrimary = index === 0;

                                    return (
                                        <motion.div
                                            key={image.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className={cn(
                                                "aspect-square",
                                                isPrimary && "col-span-2 row-span-2"
                                            )}
                                        >
                                            <ImageThumbnail
                                                image={image}
                                                isPrimary={isPrimary && showPrimaryBadge}
                                                isSelected={selectedImages.has(image.id)}
                                                onView={() => openPreview(image.id)}
                                                onSetPrimary={() => setPrimaryImage(image.id)}
                                                onDelete={() => handleDeleteRequest(image.id)}
                                                onEditAlt={() => handleEditAlt(image.id)}
                                                onDownload={() => handleDownload(image.id)}
                                                onToggleSelection={() => handleToggleSelection(image.id)}
                                                allowDelete={allowDelete}
                                                className="w-full h-full"
                                            />
                                        </motion.div>
                                    );
                                })}

                                {/* Upload en cours */}
                                {uploadingItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="aspect-square rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 flex items-center justify-center"
                                    >
                                        <div className="text-center">
                                            <RefreshCw className="h-6 w-6 text-primary animate-spin mx-auto mb-2" />
                                            <p className="text-xs text-muted-foreground">{item.progress}%</p>
                                        </div>
                                    </div>
                                ))}

                                {/* Bouton d'ajout */}
                                {canAddMore && (
                                    <div className="aspect-square">
                                        <AddImageButton
                                            onFilesSelected={handleFilesSelected}
                                            disabled={isLoading || isDisabled}
                                            maxImages={maxImages}
                                            currentCount={images.length}
                                            className="w-full h-full"
                                        />
                                    </div>
                                )}
                            </div>
                        </SortableContext>
                    </DndContext>

                    {/* Barre d'actions pour sélection */}
                    <AnimatePresence>
                        {selectedImages.size > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="flex items-center justify-between gap-4 mt-4 p-3 rounded-lg bg-muted/50 border border-border/50"
                            >
                                <span className="text-sm text-muted-foreground">
                                    {selectedImages.size} image(s) sélectionnée(s)
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedImages(new Set())}
                                    >
                                        Annuler
                                    </Button>
                                    {allowDelete && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleDeleteSelected}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Supprimer
                                        </Button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>

            {/* Dialog suppression unique */}
            <AlertDialog open={imageToDelete !== null} onOpenChange={() => setImageToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer l&apos;image ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. L&apos;image sera définitivement supprimée.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog suppression groupée */}
            <AlertDialog open={imagesToDelete !== null} onOpenChange={() => setImagesToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer {imagesToDelete?.length} image(s) ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Les images sélectionnées seront définitivement supprimées.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmBatchDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Supprimer tout
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog édition alt text */}
            <Dialog open={editingAltImage !== null} onOpenChange={() => setEditingAltImage(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier le texte alternatif</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="alt-text">Texte alternatif (SEO)</Label>
                            <Input
                                id="alt-text"
                                value={editingAltText}
                                onChange={(e) => setEditingAltText(e.target.value)}
                                placeholder="Décrivez l'image pour l'accessibilité et le SEO"
                            />
                            <p className="text-xs text-muted-foreground">
                                Décrivez le contenu de l&apos;image de manière concise et descriptive.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingAltImage(null)}>
                            Annuler
                        </Button>
                        <Button onClick={handleSaveAlt}>
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

// Re-export types
export type { ProductImage, ProductImageGalleryProps, UploadingItem } from "./types";
