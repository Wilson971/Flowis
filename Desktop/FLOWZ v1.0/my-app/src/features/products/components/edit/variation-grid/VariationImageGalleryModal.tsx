"use client";

import React, { useState, useCallback, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Image as ImageIcon,
    Upload,
    Check,
    Loader2,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface GalleryImage {
    id: string | number;
    src: string;
    alt?: string;
    name?: string;
}

interface VariationImageGalleryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productImages: GalleryImage[];
    currentImageSrc?: string | null;
    onSelectImage: (image: GalleryImage) => void;
    onUploadImage: (file: File) => void;
    isUploading?: boolean;
}

export function VariationImageGalleryModal({
    open,
    onOpenChange,
    productImages,
    currentImageSrc,
    onSelectImage,
    onUploadImage,
    isUploading,
}: VariationImageGalleryModalProps) {
    const [selectedSrc, setSelectedSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const effectiveSelected = selectedSrc ?? currentImageSrc ?? null;

    const handleConfirm = useCallback(() => {
        if (!selectedSrc) return;
        const img = productImages.find((i) => (i.src || i.src) === selectedSrc);
        if (img) {
            onSelectImage(img);
            onOpenChange(false);
            setSelectedSrc(null);
        }
    }, [selectedSrc, productImages, onSelectImage, onOpenChange]);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) onUploadImage(file);
            e.target.value = "";
        },
        [onUploadImage]
    );

    return (
        <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSelectedSrc(null); }}>
            <DialogContent className="sm:max-w-[600px] p-0 gap-0">
                <div className="px-6 pt-6 pb-4">
                    <DialogTitle className="text-[15px] font-semibold tracking-tight flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        Galerie d&apos;images
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-1">
                        Choisissez une image du produit ou uploadez-en une nouvelle.
                    </DialogDescription>
                </div>

                <ScrollArea className="max-h-[400px] px-6">
                    {productImages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <ImageIcon className="h-10 w-10 text-muted-foreground/30 mb-3" />
                            <p className="text-sm text-muted-foreground">
                                Aucune image dans la galerie produit.
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                                Uploadez une image ci-dessous.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-3 pb-4">
                            {productImages.map((img) => {
                                const isSelected = effectiveSelected === img.src;
                                return (
                                    <button
                                        key={img.id}
                                        type="button"
                                        onClick={() => setSelectedSrc(img.src)}
                                        className={cn(
                                            "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
                                            "hover:border-primary/50 hover:shadow-md",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                            isSelected
                                                ? "border-primary ring-2 ring-primary/20"
                                                : "border-border/40"
                                        )}
                                    >
                                        <img
                                            src={img.src}
                                            alt={img.alt || ""}
                                            className="h-full w-full object-cover"
                                        />
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                                    <Check className="h-3.5 w-3.5 text-primary-foreground" />
                                                </div>
                                            </div>
                                        )}
                                        {img.name && (
                                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                                                <p className="text-[9px] text-white truncate">{img.name}</p>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer actions */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 bg-muted/20">
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-[11px] rounded-lg gap-1.5"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Upload className="h-3.5 w-3.5" />
                            )}
                            Uploader
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[11px] rounded-lg"
                            onClick={() => { onOpenChange(false); setSelectedSrc(null); }}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="h-8 text-[11px] rounded-lg gap-1.5"
                            onClick={handleConfirm}
                            disabled={!selectedSrc || selectedSrc === currentImageSrc}
                        >
                            <Check className="h-3.5 w-3.5" />
                            Appliquer
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
