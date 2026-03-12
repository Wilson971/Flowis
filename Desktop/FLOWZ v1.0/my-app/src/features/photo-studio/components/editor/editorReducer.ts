// ---------------------------------------------------------------------------
// EditorHub reducer — manages all editor state for the Photo Studio editor
// ---------------------------------------------------------------------------

import type { Annotation } from "./AnnotationLayer"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActiveTool = "crop" | "adjust" | "annotate" | "compare" | null

export interface EditorState {
  activeImage: string
  originalImage: string
  activeTool: ActiveTool
  crop: { x: number; y: number; width: number; height: number } | null
  adjustments: {
    brightness: number
    contrast: number
    saturation: number
    sharpness: number
  }
  annotations: Annotation[]
  selectedAction: string | null
  selectedPreset: Record<string, unknown> | null
  validationStatus: "draft" | "approved" | "published"
  isGenerating: boolean
  zoom: number
  userInstruction: string
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type EditorAction =
  | { type: "SET_IMAGE"; payload: { active: string; original: string } }
  | { type: "SET_ACTIVE_IMAGE"; payload: string }
  | { type: "SET_TOOL"; payload: ActiveTool }
  | {
      type: "SET_CROP"
      payload: { x: number; y: number; width: number; height: number } | null
    }
  | {
      type: "SET_ADJUSTMENTS"
      payload: Partial<EditorState["adjustments"]>
    }
  | { type: "RESET_ADJUSTMENTS" }
  | { type: "ADD_ANNOTATION"; payload: Annotation }
  | { type: "REMOVE_ANNOTATION"; payload: string }
  | { type: "SET_ACTION"; payload: string | null }
  | { type: "SET_PRESET"; payload: Record<string, unknown> | null }
  | {
      type: "SET_VALIDATION_STATUS"
      payload: "draft" | "approved" | "published"
    }
  | { type: "SET_GENERATING"; payload: boolean }
  | { type: "SET_ZOOM"; payload: number }
  | { type: "SET_INSTRUCTION"; payload: string }

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const DEFAULT_ADJUSTMENTS: EditorState["adjustments"] = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sharpness: 100,
}

export const initialEditorState: EditorState = {
  activeImage: "",
  originalImage: "",
  activeTool: null,
  crop: null,
  adjustments: { ...DEFAULT_ADJUSTMENTS },
  annotations: [],
  selectedAction: null,
  selectedPreset: null,
  validationStatus: "draft",
  isGenerating: false,
  zoom: 100,
  userInstruction: "",
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function editorReducer(
  state: EditorState,
  action: EditorAction
): EditorState {
  switch (action.type) {
    case "SET_IMAGE":
      return {
        ...state,
        activeImage: action.payload.active,
        originalImage: action.payload.original,
      }

    case "SET_ACTIVE_IMAGE":
      return { ...state, activeImage: action.payload }

    case "SET_TOOL":
      return { ...state, activeTool: action.payload }

    case "SET_CROP":
      return { ...state, crop: action.payload }

    case "SET_ADJUSTMENTS":
      return {
        ...state,
        adjustments: { ...state.adjustments, ...action.payload },
      }

    case "RESET_ADJUSTMENTS":
      return { ...state, adjustments: { ...DEFAULT_ADJUSTMENTS } }

    case "ADD_ANNOTATION":
      return {
        ...state,
        annotations: [...state.annotations, action.payload],
      }

    case "REMOVE_ANNOTATION":
      return {
        ...state,
        annotations: state.annotations.filter((a) => a.id !== action.payload),
      }

    case "SET_ACTION":
      return { ...state, selectedAction: action.payload }

    case "SET_PRESET":
      return { ...state, selectedPreset: action.payload }

    case "SET_VALIDATION_STATUS":
      return { ...state, validationStatus: action.payload }

    case "SET_GENERATING":
      return { ...state, isGenerating: action.payload }

    case "SET_ZOOM":
      return { ...state, zoom: action.payload }

    case "SET_INSTRUCTION":
      return { ...state, userInstruction: action.payload }

    default:
      return state
  }
}
