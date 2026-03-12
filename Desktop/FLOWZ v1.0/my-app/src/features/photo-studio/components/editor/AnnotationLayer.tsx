"use client"

import React, { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Move, ArrowRight, Type, Square, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Annotation {
  id: string
  type: 'arrow' | 'text' | 'rect' | 'freehand'
  points: { x: number; y: number }[]
  color: string
  label?: string
}

interface AnnotationLayerProps {
  annotations: Annotation[]
  onAdd: (annotation: Annotation) => void
  onRemove: (id: string) => void
  width: number
  height: number
  active: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type Tool = 'move' | 'arrow' | 'text' | 'rect' | 'freehand'

const TOOLS: { tool: Tool; icon: React.ReactNode; label: string }[] = [
  { tool: 'move', icon: <Move className="h-4 w-4" />, label: 'Move' },
  { tool: 'arrow', icon: <ArrowRight className="h-4 w-4" />, label: 'Arrow' },
  { tool: 'text', icon: <Type className="h-4 w-4" />, label: 'Text' },
  { tool: 'rect', icon: <Square className="h-4 w-4" />, label: 'Rectangle' },
  { tool: 'freehand', icon: <Pencil className="h-4 w-4" />, label: 'Freehand' },
]

const PALETTE = [
  { color: '#ef4444', label: 'Red' },
  { color: '#3b82f6', label: 'Blue' },
  { color: '#22c55e', label: 'Green' },
  { color: '#eab308', label: 'Yellow' },
  { color: '#ffffff', label: 'White' },
  { color: '#000000', label: 'Black' },
]

const MARKER_ID = 'annotation-arrowhead'

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

// ---------------------------------------------------------------------------
// SVG renderers
// ---------------------------------------------------------------------------

function renderAnnotation(a: Annotation) {
  switch (a.type) {
    case 'arrow': {
      if (a.points.length < 2) return null
      const [start, end] = a.points
      return (
        <line
          key={a.id}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={a.color}
          strokeWidth={2}
          markerEnd={`url(#${MARKER_ID}-${a.color.replace('#', '')})`}
        />
      )
    }
    case 'text': {
      if (a.points.length < 1 || !a.label) return null
      const p = a.points[0]
      const padding = 4
      const fontSize = 14
      const textWidth = a.label.length * fontSize * 0.6
      return (
        <g key={a.id}>
          <rect
            x={p.x - padding}
            y={p.y - fontSize - padding}
            width={textWidth + padding * 2}
            height={fontSize + padding * 2}
            rx={4}
            fill={a.color}
            fillOpacity={0.2}
            stroke={a.color}
            strokeWidth={1}
          />
          <text
            x={p.x}
            y={p.y}
            fill={a.color}
            fontSize={fontSize}
            fontFamily="sans-serif"
            dominantBaseline="auto"
          >
            {a.label}
          </text>
        </g>
      )
    }
    case 'rect': {
      if (a.points.length < 2) return null
      const [p1, p2] = a.points
      const x = Math.min(p1.x, p2.x)
      const y = Math.min(p1.y, p2.y)
      const w = Math.abs(p2.x - p1.x)
      const h = Math.abs(p2.y - p1.y)
      return (
        <rect
          key={a.id}
          x={x}
          y={y}
          width={w}
          height={h}
          stroke={a.color}
          strokeWidth={2}
          fill={a.color}
          fillOpacity={0.08}
          rx={2}
        />
      )
    }
    case 'freehand': {
      if (a.points.length < 2) return null
      const d = a.points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
        .join(' ')
      return (
        <path
          key={a.id}
          d={d}
          stroke={a.color}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    }
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnnotationLayer({
  annotations,
  onAdd,
  onRemove,
  width,
  height,
  active,
}: AnnotationLayerProps) {
  const [tool, setTool] = useState<Tool>('move')
  const [color, setColor] = useState('#ef4444')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Drawing state
  const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[] | null>(null)
  const [arrowStart, setArrowStart] = useState<{ x: number; y: number } | null>(null)
  const [textInput, setTextInput] = useState<{ x: number; y: number; value: string } | null>(null)
  const isDrawing = useRef(false)
  const svgRef = useRef<SVGSVGElement>(null)

  // ---- Helpers ----

  const svgPoint = useCallback(
    (e: React.MouseEvent | React.PointerEvent): { x: number; y: number } => {
      const svg = svgRef.current
      if (!svg) return { x: 0, y: 0 }
      const rect = svg.getBoundingClientRect()
      return {
        x: ((e.clientX - rect.left) / rect.width) * width,
        y: ((e.clientY - rect.top) / rect.height) * height,
      }
    },
    [width, height],
  )

  // ---- Pointer handlers ----

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!active || tool === 'move') return
      const p = svgPoint(e)

      if (tool === 'text') {
        setTextInput({ x: p.x, y: p.y, value: '' })
        return
      }

      if (tool === 'arrow') {
        if (!arrowStart) {
          setArrowStart(p)
        } else {
          onAdd({
            id: uid(),
            type: 'arrow',
            points: [arrowStart, p],
            color,
          })
          setArrowStart(null)
        }
        return
      }

      // rect or freehand — start drag
      isDrawing.current = true
      setDrawingPoints([p])
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
    },
    [active, tool, color, arrowStart, svgPoint, onAdd],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isDrawing.current || !drawingPoints) return
      const p = svgPoint(e)

      if (tool === 'freehand') {
        setDrawingPoints((prev) => (prev ? [...prev, p] : [p]))
      } else if (tool === 'rect') {
        setDrawingPoints((prev) => (prev ? [prev[0], p] : [p]))
      }
    },
    [drawingPoints, tool, svgPoint],
  )

  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current || !drawingPoints) return
    isDrawing.current = false

    if (tool === 'freehand' && drawingPoints.length >= 2) {
      onAdd({ id: uid(), type: 'freehand', points: drawingPoints, color })
    } else if (tool === 'rect' && drawingPoints.length === 2) {
      onAdd({ id: uid(), type: 'rect', points: drawingPoints, color })
    }

    setDrawingPoints(null)
  }, [drawingPoints, tool, color, onAdd])

  // ---- Text input confirmation ----

  const confirmText = useCallback(() => {
    if (!textInput || !textInput.value.trim()) {
      setTextInput(null)
      return
    }
    onAdd({
      id: uid(),
      type: 'text',
      points: [{ x: textInput.x, y: textInput.y }],
      color,
      label: textInput.value.trim(),
    })
    setTextInput(null)
  }, [textInput, color, onAdd])

  // ---- Click on annotation ----

  const handleAnnotationClick = useCallback(
    (e: React.MouseEvent, id: string) => {
      if (!active || tool !== 'move') return
      e.stopPropagation()
      setSelectedId((prev) => (prev === id ? null : id))
    },
    [active, tool],
  )

  // Deselect on background click
  const handleBgClick = useCallback(() => {
    if (tool === 'move') setSelectedId(null)
  }, [tool])

  // ---- Unique arrow-marker colors ----
  const usedColors = new Set(annotations.map((a) => a.color))
  usedColors.add(color) // include current drawing color

  // ---- Preview shapes while drawing ----
  const preview: Annotation | null = drawingPoints
    ? tool === 'freehand' && drawingPoints.length >= 2
      ? { id: '__preview', type: 'freehand', points: drawingPoints, color }
      : tool === 'rect' && drawingPoints.length === 2
        ? { id: '__preview', type: 'rect', points: drawingPoints, color }
        : null
    : null

  return (
    <div className="relative" style={{ width, height }}>
      {/* Toolbar */}
      {active && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-xl border border-border bg-background/95 px-2 py-1 shadow-lg backdrop-blur-sm">
          {TOOLS.map((t) => (
            <Button
              key={t.tool}
              variant={tool === t.tool ? 'default' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setTool(t.tool)
                setArrowStart(null)
                setTextInput(null)
                setSelectedId(null)
              }}
              title={t.label}
              aria-label={t.label}
            >
              {t.icon}
            </Button>
          ))}

          <div className="mx-1 h-5 w-px bg-border" />

          {PALETTE.map((c) => (
            <button
              key={c.color}
              className={cn(
                'h-5 w-5 rounded-full border-2 transition-transform',
                color === c.color
                  ? 'scale-125 border-primary'
                  : 'border-border/50 hover:scale-110',
              )}
              style={{ backgroundColor: c.color }}
              onClick={() => setColor(c.color)}
              title={c.label}
              aria-label={c.label}
            />
          ))}
        </div>
      )}

      {/* SVG layer */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={cn(
          'absolute inset-0 h-full w-full',
          active && tool !== 'move' ? 'cursor-crosshair' : '',
          !active && 'pointer-events-none',
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleBgClick}
      >
        {/* Arrowhead markers per color */}
        <defs>
          {Array.from(usedColors).map((c) => (
            <marker
              key={c}
              id={`${MARKER_ID}-${c.replace('#', '')}`}
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={c} />
            </marker>
          ))}
        </defs>

        {/* Existing annotations */}
        {annotations.map((a) => (
          <g
            key={a.id}
            onClick={(e) => handleAnnotationClick(e, a.id)}
            className={cn(active && tool === 'move' ? 'cursor-pointer' : '')}
          >
            {renderAnnotation(a)}
          </g>
        ))}

        {/* Preview while drawing */}
        {preview && renderAnnotation(preview)}

        {/* Arrow start indicator */}
        {arrowStart && (
          <circle
            cx={arrowStart.x}
            cy={arrowStart.y}
            r={4}
            fill={color}
            fillOpacity={0.6}
          />
        )}
      </svg>

      {/* Delete button for selected annotation */}
      {active && selectedId && (() => {
        const sel = annotations.find((a) => a.id === selectedId)
        if (!sel || sel.points.length === 0) return null
        const p = sel.points[0]
        // Position delete button relative to SVG
        const svg = svgRef.current
        if (!svg) return null
        const rect = svg.getBoundingClientRect()
        const sx = (p.x / width) * rect.width
        const sy = (p.y / height) * rect.height
        return (
          <Button
            variant="ghost"
            size="icon"
            className="absolute z-40 h-6 w-6 rounded-full border border-border bg-background shadow-md"
            style={{ left: sx + 8, top: sy - 20 }}
            onClick={() => {
              onRemove(selectedId)
              setSelectedId(null)
            }}
            aria-label="Delete annotation"
          >
            <X className="h-3 w-3" />
          </Button>
        )
      })()}

      {/* Text input popup */}
      {active && textInput && (() => {
        const svg = svgRef.current
        if (!svg) return null
        const rect = svg.getBoundingClientRect()
        const sx = (textInput.x / width) * rect.width
        const sy = (textInput.y / height) * rect.height
        return (
          <input
            autoFocus
            className="absolute z-40 rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground shadow-lg outline-none"
            style={{ left: sx, top: sy }}
            value={textInput.value}
            onChange={(e) => setTextInput((prev) => prev ? { ...prev, value: e.target.value } : null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmText()
              if (e.key === 'Escape') setTextInput(null)
            }}
            onBlur={confirmText}
          />
        )
      })()}
    </div>
  )
}

export default AnnotationLayer
