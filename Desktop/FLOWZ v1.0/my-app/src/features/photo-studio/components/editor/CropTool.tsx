"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Check, X } from "lucide-react"

interface CropToolProps {
  imageUrl: string
  imageWidth: number
  imageHeight: number
  onApply: (croppedBlob: Blob) => void
  onCancel: () => void
}

type DragType = "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w"
type AspectRatio = "free" | "1:1" | "4:3" | "16:9"

const ASPECT_RATIOS: Record<AspectRatio, number | null> = {
  free: null,
  "1:1": 1,
  "4:3": 4 / 3,
  "16:9": 16 / 9,
}

const HANDLE_SIZE = 10

export function CropTool({
  imageUrl,
  imageWidth,
  imageHeight,
  onApply,
  onCancel,
}: CropToolProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0, width: imageWidth, height: imageHeight })
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("free")
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState<DragType | null>(null)
  const dragStart = useRef({ mouseX: 0, mouseY: 0, crop: { x: 0, y: 0, width: 0, height: 0 } })
  const overlayRef = useRef<HTMLDivElement>(null)

  // Constrain crop to image bounds
  const clampCrop = useCallback(
    (c: typeof crop) => ({
      x: Math.max(0, Math.min(c.x, imageWidth - c.width)),
      y: Math.max(0, Math.min(c.y, imageHeight - c.height)),
      width: Math.max(20, Math.min(c.width, imageWidth - Math.max(0, c.x))),
      height: Math.max(20, Math.min(c.height, imageHeight - Math.max(0, c.y))),
    }),
    [imageWidth, imageHeight]
  )

  // When aspect ratio changes, adjust crop
  useEffect(() => {
    const ratio = ASPECT_RATIOS[aspectRatio]
    if (!ratio) return
    setCrop((prev) => {
      let { x, y, width, height } = prev
      const newHeight = width / ratio
      if (newHeight <= imageHeight) {
        height = newHeight
      } else {
        height = imageHeight
        width = height * ratio
      }
      return clampCrop({ x, y, width, height })
    })
  }, [aspectRatio, imageHeight, clampCrop])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: DragType) => {
      e.stopPropagation()
      e.preventDefault()
      setIsDragging(true)
      setDragType(type)
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        crop: { ...crop },
      }
    },
    [crop]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragType) return
      const dx = e.clientX - dragStart.current.mouseX
      const dy = e.clientY - dragStart.current.mouseY
      const start = dragStart.current.crop
      const ratio = ASPECT_RATIOS[aspectRatio]

      setCrop(() => {
        let { x, y, width, height } = { ...start }

        if (dragType === "move") {
          x = start.x + dx
          y = start.y + dy
          return clampCrop({ x, y, width, height })
        }

        // Resize based on handle
        if (dragType.includes("e")) {
          width = Math.max(20, start.width + dx)
        }
        if (dragType.includes("w")) {
          const newWidth = Math.max(20, start.width - dx)
          x = start.x + (start.width - newWidth)
          width = newWidth
        }
        if (dragType.includes("s")) {
          height = Math.max(20, start.height + dy)
        }
        if (dragType.includes("n")) {
          const newHeight = Math.max(20, start.height - dy)
          y = start.y + (start.height - newHeight)
          height = newHeight
        }

        // Enforce aspect ratio
        if (ratio) {
          if (dragType === "n" || dragType === "s") {
            width = height * ratio
          } else {
            height = width / ratio
            if (dragType.includes("n")) {
              y = start.y + start.height - height
            }
          }
        }

        return clampCrop({ x, y, width, height })
      })
    },
    [isDragging, dragType, aspectRatio, clampCrop]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragType(null)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleApply = useCallback(async () => {
    const canvas = document.createElement("canvas")
    canvas.width = crop.width
    canvas.height = crop.height
    const ctx = canvas.getContext("2d")!
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = imageUrl
    await new Promise((r) => (img.onload = r))
    ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)
    canvas.toBlob(
      (blob) => {
        if (blob) onApply(blob)
      },
      "image/png"
    )
  }, [crop, imageUrl, onApply])

  const handleCancel = useCallback(() => {
    setCrop({ x: 0, y: 0, width: imageWidth, height: imageHeight })
    onCancel()
  }, [imageWidth, imageHeight, onCancel])

  const handles: { type: DragType; style: React.CSSProperties; cursor: string }[] = [
    { type: "nw", style: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 }, cursor: "nwse-resize" },
    { type: "ne", style: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 }, cursor: "nesw-resize" },
    { type: "sw", style: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 }, cursor: "nesw-resize" },
    { type: "se", style: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 }, cursor: "nwse-resize" },
    { type: "n", style: { top: -HANDLE_SIZE / 2, left: "50%", marginLeft: -HANDLE_SIZE / 2 }, cursor: "ns-resize" },
    { type: "s", style: { bottom: -HANDLE_SIZE / 2, left: "50%", marginLeft: -HANDLE_SIZE / 2 }, cursor: "ns-resize" },
    { type: "w", style: { top: "50%", left: -HANDLE_SIZE / 2, marginTop: -HANDLE_SIZE / 2 }, cursor: "ew-resize" },
    { type: "e", style: { top: "50%", right: -HANDLE_SIZE / 2, marginTop: -HANDLE_SIZE / 2 }, cursor: "ew-resize" },
  ]

  return (
    <div className="absolute inset-0 z-30 select-none" ref={overlayRef}>
      {/* Top toolbar */}
      <div className="absolute -top-12 left-0 right-0 flex items-center justify-between z-40">
        <ToggleGroup
          type="single"
          value={aspectRatio}
          onValueChange={(v) => {
            if (v) setAspectRatio(v as AspectRatio)
          }}
          className="gap-1"
        >
          <ToggleGroupItem value="free" size="sm" className="rounded-lg text-xs">
            Free
          </ToggleGroupItem>
          <ToggleGroupItem value="1:1" size="sm" className="rounded-lg text-xs">
            1:1
          </ToggleGroupItem>
          <ToggleGroupItem value="4:3" size="sm" className="rounded-lg text-xs">
            4:3
          </ToggleGroupItem>
          <ToggleGroupItem value="16:9" size="sm" className="rounded-lg text-xs">
            16:9
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handleCancel} className="rounded-lg">
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply} className="rounded-lg">
            <Check className="h-4 w-4 mr-1" />
            Apply
          </Button>
        </div>
      </div>

      {/* Dark overlay - 4 regions around crop area */}
      <div
        className="absolute bg-black/50"
        style={{ top: 0, left: 0, right: 0, height: crop.y }}
      />
      <div
        className="absolute bg-black/50"
        style={{ top: crop.y + crop.height, left: 0, right: 0, bottom: 0 }}
      />
      <div
        className="absolute bg-black/50"
        style={{ top: crop.y, left: 0, width: crop.x, height: crop.height }}
      />
      <div
        className="absolute bg-black/50"
        style={{
          top: crop.y,
          left: crop.x + crop.width,
          right: 0,
          height: crop.height,
        }}
      />

      {/* Crop area */}
      <div
        className={cn(
          "absolute border-2 border-primary",
          isDragging && dragType === "move" ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{
          top: crop.y,
          left: crop.x,
          width: crop.width,
          height: crop.height,
        }}
        onMouseDown={(e) => handleMouseDown(e, "move")}
      >
        {/* Rule of thirds grid */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
        </div>

        {/* Resize handles */}
        {handles.map(({ type, style, cursor }) => (
          <div
            key={type}
            className="absolute bg-white border-2 border-primary rounded-sm"
            style={{
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              cursor,
              ...style,
            }}
            onMouseDown={(e) => handleMouseDown(e, type)}
          />
        ))}
      </div>
    </div>
  )
}
