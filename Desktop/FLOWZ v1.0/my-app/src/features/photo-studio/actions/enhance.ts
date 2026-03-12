import type { ActionHandler, StudioActionType } from './types'

const ENHANCE_PROMPTS: Record<string, (name: string) => string> = {
  enhance: (name) =>
    `Enhance this product image of "${name}" for professional e-commerce use. Improve lighting balance, color accuracy, sharpness, contrast and overall image quality. Make it look like a professional studio photograph. Keep the product exactly as it is — only improve the image quality.`,
  enhance_light: (name) =>
    `Enhance the lighting of this product image of "${name}". Correct exposure, reduce harsh shadows, add professional studio-quality lighting. Balanced key light with soft fill. Keep the product and colors exactly as they are — only improve the lighting.`,
  enhance_color: (name) =>
    `Enhance the colors of this product image of "${name}". Improve color accuracy, saturation balance, and white balance. Make colors vibrant but natural-looking, suitable for professional e-commerce. Keep the product and composition exactly as they are — only improve the color rendering.`,
}

export function createEnhanceHandler(
  variant: 'enhance' | 'enhance_light' | 'enhance_color'
): ActionHandler {
  const isBase = variant === 'enhance'
  return {
    type: isBase ? 'dedicated' : 'preset',
    baseAction: isBase ? undefined : ('enhance' as StudioActionType),
    buildPrompt: ({ productName = 'Product' }) =>
      ENHANCE_PROMPTS[variant](productName),
    config: { temperature: 0.6, maxOutputTokens: 8192 },
    outputCount: 1,
  }
}
