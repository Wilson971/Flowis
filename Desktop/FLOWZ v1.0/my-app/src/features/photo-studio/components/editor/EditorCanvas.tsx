"use client"

/**
 * EditorCanvas — Central image display with CSS filters, tool overlays, and zoom.
 *
 * Renders the active image and conditionally layers CropTool, AnnotationLayer,
 * or CompareOverlay depending on the active tool. Adjustments are previewed
 * via CSS filters in real-time.
 */

import React, { useRef, useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { EditorState, EditorAction } from "./editorReducer"
import { CropTool } from "./CropTool"
import { AnnotationLayer } from "./AnnotationLayer"
import { CompareOverlay } from "../viewer/CompareOverlay"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EditorCanvasProps {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
  className?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildCssFilter(adj: EditorState["adjustments"]): string {
  return [
    `brightness(${adj.brightness / 100})`,
    `contrast(${adj.contrast / 100})`,
    `saturate(${adj.saturation / 100})`,
  ].join(" ")
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditorCanvas({ state, dispatch, className }: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [imageDims, setImageDims] = useState({ width: 0, height: 0 })

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget
      setImageDims({ width: img.naturalWidth, height: img.naturalHeight })
    },
    []
  )

  // Reset dims when image changes
  useEffect(() => {
    setImageDims({ width: 0, height: 0 })
  }, [state.activeImage])

  const handleCropApply = useCallback(
    (blob: Blob) => {
      const url = URL.createObjectURL(blob)
      dispatch({ type: "SET_ACTIVE_IMAGE", payload: url })
      dispatch({ type: "SET_TOOL", payload: null })
    },
    [dispatch]
  )

  const handleCropCancel = useCallback(() => {
    dispatch({ type: "SET_TOOL", payload: null })
  }, [dispatch])

  const cssFilter = buildCssFilter(state.adjustments)
  const scale = state.zoom / 100

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex-1 overflow-hidden bg-muted/30 flex items-center justify-center",
        className
      )}
    >
      {/* Zoomable + filterable image wrapper */}
      <div
        className="relative transition-transform duration-200"
        style={{ transform: `scale(${scale})` }}
      >
        {state.activeImage ? (
          <>
            {/* Main image */}
            <img
              src={state.activeImage}
              alt="Editor preview"
              onLoad={handleImageLoad}
              className="max-w-full max-h-full object-contain select-none"
              style={{ filter: cssFilter }}
              draggable={false}
            />

            {/* Crop overlay */}
            {state.activeTool === "crop" &&
              imageDims.width > 0 &&
              imageDims.height > 0 && (
                <CropTool
                  imageUrl={state.activeImage}
                  imageWidth={imageDims.width}
                  imageHeight={imageDims.height}
                  onApply={handleCropApply}
                  onCancel={handleCropCancel}
                />
              )}

            {/* Annotation overlay */}
            {state.activeTool === "annotate" &&
              imageDims.width > 0 &&
              imageDims.height > 0 && (
                <div className="absolute inset-0">
                  <AnnotationLayer
                    annotations={state.annotations}
                    onAdd={(a) =>
                      dispatch({ type: "ADD_ANNOTATION", payload: a })
                    }
                    onRemove={(id) =>
                      dispatch({ type: "REMOVE_ANNOTATION", payload: id })
                    }
                    width={imageDims.width}
                    height={imageDims.height}
                    active
                  />
                </div>
              )}
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            Aucune image selectionnee
          </div>
        )}
      </div>

      {/* Compare overlay — full container, outside zoom wrapper */}
      {state.activeTool === "compare" &&
        state.originalImage &&
        state.activeImage && (
          <div className="absolute inset-0 z-20">
            <CompareOverlay
              originalUrl={state.originalImage}
              generatedUrl={state.activeImage}
              className="h-full w-full"
            />
          </div>
        )}
    </div>
  )
}
