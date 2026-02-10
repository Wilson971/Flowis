"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Star,
    Trash2,
    MoreVertical,
    Eye,
    Download,
    Edit3,
    GripVertical,
    AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { ProductImage } from "./types";

interface ImageThumbnailProps {
    image: ProductImage;
    isPrimary?: boolean;
    isSelected?: boolean;
    onView?: () => void;
    onSetPrimary?: () => void;
    onDelete?: () => void;
    onEditAlt?: () => void;
    onDownload?: () => void;
    onToggleSelection?: () => void;
    allowDelete?: boolean;
    className?: string;
}

/**
 * Thumbnail d'une image avec overlay d'actions
 */
export const ImageThumbnail = ({
    image,
    isPrimary = false,
    isSelected = false,
    onView,
    onSetPrimary,
    onDelete,
    onEditAlt,
    onDownload,
    onToggleSelection,
    allowDelete = true,
    className,
}: ImageThumbnailProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: image.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const imageUrl = image.url || image.src || '';
    const hasAlt = image.alt && image.alt.trim().length > 0;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative group rounded-lg overflow-hidden bg-muted/50",
                "border border-border/40 transition-all duration-200",
                isDragging && "opacity-50 scale-105 shadow-xl z-50",
                isSelected && "ring-2 ring-primary ring-offset-2",
                className
            )}
        >
            {/* Image */}
            <div className="relative w-full h-full aspect-square">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={image.alt || 'Product image'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                        unoptimized={imageUrl.startsWith('http')}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                )}
            </div>

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            {/* Primary badge */}
            {isPrimary && (
                <Badge className="absolute top-1.5 left-1.5 text-[10px] px-1.5 h-5 bg-primary/90 backdrop-blur-sm">
                    <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                    Principale
                </Badge>
            )}

            {/* Missing alt warning */}
            {!hasAlt && (
                <div className="absolute top-1.5 right-1.5">
                    <Badge variant="destructive" className="text-[9px] px-1 h-4 bg-amber-500/90">
                        Alt manquant
                    </Badge>
                </div>
            )}

            {/* Drag handle */}
            <button
                {...attributes}
                {...listeners}
                className="absolute top-1.5 left-1.5 p-1 rounded bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            >
                <GripVertical className="h-3 w-3 text-white" />
            </button>

            {/* Selection checkbox */}
            {onToggleSelection && (
                <button
                    type="button"
                    onClick={onToggleSelection}
                    className={cn(
                        "absolute top-1.5 right-1.5 h-5 w-5 rounded border-2",
                        "flex items-center justify-center transition-all",
                        isSelected
                            ? "bg-primary border-primary"
                            : "bg-black/30 border-white/50 opacity-0 group-hover:opacity-100"
                    )}
                >
                    {isSelected && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </button>
            )}

            {/* Actions overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between">
                    {/* Quick actions */}
                    <div className="flex items-center gap-1">
                        {onView && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={onView}
                                className="h-7 w-7 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white"
                            >
                                <Eye className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>

                    {/* More menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white"
                            >
                                <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            {onView && (
                                <DropdownMenuItem onClick={onView}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Voir
                                </DropdownMenuItem>
                            )}
                            {!isPrimary && onSetPrimary && (
                                <DropdownMenuItem onClick={onSetPrimary}>
                                    <Star className="h-4 w-4 mr-2" />
                                    Définir principale
                                </DropdownMenuItem>
                            )}
                            {onEditAlt && (
                                <DropdownMenuItem onClick={onEditAlt}>
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Éditer alt text
                                </DropdownMenuItem>
                            )}
                            {onDownload && (
                                <DropdownMenuItem onClick={onDownload}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Télécharger
                                </DropdownMenuItem>
                            )}
                            {allowDelete && onDelete && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={onDelete}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Supprimer
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
};
