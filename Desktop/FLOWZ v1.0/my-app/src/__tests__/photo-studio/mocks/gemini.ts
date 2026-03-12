import { vi } from 'vitest'

export function createMockGemini() {
  return {
    models: {
      generateContent: vi.fn().mockResolvedValue({
        candidates: [{
          content: {
            parts: [{ inlineData: { mimeType: 'image/png', data: 'bW9ja0Jhc2U2NA==' } }]
          }
        }],
        usageMetadata: { promptTokenCount: 500, candidatesTokenCount: 200 },
      })
    }
  }
}

export function createMockGeminiError(errorType: string = 'INTERNAL') {
  return {
    models: {
      generateContent: vi.fn().mockRejectedValue(new Error(`Gemini error: ${errorType}`))
    }
  }
}
