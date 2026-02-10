"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, Loader2, Plus, Images } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudioContext } from '@/features/photo-studio/context/StudioContext';
import { useGenerationSessions } from '@/features/photo-studio/hooks/useGenerationSessions';
import { SourceImagesModal, type SourceImageItem } from './modals';

type SessionTimelineProps = {
  productId: string;
  sourceImages: SourceImageItem[];
  selectedSourceImageId: string | null;
  onSelectSourceImage: (image: SourceImageItem) => void;
  isDataReady?: boolean;
  onTimelineReady?: () => void;
};

export const SessionTimeline = ({
  productId,
  sourceImages,
  selectedSourceImageId,
  onSelectSourceImage,
  isDataReady = true,
  onTimelineReady,
}: SessionTimelineProps) => {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const { state, setSelectedImage } = useStudioContext();
  const { selectedImageId, selectedImageType, sessionImages, isGenerating } = state;
  const { data: sessions = [] } = useGenerationSessions(productId);

  const currentSourceImage = useMemo(() => {
    if (selectedSourceImageId) {
      return sourceImages.find(img => img.id === selectedSourceImageId) || sourceImages[0];
    }
    return sourceImages[0];
  }, [sourceImages, selectedSourceImageId]);

  const additionalImagesCount = sourceImages.length - 1;

  const generatedImages = useMemo(() => {
    const images: Array<{ id: string; url: string; type: 'generated'; status: 'loading' | 'active' | 'published'; createdAt: number; }> = [];
    const addedIds = new Set<string>();

    sessions.forEach((session) => {
      if (!session.generated_image_url) return;
      images.push({
        id: session.id,
        url: session.generated_image_url,
        type: 'generated',
        status: session.is_published ? 'published' : 'active',
        createdAt: new Date(session.created_at).getTime(),
      });
      addedIds.add(session.id);
    });

    sessionImages.forEach((img) => {
      if (!addedIds.has(img.id)) {
        images.push({ ...img, type: 'generated' });
        addedIds.add(img.id);
      }
    });

    return images.sort((a, b) => b.createdAt - a.createdAt);
  }, [sessions, sessionImages]);

  useEffect(() => {
    if (isDataReady && onTimelineReady) {
      const timer = setTimeout(() => { onTimelineReady(); }, 100);
      return () => clearTimeout(timer);
    }
  }, [isDataReady, onTimelineReady]);

  const handleImageClick = (id: string, type: 'source' | 'generated') => {
    setSelectedImage(id, type);
  };

  const handleSourceClick = () => {
    if (sourceImages.length > 1) {
      setIsGalleryOpen(true);
    } else if (currentSourceImage) {
      handleImageClick('source-0', 'source');
    }
  };

  const handleSelectFromModal = (image: SourceImageItem) => {
    onSelectSourceImage(image);
    handleImageClick('source-0', 'source');
  };

  return (
    <div className="flex h-full items-center gap-2 px-4">
      {currentSourceImage && (
        <div className="flex-shrink-0">
          <div className="relative group">
            <button
              onClick={handleSourceClick}
              className={cn(
                'relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                selectedImageId === 'source-0' && selectedImageType === 'source'
                  ? 'border-primary shadow-lg scale-105'
                  : 'border-border hover:border-primary/50 hover:shadow-md',
                sourceImages.length > 1 && 'cursor-pointer'
              )}
            >
              <img src={currentSourceImage.src} alt="Source" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              {sourceImages.length > 1 && (
                <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center">
                    <Images className="w-5 h-5 text-foreground mb-0.5" />
                    <span className="text-xs text-foreground font-medium">Voir tout</span>
                  </div>
                </div>
              )}
              {additionalImagesCount > 0 && (
                <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded-full shadow flex items-center gap-0.5">
                  <Plus className="w-2.5 h-2.5" />
                  {additionalImagesCount}
                </div>
              )}
            </button>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
              <Badge variant="secondary" className="text-xs px-1 py-0">ORIGINAL</Badge>
            </div>
          </div>
        </div>
      )}

      {currentSourceImage && <div className="w-px h-16 bg-border flex-shrink-0" />}

      <ScrollArea className="flex-1 overflow-x-auto">
        <div className="flex items-center gap-2 py-2">
          {!isDataReady && (
            <>
              {[1, 2, 3].map((i) => (
                <div key={`skeleton-${i}`} className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-border bg-muted overflow-hidden">
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent animate-shimmer" />
                    <div className="w-full h-full bg-gradient-to-br from-muted-foreground/5 to-muted-foreground/10" />
                  </div>
                </div>
              ))}
              <div className="flex-shrink-0 px-4 py-2 text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Chargement de l'historique...</span>
              </div>
            </>
          )}

          {isDataReady && generatedImages.map((image) => {
            const isActive = selectedImageId === image.id && selectedImageType === 'generated';
            const isPublished = image.status === 'published';
            const isLoadingImage = image.status === 'loading' || (isGenerating && image.id === selectedImageId);

            return (
              <button
                key={image.id}
                onClick={() => handleImageClick(image.id, 'generated')}
                className={cn(
                  'relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                  isActive ? 'border-primary shadow-lg scale-105' : 'border-border hover:border-primary/50',
                  isLoadingImage && 'opacity-60'
                )}
              >
                {isLoadingImage ? (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <img src={image.url} alt="Genere" className="w-full h-full object-cover" />
                )}
                {isPublished && (
                  <div className="absolute top-1 right-1">
                    <Badge className="bg-success text-success-foreground border-0 p-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </Badge>
                  </div>
                )}
              </button>
            );
          })}

          {isGenerating && (
            <div className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </ScrollArea>

      <SourceImagesModal
        open={isGalleryOpen}
        onOpenChange={setIsGalleryOpen}
        images={sourceImages}
        selectedImageId={selectedSourceImageId}
        onSelectImage={handleSelectFromModal}
      />
    </div>
  );
};
