"use client";

/**
 * AnnotationLayer — Canvas-based drawing overlay
 *
 * Transparent canvas overlay for drawing annotations on images.
 * Tools: Pen (freehand), Arrow, Rectangle, Text.
 * Colors: 6 preset colors. Sizes: 3 thicknesses.
 * Undo/Redo stack. Export merges canvas + image.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Pen,
  ArrowUpRight,
  Square,
  Type,
  Undo2,
  Redo2,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type AnnotationTool = 'pen' | 'arrow' | 'rectangle' | 'text';
type AnnotationColor = string;
type StrokeWidth = 2 | 4 | 6;

type DrawOperation = {
  tool: AnnotationTool;
  color: string;
  width: number;
  points?: { x: number; y: number }[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  text?: string;
};

const COLORS: { color: string; label: string }[] = [
  { color: '#ef4444', label: 'Rouge' },
  { color: '#3b82f6', label: 'Bleu' },
  { color: '#22c55e', label: 'Vert' },
  { color: '#eab308', label: 'Jaune' },
  { color: '#ffffff', label: 'Blanc' },
  { color: '#171717', label: 'Noir' },
];

const WIDTHS: { width: StrokeWidth; label: string }[] = [
  { width: 2, label: 'Fin' },
  { width: 4, label: 'Moyen' },
  { width: 6, label: 'Epais' },
];

const TOOLS: { tool: AnnotationTool; icon: React.ReactNode; label: string }[] = [
  { tool: 'pen', icon: <Pen className="w-3.5 h-3.5" />, label: 'Stylo' },
  { tool: 'arrow', icon: <ArrowUpRight className="w-3.5 h-3.5" />, label: 'Fleche' },
  { tool: 'rectangle', icon: <Square className="w-3.5 h-3.5" />, label: 'Rectangle' },
  { tool: 'text', icon: <Type className="w-3.5 h-3.5" />, label: 'Texte' },
];

type AnnotationLayerProps = {
  imageUrl: string;
  width: number;
  height: number;
  onExport: (mergedBase64: string) => void;
  onCancel: () => void;
  className?: string;
};

export const AnnotationLayer = ({
  imageUrl,
  width,
  height,
  onExport,
  onCancel,
  className,
}: AnnotationLayerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [tool, setTool] = useState<AnnotationTool>('pen');
  const [color, setColor] = useState<AnnotationColor>('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState<StrokeWidth>(4);

  const [operations, setOperations] = useState<DrawOperation[]>([]);
  const [redoStack, setRedoStack] = useState<DrawOperation[]>([]);
  const [currentOp, setCurrentOp] = useState<DrawOperation | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Redraw all operations
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allOps = currentOp ? [...operations, currentOp] : operations;

    for (const op of allOps) {
      ctx.strokeStyle = op.color;
      ctx.fillStyle = op.color;
      ctx.lineWidth = op.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (op.tool === 'pen' && op.points && op.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(op.points[0].x, op.points[0].y);
        for (let i = 1; i < op.points.length; i++) {
          ctx.lineTo(op.points[i].x, op.points[i].y);
        }
        ctx.stroke();
      }

      if (op.tool === 'arrow' && op.start && op.end) {
        const dx = op.end.x - op.start.x;
        const dy = op.end.y - op.start.y;
        const angle = Math.atan2(dy, dx);
        const headLen = 12 + op.width * 2;

        ctx.beginPath();
        ctx.moveTo(op.start.x, op.start.y);
        ctx.lineTo(op.end.x, op.end.y);
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(op.end.x, op.end.y);
        ctx.lineTo(
          op.end.x - headLen * Math.cos(angle - Math.PI / 6),
          op.end.y - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          op.end.x - headLen * Math.cos(angle + Math.PI / 6),
          op.end.y - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }

      if (op.tool === 'rectangle' && op.start && op.end) {
        const rx = Math.min(op.start.x, op.end.x);
        const ry = Math.min(op.start.y, op.end.y);
        const rw = Math.abs(op.end.x - op.start.x);
        const rh = Math.abs(op.end.y - op.start.y);
        ctx.strokeRect(rx, ry, rw, rh);
      }

      if (op.tool === 'text' && op.start && op.text) {
        ctx.font = `${14 + op.width * 2}px sans-serif`;
        ctx.fillText(op.text, op.start.x, op.start.y);
      }
    }
  }, [operations, currentOp]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Resize canvas to match container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    redraw();
  }, [width, height, redraw]);

  const getCanvasPoint = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (tool === 'text') {
      const point = getCanvasPoint(e);
      const text = prompt('Texte a ajouter:');
      if (text) {
        const op: DrawOperation = { tool: 'text', color, width: strokeWidth, start: point, text };
        setOperations((prev) => [...prev, op]);
        setRedoStack([]);
      }
      return;
    }

    setIsDrawing(true);
    const point = getCanvasPoint(e);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    if (tool === 'pen') {
      setCurrentOp({ tool: 'pen', color, width: strokeWidth, points: [point] });
    } else {
      setCurrentOp({ tool, color, width: strokeWidth, start: point, end: point });
    }
  }, [tool, color, strokeWidth, getCanvasPoint]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing || !currentOp) return;
    const point = getCanvasPoint(e);

    if (currentOp.tool === 'pen') {
      setCurrentOp((prev) => prev ? { ...prev, points: [...(prev.points || []), point] } : null);
    } else {
      setCurrentOp((prev) => prev ? { ...prev, end: point } : null);
    }
  }, [isDrawing, currentOp, getCanvasPoint]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || !currentOp) return;
    setIsDrawing(false);
    setOperations((prev) => [...prev, currentOp]);
    setRedoStack([]);
    setCurrentOp(null);
  }, [isDrawing, currentOp]);

  const handleUndo = useCallback(() => {
    setOperations((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack((redo) => [last, ...redo]);
      return prev.slice(0, -1);
    });
  }, []);

  const handleRedo = useCallback(() => {
    setRedoStack((redo) => {
      if (redo.length === 0) return redo;
      const [first, ...rest] = redo;
      setOperations((prev) => [...prev, first]);
      return rest;
    });
  }, []);

  const handleClear = useCallback(() => {
    setOperations([]);
    setRedoStack([]);
    setCurrentOp(null);
  }, []);

  // Export: merge image + canvas
  const handleExport = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = img.naturalWidth;
    exportCanvas.height = img.naturalHeight;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);

    // Scale annotations from display size to natural size
    const scaleX = img.naturalWidth / canvas.width;
    const scaleY = img.naturalHeight / canvas.height;
    ctx.save();
    ctx.scale(scaleX, scaleY);
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();

    onExport(exportCanvas.toDataURL('image/png'));
  }, [onExport]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel, handleUndo, handleRedo]);

  return (
    <div className={cn("absolute inset-0 z-20", className)}>
      {/* Hidden image for export */}
      <img
        ref={imgRef}
        src={imageUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-contain opacity-0 pointer-events-none"
        crossOrigin="anonymous"
      />

      {/* Drawing canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      {/* Toolbar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm border border-border rounded-full px-2 py-1.5 shadow-xl">
          {/* Tools */}
          {TOOLS.map((t) => (
            <Button
              key={t.tool}
              variant={tool === t.tool ? 'default' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setTool(t.tool)}
              title={t.label}
              aria-label={t.label}
            >
              {t.icon}
            </Button>
          ))}

          <div className="w-px h-5 bg-border mx-0.5" />

          {/* Colors */}
          {COLORS.map((c) => (
            <button
              key={c.color}
              className={cn(
                "w-5 h-5 rounded-full border-2 transition-transform",
                color === c.color ? "border-primary scale-125" : "border-border/50 hover:scale-110"
              )}
              style={{ backgroundColor: c.color }}
              onClick={() => setColor(c.color)}
              title={c.label}
              aria-label={c.label}
            />
          ))}

          <div className="w-px h-5 bg-border mx-0.5" />

          {/* Widths */}
          {WIDTHS.map((w) => (
            <button
              key={w.width}
              className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full transition-colors",
                strokeWidth === w.width ? "bg-primary/20" : "hover:bg-accent"
              )}
              onClick={() => setStrokeWidth(w.width)}
              title={w.label}
              aria-label={`Epaisseur ${w.label}`}
            >
              <div
                className="rounded-full bg-foreground"
                style={{ width: w.width * 2, height: w.width * 2 }}
              />
            </button>
          ))}

          <div className="w-px h-5 bg-border mx-0.5" />

          {/* Actions */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleUndo}
            disabled={operations.length === 0}
            title="Annuler (Ctrl+Z)"
            aria-label="Annuler"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="Retablir (Ctrl+Shift+Z)"
            aria-label="Retablir"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleClear}
            disabled={operations.length === 0}
            title="Effacer tout"
            aria-label="Effacer tout"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>

          <div className="w-px h-5 bg-border mx-0.5" />

          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel} title="Fermer (Echap)">
            <X className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="default"
            size="icon"
            className="h-7 w-7"
            onClick={handleExport}
            disabled={operations.length === 0}
            title="Exporter"
          >
            <Check className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnnotationLayer;
