import { describe, it, expect } from 'vitest'
import { getActionHandler, isValidAction } from '@/features/photo-studio/actions'
import type { StudioActionType } from '@/features/photo-studio/actions'

const ALL_ACTIONS: StudioActionType[] = [
  'remove_bg',
  'enhance',
  'enhance_light',
  'enhance_color',
  'replace_bg',
  'replace_bg_white',
  'replace_bg_studio',
  'replace_bg_marble',
  'replace_bg_wood',
  'generate_angles',
  'generate_scene',
  'harmonize',
  'magic_edit',
]

describe('Action Registry Integration', () => {
  it('registry contains exactly 13 actions', () => {
    expect(ALL_ACTIONS).toHaveLength(13)
    for (const action of ALL_ACTIONS) {
      expect(isValidAction(action)).toBe(true)
    }
  })

  it('isValidAction rejects unknown actions', () => {
    expect(isValidAction('unknown_action')).toBe(false)
    expect(isValidAction('')).toBe(false)
  })

  it('all actions produce valid prompts with minimal input', () => {
    const minimalInput = { imageBase64: 'dGVzdA==', imageMimeType: 'image/png' as const }
    for (const action of ALL_ACTIONS) {
      const handler = getActionHandler(action)
      expect(handler).toBeDefined()
      const prompt = handler!.buildPrompt(minimalInput)
      expect(typeof prompt).toBe('string')
      expect(prompt.length).toBeGreaterThan(0)
    }
  })

  it('all actions have valid config', () => {
    for (const action of ALL_ACTIONS) {
      const handler = getActionHandler(action)!
      expect(handler.config.temperature).toBeGreaterThanOrEqual(0)
      expect(handler.config.temperature).toBeLessThanOrEqual(2)
      expect(handler.config.maxOutputTokens).toBeGreaterThan(0)
    }
  })

  it('preset variant actions have type "preset" and baseAction "replace_bg"', () => {
    const presetActions: StudioActionType[] = [
      'replace_bg_white',
      'replace_bg_studio',
      'replace_bg_marble',
      'replace_bg_wood',
    ]
    for (const action of presetActions) {
      const handler = getActionHandler(action)!
      expect(handler.type).toBe('preset')
      expect(handler.baseAction).toBe('replace_bg')
    }
  })

  it('dedicated actions have type "dedicated" and no baseAction', () => {
    const dedicatedActions: StudioActionType[] = [
      'remove_bg',
      'enhance',
      'replace_bg',
      'generate_angles',
      'generate_scene',
      'harmonize',
      'magic_edit',
    ]
    for (const action of dedicatedActions) {
      const handler = getActionHandler(action)!
      expect(handler.type).toBe('dedicated')
      expect(handler.baseAction).toBeUndefined()
    }
  })

  it('enhance variants are preset with baseAction "enhance"', () => {
    const enhancePresets: StudioActionType[] = ['enhance_light', 'enhance_color']
    for (const action of enhancePresets) {
      const handler = getActionHandler(action)!
      expect(handler.type).toBe('preset')
      expect(handler.baseAction).toBe('enhance')
    }
  })

  it('all handlers have a valid outputCount', () => {
    for (const action of ALL_ACTIONS) {
      const handler = getActionHandler(action)!
      const valid =
        handler.outputCount === 'dynamic' ||
        (typeof handler.outputCount === 'number' && handler.outputCount >= 1)
      expect(valid).toBe(true)
    }
  })
})
