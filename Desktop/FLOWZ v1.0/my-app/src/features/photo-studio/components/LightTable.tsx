"use client";

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, RotateCcw, Crop, Pencil, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompareOverlay } from './CompareOverlay';
import { useStudioContext } from '@/features/photo-studio/context/StudioContext';
import { useGenerationSessions } from '@/features/photo-studio/hooks/useGenerationSessions';

type LightTableProps = {
  productId: string;
  sourceImageUrl: string | null;
};

export const LightTable = ({ productId, sourceImageUrl }: LightTableProps) => {
  const [zoom, setZoom] = useState(1);
  const { state } = useStudioContext();
  const { selectedImageId, selectedImageType, sessionImages } = state;
  const { data: sessions = [] } = useGenerationSessions(productId);

  const currentImage = useMemo(() => {
    if (selectedImageType === 'generated' && selectedImageId) {
      const session = sessions.find(s => s.id === selectedImageId);
      if (session && session.generated_image_url) {
        return { url: session.generated_image_url, isGenerated: true, sourceUrl: session.source_image_url ?? sourceImageUrl ?? '', status: 'active' as const };
      }
      const sessionImage = sessionImages.find(img => img.id === selectedImageId);
      if (sessionImage) {
        return { url: sessionImage.url, isGenerated: true, sourceUrl: sourceImageUrl ?? '', status: sessionImage.status };
      }
    }
    if (sourceImageUrl) {
      return { url: sourceImageUrl, isGenerated: false, sourceUrl: sourceImageUrl, status: 'active' as const };
    }
    return null;
  }, [selectedImageId, selectedImageType, sessions, sessionImages, sourceImageUrl]);

  const handleDownload = () => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage.url;
    link.download = `studio-${Date.now()}.png`;
    link.click();
  };

  if (!currentImage) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Selectionnez un preset pour commencer</p>
      </div>
    );
  }

  if (currentImage.status === 'loading') {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-6 overflow-hidden">
        <div
          className="relative shadow-2xl rounded-xl overflow-hidden border border-border/50 bg-muted/30 flex items-center justify-center"
          style={{ width: '700px', height: '700px', maxWidth: '100%', maxHeight: '100%' }}
        >
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-lg font-medium text-muted-foreground">Creation de votre scene...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center p-6 overflow-hidden">
      <div
        className="relative shadow-2xl rounded-xl overflow-hidden border border-border/50 transition-transform duration-200 flex items-center justify-center"
        style={{ transform: `scale(${zoom})`, maxWidth: '700px', maxHeight: '700px' }}
      >
        {currentImage.isGenerated && currentImage.sourceUrl ? (
          <CompareOverlay
            sourceUrl={currentImage.sourceUrl}
            generatedUrl={currentImage.url}
            sourceName="Source"
            generatedName="Genere"
            transitionType="cut"
            className="max-w-[700px] max-h-[700px]"
          />
        ) : (
          <img src={currentImage.url} alt="Image produit" className="max-w-[700px] max-h-[700px] object-contain" />
        )}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm border border-border rounded-full px-2 py-1.5 shadow-xl">
          <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[10px] text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(2, z + 0.25))}>
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(1)}>
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Recadrer">
            <Crop className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Inpainting">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload} title="Telecharger">
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
