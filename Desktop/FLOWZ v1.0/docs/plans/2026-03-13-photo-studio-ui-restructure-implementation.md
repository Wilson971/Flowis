# Photo Studio UI Restructure — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure Photo Studio with clear component hierarchy, FabricJS v6 canvas, categorized presets, guided prompt builder (simple/expert), enriched timeline, and drag-and-drop gallery reordering.

**Architecture:** New dedicated editor page (`/app/photostudio/[productId]`) replaces SceneStudioDialog + EditorHub. FabricJS v6 handles all canvas operations (crop, zoom, filters, annotations). StudioEditorContext provides unified state. Existing list page cleaned up.

**Tech Stack:** FabricJS v6 (canvas), @dnd-kit/sortable (already installed), React 19, Next.js 16 App Router, shadcn/ui, Framer Motion, TanStack Query, Zod.

**Design doc:** `docs/plans/2026-03-13-photo-studio-ui-restructure-design.md`

---

## Phase 1 — Fondations

### Task 1: Install FabricJS v6

**Files:**
- Modify: `my-app/package.json`

**Step 1: Install fabric**

Run: `cd my-app && npm install fabric@^6`
Expected: Package added to dependencies

**Step 2: Verify install**

Run: `cd my-app && node -e "const f = require('fabric'); console.log('fabric OK')"`
Expected: "fabric OK"

**Step 3: Commit**

```bash
git add my-app/package.json my-app/package-lock.json
git commit -m "chore: install fabric v6 for Photo Studio canvas editor"
```

---

### Task 2: Add new types

**Files:**
- Modify: `my-app/src/features/photo-studio/types/studio.ts`

**Step 1: Add new types at end of file**

Append these types after existing ones in `studio.ts`:

```typescript
// ─── Preset Categories ─────────────────────────────────────
export type PresetCategory = 'studio' | 'lifestyle' | 'exterior' | 'artistic'

export const PRESET_CATEGORY_LABELS: Record<PresetCategory, string> = {
  studio: 'Studio',
  lifestyle: 'Lifestyle',
  exterior: 'Extérieur',
  artistic: 'Artistique',
}

export const PRESET_CATEGORY_ICONS: Record<PresetCategory, string> = {
  studio: 'Camera',
  lifestyle: 'Home',
  exterior: 'Trees',
  artistic: 'Sparkles',
}

// ─── Prompt Builder ─────────────────────────────────────────
export type PromptDimension = 'lighting' | 'angle' | 'ambiance' | 'surface'

export interface PromptBlock {
  id: string
  dimension: PromptDimension
  label: string
  promptFragment: string        // visible label
  technicalPrompt: string       // hidden pro instructions injected in simple mode
}

export interface SelectedBlocks {
  lighting: string | null
  angle: string | null
  ambiance: string | null
  surface: string | null
}

// ─── Favorite Presets ───────────────────────────────────────
export interface FavoritePreset {
  id: string
  name: string
  presetId: string | null
  selectedBlocks: SelectedBlocks
  customPromptText: string
  createdAt: string
}

// ─── Editor State ───────────────────────────────────────────
export type EditorMode = 'simple' | 'expert'
export type CanvasTool = 'select' | 'crop' | 'draw' | 'text' | 'shape' | null

export interface ImageAdjustmentValues {
  brightness: number   // -100 to 100
  contrast: number     // -100 to 100
  saturation: number   // -100 to 100
  sharpness: number    // 0 to 100
  temperature: number  // -100 to 100
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustmentValues = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpness: 0,
  temperature: 0,
}
```

**Step 2: Verify no type errors**

Run: `cd my-app && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No new errors

**Step 3: Commit**

```bash
git add my-app/src/features/photo-studio/types/studio.ts
git commit -m "feat(photo-studio): add types for presets, prompt builder, favorites, editor state"
```

---

### Task 3: Add prompt block constants

**Files:**
- Create: `my-app/src/features/photo-studio/constants/promptBlocks.ts`
- Modify: `my-app/src/features/photo-studio/constants/index.ts`

**Step 1: Create promptBlocks.ts**

```typescript
import type { PromptBlock } from '../types/studio'

export const LIGHTING_BLOCKS: PromptBlock[] = [
  {
    id: 'studio-pro',
    dimension: 'lighting',
    label: 'Studio Pro',
    promptFragment: 'professional studio lighting',
    technicalPrompt: 'Professional 3-point lighting setup: key light at 45° with softbox, fill light at 30° opposite side, subtle rim light from behind. Clean shadows, no harsh highlights.',
  },
  {
    id: 'warm',
    dimension: 'lighting',
    label: 'Lumière Chaude',
    promptFragment: 'warm golden lighting',
    technicalPrompt: 'Warm golden hour lighting, color temperature 3200K, soft diffused light wrapping around product, gentle warm shadows.',
  },
  {
    id: 'natural',
    dimension: 'lighting',
    label: 'Naturelle',
    promptFragment: 'natural daylight',
    technicalPrompt: 'Natural window daylight, soft even illumination, color temperature 5500K, minimal shadows, clean and bright.',
  },
  {
    id: 'dramatic',
    dimension: 'lighting',
    label: 'Dramatique',
    promptFragment: 'dramatic lighting with deep shadows',
    technicalPrompt: 'High contrast dramatic lighting, single hard key light at steep angle, deep shadows, chiaroscuro effect, moody atmosphere.',
  },
  {
    id: 'neon',
    dimension: 'lighting',
    label: 'Néon',
    promptFragment: 'neon colored lighting',
    technicalPrompt: 'Vibrant neon lighting with colored gels, cyan and magenta accent lights, futuristic glow, reflective highlights on product surface.',
  },
]

export const ANGLE_BLOCKS: PromptBlock[] = [
  {
    id: 'face',
    dimension: 'angle',
    label: 'Face',
    promptFragment: 'front-facing view',
    technicalPrompt: 'Straight-on front view, camera at product eye level, centered composition, 50mm equivalent lens.',
  },
  {
    id: '3-4',
    dimension: 'angle',
    label: '3/4',
    promptFragment: 'three-quarter angle view',
    technicalPrompt: 'Three-quarter angle view at 45°, showing depth and dimension, 85mm equivalent lens, slight elevation.',
  },
  {
    id: 'plongee',
    dimension: 'angle',
    label: 'Plongée',
    promptFragment: 'top-down overhead view',
    technicalPrompt: 'Top-down flat lay perspective, camera directly above at 90°, even lighting to avoid perspective distortion.',
  },
  {
    id: 'macro',
    dimension: 'angle',
    label: 'Macro',
    promptFragment: 'extreme close-up macro shot',
    technicalPrompt: 'Extreme macro close-up, 100mm macro lens, f/2.8 shallow depth of field, sharp focus on key detail, beautiful bokeh background.',
  },
  {
    id: 'wide',
    dimension: 'angle',
    label: 'Vue Large',
    promptFragment: 'wide environmental shot',
    technicalPrompt: 'Wide-angle environmental shot, 35mm lens, product in context with surroundings, full scene visible.',
  },
  {
    id: 'contre-plongee',
    dimension: 'angle',
    label: 'Contre-plongée',
    promptFragment: 'low angle looking up',
    technicalPrompt: 'Low angle upward perspective, camera below product level, heroic imposing feel, 35mm lens slight distortion.',
  },
]

export const AMBIANCE_BLOCKS: PromptBlock[] = [
  {
    id: 'premium',
    dimension: 'ambiance',
    label: 'Premium',
    promptFragment: 'premium luxury feel',
    technicalPrompt: 'High-end luxury commercial photography, meticulous composition, flawless product presentation, editorial quality, 8K resolution.',
  },
  {
    id: 'minimal',
    dimension: 'ambiance',
    label: 'Minimaliste',
    promptFragment: 'minimalist clean aesthetic',
    technicalPrompt: 'Ultra-minimalist composition, generous negative space, clean lines, distraction-free, Scandinavian design aesthetic.',
  },
  {
    id: 'luxe',
    dimension: 'ambiance',
    label: 'Luxe',
    promptFragment: 'opulent luxurious setting',
    technicalPrompt: 'Opulent luxury setting, rich textures, gold accents, velvet or silk elements, jewelry-grade product photography.',
  },
  {
    id: 'warm-cozy',
    dimension: 'ambiance',
    label: 'Chaleureux',
    promptFragment: 'warm cozy atmosphere',
    technicalPrompt: 'Warm inviting atmosphere, earth tones, soft textures, homey feel, lifestyle authenticity, relatable setting.',
  },
  {
    id: 'clean',
    dimension: 'ambiance',
    label: 'Épuré',
    promptFragment: 'clean refined look',
    technicalPrompt: 'Clean refined aesthetic, precise geometry, balanced composition, muted color palette, professional catalog quality.',
  },
  {
    id: 'industrial',
    dimension: 'ambiance',
    label: 'Industriel',
    promptFragment: 'raw industrial setting',
    technicalPrompt: 'Raw industrial aesthetic, exposed concrete or metal, moody atmosphere, urban grit, contrast between product refinement and raw backdrop.',
  },
]

export const SURFACE_BLOCKS: PromptBlock[] = [
  {
    id: 'marble-white',
    dimension: 'surface',
    label: 'Marbre Blanc',
    promptFragment: 'on white marble surface',
    technicalPrompt: 'Placed on polished white Carrara marble surface with subtle grey veining, soft reflections, luxurious material feel.',
  },
  {
    id: 'wood-natural',
    dimension: 'surface',
    label: 'Bois Naturel',
    promptFragment: 'on natural wood surface',
    technicalPrompt: 'Placed on warm natural oak wood surface, visible grain texture, matte finish, organic and authentic feel.',
  },
  {
    id: 'concrete',
    dimension: 'surface',
    label: 'Béton',
    promptFragment: 'on concrete surface',
    technicalPrompt: 'Placed on smooth grey concrete surface, subtle texture, industrial modern aesthetic, matte finish.',
  },
  {
    id: 'linen',
    dimension: 'surface',
    label: 'Tissu Lin',
    promptFragment: 'on linen fabric',
    technicalPrompt: 'Placed on natural beige linen fabric, soft wrinkled texture, organic feel, warm neutral backdrop.',
  },
  {
    id: 'metal-brushed',
    dimension: 'surface',
    label: 'Métal Brossé',
    promptFragment: 'on brushed metal surface',
    technicalPrompt: 'Placed on brushed stainless steel surface, directional grain pattern, subtle reflections, modern high-tech aesthetic.',
  },
]

export const ALL_PROMPT_BLOCKS: Record<string, PromptBlock[]> = {
  lighting: LIGHTING_BLOCKS,
  angle: ANGLE_BLOCKS,
  ambiance: AMBIANCE_BLOCKS,
  surface: SURFACE_BLOCKS,
}

export const PROMPT_DIMENSION_LABELS: Record<string, string> = {
  lighting: 'Éclairage',
  angle: 'Angle',
  ambiance: 'Ambiance',
  surface: 'Surface',
}

export const PROMPT_DIMENSION_ICONS: Record<string, string> = {
  lighting: 'Lightbulb',
  angle: 'Ruler',
  ambiance: 'Palette',
  surface: 'Layers',
}
```

**Step 2: Add export to constants/index.ts**

Add at end of `my-app/src/features/photo-studio/constants/index.ts`:

```typescript
// Prompt blocks
export * from './promptBlocks'
```

**Step 3: Verify no type errors**

Run: `cd my-app && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No new errors

**Step 4: Commit**

```bash
git add my-app/src/features/photo-studio/constants/promptBlocks.ts my-app/src/features/photo-studio/constants/index.ts
git commit -m "feat(photo-studio): add prompt block constants for 4 dimensions with technical prompts"
```

---

### Task 4: Create StudioEditorContext

**Files:**
- Create: `my-app/src/features/photo-studio/context/StudioEditorContext.tsx`

**Step 1: Create the new context**

```typescript
'use client'

import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'
import type {
  SelectedBlocks,
  EditorMode,
  CanvasTool,
  ImageAdjustmentValues,
} from '../types/studio'
import { DEFAULT_ADJUSTMENTS } from '../types/studio'

// ─── State ──────────────────────────────────────────────────
export interface StudioEditorState {
  // Product
  productId: string

  // Preset & Prompt
  activePresetId: string | null
  selectedBlocks: SelectedBlocks
  customPromptText: string
  mode: EditorMode

  // Canvas
  activeImageId: string | null
  activeImageType: 'source' | 'generated' | null
  adjustments: ImageAdjustmentValues
  activeTool: CanvasTool
  showAdjustmentsPanel: boolean

  // Gallery
  galleryOrder: string[]
  galleryDirty: boolean

  // Generation
  isGenerating: boolean
}

const createInitialState = (productId: string): StudioEditorState => ({
  productId,
  activePresetId: null,
  selectedBlocks: { lighting: null, angle: null, ambiance: null, surface: null },
  customPromptText: '',
  mode: 'simple',
  activeImageId: null,
  activeImageType: null,
  adjustments: { ...DEFAULT_ADJUSTMENTS },
  activeTool: 'select',
  showAdjustmentsPanel: false,
  galleryOrder: [],
  galleryDirty: false,
  isGenerating: false,
})

// ─── Actions ────────────────────────────────────────────────
type Action =
  | { type: 'SET_PRESET'; presetId: string | null }
  | { type: 'SET_BLOCK'; dimension: keyof SelectedBlocks; blockId: string | null }
  | { type: 'SET_CUSTOM_PROMPT'; text: string }
  | { type: 'SET_MODE'; mode: EditorMode }
  | { type: 'SET_ACTIVE_IMAGE'; imageId: string | null; imageType: 'source' | 'generated' | null }
  | { type: 'SET_ADJUSTMENTS'; adjustments: Partial<ImageAdjustmentValues> }
  | { type: 'RESET_ADJUSTMENTS' }
  | { type: 'SET_TOOL'; tool: CanvasTool }
  | { type: 'TOGGLE_ADJUSTMENTS_PANEL' }
  | { type: 'SET_GALLERY_ORDER'; order: string[] }
  | { type: 'MARK_GALLERY_SAVED' }
  | { type: 'SET_GENERATING'; isGenerating: boolean }
  | { type: 'APPLY_FAVORITE'; presetId: string | null; blocks: SelectedBlocks; customText: string }

function editorReducer(state: StudioEditorState, action: Action): StudioEditorState {
  switch (action.type) {
    case 'SET_PRESET':
      return { ...state, activePresetId: action.presetId }
    case 'SET_BLOCK':
      return {
        ...state,
        selectedBlocks: { ...state.selectedBlocks, [action.dimension]: action.blockId },
      }
    case 'SET_CUSTOM_PROMPT':
      return { ...state, customPromptText: action.text }
    case 'SET_MODE':
      return { ...state, mode: action.mode }
    case 'SET_ACTIVE_IMAGE':
      return { ...state, activeImageId: action.imageId, activeImageType: action.imageType }
    case 'SET_ADJUSTMENTS':
      return { ...state, adjustments: { ...state.adjustments, ...action.adjustments } }
    case 'RESET_ADJUSTMENTS':
      return { ...state, adjustments: { ...DEFAULT_ADJUSTMENTS } }
    case 'SET_TOOL':
      return { ...state, activeTool: action.tool }
    case 'TOGGLE_ADJUSTMENTS_PANEL':
      return { ...state, showAdjustmentsPanel: !state.showAdjustmentsPanel }
    case 'SET_GALLERY_ORDER':
      return { ...state, galleryOrder: action.order, galleryDirty: true }
    case 'MARK_GALLERY_SAVED':
      return { ...state, galleryDirty: false }
    case 'SET_GENERATING':
      return { ...state, isGenerating: action.isGenerating }
    case 'APPLY_FAVORITE':
      return {
        ...state,
        activePresetId: action.presetId,
        selectedBlocks: { ...action.blocks },
        customPromptText: action.customText,
      }
    default:
      return state
  }
}

// ─── Context ────────────────────────────────────────────────
interface StudioEditorContextValue {
  state: StudioEditorState
  dispatch: React.Dispatch<Action>
}

const StudioEditorContext = createContext<StudioEditorContextValue | null>(null)

export function StudioEditorProvider({
  productId,
  children,
}: {
  productId: string
  children: ReactNode
}) {
  const [state, dispatch] = useReducer(editorReducer, productId, createInitialState)

  return (
    <StudioEditorContext.Provider value={{ state, dispatch }}>
      {children}
    </StudioEditorContext.Provider>
  )
}

export function useStudioEditor() {
  const ctx = useContext(StudioEditorContext)
  if (!ctx) throw new Error('useStudioEditor must be used within StudioEditorProvider')
  return ctx
}
```

**Step 2: Verify no type errors**

Run: `cd my-app && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No new errors

**Step 3: Commit**

```bash
git add my-app/src/features/photo-studio/context/StudioEditorContext.tsx
git commit -m "feat(photo-studio): add StudioEditorContext with reducer for editor page state"
```

---

### Task 5: Create useFabricEditor hook

**Files:**
- Create: `my-app/src/features/photo-studio/hooks/useFabricEditor.ts`

**Step 1: Create the hook**

```typescript
'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Canvas, FabricImage, Rect, FabricText, Line, filters } from 'fabric'
import type { ImageAdjustmentValues } from '../types/studio'

interface UseFabricEditorOptions {
  width: number
  height: number
}

interface FabricEditorActions {
  loadImage: (url: string) => Promise<void>
  crop: () => void
  resetCrop: () => void
  applyCrop: () => void
  zoom: (level: number) => void
  pan: (enabled: boolean) => void
  rotate: (degrees: number) => void
  flip: (direction: 'horizontal' | 'vertical') => void
  addText: (text?: string) => void
  addShape: (type: 'rect' | 'circle' | 'arrow') => void
  freeDrawing: (enabled: boolean) => void
  applyAdjustments: (adjustments: ImageAdjustmentValues) => void
  undo: () => void
  redo: () => void
  exportImage: (format?: 'png' | 'jpeg' | 'webp', quality?: number) => string | null
  resetCanvas: () => void
}

export function useFabricEditor(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  options: UseFabricEditorOptions
) {
  const fabricRef = useRef<Canvas | null>(null)
  const mainImageRef = useRef<FabricImage | null>(null)
  const cropRectRef = useRef<Rect | null>(null)
  const historyRef = useRef<string[]>([])
  const historyIndexRef = useRef(-1)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [isReady, setIsReady] = useState(false)

  // ─── Init canvas ──────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return

    const canvas = new Canvas(canvasRef.current, {
      width: options.width,
      height: options.height,
      backgroundColor: '#1a1a1a',
      selection: true,
      preserveObjectStacking: true,
    })

    fabricRef.current = canvas
    setIsReady(true)

    return () => {
      canvas.dispose()
      fabricRef.current = null
      setIsReady(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Resize ───────────────────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.setDimensions({ width: options.width, height: options.height })
    canvas.renderAll()
  }, [options.width, options.height])

  // ─── Save history ─────────────────────────────────────────
  const saveHistory = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const json = JSON.stringify(canvas.toJSON())
    const history = historyRef.current
    // Remove forward history if we branched
    history.splice(historyIndexRef.current + 1)
    history.push(json)
    historyIndexRef.current = history.length - 1
  }, [])

  // ─── Actions ──────────────────────────────────────────────
  const actions: FabricEditorActions = {
    loadImage: useCallback(async (url: string) => {
      const canvas = fabricRef.current
      if (!canvas) return

      const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
      // Clear previous
      canvas.clear()
      canvas.backgroundColor = '#1a1a1a'

      // Scale to fit canvas
      const scaleX = (options.width * 0.85) / (img.width ?? 1)
      const scaleY = (options.height * 0.85) / (img.height ?? 1)
      const scale = Math.min(scaleX, scaleY)

      img.set({
        scaleX: scale,
        scaleY: scale,
        originX: 'center',
        originY: 'center',
        left: options.width / 2,
        top: options.height / 2,
        selectable: false,
        evented: false,
      })

      canvas.add(img)
      mainImageRef.current = img
      canvas.renderAll()
      saveHistory()
    }, [options.width, options.height, saveHistory]),

    crop: useCallback(() => {
      const canvas = fabricRef.current
      if (!canvas || cropRectRef.current) return

      const rect = new Rect({
        left: options.width * 0.15,
        top: options.height * 0.15,
        width: options.width * 0.7,
        height: options.height * 0.7,
        fill: 'rgba(0,0,0,0)',
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        cornerColor: '#3b82f6',
        cornerSize: 10,
        transparentCorners: false,
        selectable: true,
        evented: true,
      })

      canvas.add(rect)
      canvas.setActiveObject(rect)
      cropRectRef.current = rect
      canvas.renderAll()
    }, [options.width, options.height]),

    resetCrop: useCallback(() => {
      const canvas = fabricRef.current
      const rect = cropRectRef.current
      if (!canvas || !rect) return
      canvas.remove(rect)
      cropRectRef.current = null
      canvas.renderAll()
    }, []),

    applyCrop: useCallback(() => {
      const canvas = fabricRef.current
      const rect = cropRectRef.current
      const img = mainImageRef.current
      if (!canvas || !rect || !img) return

      // Get crop area relative to image
      const cropArea = rect.getBoundingRect()
      canvas.remove(rect)
      cropRectRef.current = null

      // Crop via toDataURL of area — simplified approach
      const dataUrl = canvas.toDataURL({
        left: cropArea.left,
        top: cropArea.top,
        width: cropArea.width,
        height: cropArea.height,
        format: 'png',
      })

      // Reload cropped image
      actions.loadImage(dataUrl)
    }, []), // eslint-disable-line react-hooks/exhaustive-deps

    zoom: useCallback((level: number) => {
      const canvas = fabricRef.current
      if (!canvas) return
      const clampedLevel = Math.max(25, Math.min(400, level))
      const zoomFactor = clampedLevel / 100
      canvas.setZoom(zoomFactor)
      canvas.renderAll()
      setZoomLevel(clampedLevel)
    }, []),

    pan: useCallback((enabled: boolean) => {
      const canvas = fabricRef.current
      if (!canvas) return
      if (enabled) {
        canvas.defaultCursor = 'grab'
        canvas.on('mouse:down', (e) => {
          if (e.e) canvas.defaultCursor = 'grabbing'
        })
        canvas.on('mouse:up', () => {
          canvas.defaultCursor = 'grab'
        })
      } else {
        canvas.defaultCursor = 'default'
        canvas.off('mouse:down')
        canvas.off('mouse:up')
      }
    }, []),

    rotate: useCallback((degrees: number) => {
      const img = mainImageRef.current
      const canvas = fabricRef.current
      if (!img || !canvas) return
      img.rotate((img.angle ?? 0) + degrees)
      canvas.renderAll()
      saveHistory()
    }, [saveHistory]),

    flip: useCallback((direction: 'horizontal' | 'vertical') => {
      const img = mainImageRef.current
      const canvas = fabricRef.current
      if (!img || !canvas) return
      if (direction === 'horizontal') {
        img.set('flipX', !img.flipX)
      } else {
        img.set('flipY', !img.flipY)
      }
      canvas.renderAll()
      saveHistory()
    }, [saveHistory]),

    addText: useCallback((text = 'Texte') => {
      const canvas = fabricRef.current
      if (!canvas) return
      const textObj = new FabricText(text, {
        left: options.width / 2,
        top: options.height / 2,
        originX: 'center',
        originY: 'center',
        fontSize: 24,
        fill: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        editable: true,
      })
      canvas.add(textObj)
      canvas.setActiveObject(textObj)
      canvas.renderAll()
      saveHistory()
    }, [options.width, options.height, saveHistory]),

    addShape: useCallback((type: 'rect' | 'circle' | 'arrow') => {
      const canvas = fabricRef.current
      if (!canvas) return

      if (type === 'rect') {
        const rect = new Rect({
          left: options.width / 2 - 50,
          top: options.height / 2 - 50,
          width: 100,
          height: 100,
          fill: 'rgba(59,130,246,0.3)',
          stroke: '#3b82f6',
          strokeWidth: 2,
        })
        canvas.add(rect)
        canvas.setActiveObject(rect)
      } else if (type === 'arrow') {
        const line = new Line(
          [options.width / 2 - 50, options.height / 2, options.width / 2 + 50, options.height / 2],
          { stroke: '#3b82f6', strokeWidth: 3 }
        )
        canvas.add(line)
        canvas.setActiveObject(line)
      }

      canvas.renderAll()
      saveHistory()
    }, [options.width, options.height, saveHistory]),

    freeDrawing: useCallback((enabled: boolean) => {
      const canvas = fabricRef.current
      if (!canvas) return
      canvas.isDrawingMode = enabled
      if (enabled && canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = '#3b82f6'
        canvas.freeDrawingBrush.width = 3
      }
    }, []),

    applyAdjustments: useCallback((adj: ImageAdjustmentValues) => {
      const img = mainImageRef.current
      const canvas = fabricRef.current
      if (!img || !canvas) return

      const activeFilters = []
      if (adj.brightness !== 0) {
        activeFilters.push(new filters.Brightness({ brightness: adj.brightness / 100 }))
      }
      if (adj.contrast !== 0) {
        activeFilters.push(new filters.Contrast({ contrast: adj.contrast / 100 }))
      }
      if (adj.saturation !== 0) {
        activeFilters.push(new filters.Saturation({ saturation: adj.saturation / 100 }))
      }

      img.filters = activeFilters
      img.applyFilters()
      canvas.renderAll()
    }, []),

    undo: useCallback(() => {
      const canvas = fabricRef.current
      if (!canvas || historyIndexRef.current <= 0) return
      historyIndexRef.current--
      const json = historyRef.current[historyIndexRef.current]
      canvas.loadFromJSON(json).then(() => canvas.renderAll())
    }, []),

    redo: useCallback(() => {
      const canvas = fabricRef.current
      if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return
      historyIndexRef.current++
      const json = historyRef.current[historyIndexRef.current]
      canvas.loadFromJSON(json).then(() => canvas.renderAll())
    }, []),

    exportImage: useCallback((format: 'png' | 'jpeg' | 'webp' = 'png', quality = 1) => {
      const canvas = fabricRef.current
      if (!canvas) return null
      return canvas.toDataURL({ format, quality })
    }, []),

    resetCanvas: useCallback(() => {
      const canvas = fabricRef.current
      if (!canvas) return
      canvas.clear()
      canvas.backgroundColor = '#1a1a1a'
      mainImageRef.current = null
      cropRectRef.current = null
      canvas.renderAll()
    }, []),
  }

  return { canvas: fabricRef.current, actions, zoomLevel, isReady }
}
```

**Step 2: Verify no type errors**

Run: `cd my-app && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No new errors (may need to adjust fabric imports based on v6 API)

**Step 3: Commit**

```bash
git add my-app/src/features/photo-studio/hooks/useFabricEditor.ts
git commit -m "feat(photo-studio): add useFabricEditor hook wrapping FabricJS v6 canvas"
```

---

### Task 6: Create usePromptBuilder hook

**Files:**
- Create: `my-app/src/features/photo-studio/hooks/usePromptBuilder.ts`

**Step 1: Create the hook**

```typescript
'use client'

import { useMemo } from 'react'
import type { SelectedBlocks, EditorMode } from '../types/studio'
import { ALL_PROMPT_BLOCKS } from '../constants/promptBlocks'

interface UsePromptBuilderOptions {
  presetPrompt: string | null   // from selected scene preset
  blocks: SelectedBlocks
  customText: string
  mode: EditorMode
  productName?: string
  productCategory?: string
}

interface PromptBuilderResult {
  finalPrompt: string           // sent to API (always enriched)
  displayPrompt: string         // shown in expert mode
  blockSummary: string          // short label summary for tooltips
}

const BASE_QUALITY_PROMPT = 'Ultra high quality product photography, photorealistic, sharp focus, professional commercial shot, 8K resolution, studio quality output.'

export function usePromptBuilder({
  presetPrompt,
  blocks,
  customText,
  mode,
  productName,
  productCategory,
}: UsePromptBuilderOptions): PromptBuilderResult {
  return useMemo(() => {
    const parts: string[] = []
    const displayParts: string[] = []
    const summaryParts: string[] = []

    // Layer 1: Base quality
    parts.push(BASE_QUALITY_PROMPT)

    // Layer 2: Product context
    if (productName) {
      const ctx = productCategory
        ? `Product: ${productName} (${productCategory}).`
        : `Product: ${productName}.`
      parts.push(ctx)
      displayParts.push(ctx)
    }

    // Layer 3: Preset
    if (presetPrompt) {
      parts.push(presetPrompt)
      displayParts.push(presetPrompt)
    }

    // Layer 4: Blocks (technical prompts hidden in simple mode)
    for (const [dimension, blockId] of Object.entries(blocks)) {
      if (!blockId) continue
      const blockList = ALL_PROMPT_BLOCKS[dimension]
      const block = blockList?.find((b) => b.id === blockId)
      if (!block) continue

      parts.push(block.technicalPrompt)
      displayParts.push(block.promptFragment)
      summaryParts.push(block.label)
    }

    // Layer 5: Custom text (override)
    if (customText.trim()) {
      parts.push(customText.trim())
      displayParts.push(customText.trim())
    }

    const finalPrompt = parts.join(' ')
    const displayPrompt = displayParts.join('. ')
    const blockSummary = summaryParts.join(' • ')

    return { finalPrompt, displayPrompt, blockSummary }
  }, [presetPrompt, blocks, customText, mode, productName, productCategory])
}
```

**Step 2: Verify no type errors**

Run: `cd my-app && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No new errors

**Step 3: Commit**

```bash
git add my-app/src/features/photo-studio/hooks/usePromptBuilder.ts
git commit -m "feat(photo-studio): add usePromptBuilder hook with 3-layer prompt enrichment"
```

---

### Task 7: Create useFavoritePresets hook

**Files:**
- Create: `my-app/src/features/photo-studio/hooks/useFavoritePresets.ts`

**Step 1: Create the hook**

```typescript
'use client'

import { useCallback } from 'react'
import { useStudioSettings } from './useStudioSettings'
import type { FavoritePreset, SelectedBlocks } from '../types/studio'

export function useFavoritePresets() {
  const { settings, updateSettings } = useStudioSettings()

  const favorites: FavoritePreset[] = settings?.favorites ?? []

  const saveFavorite = useCallback(
    async (params: { name: string; presetId: string | null; blocks: SelectedBlocks; customText: string }) => {
      const newFav: FavoritePreset = {
        id: crypto.randomUUID(),
        name: params.name,
        presetId: params.presetId,
        selectedBlocks: { ...params.blocks },
        customPromptText: params.customText,
        createdAt: new Date().toISOString(),
      }
      await updateSettings({ favorites: [...favorites, newFav] })
      return newFav
    },
    [favorites, updateSettings]
  )

  const removeFavorite = useCallback(
    async (id: string) => {
      await updateSettings({ favorites: favorites.filter((f) => f.id !== id) })
    },
    [favorites, updateSettings]
  )

  const renameFavorite = useCallback(
    async (id: string, name: string) => {
      await updateSettings({
        favorites: favorites.map((f) => (f.id === id ? { ...f, name } : f)),
      })
    },
    [favorites, updateSettings]
  )

  return { favorites, saveFavorite, removeFavorite, renameFavorite }
}
```

**Step 2: Commit**

```bash
git add my-app/src/features/photo-studio/hooks/useFavoritePresets.ts
git commit -m "feat(photo-studio): add useFavoritePresets hook for custom preset CRUD"
```

---

### Task 8: Create useGalleryReorder hook

**Files:**
- Create: `my-app/src/features/photo-studio/hooks/useGalleryReorder.ts`

**Step 1: Create the hook**

```typescript
'use client'

import { useState, useCallback } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface GalleryImage {
  id: string
  url: string
  sort_order: number
}

export function useGalleryReorder(productId: string) {
  const [orderedImages, setOrderedImages] = useState<GalleryImage[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const queryClient = useQueryClient()
  const supabase = createClient()

  const initOrder = useCallback((images: GalleryImage[]) => {
    setOrderedImages(images)
    setIsDirty(false)
  }, [])

  const moveImage = useCallback((fromIndex: number, toIndex: number) => {
    setOrderedImages((prev) => {
      const next = arrayMove(prev, fromIndex, toIndex)
      return next.map((img, i) => ({ ...img, sort_order: i }))
    })
    setIsDirty(true)
  }, [])

  const saveOrderMutation = useMutation({
    mutationFn: async () => {
      // Update sort_order for each image
      const updates = orderedImages.map((img, index) => ({
        id: img.id,
        sort_order: index,
      }))

      for (const update of updates) {
        const { error } = await supabase
          .from('product_images')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
        if (error) throw error
      }
    },
    onSuccess: () => {
      setIsDirty(false)
      queryClient.invalidateQueries({ queryKey: ['products', productId] })
    },
  })

  const saveOrder = useCallback(() => {
    saveOrderMutation.mutate()
  }, [saveOrderMutation])

  const resetOrder = useCallback((images: GalleryImage[]) => {
    setOrderedImages(images)
    setIsDirty(false)
  }, [])

  return {
    orderedImages,
    initOrder,
    moveImage,
    isDirty,
    saveOrder,
    resetOrder,
    isSaving: saveOrderMutation.isPending,
  }
}
```

**Step 2: Commit**

```bash
git add my-app/src/features/photo-studio/hooks/useGalleryReorder.ts
git commit -m "feat(photo-studio): add useGalleryReorder hook with dnd-kit + Supabase persist"
```

---

### Task 9: Create the editor route page

**Files:**
- Create: `my-app/src/app/app/photostudio/[productId]/page.tsx`

**Step 1: Create the route page**

```typescript
import { StudioEditorPageClient } from '@/features/photo-studio/components/editor/StudioEditorPage'

interface Props {
  params: Promise<{ productId: string }>
}

export default async function PhotoStudioEditorPage({ params }: Props) {
  const { productId } = await params

  return <StudioEditorPageClient productId={productId} />
}
```

**Step 2: Commit**

```bash
git add my-app/src/app/app/photostudio/\[productId\]/page.tsx
git commit -m "feat(photo-studio): add /app/photostudio/[productId] route page"
```

---

## Phase 2 — Editor Layout + Sidebar

### Task 10: Create StudioEditorPage + EditorHeader + EditorLayout

**Files:**
- Create: `my-app/src/features/photo-studio/components/editor/StudioEditorPage.tsx`
- Create: `my-app/src/features/photo-studio/components/editor/EditorHeader.tsx`
- Create: `my-app/src/features/photo-studio/components/editor/EditorLayout.tsx`

**Step 1: Create EditorHeader**

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { styles } from '@/lib/design-system'
import type { EditorMode } from '../../types/studio'

interface EditorHeaderProps {
  productName: string
  mode: EditorMode
  onModeChange: (mode: EditorMode) => void
  onPublish: () => void
}

export function EditorHeader({ productName, mode, onModeChange, onPublish }: EditorHeaderProps) {
  const router = useRouter()

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-card">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/app/photostudio')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <span className={cn(styles.text.body, 'font-medium truncate max-w-[300px]')}>
          {productName}
        </span>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          Studio
        </Badge>
      </div>

      {/* Center: Mode toggle */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <button
          onClick={() => onModeChange('simple')}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            mode === 'simple' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Simple
        </button>
        <button
          onClick={() => onModeChange('expert')}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            mode === 'expert' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Expert
        </button>
      </div>

      {/* Right */}
      <Button onClick={onPublish} className="gap-2">
        Publier vers la Boutique
      </Button>
    </header>
  )
}
```

**Step 2: Create EditorLayout**

```typescript
'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EditorLayoutProps {
  sidebar: ReactNode
  canvas: ReactNode
  adjustmentsPanel?: ReactNode
  footer: ReactNode
  showAdjustments: boolean
}

export function EditorLayout({ sidebar, canvas, adjustmentsPanel, footer, showAdjustments }: EditorLayoutProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-[280px] border-r border-border overflow-y-auto flex-shrink-0">
          {sidebar}
        </aside>

        {/* Canvas */}
        <main className="flex-1 min-w-0 relative bg-[#1a1a1a]">
          {canvas}
        </main>

        {/* Adjustments panel (toggle) */}
        {showAdjustments && adjustmentsPanel && (
          <aside className="w-[280px] border-l border-border overflow-y-auto flex-shrink-0">
            {adjustmentsPanel}
          </aside>
        )}
      </div>

      {/* Footer */}
      <div className="h-[140px] border-t border-border flex-shrink-0">
        {footer}
      </div>
    </div>
  )
}
```

**Step 3: Create StudioEditorPage**

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useRequireAuth } from '@/hooks/auth/useRequireAuth'
import { StudioEditorProvider, useStudioEditor } from '../../context/StudioEditorContext'
import { EditorHeader } from './EditorHeader'
import { EditorLayout } from './EditorLayout'
import { EditorSidebar } from './sidebar/EditorSidebar'
import { FabricCanvas } from './canvas/FabricCanvas'
import { ImageAdjustmentsPanel } from './adjustments/ImageAdjustmentsPanel'
import { EditorFooter } from './footer/EditorFooter'
import { Loader2 } from 'lucide-react'

function EditorContent() {
  const { state, dispatch } = useStudioEditor()
  const supabase = createClient()

  const { data: product, isLoading } = useQuery({
    queryKey: ['products', state.productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', state.productId)
        .single()
      if (error) throw error
      return data
    },
  })

  if (isLoading || !product) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <EditorHeader
        productName={product.title ?? 'Sans titre'}
        mode={state.mode}
        onModeChange={(mode) => dispatch({ type: 'SET_MODE', mode })}
        onPublish={() => {/* TODO: open PublishToProductDialog */}}
      />
      <EditorLayout
        sidebar={<EditorSidebar product={product} />}
        canvas={<FabricCanvas />}
        adjustmentsPanel={<ImageAdjustmentsPanel />}
        footer={<EditorFooter productId={state.productId} />}
        showAdjustments={state.showAdjustmentsPanel}
      />
    </div>
  )
}

export function StudioEditorPageClient({ productId }: { productId: string }) {
  useRequireAuth()

  return (
    <StudioEditorProvider productId={productId}>
      <EditorContent />
    </StudioEditorProvider>
  )
}
```

**Step 4: Commit**

```bash
git add my-app/src/features/photo-studio/components/editor/StudioEditorPage.tsx my-app/src/features/photo-studio/components/editor/EditorHeader.tsx my-app/src/features/photo-studio/components/editor/EditorLayout.tsx
git commit -m "feat(photo-studio): add StudioEditorPage with header and 3-zone layout"
```

---

### Task 11: Create EditorSidebar + ProductCard

**Files:**
- Create: `my-app/src/features/photo-studio/components/editor/sidebar/EditorSidebar.tsx`
- Create: `my-app/src/features/photo-studio/components/editor/sidebar/ProductCard.tsx`

**Step 1: Create ProductCard**

```typescript
'use client'

import Image from 'next/image'
import { ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { styles } from '@/lib/design-system'

interface ProductCardProps {
  product: { id: string; title: string; metadata?: Record<string, unknown> }
  onSwitchProduct?: () => void
}

export function ProductCard({ product, onSwitchProduct }: ProductCardProps) {
  const imageUrl = (product.metadata as { images?: { src: string }[] })?.images?.[0]?.src

  return (
    <div className={cn(styles.card.base, 'p-4 flex items-center gap-3')}>
      <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {imageUrl ? (
          <Image src={imageUrl} alt={product.title ?? ''} fill className="object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
            N/A
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-primary font-medium uppercase tracking-wide">Produit actuel</p>
        <p className={cn(styles.text.body, 'font-medium truncate')}>{product.title ?? 'Sans titre'}</p>
      </div>
      {onSwitchProduct && (
        <Button variant="ghost" size="icon" onClick={onSwitchProduct} className="flex-shrink-0">
          <ArrowLeftRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
```

**Step 2: Create EditorSidebar**

```typescript
'use client'

import { useStudioEditor } from '../../../context/StudioEditorContext'
import { ProductCard } from './ProductCard'
import { ScenePresetsPanel } from './ScenePresetsPanel'
import { PromptBuilder } from './PromptBuilder'
import { PromptPreview } from './PromptPreview'
import { FavoritesPanel } from './FavoritesPanel'
import { GenerateButton } from './GenerateButton'
import { usePromptBuilder } from '../../../hooks/usePromptBuilder'
import { getPromptModifier } from '../../../constants'

interface EditorSidebarProps {
  product: { id: string; title: string; metadata?: Record<string, unknown> }
}

export function EditorSidebar({ product }: EditorSidebarProps) {
  const { state, dispatch } = useStudioEditor()

  const presetPrompt = state.activePresetId ? getPromptModifier(state.activePresetId) : null

  const { finalPrompt, displayPrompt } = usePromptBuilder({
    presetPrompt,
    blocks: state.selectedBlocks,
    customText: state.customPromptText,
    mode: state.mode,
    productName: product.title,
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <ProductCard product={product} />

        <ScenePresetsPanel
          activePresetId={state.activePresetId}
          onPresetSelect={(id) => dispatch({ type: 'SET_PRESET', presetId: id })}
        />

        <PromptBuilder
          selectedBlocks={state.selectedBlocks}
          onBlockChange={(dimension, blockId) =>
            dispatch({ type: 'SET_BLOCK', dimension, blockId })
          }
          customText={state.customPromptText}
          onCustomTextChange={(text) => dispatch({ type: 'SET_CUSTOM_PROMPT', text })}
        />

        {state.mode === 'expert' && (
          <PromptPreview prompt={displayPrompt} />
        )}

        <FavoritesPanel
          onApply={(fav) =>
            dispatch({
              type: 'APPLY_FAVORITE',
              presetId: fav.presetId,
              blocks: fav.selectedBlocks,
              customText: fav.customPromptText,
            })
          }
          currentPresetId={state.activePresetId}
          currentBlocks={state.selectedBlocks}
          currentCustomText={state.customPromptText}
        />
      </div>

      <div className="p-4 border-t border-border">
        <GenerateButton
          prompt={finalPrompt}
          productId={product.id}
          isGenerating={state.isGenerating}
        />
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add my-app/src/features/photo-studio/components/editor/sidebar/EditorSidebar.tsx my-app/src/features/photo-studio/components/editor/sidebar/ProductCard.tsx
git commit -m "feat(photo-studio): add EditorSidebar with ProductCard"
```

---

### Task 12: Create ScenePresetsPanel + PresetCard

**Files:**
- Create: `my-app/src/features/photo-studio/components/editor/sidebar/ScenePresetsPanel.tsx`
- Create: `my-app/src/features/photo-studio/components/editor/sidebar/PresetCard.tsx`

**Step 1: Create PresetCard**

```typescript
'use client'

import Image from 'next/image'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PresetCardProps {
  id: string
  name: string
  thumbnail?: string
  isActive: boolean
  isFavorite?: boolean
  onClick: () => void
  onToggleFavorite?: () => void
}

export function PresetCard({
  name,
  thumbnail,
  isActive,
  isFavorite,
  onClick,
  onToggleFavorite,
}: PresetCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative rounded-xl overflow-hidden aspect-[4/3] group cursor-pointer transition-all',
        isActive
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
          : 'hover:ring-1 hover:ring-border'
      )}
    >
      {thumbnail ? (
        <Image src={thumbnail} alt={name} fill className="object-cover" />
      ) : (
        <div className="h-full w-full bg-muted" />
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {/* Active badge */}
      {isActive && (
        <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase rounded-full">
          Active
        </span>
      )}

      {/* Favorite toggle */}
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite()
          }}
          className="absolute top-2 right-2 p-1 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart
            className={cn('h-3.5 w-3.5', isFavorite ? 'fill-red-500 text-red-500' : 'text-white')}
          />
        </button>
      )}

      {/* Name */}
      <span className="absolute bottom-2 left-2 text-white text-xs font-medium drop-shadow-md">
        {name}
      </span>
    </button>
  )
}
```

**Step 2: Create ScenePresetsPanel**

```typescript
'use client'

import { useState } from 'react'
import { Camera, Home, Trees, Sparkles, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { styles } from '@/lib/design-system'
import { getAllPresets } from '../../../constants'
import { PresetCard } from './PresetCard'
import type { PresetCategory } from '../../../types/studio'
import { PRESET_CATEGORY_LABELS } from '../../../types/studio'

const CATEGORY_ICONS: Record<PresetCategory, React.ElementType> = {
  studio: Camera,
  lifestyle: Home,
  exterior: Trees,
  artistic: Sparkles,
}

const CATEGORIES: PresetCategory[] = ['studio', 'lifestyle', 'exterior', 'artistic']

interface ScenePresetsPanelProps {
  activePresetId: string | null
  onPresetSelect: (id: string | null) => void
}

export function ScenePresetsPanel({ activePresetId, onPresetSelect }: ScenePresetsPanelProps) {
  const [activeCategory, setActiveCategory] = useState<PresetCategory>('studio')
  const allPresets = getAllPresets()

  const filteredPresets = allPresets.filter(
    (p) => (p as { category?: string }).category === activeCategory
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className={cn(styles.text.label, 'uppercase tracking-wider text-xs')}>Mises en scène</h3>
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Category tabs */}
      <div className="flex gap-1">
        {CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat]
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {PRESET_CATEGORY_LABELS[cat]}
            </button>
          )
        })}
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-2 gap-2">
        {filteredPresets.map((preset) => (
          <PresetCard
            key={preset.id}
            id={preset.id}
            name={preset.name}
            thumbnail={(preset as { thumbnail?: string }).thumbnail}
            isActive={activePresetId === preset.id}
            onClick={() => onPresetSelect(activePresetId === preset.id ? null : preset.id)}
          />
        ))}
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add my-app/src/features/photo-studio/components/editor/sidebar/ScenePresetsPanel.tsx my-app/src/features/photo-studio/components/editor/sidebar/PresetCard.tsx
git commit -m "feat(photo-studio): add ScenePresetsPanel with categorized tabs + PresetCard"
```

---

### Task 13: Create PromptBuilder + PromptPreview

**Files:**
- Create: `my-app/src/features/photo-studio/components/editor/sidebar/PromptBuilder.tsx`
- Create: `my-app/src/features/photo-studio/components/editor/sidebar/PromptPreview.tsx`

**Step 1: Create PromptBuilder**

```typescript
'use client'

import { Lightbulb, Ruler, Palette, Layers } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { styles } from '@/lib/design-system'
import { ALL_PROMPT_BLOCKS, PROMPT_DIMENSION_LABELS } from '../../../constants/promptBlocks'
import type { SelectedBlocks, PromptDimension } from '../../../types/studio'

const DIMENSION_ICONS: Record<PromptDimension, React.ElementType> = {
  lighting: Lightbulb,
  angle: Ruler,
  ambiance: Palette,
  surface: Layers,
}

const DIMENSIONS: PromptDimension[] = ['lighting', 'angle', 'ambiance', 'surface']

interface PromptBuilderProps {
  selectedBlocks: SelectedBlocks
  onBlockChange: (dimension: keyof SelectedBlocks, blockId: string | null) => void
  customText: string
  onCustomTextChange: (text: string) => void
}

export function PromptBuilder({
  selectedBlocks,
  onBlockChange,
  customText,
  onCustomTextChange,
}: PromptBuilderProps) {
  return (
    <div className="space-y-3">
      {DIMENSIONS.map((dimension) => {
        const Icon = DIMENSION_ICONS[dimension]
        const blocks = ALL_PROMPT_BLOCKS[dimension]
        const selected = selectedBlocks[dimension]

        return (
          <div key={dimension} className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className={cn(styles.text.label, 'text-xs uppercase tracking-wider')}>
                {PROMPT_DIMENSION_LABELS[dimension]}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {blocks.map((block) => (
                <button
                  key={block.id}
                  onClick={() =>
                    onBlockChange(dimension, selected === block.id ? null : block.id)
                  }
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-colors border',
                    selected === block.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
                  )}
                >
                  {block.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {/* Custom text */}
      <div className="space-y-1.5">
        <span className={cn(styles.text.label, 'text-xs uppercase tracking-wider')}>
          Instructions supplémentaires
        </span>
        <Textarea
          value={customText}
          onChange={(e) => onCustomTextChange(e.target.value)}
          placeholder="Lumière qualité premium, ombre douce et naturelle..."
          className="resize-none text-sm"
          rows={3}
        />
      </div>
    </div>
  )
}
```

**Step 2: Create PromptPreview**

```typescript
'use client'

import { Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { styles } from '@/lib/design-system'

interface PromptPreviewProps {
  prompt: string
}

export function PromptPreview({ prompt }: PromptPreviewProps) {
  if (!prompt) return null

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
        <span className={cn(styles.text.label, 'text-xs uppercase tracking-wider')}>
          Prompt final
        </span>
      </div>
      <div className="p-3 rounded-lg bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {prompt}
        </p>
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add my-app/src/features/photo-studio/components/editor/sidebar/PromptBuilder.tsx my-app/src/features/photo-studio/components/editor/sidebar/PromptPreview.tsx
git commit -m "feat(photo-studio): add PromptBuilder with chip blocks + PromptPreview for expert mode"
```

---

### Task 14: Create FavoritesPanel + GenerateButton

**Files:**
- Create: `my-app/src/features/photo-studio/components/editor/sidebar/FavoritesPanel.tsx`
- Create: `my-app/src/features/photo-studio/components/editor/sidebar/GenerateButton.tsx`

**Step 1: Create FavoritesPanel**

```typescript
'use client'

import { useState } from 'react'
import { Heart, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { styles } from '@/lib/design-system'
import { useFavoritePresets } from '../../../hooks/useFavoritePresets'
import type { FavoritePreset, SelectedBlocks } from '../../../types/studio'

interface FavoritesPanelProps {
  onApply: (fav: FavoritePreset) => void
  currentPresetId: string | null
  currentBlocks: SelectedBlocks
  currentCustomText: string
}

export function FavoritesPanel({
  onApply,
  currentPresetId,
  currentBlocks,
  currentCustomText,
}: FavoritesPanelProps) {
  const { favorites, saveFavorite, removeFavorite } = useFavoritePresets()
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [saveName, setSaveName] = useState('')

  const handleSave = async () => {
    if (!saveName.trim()) return
    await saveFavorite({
      name: saveName.trim(),
      presetId: currentPresetId,
      blocks: currentBlocks,
      customText: currentCustomText,
    })
    setSaveName('')
    setShowSaveInput(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5 text-muted-foreground" />
          <span className={cn(styles.text.label, 'text-xs uppercase tracking-wider')}>Favoris</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSaveInput(!showSaveInput)}
          className="h-7 gap-1 text-xs"
        >
          <Save className="h-3 w-3" />
          Sauvegarder
        </Button>
      </div>

      {showSaveInput && (
        <div className="flex gap-2">
          <Input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Nom du favori..."
            className="h-8 text-xs"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button size="sm" onClick={handleSave} className="h-8 text-xs">
            OK
          </Button>
        </div>
      )}

      {favorites.length > 0 && (
        <div className="space-y-1">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer group"
              onClick={() => onApply(fav)}
            >
              <Heart className="h-3 w-3 text-red-500 fill-red-500 flex-shrink-0" />
              <span className="text-xs font-medium flex-1 truncate">{fav.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeFavorite(fav.id)
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Create GenerateButton**

```typescript
'use client'

import { Play, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStudioQuota } from '../../../monitoring'

interface GenerateButtonProps {
  prompt: string
  productId: string
  isGenerating: boolean
}

export function GenerateButton({ prompt, productId, isGenerating }: GenerateButtonProps) {
  const { quota } = useStudioQuota()

  const creditsRemaining = quota ? quota.generations_limit - quota.generations_used : null
  const isDisabled = isGenerating || !prompt || (creditsRemaining !== null && creditsRemaining <= 0)

  const handleGenerate = () => {
    // TODO: wire to generation API via useStudioJobs or useSceneGeneration
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleGenerate}
        disabled={isDisabled}
        className="w-full gap-2 h-11"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Génération...
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Générer
          </>
        )}
        {creditsRemaining !== null && (
          <span className="ml-auto text-xs opacity-70 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {creditsRemaining} cr.
          </span>
        )}
      </Button>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add my-app/src/features/photo-studio/components/editor/sidebar/FavoritesPanel.tsx my-app/src/features/photo-studio/components/editor/sidebar/GenerateButton.tsx
git commit -m "feat(photo-studio): add FavoritesPanel and GenerateButton with quota display"
```

---

## Phase 3 — Canvas + Footer

### Task 15: Create FabricCanvas + FloatingToolbar

**Files:**
- Create: `my-app/src/features/photo-studio/components/editor/canvas/FabricCanvas.tsx`
- Create: `my-app/src/features/photo-studio/components/editor/canvas/FloatingToolbar.tsx`

**Step 1: Create FabricCanvas**

```typescript
'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useStudioEditor } from '../../../context/StudioEditorContext'
import { useFabricEditor } from '../../../hooks/useFabricEditor'
import { FloatingToolbar } from './FloatingToolbar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function FabricCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { state } = useStudioEditor()

  const { actions, zoomLevel, isReady } = useFabricEditor(canvasRef, {
    width: containerRef.current?.clientWidth ?? 800,
    height: containerRef.current?.clientHeight ?? 600,
  })

  // Resize observer
  useEffect(() => {
    const container = containerRef.current
    if (!container || !isReady) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        actions.zoom(zoomLevel) // re-render at current zoom
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      {/* Badge */}
      <div className="absolute top-4 left-4 z-10">
        <Badge
          variant={state.activeImageType === 'generated' ? 'default' : 'secondary'}
          className="gap-1.5"
        >
          {state.activeImageType === 'generated' ? '✨ Généré' : 'Original'}
        </Badge>
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} />

      {/* Floating toolbar */}
      <FloatingToolbar actions={actions} zoomLevel={zoomLevel} />
    </div>
  )
}
```

**Step 2: Create FloatingToolbar**

```typescript
'use client'

import {
  ZoomIn, ZoomOut, Undo2, Redo2, Crop, RotateCw, FlipHorizontal2,
  Pencil, Type, Square, Download, SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useStudioEditor } from '../../../context/StudioEditorContext'
import { cn } from '@/lib/utils'
import type { CanvasTool } from '../../../types/studio'

interface FloatingToolbarProps {
  actions: {
    zoom: (level: number) => void
    undo: () => void
    redo: () => void
    crop: () => void
    rotate: (degrees: number) => void
    flip: (direction: 'horizontal' | 'vertical') => void
    freeDrawing: (enabled: boolean) => void
    addText: (text?: string) => void
    addShape: (type: 'rect' | 'circle' | 'arrow') => void
    exportImage: (format?: 'png' | 'jpeg' | 'webp', quality?: number) => string | null
  }
  zoomLevel: number
}

export function FloatingToolbar({ actions, zoomLevel }: FloatingToolbarProps) {
  const { state, dispatch } = useStudioEditor()

  const setTool = (tool: CanvasTool) => {
    dispatch({ type: 'SET_TOOL', tool })
    // Disable drawing if switching away
    if (tool !== 'draw') actions.freeDrawing(false)
  }

  const toolBtn = (
    icon: React.ElementType,
    label: string,
    onClick: () => void,
    isActive?: boolean
  ) => {
    const Icon = icon
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className={cn('h-8 w-8', isActive && 'bg-primary/20 text-primary')}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-background/80 backdrop-blur-lg border border-border shadow-lg">
      {/* Zoom */}
      {toolBtn(ZoomOut, 'Zoom -', () => actions.zoom(zoomLevel - 10))}
      <span className="text-xs font-mono w-10 text-center text-muted-foreground">
        {zoomLevel}%
      </span>
      {toolBtn(ZoomIn, 'Zoom +', () => actions.zoom(zoomLevel + 10))}

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Undo/Redo */}
      {toolBtn(Undo2, 'Annuler', () => actions.undo())}
      {toolBtn(Redo2, 'Rétablir', () => actions.redo())}

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Transform */}
      {toolBtn(Crop, 'Recadrer', () => {
        setTool('crop')
        actions.crop()
      }, state.activeTool === 'crop')}
      {toolBtn(RotateCw, 'Rotation 90°', () => actions.rotate(90))}
      {toolBtn(FlipHorizontal2, 'Miroir', () => actions.flip('horizontal'))}

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Annotate */}
      {toolBtn(Pencil, 'Dessiner', () => {
        const enable = state.activeTool !== 'draw'
        setTool(enable ? 'draw' : 'select')
        actions.freeDrawing(enable)
      }, state.activeTool === 'draw')}
      {toolBtn(Type, 'Texte', () => {
        setTool('text')
        actions.addText()
      }, state.activeTool === 'text')}
      {toolBtn(Square, 'Rectangle', () => {
        setTool('shape')
        actions.addShape('rect')
      }, state.activeTool === 'shape')}

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Adjustments toggle */}
      {toolBtn(SlidersHorizontal, 'Ajustements', () =>
        dispatch({ type: 'TOGGLE_ADJUSTMENTS_PANEL' }),
        state.showAdjustmentsPanel
      )}

      {/* Export */}
      {toolBtn(Download, 'Télécharger', () => {
        const dataUrl = actions.exportImage('png')
        if (dataUrl) {
          const a = document.createElement('a')
          a.href = dataUrl
          a.download = 'photo-studio-export.png'
          a.click()
        }
      })}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add my-app/src/features/photo-studio/components/editor/canvas/FabricCanvas.tsx my-app/src/features/photo-studio/components/editor/canvas/FloatingToolbar.tsx
git commit -m "feat(photo-studio): add FabricCanvas wrapper + FloatingToolbar with glassmorphism"
```

---

### Task 16: Create ImageAdjustmentsPanel

**Files:**
- Create: `my-app/src/features/photo-studio/components/editor/adjustments/ImageAdjustmentsPanel.tsx`

**Step 1: Create the panel**

```typescript
'use client'

import { SlidersHorizontal, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { styles } from '@/lib/design-system'
import { useStudioEditor } from '../../../context/StudioEditorContext'
import type { ImageAdjustmentValues } from '../../../types/studio'

const SLIDERS: { key: keyof ImageAdjustmentValues; label: string; min: number; max: number }[] = [
  { key: 'brightness', label: 'Luminosité', min: -100, max: 100 },
  { key: 'contrast', label: 'Contraste', min: -100, max: 100 },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
  { key: 'sharpness', label: 'Netteté', min: 0, max: 100 },
  { key: 'temperature', label: 'Température', min: -100, max: 100 },
]

export function ImageAdjustmentsPanel() {
  const { state, dispatch } = useStudioEditor()

  const handleChange = (key: keyof ImageAdjustmentValues, value: number) => {
    dispatch({ type: 'SET_ADJUSTMENTS', adjustments: { [key]: value } })
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <h3 className={cn(styles.text.body, 'font-medium')}>Ajustements</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => dispatch({ type: 'RESET_ADJUSTMENTS' })}
          className="h-7 gap-1 text-xs"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      </div>

      {SLIDERS.map(({ key, label, min, max }) => (
        <div key={key} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-xs font-mono text-foreground w-8 text-right">
              {state.adjustments[key]}
            </span>
          </div>
          <Slider
            value={[state.adjustments[key]]}
            min={min}
            max={max}
            step={1}
            onValueChange={([v]) => handleChange(key, v)}
          />
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add my-app/src/features/photo-studio/components/editor/adjustments/ImageAdjustmentsPanel.tsx
git commit -m "feat(photo-studio): add ImageAdjustmentsPanel with 5 sliders connected to context"
```

---

### Task 17: Create EditorFooter + SourceGallery + GeneratedTimeline

**Files:**
- Create: `my-app/src/features/photo-studio/components/editor/footer/EditorFooter.tsx`
- Create: `my-app/src/features/photo-studio/components/editor/footer/SourceGallery.tsx`
- Create: `my-app/src/features/photo-studio/components/editor/footer/GeneratedTimeline.tsx`

**Step 1: Create SourceGallery**

```typescript
'use client'

import { useCallback } from 'react'
import Image from 'next/image'
import { GripVertical, Plus, Save } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { useStudioEditor } from '../../../context/StudioEditorContext'
import { cn } from '@/lib/utils'

interface GalleryImage {
  id: string
  url: string
  sort_order: number
}

interface SortableImageProps {
  image: GalleryImage
  isActive: boolean
  onClick: () => void
}

function SortableImage({ image, isActive, onClick }: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        'relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer group',
        isActive ? 'ring-2 ring-primary' : 'ring-1 ring-border hover:ring-foreground/30'
      )}
    >
      <Image src={image.url} alt="" fill className="object-cover" />
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors cursor-grab"
      >
        <GripVertical className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
      </div>
    </div>
  )
}

interface SourceGalleryProps {
  images: GalleryImage[]
  onReorder: (fromIndex: number, toIndex: number) => void
  onSave: () => void
  isDirty: boolean
  isSaving: boolean
}

export function SourceGallery({ images, onReorder, onSave, isDirty, isSaving }: SourceGalleryProps) {
  const { state, dispatch } = useStudioEditor()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const fromIndex = images.findIndex((i) => i.id === active.id)
      const toIndex = images.findIndex((i) => i.id === over.id)
      onReorder(fromIndex, toIndex)
    },
    [images, onReorder]
  )

  return (
    <div className="flex items-center gap-3 h-full px-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={images.map((i) => i.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex items-center gap-2 overflow-x-auto py-2">
            {images.map((img) => (
              <SortableImage
                key={img.id}
                image={img}
                isActive={state.activeImageId === img.id && state.activeImageType === 'source'}
                onClick={() =>
                  dispatch({ type: 'SET_ACTIVE_IMAGE', imageId: img.id, imageType: 'source' })
                }
              />
            ))}
            <button className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center flex-shrink-0 hover:border-foreground/30 transition-colors">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </SortableContext>
      </DndContext>

      {isDirty && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="flex-shrink-0 gap-1 text-xs"
        >
          <Save className="h-3 w-3" />
          Sauvegarder
        </Button>
      )}
    </div>
  )
}
```

**Step 2: Create GeneratedTimeline**

```typescript
'use client'

import Image from 'next/image'
import { Check, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useStudioEditor } from '../../../context/StudioEditorContext'
import { cn } from '@/lib/utils'
import type { StudioImage } from '../../../hooks/useStudioImages'

interface GeneratedTimelineProps {
  images: StudioImage[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onApplyToGallery: () => void
  onImageDetail: (image: StudioImage) => void
}

export function GeneratedTimeline({
  images,
  onApprove,
  onReject,
  onApplyToGallery,
  onImageDetail,
}: GeneratedTimelineProps) {
  const { state, dispatch } = useStudioEditor()

  const hasApproved = images.some((i) => i.status === 'approved')

  return (
    <div className="flex items-center gap-3 h-full px-4">
      <div className="flex items-center gap-2 overflow-x-auto py-2 flex-1">
        {images.map((img) => (
          <Tooltip key={img.id}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer group',
                  img.status === 'approved' && 'ring-2 ring-green-500',
                  img.status === 'rejected' && 'ring-2 ring-red-500',
                  img.status === 'draft' && 'ring-1 ring-dashed ring-border',
                  state.activeImageId === img.id &&
                    state.activeImageType === 'generated' &&
                    'ring-2 ring-primary'
                )}
                onClick={() =>
                  dispatch({ type: 'SET_ACTIVE_IMAGE', imageId: img.id, imageType: 'generated' })
                }
                onDoubleClick={() => onImageDetail(img)}
              >
                <Image
                  src={img.thumbnail_url ?? img.storage_url}
                  alt=""
                  fill
                  className="object-cover"
                />

                {/* Quick actions */}
                <div className="absolute bottom-0 inset-x-0 flex justify-center gap-0.5 p-1 bg-gradient-to-t from-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onApprove(img.id)
                    }}
                    className="p-1 rounded-full bg-green-500/80 hover:bg-green-500 text-white"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onReject(img.id)
                    }}
                    className="p-1 rounded-full bg-red-500/80 hover:bg-red-500 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs space-y-1 max-w-[200px]">
              <p className="font-medium">{img.action}</p>
              {img.metadata && (
                <>
                  {(img.metadata as { preset?: string }).preset && (
                    <p>Preset: {(img.metadata as { preset: string }).preset}</p>
                  )}
                  {(img.metadata as { latency_ms?: number }).latency_ms && (
                    <p>{((img.metadata as { latency_ms: number }).latency_ms / 1000).toFixed(1)}s</p>
                  )}
                </>
              )}
              <p className="text-muted-foreground">
                {new Date(img.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}

        {images.length === 0 && (
          <div className="flex items-center justify-center w-full text-xs text-muted-foreground">
            Les images générées apparaîtront ici
          </div>
        )}
      </div>

      {hasApproved && (
        <Button
          variant="outline"
          size="sm"
          onClick={onApplyToGallery}
          className="flex-shrink-0 gap-1 text-xs"
        >
          Appliquer à la galerie
          <ArrowRight className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
```

**Step 3: Create EditorFooter**

```typescript
'use client'

import { useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { styles } from '@/lib/design-system'
import { SourceGallery } from './SourceGallery'
import { GeneratedTimeline } from './GeneratedTimeline'
import { useGalleryReorder } from '../../../hooks/useGalleryReorder'
import { useStudioImages, type StudioImage } from '../../../hooks/useStudioImages'

interface EditorFooterProps {
  productId: string
}

export function EditorFooter({ productId }: EditorFooterProps) {
  const { orderedImages, moveImage, isDirty, saveOrder, isSaving } = useGalleryReorder(productId)
  const { images: generatedImages, updateStatus } = useStudioImages({ productId })

  const handleApprove = (id: string) => updateStatus(id, 'approve')
  const handleReject = (id: string) => updateStatus(id, 'reject')

  return (
    <div className="flex h-full">
      {/* Source gallery */}
      <div className="flex-1 min-w-0">
        <div className="px-4 pt-2">
          <span className={cn(styles.text.label, 'text-[10px] uppercase tracking-wider text-muted-foreground')}>
            Galerie produit
          </span>
        </div>
        <SourceGallery
          images={orderedImages}
          onReorder={moveImage}
          onSave={saveOrder}
          isDirty={isDirty}
          isSaving={isSaving}
        />
      </div>

      <Separator orientation="vertical" className="h-full" />

      {/* Generated timeline */}
      <div className="flex-1 min-w-0">
        <div className="px-4 pt-2">
          <span className={cn(styles.text.label, 'text-[10px] uppercase tracking-wider text-muted-foreground')}>
            Images générées
          </span>
        </div>
        <GeneratedTimeline
          images={generatedImages ?? []}
          onApprove={handleApprove}
          onReject={handleReject}
          onApplyToGallery={() => {/* TODO: open PublishToProductDialog */}}
          onImageDetail={() => {/* TODO: open ImageDetailModal */}}
        />
      </div>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add my-app/src/features/photo-studio/components/editor/footer/EditorFooter.tsx my-app/src/features/photo-studio/components/editor/footer/SourceGallery.tsx my-app/src/features/photo-studio/components/editor/footer/GeneratedTimeline.tsx
git commit -m "feat(photo-studio): add EditorFooter with SourceGallery (dnd-kit) + GeneratedTimeline"
```

---

## Phase 4 — Integration + Wiring

### Task 18: Create ImageDetailModal

**Files:**
- Create: `my-app/src/features/photo-studio/components/modals/ImageDetailModal.tsx`

**Step 1: Create the modal**

```typescript
'use client'

import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { styles } from '@/lib/design-system'
import type { StudioImage } from '../../hooks/useStudioImages'

interface ImageDetailModalProps {
  image: StudioImage | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  approved: 'bg-green-500/10 text-green-500',
  published: 'bg-primary/10 text-primary',
  rejected: 'bg-red-500/10 text-red-500',
}

export function ImageDetailModal({ image, open, onOpenChange }: ImageDetailModalProps) {
  if (!image) return null

  const metadata = image.metadata as Record<string, unknown> | null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Détails de l&apos;image
            <Badge className={cn(STATUS_COLORS[image.status])}>{image.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
            <Image src={image.storage_url} alt="" fill className="object-contain" />
          </div>

          {/* Metadata table */}
          <div className="space-y-2">
            <h4 className={cn(styles.text.label, 'text-xs uppercase tracking-wider')}>Métadonnées</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Action</span>
                <p className="font-medium">{image.action}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Date</span>
                <p className="font-medium">
                  {new Date(image.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {metadata?.preset && (
                <div>
                  <span className="text-muted-foreground">Preset</span>
                  <p className="font-medium">{metadata.preset as string}</p>
                </div>
              )}
              {metadata?.latency_ms && (
                <div>
                  <span className="text-muted-foreground">Latence</span>
                  <p className="font-medium">{((metadata.latency_ms as number) / 1000).toFixed(1)}s</p>
                </div>
              )}
              {metadata?.cost && (
                <div>
                  <span className="text-muted-foreground">Coût</span>
                  <p className="font-medium">{(metadata.cost as number).toFixed(4)}€</p>
                </div>
              )}
            </div>
          </div>

          {/* Prompt */}
          {metadata?.prompt && (
            <div className="space-y-2">
              <h4 className={cn(styles.text.label, 'text-xs uppercase tracking-wider')}>Prompt utilisé</h4>
              <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                {metadata.prompt as string}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Commit**

```bash
git add my-app/src/features/photo-studio/components/modals/ImageDetailModal.tsx
git commit -m "feat(photo-studio): add ImageDetailModal with full metadata display"
```

---

### Task 19: Update exports and wire routing from list page

**Files:**
- Modify: `my-app/src/features/photo-studio/components/editor/index.ts`
- Modify: `my-app/src/features/photo-studio/index.ts`
- Modify: `my-app/src/features/photo-studio/hooks/index.ts`

**Step 1: Update editor/index.ts** — replace old exports with new ones

Rewrite `my-app/src/features/photo-studio/components/editor/index.ts`:

```typescript
// ─── New Editor Components ──────────────────────────────────
export { StudioEditorPageClient } from './StudioEditorPage'
export { EditorHeader } from './EditorHeader'
export { EditorLayout } from './EditorLayout'

// Sidebar
export { EditorSidebar } from './sidebar/EditorSidebar'
export { ProductCard } from './sidebar/ProductCard'
export { ScenePresetsPanel } from './sidebar/ScenePresetsPanel'
export { PresetCard } from './sidebar/PresetCard'
export { PromptBuilder } from './sidebar/PromptBuilder'
export { PromptPreview } from './sidebar/PromptPreview'
export { FavoritesPanel } from './sidebar/FavoritesPanel'
export { GenerateButton } from './sidebar/GenerateButton'

// Canvas
export { FabricCanvas } from './canvas/FabricCanvas'
export { FloatingToolbar } from './canvas/FloatingToolbar'

// Adjustments
export { ImageAdjustmentsPanel } from './adjustments/ImageAdjustmentsPanel'

// Footer
export { EditorFooter } from './footer/EditorFooter'
export { SourceGallery } from './footer/SourceGallery'
export { GeneratedTimeline } from './footer/GeneratedTimeline'

// ─── Legacy exports (kept for backward compat during migration) ──
export { editorReducer, initialEditorState } from './editorReducer'
export type { EditorState, EditorAction, ActiveTool } from './editorReducer'
```

**Step 2: Update hooks/index.ts** — add new hook exports

Append to `my-app/src/features/photo-studio/hooks/index.ts`:

```typescript
export { useFabricEditor } from './useFabricEditor'
export { usePromptBuilder } from './usePromptBuilder'
export { useFavoritePresets } from './useFavoritePresets'
export { useGalleryReorder } from './useGalleryReorder'
```

**Step 3: Update main index.ts** — export new context

Add to `my-app/src/features/photo-studio/index.ts`:

```typescript
export { StudioEditorProvider, useStudioEditor } from './context/StudioEditorContext'
```

**Step 4: Commit**

```bash
git add my-app/src/features/photo-studio/components/editor/index.ts my-app/src/features/photo-studio/hooks/index.ts my-app/src/features/photo-studio/index.ts
git commit -m "feat(photo-studio): update exports for new editor components and hooks"
```

---

### Task 20: Wire list page navigation to new editor

**Files:**
- Modify: `my-app/src/features/photo-studio/components/photo-studio-page/PhotoStudioPage.tsx`

**Step 1: Find the product click handler and update navigation**

In `PhotoStudioPage.tsx`, find where `handleProductClick` or `onProductClick` is defined (likely in `usePhotoStudioData.ts`). Update it to navigate to the new route instead of opening the SceneStudioDialog:

Replace the existing click handler pattern:

```typescript
// OLD: opens dialog
const handleProductClick = (productId: string) => {
  setStudioDialogOpen(true)
  setStudioProduct(...)
}
```

With:

```typescript
// NEW: navigates to editor page
import { useRouter } from 'next/navigation'
const router = useRouter()

const handleProductClick = (productId: string) => {
  router.push(`/app/photostudio/${productId}`)
}
```

**Step 2: Remove SceneStudioDialog rendering** from PhotoStudioPage.tsx — remove the `<StudioContextProvider>` wrapper and `<SceneStudioDialog>` component.

**Step 3: Verify build**

Run: `cd my-app && npm run build 2>&1 | tail -20`
Expected: Build succeeds (warnings OK, no errors)

**Step 4: Commit**

```bash
git add my-app/src/features/photo-studio/components/photo-studio-page/
git commit -m "feat(photo-studio): wire list page to new /photostudio/[productId] editor route"
```

---

## Phase 5 — Cleanup

### Task 21: Remove deprecated components

**Files to delete:**
- `my-app/src/features/photo-studio/components/PhotoStudioPage.tsx` (old doublon)
- `my-app/src/features/photo-studio/components/editor/EditorHub.tsx`
- `my-app/src/features/photo-studio/components/editor/CropTool.tsx`
- `my-app/src/features/photo-studio/components/editor/AnnotationLayer.tsx`
- `my-app/src/features/photo-studio/components/editor/EditorCanvas.tsx`
- `my-app/src/features/photo-studio/components/editor/ActionBar.tsx`
- `my-app/src/features/photo-studio/components/editor/ControlPanel.tsx`
- `my-app/src/features/photo-studio/components/SceneStudioDialog.tsx`
- `my-app/src/features/photo-studio/components/SceneStudioLayout.tsx`
- `my-app/src/features/photo-studio/components/SceneStudioLoader.tsx`

**Step 1: Delete old files**

Run: `cd my-app && rm -f src/features/photo-studio/components/PhotoStudioPage.tsx src/features/photo-studio/components/editor/EditorHub.tsx src/features/photo-studio/components/editor/CropTool.tsx src/features/photo-studio/components/editor/AnnotationLayer.tsx src/features/photo-studio/components/editor/EditorCanvas.tsx src/features/photo-studio/components/editor/ActionBar.tsx src/features/photo-studio/components/editor/ControlPanel.tsx src/features/photo-studio/components/SceneStudioDialog.tsx src/features/photo-studio/components/SceneStudioLayout.tsx src/features/photo-studio/components/SceneStudioLoader.tsx`

**Step 2: Fix any broken imports**

Run: `cd my-app && npm run build 2>&1 | grep "Module not found" | head -20`

Fix each broken import by removing the import line or redirecting to new components.

**Step 3: Verify build passes**

Run: `cd my-app && npm run build 2>&1 | tail -5`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add -A my-app/src/features/photo-studio/
git commit -m "chore(photo-studio): remove deprecated components replaced by new editor"
```

---

### Task 22: Move viewer components to shared (optional)

If `GalleryView`, `CompareOverlay`, `LightTable` are still used on the list page (Results tab), move them to `components/shared/`. If not used anywhere, delete them.

**Step 1: Check for imports**

Run: `cd my-app && grep -r "GalleryView\|CompareOverlay\|LightTable" src/ --include="*.tsx" --include="*.ts" -l`

**Step 2: Based on results, either move or delete**

**Step 3: Commit**

```bash
git add -A my-app/src/features/photo-studio/
git commit -m "chore(photo-studio): cleanup viewer components (move or remove)"
```

---

### Task 23: Final build + lint verification

**Step 1: Build**

Run: `cd my-app && npm run build`
Expected: Build succeeds

**Step 2: Lint**

Run: `cd my-app && npm run lint`
Expected: No new errors

**Step 3: Fix any remaining issues and commit**

```bash
git add -A my-app/
git commit -m "chore(photo-studio): fix build/lint issues from UI restructure"
```

---

### Task 24: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update Photo Studio section** to reflect new component hierarchy, new route (`/app/photostudio/[productId]`), FabricJS v6 dependency, new hooks (useFabricEditor, usePromptBuilder, useFavoritePresets, useGalleryReorder), and StudioEditorContext.

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with Photo Studio UI restructure changes"
```
