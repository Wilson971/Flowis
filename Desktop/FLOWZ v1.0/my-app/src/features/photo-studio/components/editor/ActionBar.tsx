"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import {
  Crop,
  SlidersHorizontal,
  PenTool,
  Columns,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EditorTool = 'crop' | 'adjust' | 'annotate' | 'compare'

export interface EditorActionBarProps {
  activeTool: EditorTool | null
  onToolChange: (tool: EditorTool | null) => void
  zoom: number
  onZoomChange: (zoom: number) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOOLS = [
  { id: 'crop' as const, icon: Crop, label: 'Recadrer' },
  { id: 'adjust' as const, icon: SlidersHorizontal, label: 'Ajuster' },
  { id: 'annotate' as const, icon: PenTool, label: 'Annoter' },
  { id: 'compare' as const, icon: Columns, label: 'Comparer' },
]

const ZOOM_STEP = 10
const ZOOM_MIN = 10
const ZOOM_MAX = 400

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditorActionBar({
  activeTool,
  onToolChange,
  zoom,
  onZoomChange,
}: EditorActionBarProps) {
  const handleToolClick = (toolId: EditorTool) => {
    onToolChange(activeTool === toolId ? null : toolId)
  }

  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom + ZOOM_STEP, ZOOM_MAX))
  }

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom - ZOOM_STEP, ZOOM_MIN))
  }

  return (
    <div className="flex items-center gap-1 px-4 h-full bg-card border-b border-border">
      {/* Tool buttons */}
      {TOOLS.map((tool) => (
        <Button
          key={tool.id}
          variant={activeTool === tool.id ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleToolClick(tool.id)}
          className={cn(
            'gap-1.5 rounded-lg text-xs transition-all duration-200',
            activeTool === tool.id && 'shadow-sm'
          )}
        >
          <tool.icon className="w-4 h-4" />
          {tool.label}
        </Button>
      ))}

      <Separator orientation="vertical" className="mx-2 h-6" />

      {/* Zoom controls */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleZoomOut}
        disabled={zoom <= ZOOM_MIN}
        className="h-8 w-8 rounded-lg"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>

      <span className="min-w-[3.5rem] text-center text-xs font-medium tabular-nums text-muted-foreground">
        {Math.round(zoom)}%
      </span>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleZoomIn}
        disabled={zoom >= ZOOM_MAX}
        className="h-8 w-8 rounded-lg"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
    </div>
  )
}
