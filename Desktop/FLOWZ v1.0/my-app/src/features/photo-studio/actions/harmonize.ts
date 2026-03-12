import type { ActionHandler } from './types'

export const harmonizeHandler: ActionHandler = {
  type: 'dedicated',
  buildPrompt: ({ productName = 'Product' }) =>
    `Harmonize this product image of "${productName}" for a cohesive e-commerce catalog look. Normalize the white balance, ensure consistent lighting direction, match exposure levels, and unify the color temperature. The product should look like it belongs in a professional product lineup. Keep the product itself unchanged — only harmonize the overall image appearance.`,
  config: { temperature: 0.6, maxOutputTokens: 8192 },
  outputCount: 1,
}
