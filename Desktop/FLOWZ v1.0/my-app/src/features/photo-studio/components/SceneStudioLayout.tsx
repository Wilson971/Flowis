"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ActionBar } from './ActionBar';
import { ControlPanel } from './ControlPanel';
import { LightTable } from './LightTable';
import { SessionTimeline } from './SessionTimeline';
import { SceneStudioLoader } from './SceneStudioLoader';
import type { SourceImageItem } from './modals';

type SceneStudioLayoutProps = {
  productId: string;
  productName: string;
  sourceImages: SourceImageItem[];
  onBack?: () => void;
  onPublish?: () => void;
  isPublishing?: boolean;
  isDataReady?: boolean;
  isLoadingOverlayVisible?: boolean;
  onTimelineReady?: () => void;
  className?: string;
};

export const SceneStudioLayout = ({
  productId,
  productName,
  sourceImages,
  onBack,
  onPublish,
  isPublishing,
  isDataReady = true,
  isLoadingOverlayVisible = false,
  onTimelineReady,
  className,
}: SceneStudioLayoutProps) => {
  const [selectedSourceImageId, setSelectedSourceImageId] = useState<string | null>(
    sourceImages[0]?.id || null
  );

  const currentSourceImage = useMemo(() => {
    if (selectedSourceImageId) {
      return sourceImages.find(img => img.id === selectedSourceImageId) || sourceImages[0];
    }
    return sourceImages[0];
  }, [sourceImages, selectedSourceImageId]);

  const sourceImageUrl = currentSourceImage?.src || null;

  const handleSelectSourceImage = useCallback((image: SourceImageItem) => {
    setSelectedSourceImageId(image.id);
  }, []);

  return (
    <div
      className={cn("studio-container h-screen w-screen overflow-hidden bg-background relative", className)}
      style={{
        display: 'grid',
        gridTemplateColumns: '400px 1fr',
        gridTemplateRows: '60px 1fr 120px',
        gridTemplateAreas: `
          "header header"
          "controls canvas"
          "controls timeline"
        `,
      }}
    >
      <SceneStudioLoader isLoading={isLoadingOverlayVisible} message="Ouverture du Studio" subMessage="Synchronisation de votre historique..." />

      <div className="border-b border-border bg-background" style={{ gridArea: 'header' }}>
        <ActionBar productName={productName} onBack={onBack} onPublish={onPublish} isPublishing={isPublishing} isDataReady={isDataReady} />
      </div>

      <div className="border-r border-border bg-background overflow-y-auto" style={{ gridArea: 'controls' }}>
        <ControlPanel productId={productId} productName={productName} sourceImageUrl={sourceImageUrl} />
      </div>

      <div className="bg-muted/20 flex items-center justify-center overflow-hidden" style={{ gridArea: 'canvas' }}>
        <LightTable productId={productId} sourceImageUrl={sourceImageUrl} />
      </div>

      <div className="border-t border-border bg-background" style={{ gridArea: 'timeline' }}>
        <SessionTimeline
          productId={productId}
          sourceImages={sourceImages}
          selectedSourceImageId={selectedSourceImageId}
          onSelectSourceImage={handleSelectSourceImage}
          isDataReady={isDataReady}
          onTimelineReady={onTimelineReady}
        />
      </div>
    </div>
  );
};
