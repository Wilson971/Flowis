import { describe, it, expect } from 'vitest'
import { getActionHandler, isValidAction } from '@/features/photo-studio/actions'

const ALL_ACTIONS = [
  'remove_bg', 'enhance', 'enhance_light', 'enhance_color',
  'replace_bg', 'replace_bg_white', 'replace_bg_studio', 'replace_bg_marble', 'replace_bg_wood',
  'generate_angles', 'generate_scene', 'harmonize', 'magic_edit',
] as const

describe('Action Registry', () => {
  it('returns handler for all 13 valid actions', () => {
    for (const action of ALL_ACTIONS) {
      expect(isValidAction(action)).toBe(true)
      expect(getActionHandler(action)).toBeDefined()
    }
  })

  it('returns undefined for unknown action', () => {
    expect(isValidAction('unknown')).toBe(false)
    expect(getActionHandler('unknown' as any)).toBeUndefined()
  })

  it('replace_bg variants (not base) use preset type', () => {
    for (const v of ['replace_bg_white', 'replace_bg_studio', 'replace_bg_marble', 'replace_bg_wood'] as const) {
      const handler = getActionHandler(v)
      expect(handler?.type).toBe('preset')
      expect(handler?.baseAction).toBe('replace_bg')
    }
  })

  it('replace_bg base uses dedicated type', () => {
    const handler = getActionHandler('replace_bg')
    expect(handler?.type).toBe('dedicated')
    expect(handler?.baseAction).toBeUndefined()
  })

  it('enhance variants (not base) use preset type', () => {
    for (const v of ['enhance_light', 'enhance_color'] as const) {
      const handler = getActionHandler(v)
      expect(handler?.type).toBe('preset')
      expect(handler?.baseAction).toBe('enhance')
    }
  })

  it('enhance base uses dedicated type', () => {
    const handler = getActionHandler('enhance')
    expect(handler?.type).toBe('dedicated')
    expect(handler?.baseAction).toBeUndefined()
  })

  it('generate_angles has dynamic output count', () => {
    expect(getActionHandler('generate_angles')?.outputCount).toBe('dynamic')
  })

  it('non-dynamic actions have outputCount = 1', () => {
    const nonDynamic = ALL_ACTIONS.filter(a => a !== 'generate_angles')
    for (const action of nonDynamic) {
      expect(getActionHandler(action)?.outputCount).toBe(1)
    }
  })

  it('all handlers produce non-empty prompts', () => {
    const input = { imageBase64: 'test', imageMimeType: 'image/png' }
    for (const action of ALL_ACTIONS) {
      const handler = getActionHandler(action)
      const prompt = handler!.buildPrompt(input)
      expect(prompt.length).toBeGreaterThan(10)
    }
  })

  it('magic_edit includes user instruction in prompt', () => {
    const handler = getActionHandler('magic_edit')!
    const prompt = handler.buildPrompt({
      imageBase64: '',
      imageMimeType: 'image/png',
      userInstruction: 'make it blue',
    })
    expect(prompt).toContain('make it blue')
  })

  it('replace_bg_marble includes marble in prompt', () => {
    const handler = getActionHandler('replace_bg_marble')!
    const prompt = handler.buildPrompt({ imageBase64: '', imageMimeType: 'image/png' })
    expect(prompt.toLowerCase()).toContain('marb')
  })

  it('replace_bg_wood includes wood in prompt', () => {
    const handler = getActionHandler('replace_bg_wood')!
    const prompt = handler.buildPrompt({ imageBase64: '', imageMimeType: 'image/png' })
    expect(prompt.toLowerCase()).toContain('wood')
  })

  it('all handlers have valid config', () => {
    for (const action of ALL_ACTIONS) {
      const handler = getActionHandler(action)!
      expect(handler.config.temperature).toBeGreaterThan(0)
      expect(handler.config.temperature).toBeLessThanOrEqual(1)
      expect(handler.config.maxOutputTokens).toBeGreaterThan(0)
    }
  })
})
