import type { ActionHandler, StudioActionType } from './types'
import { getPromptModifier } from '../constants/scenePresets'

const BG_PRESETS: Record<string, string> = {
  replace_bg_white:
    'on a seamless white infinity background, professional studio lighting, soft shadows, 4k product photography',
  replace_bg_studio:
    'on a clean, modern professional studio background with neutral tones, professional lighting setup, e-commerce photography',
  replace_bg_marble:
    'sitting on a white marble kitchen countertop, blurred modern kitchen background, morning sunlight coming from window, photorealistic',
  replace_bg_wood:
    'on a warm wooden table, natural daylight, cozy atmosphere, lifestyle photography',
}

export function createReplaceBgHandler(
  variant:
    | 'replace_bg'
    | 'replace_bg_white'
    | 'replace_bg_studio'
    | 'replace_bg_marble'
    | 'replace_bg_wood'
): ActionHandler {
  const isBase = variant === 'replace_bg'
  return {
    type: isBase ? 'dedicated' : 'preset',
    baseAction: isBase ? undefined : ('replace_bg' as StudioActionType),
    buildPrompt: ({ productName = 'Product', preset }) => {
      let modifier: string
      if (isBase) {
        // Dynamic: use scenePresetId from preset or fallback
        const presetId = preset?.scenePresetId as string | undefined
        modifier = presetId
          ? getPromptModifier(presetId) ?? 'on a clean, modern professional background'
          : 'on a clean, modern professional background'
      } else {
        modifier = BG_PRESETS[variant]
      }
      return `Edit this product image of "${productName}". Place the product ${modifier}. Keep the product clearly visible and the main focus. Do not alter the product itself, only change the background and environment. Professional e-commerce photography.`
    },
    config: { temperature: 0.6, maxOutputTokens: 8192 },
    outputCount: 1,
  }
}
