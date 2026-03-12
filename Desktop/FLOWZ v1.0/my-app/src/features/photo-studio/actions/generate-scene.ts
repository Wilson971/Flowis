import type { ActionHandler } from './types'
import { getPromptModifier } from '../constants/scenePresets'

export const generateSceneHandler: ActionHandler = {
  type: 'dedicated',
  buildPrompt: ({ productName = 'Product', preset }) => {
    const presetId = preset?.scenePresetId as string | undefined
    const modifier = presetId
      ? getPromptModifier(presetId) ?? 'in a professional lifestyle setting'
      : 'in a professional lifestyle setting'
    return `Create a professional e-commerce lifestyle scene for this "${productName}". ${modifier}. The product should be the clear focal point. Professional product photography quality. Photorealistic.`
  },
  config: { temperature: 0.6, maxOutputTokens: 8192 },
  outputCount: 1,
}
