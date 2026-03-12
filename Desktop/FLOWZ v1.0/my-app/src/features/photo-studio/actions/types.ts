// ============================================================================
// Photo Studio — Action Types
// ============================================================================

export type StudioActionType =
  | 'remove_bg'
  | 'enhance'
  | 'enhance_light'
  | 'enhance_color'
  | 'replace_bg'
  | 'replace_bg_white'
  | 'replace_bg_studio'
  | 'replace_bg_marble'
  | 'replace_bg_wood'
  | 'generate_angles'
  | 'generate_scene'
  | 'harmonize'
  | 'magic_edit'

export interface ActionInput {
  imageBase64: string
  imageMimeType: string
  productName?: string
  productDescription?: string
  preset?: Record<string, unknown>
  angles?: string[]
  userInstruction?: string
}

export interface ActionConfig {
  temperature: number
  maxOutputTokens: number
}

export interface ActionHandler {
  /** 'preset' = variant of a base action, 'dedicated' = standalone */
  type: 'preset' | 'dedicated'
  /** For preset handlers, the base action they derive from */
  baseAction?: StudioActionType
  /** Build the prompt string from input */
  buildPrompt: (input: ActionInput) => string
  /** Gemini generation config */
  config: ActionConfig
  /** Number of output images: fixed number or 'dynamic' (e.g. generate_angles) */
  outputCount: number | 'dynamic'
}
