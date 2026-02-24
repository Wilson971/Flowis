"use client";

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, RotateCcw, Crop, Pencil, SlidersHorizontal, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompareOverlay } from './CompareOverlay';
import { CropTool } from './CropTool';
import { AnnotationLayer } from './AnnotationLayer';
import { ImageAdjustments, adjustmentsToFilter, DEFAULT_ADJUSTMENTS } from './ImageAdjustments';
import { useStudioContext } from '@/features/photo-studio/context/StudioContext';
import { useGenerationSessions } from '@/features/photo-studio/hooks/useGenerationSessions';
import type { EditorMode } from '@/features/photo-studio/context/StudioContext';

type LightTableProps = {
  productId: string;
  sourceImageUrl: string | null;
};

export const LightTable = ({ productId, sourceImageUrl }: LightTableProps) => {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const {
    state,
    setEditorMode,
    setImageAdjustments,
    resetAdjustments,
    updateSessionImage,
  } = useStudioContext();

  const {
    selectedImageId,
    selectedImageType,
    sessionImages,
    editorMode,
    imageAdjustments,
  } = state;

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

  const handleDownload = useCallback(() => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage.url;
    link.download = `studio-${Date.now()}.png`;
    link.click();
  }, [currentImage]);

  const toggleMode = useCallback((mode: EditorMode) => {
    setEditorMode(editorMode === mode ? 'none' : mode);
  }, [editorMode, setEditorMode]);

  // Crop: apply cropped image
  const handleCropApply = useCallback((croppedBase64: string) => {
    if (selectedImageId && selectedImageType === 'generated') {
      updateSessionImage(selectedImageId, { url: croppedBase64 });
    }
    setEditorMode('none');
  }, [selectedImageId, selectedImageType, updateSessionImage, setEditorMode]);

  // Adjustments: apply via canvas render
  const handleAdjustApply = useCallback(() => {
    if (!currentImage) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.filter = adjustmentsToFilter(imageAdjustments);
      ctx.drawImage(img, 0, 0);
      const base64 = canvas.toDataURL('image/png');
      if (selectedImageId && selectedImageType === 'generated') {
        updateSessionImage(selectedImageId, { url: base64 });
      }
      resetAdjustments();
      setEditorMode('none');
    };
    img.src = currentImage.url;
  }, [currentImage, imageAdjustments, selectedImageId, selectedImageType, updateSessionImage, resetAdjustments, setEditorMode]);

  // Annotations: apply exported image
  const handleAnnotationExport = useCallback((mergedBase64: string) => {
    if (selectedImageId && selectedImageType === 'generated') {
      updateSessionImage(selectedImageId, { url: mergedBase64 });
    }
    setEditorMode('none');
  }, [selectedImageId, selectedImageType, updateSessionImage, setEditorMode]);

  // CSS filter for live preview
  const filterStyle = editorMode === 'adjust' ? adjustmentsToFilter(imageAdjustments) : 'none';

  // Container dimensions for overlays
  const containerDims = useMemo(() => {
    if (!imageContainerRef.current) return { width: 700, height: 700 };
    return {
      width: imageContainerRef.current.clientWidth,
      height: imageContainerRef.current.clientHeight,
    };
  }, [editorMode]); // eslint-disable-line react-hooks/exhaustive-deps

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
          {/* Skeleton shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/50 to-transparent animate-pulse" />
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-lg font-medium text-muted-foreground">Creation de votre scene...</p>
            <p className="text-xs text-muted-foreground/60">Cela peut prendre quelques secondes</p>
          </div>
        </div>
      </div>
    );
  }

  const isEditorActive = editorMode !== 'none';

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center p-6 overflow-hidden">
      {/* Main image container */}
      <div
        ref={imageContainerRef}
        className={cn(
          "relative shadow-2xl rounded-xl overflow-hidden border border-border/50 transition-transform duration-200 flex items-center justify-center",
          isEditorActive && "ring-2 ring-primary/30"
        )}
        style={{
          transform: `scale(${zoom})`,
          maxWidth: '700px',
          maxHeight: '700px',
        }}
      >
        {/* Image display with optional CSS filter */}
        {currentImage.isGenerated && currentImage.sourceUrl && editorMode === 'none' ? (
          <CompareOverlay
            sourceUrl={currentImage.sourceUrl}
            generatedUrl={currentImage.url}
            sourceName="Source"
            generatedName="Genere"
            className="max-w-[700px] max-h-[700px]"
          />
        ) : (
          <img
            src={currentImage.url}
            alt="Image produit"
            className="max-w-[700px] max-h-[700px] object-contain"
            style={{ filter: filterStyle }}
            draggable={false}
          />
        )}

        {/* Crop overlay */}
        {editorMode === 'crop' && (
          <CropTool
            imageUrl={currentImage.url}
            containerWidth={containerDims.width}
            containerHeight={containerDims.height}
            onApply={handleCropApply}
            onCancel={() => setEditorMode('none')}
          />
        )}

        {/* Annotation overlay */}
        {editorMode === 'annotate' && (
          <AnnotationLayer
            imageUrl={currentImage.url}
            width={containerDims.width}
            height={containerDims.height}
            onExport={handleAnnotationExport}
            onCancel={() => setEditorMode('none')}
          />
        )}
      </div>

      {/* Adjustments panel (floating beside image) */}
      {editorMode === 'adjust' && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-56">
          <ImageAdjustments
            values={imageAdjustments}
            onChange={setImageAdjustments}
            onApply={handleAdjustApply}
            onReset={resetAdjustments}
          />
        </div>
      )}

      {/* Bottom toolbar — hidden when crop/annotate active (they have their own toolbars) */}
      {editorMode !== 'crop' && editorMode !== 'annotate' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-1 bg-background/80 backdrop-blur-md border border-white/10 rounded-full px-2 py-1.5 shadow-2xl ring-1 ring-border/5">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                aria-label="Zoom arriere"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <span className="text-[10px] text-muted-foreground w-10 text-center tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
                aria-label="Zoom avant"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoom(1)}
                aria-label="Reinitialiser le zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Editor tools */}
            <Button
              variant={editorMode === 'crop' ? 'default' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => toggleMode('crop')}
              title="Recadrer"
              aria-label="Recadrer"
            >
              <Crop className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={editorMode === 'adjust' ? 'default' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => toggleMode('adjust')}
              title="Ajustements"
              aria-label="Ajustements image"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={editorMode === 'annotate' ? 'default' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => toggleMode('annotate')}
              title="Annoter"
              aria-label="Annoter l'image"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>

            {/* Download */}
            <div className="border-l border-border pl-2 ml-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleDownload}
                title="Telecharger"
                aria-label="Telecharger l'image"
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
