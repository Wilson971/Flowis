"use client"

import { createContext, useContext, useReducer, type ReactNode } from "react"
import type {
  SelectedBlocks,
  EditorMode,
  CanvasTool,
  ImageAdjustmentValues,
  FavoritePreset,
} from "../types/studio"
import { DEFAULT_ADJUSTMENTS } from "../types/studio"

// ══════════════════════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════════════════════

export interface StudioEditorState {
  productId: string
  activePresetId: string | null
  selectedBlocks: SelectedBlocks
  customPromptText: string
  mode: EditorMode
  activeImageId: string | null
  activeImageType: "source" | "generated" | null
  adjustments: ImageAdjustmentValues
  activeTool: CanvasTool
  showAdjustmentsPanel: boolean
  galleryOrder: string[]
  galleryDirty: boolean
  isGenerating: boolean
}

function createInitialState(productId: string): StudioEditorState {
  return {
    productId,
    activePresetId: null,
    selectedBlocks: { lighting: null, angle: null, ambiance: null, surface: null },
    customPromptText: "",
    mode: "simple",
    activeImageId: null,
    activeImageType: null,
    adjustments: DEFAULT_ADJUSTMENTS,
    activeTool: "select",
    showAdjustmentsPanel: false,
    galleryOrder: [],
    galleryDirty: false,
    isGenerating: false,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ACTIONS
// ══════════════════════════════════════════════════════════════════════════════

type StudioEditorAction =
  | { type: "SET_PRESET"; presetId: string | null }
  | { type: "SET_BLOCK"; dimension: keyof SelectedBlocks; blockId: string | null }
  | { type: "SET_CUSTOM_PROMPT"; text: string }
  | { type: "SET_MODE"; mode: EditorMode }
  | { type: "SET_ACTIVE_IMAGE"; imageId: string | null; imageType: "source" | "generated" | null }
  | { type: "SET_ADJUSTMENTS"; adjustments: Partial<ImageAdjustmentValues> }
  | { type: "RESET_ADJUSTMENTS" }
  | { type: "SET_TOOL"; tool: CanvasTool }
  | { type: "TOGGLE_ADJUSTMENTS_PANEL" }
  | { type: "SET_GALLERY_ORDER"; order: string[] }
  | { type: "MARK_GALLERY_SAVED" }
  | { type: "SET_GENERATING"; value: boolean }
  | { type: "APPLY_FAVORITE"; favorite: FavoritePreset }

// ══════════════════════════════════════════════════════════════════════════════
// REDUCER
// ══════════════════════════════════════════════════════════════════════════════

function studioEditorReducer(
  state: StudioEditorState,
  action: StudioEditorAction,
): StudioEditorState {
  switch (action.type) {
    case "SET_PRESET":
      return { ...state, activePresetId: action.presetId }

    case "SET_BLOCK":
      return {
        ...state,
        selectedBlocks: { ...state.selectedBlocks, [action.dimension]: action.blockId },
      }

    case "SET_CUSTOM_PROMPT":
      return { ...state, customPromptText: action.text }

    case "SET_MODE":
      return { ...state, mode: action.mode }

    case "SET_ACTIVE_IMAGE":
      return { ...state, activeImageId: action.imageId, activeImageType: action.imageType }

    case "SET_ADJUSTMENTS":
      return { ...state, adjustments: { ...state.adjustments, ...action.adjustments } }

    case "RESET_ADJUSTMENTS":
      return { ...state, adjustments: DEFAULT_ADJUSTMENTS }

    case "SET_TOOL":
      return { ...state, activeTool: action.tool }

    case "TOGGLE_ADJUSTMENTS_PANEL":
      return { ...state, showAdjustmentsPanel: !state.showAdjustmentsPanel }

    case "SET_GALLERY_ORDER":
      return { ...state, galleryOrder: action.order, galleryDirty: true }

    case "MARK_GALLERY_SAVED":
      return { ...state, galleryDirty: false }

    case "SET_GENERATING":
      return { ...state, isGenerating: action.value }

    case "APPLY_FAVORITE":
      return {
        ...state,
        activePresetId: action.favorite.presetId,
        selectedBlocks: action.favorite.selectedBlocks,
        customPromptText: action.favorite.customPromptText,
      }

    default:
      return state
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CONTEXT
// ══════════════════════════════════════════════════════════════════════════════

type StudioEditorContextValue = {
  state: StudioEditorState
  dispatch: React.Dispatch<StudioEditorAction>
}

const StudioEditorContext = createContext<StudioEditorContextValue | null>(null)

// ══════════════════════════════════════════════════════════════════════════════
// PROVIDER
// ══════════════════════════════════════════════════════════════════════════════

export function StudioEditorProvider({
  productId,
  children,
}: {
  productId: string
  children: ReactNode
}) {
  const [state, dispatch] = useReducer(studioEditorReducer, productId, createInitialState)

  return (
    <StudioEditorContext.Provider value={{ state, dispatch }}>
      {children}
    </StudioEditorContext.Provider>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// HOOK
// ══════════════════════════════════════════════════════════════════════════════

export function useStudioEditor() {
  const ctx = useContext(StudioEditorContext)
  if (!ctx) {
    throw new Error("useStudioEditor must be used within a StudioEditorProvider")
  }
  return ctx
}
