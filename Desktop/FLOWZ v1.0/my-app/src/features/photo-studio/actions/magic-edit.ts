import type { ActionHandler } from './types'

export const magicEditHandler: ActionHandler = {
  type: 'dedicated',
  buildPrompt: ({ productName = 'Product', userInstruction }) => {
    const instruction =
      userInstruction?.trim() ||
      'Improve the overall quality and presentation'
    return `Edit this product image of "${productName}" for professional e-commerce use. User instruction: ${instruction}. Apply the requested changes while maintaining professional product photography quality. Keep the product recognizable.`
  },
  config: { temperature: 0.7, maxOutputTokens: 8192 },
  outputCount: 1,
}
