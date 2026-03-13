'use client'

import { useEffect, useRef, useState, useCallback, type RefObject } from 'react'
import {
  Canvas,
  FabricImage,
  Rect,
  FabricText,
  Circle,
  Line,
  filters,
  type FabricObject,
} from 'fabric'
import type { ImageAdjustmentValues } from '../types/studio'

// ─── Types ────────────────────────────────────────────────────
interface UseFabricEditorOptions {
  width: number
  height: number
}

interface CropRect {
  left: number
  top: number
  width: number
  height: number
}

interface FabricEditorActions {
  loadImage: (url: string) => Promise<void>
  crop: () => void
  resetCrop: () => void
  applyCrop: () => Promise<void>
  zoom: (delta: number) => void
  pan: (dx: number, dy: number) => void
  rotate: (angle: number) => void
  flip: (axis: 'x' | 'y') => void
  addText: (text: string, options?: Partial<{ fontSize: number; fill: string }>) => void
  addShape: (shape: 'rect' | 'circle' | 'line', options?: Partial<{ width: number; height: number; fill: string; stroke: string }>) => void
  freeDrawing: (enabled: boolean, options?: Partial<{ color: string; width: number }>) => void
  applyAdjustments: (values: ImageAdjustmentValues) => void
  undo: () => void
  redo: () => void
  exportImage: (format?: 'png' | 'jpeg' | 'webp', quality?: number) => string | null
  resetCanvas: () => void
}

const MAX_HISTORY = 50

export function useFabricEditor(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  options: UseFabricEditorOptions
) {
  const [canvas, setCanvas] = useState<Canvas | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isReady, setIsReady] = useState(false)

  const historyRef = useRef<string[]>([])
  const historyIndexRef = useRef(-1)
  const isRestoringRef = useRef(false)
  const cropRectRef = useRef<Rect | null>(null)

  // ─── Save history snapshot ─────────────────────────────────
  const saveHistory = useCallback((c: Canvas) => {
    if (isRestoringRef.current) return
    const json = JSON.stringify(c.toJSON())
    const idx = historyIndexRef.current
    // Truncate forward history
    historyRef.current = historyRef.current.slice(0, idx + 1)
    historyRef.current.push(json)
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift()
    } else {
      historyIndexRef.current = historyRef.current.length - 1
    }
  }, [])

  // ─── Init / Dispose ────────────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return

    const c = new Canvas(el, {
      width: options.width,
      height: options.height,
      backgroundColor: '#f5f5f5',
      selection: true,
    })

    c.on('object:modified', () => saveHistory(c))
    c.on('object:added', () => saveHistory(c))

    setCanvas(c)
    setIsReady(true)
    saveHistory(c)

    return () => {
      c.dispose()
      setCanvas(null)
      setIsReady(false)
      historyRef.current = []
      historyIndexRef.current = -1
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, options.width, options.height])

  // ─── Actions ───────────────────────────────────────────────
  const actions: FabricEditorActions = {
    loadImage: async (url: string) => {
      if (!canvas) return
      const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' })

      // Scale to fit canvas
      const scaleX = canvas.getWidth() / (img.width ?? 1)
      const scaleY = canvas.getHeight() / (img.height ?? 1)
      const scale = Math.min(scaleX, scaleY, 1)
      img.scale(scale)
      img.set({
        left: (canvas.getWidth() - (img.width ?? 0) * scale) / 2,
        top: (canvas.getHeight() - (img.height ?? 0) * scale) / 2,
        selectable: true,
      })

      canvas.clear()
      canvas.add(img)
      canvas.renderAll()
      saveHistory(canvas)
    },

    crop: () => {
      if (!canvas) return
      // Remove existing crop rect
      if (cropRectRef.current) {
        canvas.remove(cropRectRef.current)
      }
      const rect = new Rect({
        left: canvas.getWidth() * 0.1,
        top: canvas.getHeight() * 0.1,
        width: canvas.getWidth() * 0.8,
        height: canvas.getHeight() * 0.8,
        fill: 'rgba(0,0,0,0.3)',
        stroke: '#ffffff',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        cornerColor: '#ffffff',
        cornerStrokeColor: '#000000',
        transparentCorners: false,
      })
      cropRectRef.current = rect
      canvas.add(rect)
      canvas.setActiveObject(rect)
      canvas.renderAll()
    },

    resetCrop: () => {
      if (!canvas || !cropRectRef.current) return
      canvas.remove(cropRectRef.current)
      cropRectRef.current = null
      canvas.renderAll()
    },

    applyCrop: async () => {
      if (!canvas || !cropRectRef.current) return
      const rect = cropRectRef.current
      const cropArea: CropRect = {
        left: rect.left ?? 0,
        top: rect.top ?? 0,
        width: (rect.width ?? 0) * (rect.scaleX ?? 1),
        height: (rect.height ?? 0) * (rect.scaleY ?? 1),
      }
      canvas.remove(rect)
      cropRectRef.current = null

      // Export cropped area
      const dataUrl = canvas.toDataURL({
        left: cropArea.left,
        top: cropArea.top,
        width: cropArea.width,
        height: cropArea.height,
        format: 'png',
      })

      // Reload cropped image
      const img = await FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' })
      canvas.clear()
      canvas.setWidth(cropArea.width)
      canvas.setHeight(cropArea.height)
      canvas.add(img)
      canvas.renderAll()
      saveHistory(canvas)
    },

    zoom: (delta: number) => {
      if (!canvas) return
      const newZoom = Math.max(0.1, Math.min(5, zoomLevel + delta))
      canvas.setZoom(newZoom)
      setZoomLevel(newZoom)
      canvas.renderAll()
    },

    pan: (dx: number, dy: number) => {
      if (!canvas) return
      const vpt = canvas.viewportTransform
      if (!vpt) return
      vpt[4] += dx
      vpt[5] += dy
      canvas.setViewportTransform(vpt)
      canvas.renderAll()
    },

    rotate: (angle: number) => {
      if (!canvas) return
      const obj = canvas.getActiveObject()
      if (!obj) return
      obj.rotate((obj.angle ?? 0) + angle)
      canvas.renderAll()
      saveHistory(canvas)
    },

    flip: (axis: 'x' | 'y') => {
      if (!canvas) return
      const obj = canvas.getActiveObject()
      if (!obj) return
      if (axis === 'x') {
        obj.set('flipX', !obj.flipX)
      } else {
        obj.set('flipY', !obj.flipY)
      }
      canvas.renderAll()
      saveHistory(canvas)
    },

    addText: (text: string, opts?: Partial<{ fontSize: number; fill: string }>) => {
      if (!canvas) return
      const t = new FabricText(text, {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2,
        fontSize: opts?.fontSize ?? 24,
        fill: opts?.fill ?? '#000000',
        originX: 'center',
        originY: 'center',
      })
      canvas.add(t)
      canvas.setActiveObject(t)
      canvas.renderAll()
    },

    addShape: (shape, opts) => {
      if (!canvas) return
      let obj: FabricObject
      const centerX = canvas.getWidth() / 2
      const centerY = canvas.getHeight() / 2

      switch (shape) {
        case 'rect':
          obj = new Rect({
            left: centerX,
            top: centerY,
            width: opts?.width ?? 100,
            height: opts?.height ?? 100,
            fill: opts?.fill ?? 'transparent',
            stroke: opts?.stroke ?? '#000000',
            strokeWidth: 2,
            originX: 'center',
            originY: 'center',
          })
          break
        case 'circle':
          obj = new Circle({
            left: centerX,
            top: centerY,
            radius: (opts?.width ?? 50) / 2,
            fill: opts?.fill ?? 'transparent',
            stroke: opts?.stroke ?? '#000000',
            strokeWidth: 2,
            originX: 'center',
            originY: 'center',
          })
          break
        case 'line':
          obj = new Line(
            [centerX - 50, centerY, centerX + 50, centerY],
            {
              stroke: opts?.stroke ?? '#000000',
              strokeWidth: 2,
            }
          )
          break
        default:
          return
      }

      canvas.add(obj)
      canvas.setActiveObject(obj)
      canvas.renderAll()
    },

    freeDrawing: (enabled: boolean, opts?: Partial<{ color: string; width: number }>) => {
      if (!canvas) return
      canvas.isDrawingMode = enabled
      if (enabled && canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = opts?.color ?? '#000000'
        canvas.freeDrawingBrush.width = opts?.width ?? 2
      }
    },

    applyAdjustments: (values: ImageAdjustmentValues) => {
      if (!canvas) return
      const objects = canvas.getObjects()
      const img = objects.find((o): o is FabricImage => o instanceof FabricImage)
      if (!img) return

      img.filters = [
        new filters.Brightness({ brightness: values.brightness / 100 }),
        new filters.Contrast({ contrast: values.contrast / 100 }),
        new filters.Saturation({ saturation: values.saturation / 100 }),
      ]
      img.applyFilters()
      canvas.renderAll()
      saveHistory(canvas)
    },

    undo: () => {
      if (!canvas || historyIndexRef.current <= 0) return
      isRestoringRef.current = true
      historyIndexRef.current--
      const json = historyRef.current[historyIndexRef.current]
      canvas.loadFromJSON(JSON.parse(json)).then(() => {
        canvas.renderAll()
        isRestoringRef.current = false
      })
    },

    redo: () => {
      if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return
      isRestoringRef.current = true
      historyIndexRef.current++
      const json = historyRef.current[historyIndexRef.current]
      canvas.loadFromJSON(JSON.parse(json)).then(() => {
        canvas.renderAll()
        isRestoringRef.current = false
      })
    },

    exportImage: (format = 'png', quality = 1) => {
      if (!canvas) return null
      return canvas.toDataURL({
        format: format === 'jpg' ? 'jpeg' : format,
        quality,
      })
    },

    resetCanvas: () => {
      if (!canvas) return
      canvas.clear()
      canvas.setWidth(options.width)
      canvas.setHeight(options.height)
      canvas.setZoom(1)
      setZoomLevel(1)
      canvas.renderAll()
      saveHistory(canvas)
    },
  }

  return { canvas, actions, zoomLevel, isReady }
}
