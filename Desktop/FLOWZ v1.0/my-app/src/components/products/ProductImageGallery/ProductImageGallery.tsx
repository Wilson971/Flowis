"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
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
import { RefreshCw, Trash2, Image as ImageIcon, X, ChevronLeft, ChevronRight } from "lucide-react";
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
    maxVisible,
    isLoading = false,
    isDisabled = false,
    allowDelete = true,
    allowReorder = true,
    showPrimaryBadge = true,
    productTitle,
    productId,
    actionButton,
}: ProductImageGalleryProps) => {
    // États locaux
    const [selectedImages, setSelectedImages] = useState<Set<string | number>>(new Set());
    const [imageToDelete, setImageToDelete] = useState<string | number | null>(null);
    const [imagesToDelete, setImagesToDelete] = useState<(string | number)[] | null>(null);
    const [editingAltImage, setEditingAltImage] = useState<ProductImage | null>(null);
    const [editingAltText, setEditingAltText] = useState("");
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);

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
                        <div className="flex items-center gap-6">
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

                            <div className="hidden sm:flex items-center gap-4 text-xs pl-2 border-l border-border/20">
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none mb-1">Capacité</span>
                                    <span className="font-mono text-foreground font-bold">
                                        {images.length} / {maxImages}
                                    </span>
                                </div>

                                {images.length > 0 && (
                                    <>
                                        <div className="w-px h-6 bg-border/20" />
                                        <div className="flex flex-col items-start">
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
                        </div>

                        <div className="flex items-center gap-4">

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

                            {actionButton}
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
                            {(() => {
                                // Calculate how many thumbnails to show
                                // maxVisible accounts for the primary image taking 1 slot visually but we count it as 1 image
                                const hasOverflow = maxVisible != null && sortedImages.length > maxVisible;
                                const visibleImages = hasOverflow ? sortedImages.slice(0, maxVisible) : sortedImages;
                                const hiddenCount = hasOverflow ? sortedImages.length - maxVisible : 0;

                                return (
                                    <div className={cn(
                                        "grid gap-3",
                                        "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
                                    )}>
                                        {/* Images */}
                                        {visibleImages.map((image, index) => {
                                            const isPrimary = index === 0;
                                            const isLastVisible = hasOverflow && index === visibleImages.length - 1;

                                            return (
                                                <motion.div
                                                    key={image.id}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    className={cn(
                                                        "aspect-square relative",
                                                        isPrimary && "col-span-2 row-span-2"
                                                    )}
                                                >
                                                    <ImageThumbnail
                                                        image={image}
                                                        isPrimary={isPrimary && showPrimaryBadge}
                                                        isSelected={selectedImages.has(image.id)}
                                                        onView={() => {
                                                            if (isLastVisible) {
                                                                setGalleryIndex(0);
                                                                setGalleryOpen(true);
                                                            } else {
                                                                openPreview(image.id);
                                                            }
                                                        }}
                                                        onSetPrimary={() => setPrimaryImage(image.id)}
                                                        onDelete={() => handleDeleteRequest(image.id)}
                                                        onEditAlt={() => handleEditAlt(image.id)}
                                                        onDownload={() => handleDownload(image.id)}
                                                        onToggleSelection={() => handleToggleSelection(image.id)}
                                                        allowDelete={allowDelete}
                                                        className="w-full h-full"
                                                    />
                                                    {/* "+X" overlay on last visible thumbnail */}
                                                    {isLastVisible && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setGalleryIndex(0);
                                                                setGalleryOpen(true);
                                                            }}
                                                            className="absolute inset-0 z-10 rounded-lg bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors hover:bg-black/70"
                                                        >
                                                            <span className="text-2xl font-bold text-white">
                                                                +{hiddenCount}
                                                            </span>
                                                            <span className="text-xs text-white/80">
                                                                Voir tout
                                                            </span>
                                                        </button>
                                                    )}
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

                                        {/* Bouton d'ajout — toujours visible après les vignettes */}
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
                                );
                            })()}
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

            {/* Gallery lightbox modal */}
            <AnimatePresence>
                {galleryOpen && sortedImages.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
                        onClick={() => setGalleryOpen(false)}
                    >
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setGalleryOpen(false)}
                            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Counter */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium tabular-nums">
                            {galleryIndex + 1} / {sortedImages.length}
                        </div>

                        {/* Previous button */}
                        {sortedImages.length > 1 && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setGalleryIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
                                }}
                                className="absolute left-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                        )}

                        {/* Main image */}
                        <motion.div
                            key={sortedImages[galleryIndex]?.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="relative max-w-[85vw] max-h-[80vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={sortedImages[galleryIndex]?.url || sortedImages[galleryIndex]?.src || ""}
                                alt={sortedImages[galleryIndex]?.alt || ""}
                                width={400}
                                height={400}
                                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                                unoptimized
                            />
                            {sortedImages[galleryIndex]?.alt && (
                                <p className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg text-white text-sm text-center">
                                    {sortedImages[galleryIndex].alt}
                                </p>
                            )}
                        </motion.div>

                        {/* Next button */}
                        {sortedImages.length > 1 && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setGalleryIndex((prev) => (prev + 1) % sortedImages.length);
                                }}
                                className="absolute right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </button>
                        )}

                        {/* Thumbnail strip */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm max-w-[90vw] overflow-x-auto">
                            {sortedImages.map((image, index) => (
                                <button
                                    key={image.id}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setGalleryIndex(index);
                                    }}
                                    className={cn(
                                        "w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all",
                                        index === galleryIndex
                                            ? "border-white ring-1 ring-white/50 scale-110"
                                            : "border-transparent opacity-60 hover:opacity-100"
                                    )}
                                >
                                    <Image
                                        src={image.url || image.src || ""}
                                        alt={image.alt || ""}
                                        width={80}
                                        height={80}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                    />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

// Re-export types
export type { ProductImage, ProductImageGalleryProps, UploadingItem } from "./types";
