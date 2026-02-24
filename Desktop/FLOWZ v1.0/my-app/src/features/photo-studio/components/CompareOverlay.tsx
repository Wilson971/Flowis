"use client";

/**
 * CompareOverlay — Before/After interactive slider
 *
 * Drag the vertical bar left/right to reveal source vs generated image.
 * Supports mouse and touch input. Accessible via keyboard (left/right arrows).
 */

import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon, Sparkles } from 'lucide-react';

type CompareOverlayProps = {
  sourceUrl: string;
  generatedUrl: string;
  sourceName?: string;
  generatedName?: string;
  className?: string;
};

export const CompareOverlay = ({
  sourceUrl,
  generatedUrl,
  sourceName = 'Avant',
  generatedName = 'Apres',
  className,
}: CompareOverlayProps) => {
  const [position, setPosition] = useState(50); // 0-100%
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getPositionFromEvent = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return 50;
    const x = clientX - rect.left;
    return Math.max(0, Math.min(100, (x / rect.width) * 100));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setPosition(getPositionFromEvent(e.clientX));
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [getPositionFromEvent]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition(getPositionFromEvent(e.clientX));
  }, [isDragging, getPositionFromEvent]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); setPosition(p => Math.max(0, p - 2)); }
    if (e.key === 'ArrowRight') { e.preventDefault(); setPosition(p => Math.min(100, p + 2)); }
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative select-none overflow-hidden", isDragging && "cursor-col-resize", className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Generated image (full, underneath) */}
      <img
        src={generatedUrl}
        alt={generatedName}
        className="w-full h-full object-contain"
        style={{ maxWidth: '700px', maxHeight: '700px' }}
        draggable={false}
      />

      {/* Source image (clipped from left to slider position) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={sourceUrl}
          alt={sourceName}
          className="w-full h-full object-contain"
          style={{ maxWidth: '700px', maxHeight: '700px' }}
          draggable={false}
        />
      </div>

      {/* Slider bar */}
      <div
        className="absolute top-0 bottom-0 z-10"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        {/* Vertical line */}
        <div className="absolute inset-0 w-0.5 bg-background shadow-[0_0_8px_rgba(0,0,0,0.5)]" />

        {/* Handle */}
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "w-10 h-10 rounded-full",
            "bg-background/90 backdrop-blur-sm border-2 border-border shadow-xl",
            "flex items-center justify-center",
            "transition-transform duration-100",
            isDragging && "scale-110"
          )}
          role="slider"
          aria-label="Curseur comparaison avant/apres"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <div className="flex gap-0.5">
            <div className="w-0.5 h-4 bg-muted-foreground/60 rounded-full" />
            <div className="w-0.5 h-4 bg-muted-foreground/60 rounded-full" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-md text-xs font-medium">
          <ImageIcon className="w-3 h-3" />
          <span>{sourceName}</span>
        </div>
      </div>
      <div className="absolute top-3 right-3 z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/80 backdrop-blur-sm border border-primary/30 shadow-md text-xs font-medium text-primary-foreground">
          <Sparkles className="w-3 h-3" />
          <span>{generatedName}</span>
        </div>
      </div>
    </div>
  );
};

export default CompareOverlay;
