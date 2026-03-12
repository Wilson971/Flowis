import type { ActionHandler } from './types'
import { VIEW_ANGLE_PROMPTS, type ViewAngle } from '../types/studio'

export const generateAnglesHandler: ActionHandler = {
  type: 'dedicated',
  buildPrompt: ({ productName = 'Product', angles }) => {
    // When called per-angle, angles[0] is the current angle
    const angle = angles?.[0] ?? 'front'
    const angleDesc =
      VIEW_ANGLE_PROMPTS[angle as ViewAngle] || 'front view, facing the camera'
    return `Generate a professional product photograph of "${productName}", ${angleDesc}. Professional studio lighting, clean white background. High resolution e-commerce product photography.`
  },
  config: { temperature: 0.6, maxOutputTokens: 8192 },
  outputCount: 'dynamic',
}

/** Default angles when none specified */
export const DEFAULT_ANGLES: ViewAngle[] = [
  'front',
  'three_quarter_left',
  'three_quarter_right',
  'top',
]
