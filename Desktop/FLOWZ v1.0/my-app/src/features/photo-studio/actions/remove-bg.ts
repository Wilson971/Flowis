import type { ActionHandler } from './types'

export const removeBgHandler: ActionHandler = {
  type: 'dedicated',
  buildPrompt: ({ productName = 'Product' }) =>
    `Remove the background from this product image of "${productName}". Replace the background with a clean, pure white (#FFFFFF) background. Preserve all product details, textures, shadows, and colors exactly as they are. Professional product photography cutout.`,
  config: { temperature: 0.6, maxOutputTokens: 8192 },
  outputCount: 1,
}
