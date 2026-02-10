"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { Plus, Upload } from "lucide-react";

interface AddImageButtonProps {
    onFilesSelected: (files: File[]) => void;
    disabled?: boolean;
    maxImages?: number;
    currentCount?: number;
    className?: string;
}

/**
 * Bouton d'ajout d'image avec dropzone intégrée
 */
export const AddImageButton = ({
    onFilesSelected,
    disabled = false,
    maxImages = 15,
    currentCount = 0,
    className,
}: AddImageButtonProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        if (!disabled && inputRef.current) {
            inputRef.current.click();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFilesSelected(Array.from(files));
            // Reset input pour permettre de re-sélectionner le même fichier
            e.target.value = '';
        }
    };

    const remainingSlots = maxImages - currentCount;

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleChange}
                className="hidden"
                disabled={disabled}
            />
            <button
                type="button"
                onClick={handleClick}
                disabled={disabled}
                className={cn(
                    "relative w-full h-full min-h-[100px] rounded-lg border-2 border-dashed border-border/50 bg-muted/30",
                    "flex flex-col items-center justify-center gap-2 p-4",
                    "transition-all duration-200",
                    "hover:border-primary/50 hover:bg-primary/5",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
                    disabled && "opacity-50 cursor-not-allowed hover:border-border/50 hover:bg-muted/30",
                    className
                )}
            >
                <div className="p-2 rounded-full bg-primary/10">
                    <Plus className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                    <p className="text-xs font-medium text-foreground">
                        Ajouter
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                        {remainingSlots > 0
                            ? `${remainingSlots} restant${remainingSlots > 1 ? 's' : ''}`
                            : 'Maximum atteint'}
                    </p>
                </div>
            </button>
        </>
    );
};
