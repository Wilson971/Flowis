"use client";

import React, { useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Check, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SourceImageItem = {
  id: string;
  src: string;
  alt?: string;
  isPrimary?: boolean;
};

type SourceImagesModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: SourceImageItem[];
  selectedImageId: string | null;
  onSelectImage: (image: SourceImageItem) => void;
  productName?: string;
};

export const SourceImagesModal = ({
  open,
  onOpenChange,
  images,
  selectedImageId,
  onSelectImage,
  productName = 'Produit',
}: SourceImagesModalProps) => {
  const handleImageSelect = (image: SourceImageItem) => {
    onSelectImage(image);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">
                Galerie d'images sources
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {productName} &bull; {images.length} image{images.length > 1 ? 's' : ''} disponible{images.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-180px)]">
          <div className="p-6">
            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
                <p>Aucune image disponible</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((image, index) => {
                  const isSelected = selectedImageId === image.id;
                  const isPrimary = image.isPrimary || index === 0;

                  return (
                    <button
                      key={`${image.id}-${index}`}
                      onClick={() => handleImageSelect(image)}
                      className={cn(
                        'group relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                        isSelected
                          ? 'border-primary shadow-lg ring-2 ring-primary/20'
                          : 'border-transparent hover:border-primary/50 hover:shadow-md'
                      )}
                    >
                      <img
                        src={image.src}
                        alt={image.alt || `Image ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className={cn(
                        'absolute inset-0 transition-all duration-200',
                        isSelected ? 'bg-primary/10' : 'bg-black/0 group-hover:bg-black/20'
                      )} />
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-primary rounded-full p-1 shadow-lg">
                          <Check className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                      )}
                      {isPrimary && (
                        <Badge className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm text-xs" variant="secondary">
                          Principal
                        </Badge>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span className="bg-background/90 text-foreground px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
                          {isSelected ? 'Selectionnee' : 'Selectionner'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t flex justify-between items-center bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Cliquez sur une image pour la selectionner comme source de generation
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
