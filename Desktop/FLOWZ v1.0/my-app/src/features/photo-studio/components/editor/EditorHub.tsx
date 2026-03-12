"use client"

/**
 * EditorHub — Full-screen editor dialog for the Photo Studio.
 *
 * Layout:
 * ┌──────────────────────────────────────────────────────────┐
 * │ Header: product name | ValidationBadge | [X] close       │
 * ├────────────────────────────────┬─────────────────────────┤
 * │ ActionBar (tools + zoom)       │                         │
 * │ ──────────────────────────────│  EditorControlPanel      │
 * │                               │  (actions, presets,      │
 * │   EditorCanvas                │   classification)        │
 * │   (image + overlays)          │                         │
 * │                               │  ImageAdjustments        │
 * │                               │  (when adjust tool)      │
 * ├───────────────────────────────┴─────────────────────────┤
 * │ SessionTimeline (horizontal scroll)                      │
 * ├─────────────────────────────────────────────────────────┤
 * │ Footer: [Generer] [Appliquer au produit] [Telecharger]  │
 * └─────────────────────────────────────────────────────────┘
 */

import React, { useCallback, useEffect, useReducer } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { styles, motionTokens } from "@/lib/design-system"
import {
  Download,
  Loader2,
  PackageCheck,
  Sparkles,
  X,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

import { editorReducer, initialEditorState } from "./editorReducer"
import { EditorCanvas } from "./EditorCanvas"
import { EditorActionBar } from "./ActionBar"
import { EditorControlPanel } from "./ControlPanel"
import { ImageAdjustments } from "./ImageAdjustments"
import { SessionTimeline } from "./SessionTimeline"
import { useStudioImages } from "../../hooks/useStudioImages"
import type { StudioImage } from "../../hooks/useStudioImages"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EditorHubProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: { id: string; title: string; images: string[] }
}

// ---------------------------------------------------------------------------
// Validation badge
// ---------------------------------------------------------------------------

const STATUS_VARIANTS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  published: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  approved: "Approuve",
  published: "Publie",
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditorHub({ open, onOpenChange, product }: EditorHubProps) {
  const [state, dispatch] = useReducer(editorReducer, initialEditorState)
  const { updateStatusAsync } = useStudioImages({ productId: product.id })

  // Initialise image on open
  useEffect(() => {
    if (open && product.images.length > 0) {
      const firstImage = product.images[0]
      dispatch({
        type: "SET_IMAGE",
        payload: { active: firstImage, original: firstImage },
      })
    }
  }, [open, product.images])

  // ---- Handlers ----

  const handleGenerate = useCallback(async () => {
    if (!state.selectedAction || state.isGenerating) return
    dispatch({ type: "SET_GENERATING", payload: true })

    try {
      const res = await fetch("/api/photo-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          action: state.selectedAction,
          preset: state.selectedPreset,
          imageUrl: state.activeImage,
          instruction: state.userInstruction || undefined,
        }),
      })

      if (!res.ok) throw new Error("Generation failed")

      const data = await res.json()
      if (data.outputUrl) {
        dispatch({ type: "SET_ACTIVE_IMAGE", payload: data.outputUrl })
      }
    } catch {
      // Error is handled silently — toast could be added in a future iteration
    } finally {
      dispatch({ type: "SET_GENERATING", payload: false })
    }
  }, [
    product.id,
    state.selectedAction,
    state.selectedPreset,
    state.activeImage,
    state.userInstruction,
    state.isGenerating,
  ])

  const handleApplyToProduct = useCallback(async () => {
    if (!state.activeImage) return

    try {
      await updateStatusAsync({
        imageUrl: state.activeImage,
        status: "approved",
      })
      dispatch({ type: "SET_VALIDATION_STATUS", payload: "approved" })

      await updateStatusAsync({
        imageUrl: state.activeImage,
        status: "published",
      })
      dispatch({ type: "SET_VALIDATION_STATUS", payload: "published" })
    } catch {
      // Silent — could add toast
    }
  }, [state.activeImage, updateStatusAsync])

  const handleDownload = useCallback(async () => {
    if (!state.activeImage) return

    try {
      const response = await fetch(state.activeImage)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${product.title.replace(/\s+/g, "_")}_edited.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // Silent
    }
  }, [state.activeImage, product.title])

  const handleTimelineSelect = useCallback(
    (image: StudioImage) => {
      dispatch({
        type: "SET_IMAGE",
        payload: { active: image.storage_url, original: state.originalImage },
      })
      dispatch({ type: "SET_VALIDATION_STATUS", payload: image.status })
    },
    [state.originalImage]
  )

  const handleTimelineRegenerate = useCallback(
    (image: StudioImage) => {
      dispatch({ type: "SET_ACTION", payload: image.action })
      dispatch({
        type: "SET_IMAGE",
        payload: { active: image.storage_url, original: state.originalImage },
      })
    },
    [state.originalImage]
  )

  const handleAdjustmentApply = useCallback(
    (blob: Blob) => {
      const url = URL.createObjectURL(blob)
      dispatch({ type: "SET_ACTIVE_IMAGE", payload: url })
      dispatch({ type: "RESET_ADJUSTMENTS" })
    },
    []
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-[95vw] h-[95vh] p-0 gap-0 flex flex-col overflow-hidden rounded-2xl",
          "border border-border bg-background"
        )}
      >
        {/* Accessible title */}
        <DialogTitle className="sr-only">
          Editeur Photo Studio — {product.title}
        </DialogTitle>

        <motion.div
          className="flex flex-col h-full"
          variants={motionTokens.variants.modal}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* ---------------------------------------------------------------- */}
          {/* Header                                                           */}
          {/* ---------------------------------------------------------------- */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <h2 className={cn(styles.text.h4, "truncate max-w-sm")}>
                {product.title}
              </h2>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full text-xs font-medium",
                  STATUS_VARIANTS[state.validationStatus]
                )}
              >
                {STATUS_LABELS[state.validationStatus]}
              </Badge>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fermer</span>
            </Button>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Body                                                             */}
          {/* ---------------------------------------------------------------- */}
          <div className="flex flex-1 min-h-0">
            {/* Left: ActionBar + Canvas */}
            <div className="flex flex-col flex-1 min-w-0">
              {/* Action bar */}
              <div className="h-11 flex-shrink-0">
                <EditorActionBar
                  activeTool={state.activeTool}
                  onToolChange={(tool) =>
                    dispatch({ type: "SET_TOOL", payload: tool })
                  }
                  zoom={state.zoom}
                  onZoomChange={(z) =>
                    dispatch({ type: "SET_ZOOM", payload: z })
                  }
                />
              </div>

              {/* Canvas */}
              <EditorCanvas state={state} dispatch={dispatch} />
            </div>

            {/* Right: Control panel + adjustments */}
            <div className="w-80 flex-shrink-0 flex flex-col min-h-0 border-l border-border">
              <ScrollArea className="flex-1 min-h-0">
                <EditorControlPanel
                  selectedAction={state.selectedAction}
                  onActionChange={(a) =>
                    dispatch({ type: "SET_ACTION", payload: a })
                  }
                  selectedPreset={state.selectedPreset}
                  onPresetChange={(p) =>
                    dispatch({ type: "SET_PRESET", payload: p })
                  }
                  productId={product.id}
                  imageUrl={state.activeImage || null}
                  isGenerating={state.isGenerating}
                  onGenerate={handleGenerate}
                  userInstruction={state.userInstruction}
                  onInstructionChange={(v) =>
                    dispatch({ type: "SET_INSTRUCTION", payload: v })
                  }
                />

                {/* Adjustments panel — visible when adjust tool is active */}
                {state.activeTool === "adjust" && (
                  <>
                    <Separator />
                    <ImageAdjustments
                      adjustments={state.adjustments}
                      onAdjustmentsChange={(partial) =>
                        dispatch({
                          type: "SET_ADJUSTMENTS",
                          payload: partial,
                        })
                      }
                      onReset={() => dispatch({ type: "RESET_ADJUSTMENTS" })}
                      onApply={handleAdjustmentApply}
                      imageUrl={state.activeImage}
                    />
                  </>
                )}
              </ScrollArea>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Session Timeline                                                 */}
          {/* ---------------------------------------------------------------- */}
          <div className="flex-shrink-0 border-t border-border bg-card">
            <SessionTimeline
              productId={product.id}
              activeImageUrl={state.activeImage}
              onImageSelect={handleTimelineSelect}
              onRegenerate={handleTimelineRegenerate}
            />
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Footer                                                           */}
          {/* ---------------------------------------------------------------- */}
          <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-border flex-shrink-0 bg-card">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-lg"
              onClick={handleDownload}
              disabled={!state.activeImage}
            >
              <Download className="h-4 w-4" />
              Telecharger
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-lg"
              onClick={handleApplyToProduct}
              disabled={!state.activeImage || state.isGenerating}
            >
              <PackageCheck className="h-4 w-4" />
              Appliquer au produit
            </Button>

            <Button
              size="sm"
              className="gap-2 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-300"
              onClick={handleGenerate}
              disabled={
                state.isGenerating || !state.selectedAction
              }
            >
              {state.isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generation...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generer
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
