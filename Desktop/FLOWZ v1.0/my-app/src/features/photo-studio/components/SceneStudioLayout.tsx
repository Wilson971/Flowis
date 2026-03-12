"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { EditorActionBar } from './editor/ActionBar';
import { EditorControlPanel } from './editor/ControlPanel';
import { LightTable } from './viewer/LightTable';
import type { StudioImage } from './viewer/LightTable';
import { SessionTimeline } from './editor/SessionTimeline';
import { SceneStudioLoader } from './SceneStudioLoader';
import { useStudioContext } from '@/features/photo-studio/context/StudioContext';
import type { EditorTool } from './editor/ActionBar';
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

  // ---------------------------------------------------------------------------
  // Editor state (ActionBar)
  // ---------------------------------------------------------------------------
  const [activeTool, setActiveTool] = useState<EditorTool | null>(null);
  const [zoom, setZoom] = useState(100);

  // ---------------------------------------------------------------------------
  // Control panel state
  // ---------------------------------------------------------------------------
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<Record<string, unknown> | null>(null);
  const [userInstruction, setUserInstruction] = useState('');

  // ---------------------------------------------------------------------------
  // LightTable state — images populated from context sessionImages
  // ---------------------------------------------------------------------------
  const { state, setEditorMode, closeStudio } = useStudioContext();

  const lightTableImages: StudioImage[] = useMemo(() => {
    return state.sessionImages.map(img => ({
      id: img.id,
      url: img.url,
      productId,
      productName,
      action: 'generate_scene',
      createdAt: new Date(img.createdAt).toISOString(),
    }));
  }, [state.sessionImages, productId, productName]);

  const handleImageAction = useCallback(
    (_imageIds: string[], _action: 'approve' | 'reject') => {
      // Handled by context / upstream hooks
    },
    []
  );

  // ---------------------------------------------------------------------------
  // SessionTimeline adapter
  // ---------------------------------------------------------------------------
  const handleTimelineImageSelect = useCallback((image: StudioImage) => {
    // Select the image in the timeline
    setSelectedSourceImageId(image.id);
  }, []);

  const handleTimelineRegenerate = useCallback((_image: StudioImage) => {
    // Trigger regeneration — placeholder
  }, []);

  // ---------------------------------------------------------------------------
  // Generation handler (placeholder — wired via hooks upstream)
  // ---------------------------------------------------------------------------
  const handleGenerate = useCallback(() => {
    // Actual generation logic is handled by the parent via context
  }, []);

  // ---------------------------------------------------------------------------
  // Global keyboard shortcuts
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (e.key === 'Escape') {
        if (state.editorMode !== 'none') {
          setEditorMode('none');
        } else if (onBack) {
          onBack();
        }
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.editorMode, setEditorMode, closeStudio, onBack]);

  // Notify parent when timeline is ready
  useEffect(() => {
    if (isDataReady && onTimelineReady) {
      onTimelineReady();
    }
  }, [isDataReady, onTimelineReady]);

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
        <EditorActionBar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          zoom={zoom}
          onZoomChange={setZoom}
        />
      </div>

      <div className="border-r border-border bg-card overflow-y-auto" style={{ gridArea: 'controls' }}>
        <EditorControlPanel
          selectedAction={selectedAction}
          onActionChange={setSelectedAction}
          selectedPreset={selectedPreset}
          onPresetChange={setSelectedPreset}
          productId={productId}
          imageUrl={sourceImageUrl}
          isGenerating={state.isGenerating}
          onGenerate={handleGenerate}
          userInstruction={userInstruction}
          onInstructionChange={setUserInstruction}
        />
      </div>

      {/* Canvas Area with subtle pattern/contrast */}
      <div className="bg-muted/30 flex items-center justify-center overflow-hidden relative" style={{ gridArea: 'canvas' }}>
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" style={{ backgroundSize: '24px 24px' }} />
        <LightTable
          images={lightTableImages}
          isLoading={!isDataReady}
          onImageAction={handleImageAction}
        />
      </div>

      <div className="border-t border-border bg-card shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-10" style={{ gridArea: 'timeline' }}>
        <SessionTimeline
          productId={productId}
          activeImageUrl={sourceImageUrl}
          onImageSelect={handleTimelineImageSelect}
          onRegenerate={handleTimelineRegenerate}
        />
      </div>
    </div>
  );
};
