"use client";

/**
 * CompareOverlay -- Before/After interactive comparison slider
 *
 * Drag the vertical divider left/right to reveal source vs generated image.
 * Supports pointer (mouse + touch), keyboard (arrow keys, 5% increments),
 * scroll-to-zoom (synchronized), and swap button.
 */

import React, { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { ImageIcon, Sparkles, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motionTokens } from "@/lib/design-system";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompareOverlayProps {
  originalUrl: string;
  generatedUrl: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const KEYBOARD_STEP = 5;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.15;

// Fast transition for micro-interactions (200ms from design system)
const FAST_TRANSITION = motionTokens.transitions.fast;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CompareOverlay = ({
  originalUrl,
  generatedUrl,
  className,
}: CompareOverlayProps) => {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resolve which image is left vs right based on swap state
  const leftUrl = swapped ? generatedUrl : originalUrl;
  const rightUrl = swapped ? originalUrl : generatedUrl;
  const leftLabel = swapped ? "Apres" : "Avant";
  const rightLabel = swapped ? "Avant" : "Apres";

  // -----------------------------------------------------------------------
  // Pointer helpers
  // -----------------------------------------------------------------------

  const getPositionFromEvent = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return 50;
    const x = clientX - rect.left;
    return Math.max(0, Math.min(100, (x / rect.width) * 100));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setPosition(getPositionFromEvent(e.clientX));
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [getPositionFromEvent]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      setPosition(getPositionFromEvent(e.clientX));
    },
    [isDragging, getPositionFromEvent]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // -----------------------------------------------------------------------
  // Keyboard
  // -----------------------------------------------------------------------

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPosition((p) => Math.max(0, p - KEYBOARD_STEP));
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setPosition((p) => Math.min(100, p + KEYBOARD_STEP));
    }
  }, []);

  // -----------------------------------------------------------------------
  // Scroll-to-zoom (synchronized on both images)
  // -----------------------------------------------------------------------

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => {
      const next = z + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
      return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
    });
  }, []);

  // -----------------------------------------------------------------------
  // Shared image styles
  // -----------------------------------------------------------------------

  const imgStyle: React.CSSProperties = {
    transform: `scale(${zoom})`,
    transition: `transform ${FAST_TRANSITION.duration}s ease`,
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative select-none overflow-hidden rounded-xl bg-muted/30",
        isDragging && "cursor-col-resize",
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* Left image (full, behind) */}
      <img
        src={leftUrl}
        alt={leftLabel}
        className="w-full h-full object-contain"
        style={imgStyle}
        draggable={false}
      />

      {/* Right image (clipped from left edge to position) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 0 0 ${position}%)` }}
      >
        <img
          src={rightUrl}
          alt={rightLabel}
          className="w-full h-full object-contain"
          style={imgStyle}
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 z-10"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        {/* Vertical line */}
        <div className="absolute inset-0 w-0.5 bg-background shadow-[0_0_8px_rgba(0,0,0,0.5)]" />

        {/* Drag handle */}
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "w-10 h-10 rounded-full",
            "bg-background/90 backdrop-blur-sm border-2 border-border shadow-xl",
            "flex items-center justify-center",
            "transition-transform duration-200",
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
          <span>{leftLabel}</span>
        </div>
      </div>
      <div className="absolute top-3 right-3 z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/80 backdrop-blur-sm border border-primary/30 shadow-md text-xs font-medium text-primary-foreground">
          <Sparkles className="w-3 h-3" />
          <span>{rightLabel}</span>
        </div>
      </div>

      {/* Swap button */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full gap-1.5 shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            setSwapped((s) => !s);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span className="text-xs">Inverser</span>
        </Button>
      </div>
    </div>
  );
};

export default CompareOverlay;
