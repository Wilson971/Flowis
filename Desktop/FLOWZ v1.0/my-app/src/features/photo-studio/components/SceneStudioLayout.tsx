"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ActionBar } from './ActionBar';
import { ControlPanel } from './ControlPanel';
import { LightTable } from './LightTable';
import { SessionTimeline } from './SessionTimeline';
import { SceneStudioLoader } from './SceneStudioLoader';
import { useStudioContext } from '@/features/photo-studio/context/StudioContext';
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

  // ---------------------------------------------------------------------------
  // Global keyboard shortcuts
  // ---------------------------------------------------------------------------
  const { state, setEditorMode, closeStudio } = useStudioContext();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      // Escape: close editor mode, or close studio
      if (e.key === 'Escape') {
        if (state.editorMode !== 'none') {
          setEditorMode('none');
        } else if (onBack) {
          onBack();
        }
        return;
      }

      // Space: toggle compare (handled by CompareOverlay natively via slider)

      // +/= : zoom in (handled by LightTable, but add global shortcut)
      // -   : zoom out
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.editorMode, setEditorMode, closeStudio, onBack]);

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

      <div className="border-b border-border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent" style={{ gridArea: 'header' }}>
        <ActionBar productName={productName} onBack={onBack} onPublish={onPublish} isPublishing={isPublishing} isDataReady={isDataReady} />
      </div>

      <div className="border-r border-border bg-card overflow-y-auto" style={{ gridArea: 'controls' }}>
        <ControlPanel productId={productId} productName={productName} sourceImageUrl={sourceImageUrl} />
      </div>

      {/* Canvas Area with subtle pattern/contrast */}
      <div className="bg-muted/30 flex items-center justify-center overflow-hidden relative" style={{ gridArea: 'canvas' }}>
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" style={{ backgroundSize: '24px 24px' }} />
        <LightTable productId={productId} sourceImageUrl={sourceImageUrl} />
      </div>

      <div className="border-t border-border bg-card shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-10" style={{ gridArea: 'timeline' }}>
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
