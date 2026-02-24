"use client";

/**
 * CropTool — Lightweight Canvas-based crop overlay
 *
 * Renders a dark overlay with a resizable selection area.
 * Drag handles on corners + edges. Ratio lock (free, 1:1, 4:5, 16:9).
 * Apply → canvas drawImage → base64 output.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, X, RectangleHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type CropRatio = 'free' | '1:1' | '4:5' | '16:9';

const RATIOS: { label: string; value: CropRatio }[] = [
  { label: 'Libre', value: 'free' },
  { label: '1:1', value: '1:1' },
  { label: '4:5', value: '4:5' },
  { label: '16:9', value: '16:9' },
];

function getRatioValue(ratio: CropRatio): number | null {
  switch (ratio) {
    case '1:1': return 1;
    case '4:5': return 4 / 5;
    case '16:9': return 16 / 9;
    default: return null;
  }
}

type CropToolProps = {
  imageUrl: string;
  containerWidth: number;
  containerHeight: number;
  onApply: (croppedBase64: string) => void;
  onCancel: () => void;
  className?: string;
};

export const CropTool = ({
  imageUrl,
  containerWidth,
  containerHeight,
  onApply,
  onCancel,
  className,
}: CropToolProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [ratio, setRatio] = useState<CropRatio>('free');
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });

  // Crop selection in percentage (0-100) relative to the displayed image
  const [crop, setCrop] = useState<CropRect>({ x: 10, y: 10, width: 80, height: 80 });
  const [dragging, setDragging] = useState<string | null>(null);
  const dragStartRef = useRef<{ mx: number; my: number; crop: CropRect }>({ mx: 0, my: 0, crop: { x: 0, y: 0, width: 0, height: 0 } });

  // Track rendered image dimensions
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgDimensions({
      width: img.clientWidth,
      height: img.clientHeight,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    });
  }, []);

  // Apply ratio constraint
  useEffect(() => {
    const r = getRatioValue(ratio);
    if (!r || imgDimensions.width === 0) return;
    setCrop((prev) => {
      const maxW = 90;
      const maxH = 90;
      const imgAspect = imgDimensions.width / imgDimensions.height;
      // Convert % to pixel-like units to apply ratio
      let newW = prev.width;
      let newH = (newW * imgAspect) / r;
      if (newH > maxH) {
        newH = maxH;
        newW = (newH * r) / imgAspect;
      }
      if (newW > maxW) {
        newW = maxW;
        newH = (newW * imgAspect) / r;
      }
      const x = Math.min(prev.x, 100 - newW);
      const y = Math.min(prev.y, 100 - newH);
      return { x: Math.max(0, x), y: Math.max(0, y), width: newW, height: newH };
    });
  }, [ratio, imgDimensions]);

  // Mouse handlers
  const handlePointerDown = useCallback((e: React.PointerEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(handle);
    dragStartRef.current = { mx: e.clientX, my: e.clientY, crop: { ...crop } };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [crop]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || !overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStartRef.current.mx) / rect.width) * 100;
    const dy = ((e.clientY - dragStartRef.current.my) / rect.height) * 100;
    const prev = dragStartRef.current.crop;

    setCrop(() => {
      let { x, y, width, height } = prev;

      if (dragging === 'move') {
        x = Math.max(0, Math.min(100 - width, prev.x + dx));
        y = Math.max(0, Math.min(100 - height, prev.y + dy));
      } else {
        // Handle resizing from edges/corners
        if (dragging.includes('l')) {
          const newX = Math.max(0, Math.min(prev.x + prev.width - 5, prev.x + dx));
          width = prev.width - (newX - prev.x);
          x = newX;
        }
        if (dragging.includes('r')) {
          width = Math.max(5, Math.min(100 - prev.x, prev.width + dx));
        }
        if (dragging.includes('t')) {
          const newY = Math.max(0, Math.min(prev.y + prev.height - 5, prev.y + dy));
          height = prev.height - (newY - prev.y);
          y = newY;
        }
        if (dragging.includes('b')) {
          height = Math.max(5, Math.min(100 - prev.y, prev.height + dy));
        }

        // Enforce ratio
        const r = getRatioValue(ratio);
        if (r && imgDimensions.width > 0) {
          const imgAspect = imgDimensions.width / imgDimensions.height;
          if (dragging.includes('l') || dragging.includes('r')) {
            height = (width * imgAspect) / r;
            if (y + height > 100) height = 100 - y;
          } else {
            width = (height * r) / imgAspect;
            if (x + width > 100) width = 100 - x;
          }
        }
      }

      return { x, y, width, height };
    });
  }, [dragging, ratio, imgDimensions]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  // Apply crop via canvas
  const handleApply = useCallback(() => {
    if (!imgRef.current || imgDimensions.naturalWidth === 0) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sx = (crop.x / 100) * imgDimensions.naturalWidth;
    const sy = (crop.y / 100) * imgDimensions.naturalHeight;
    const sw = (crop.width / 100) * imgDimensions.naturalWidth;
    const sh = (crop.height / 100) * imgDimensions.naturalHeight;

    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);

    ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL('image/png');
    onApply(base64);
  }, [crop, imgDimensions, onApply]);

  // Keyboard: Escape to cancel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') handleApply();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel, handleApply]);

  return (
    <div
      ref={overlayRef}
      className={cn("absolute inset-0 z-20", dragging && "cursor-crosshair", className)}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Hidden image for canvas rendering */}
      <img
        ref={imgRef}
        src={imageUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-contain opacity-0 pointer-events-none"
        crossOrigin="anonymous"
        onLoad={handleImageLoad}
      />

      {/* Dark overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="crop-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={`${crop.x}%`}
              y={`${crop.y}%`}
              width={`${crop.width}%`}
              height={`${crop.height}%`}
              fill="black"
            />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#crop-mask)" />
      </svg>

      {/* Selection area */}
      <div
        className="absolute border-2 border-white shadow-lg cursor-move"
        style={{
          left: `${crop.x}%`,
          top: `${crop.y}%`,
          width: `${crop.width}%`,
          height: `${crop.height}%`,
        }}
        onPointerDown={(e) => handlePointerDown(e, 'move')}
      >
        {/* Rule of thirds grid */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-background/30" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-background/30" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-background/30" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-background/30" />
        </div>

        {/* Corner handles */}
        {['tl', 'tr', 'bl', 'br'].map((corner) => {
          const posStyle: React.CSSProperties = {
            ...(corner.includes('t') ? { top: -4 } : { bottom: -4 }),
            ...(corner.includes('l') ? { left: -4 } : { right: -4 }),
          };
          return (
            <div
              key={corner}
              className="absolute w-3 h-3 bg-background border border-border rounded-sm shadow-md cursor-nwse-resize z-10"
              style={{
                ...posStyle,
                cursor: corner === 'tl' || corner === 'br' ? 'nwse-resize' : 'nesw-resize',
              }}
              onPointerDown={(e) => handlePointerDown(e, corner.replace('tl', 'lt').replace('tr', 'rt').replace('bl', 'lb').replace('br', 'rb'))}
            />
          );
        })}

        {/* Edge handles */}
        {['t', 'b', 'l', 'r'].map((edge) => {
          const isHorizontal = edge === 't' || edge === 'b';
          const posStyle: React.CSSProperties = isHorizontal
            ? { [edge === 't' ? 'top' : 'bottom']: -3, left: '50%', transform: 'translateX(-50%)' }
            : { [edge === 'l' ? 'left' : 'right']: -3, top: '50%', transform: 'translateY(-50%)' };
          return (
            <div
              key={edge}
              className={cn(
                "absolute bg-background border border-border rounded-sm shadow-md z-10",
                isHorizontal ? "w-6 h-1.5 cursor-ns-resize" : "w-1.5 h-6 cursor-ew-resize"
              )}
              style={posStyle}
              onPointerDown={(e) => handlePointerDown(e, edge)}
            />
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm border border-border rounded-full px-2 py-1 shadow-xl">
          {RATIOS.map((r) => (
            <Button
              key={r.value}
              variant={ratio === r.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setRatio(r.value)}
              className="h-6 px-2 text-[10px] rounded-full"
            >
              {r.value === 'free' ? <RectangleHorizontal className="w-3 h-3" /> : null}
              {r.label}
            </Button>
          ))}
          <div className="w-px h-4 bg-border mx-1" />
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel} title="Annuler (Echap)">
            <X className="w-3.5 h-3.5" />
          </Button>
          <Button variant="default" size="icon" className="h-6 w-6" onClick={handleApply} title="Appliquer (Entree)">
            <Check className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CropTool;
