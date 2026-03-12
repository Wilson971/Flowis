import { describe, it, expect } from 'vitest'
import { editorReducer, initialEditorState } from '@/features/photo-studio/components/editor/editorReducer'

describe('editorReducer', () => {
  it('sets active image and original', () => {
    const state = editorReducer(initialEditorState, {
      type: 'SET_IMAGE',
      payload: { active: 'http://img.jpg', original: 'http://img.jpg' },
    })
    expect(state.activeImage).toBe('http://img.jpg')
    expect(state.originalImage).toBe('http://img.jpg')
  })

  it('sets image with separate original', () => {
    const state = editorReducer(initialEditorState, {
      type: 'SET_IMAGE',
      payload: { active: 'http://new.jpg', original: 'http://orig.jpg' },
    })
    expect(state.activeImage).toBe('http://new.jpg')
    expect(state.originalImage).toBe('http://orig.jpg')
  })

  it('sets active image only via SET_ACTIVE_IMAGE', () => {
    const state = editorReducer(initialEditorState, {
      type: 'SET_ACTIVE_IMAGE',
      payload: 'http://replaced.jpg',
    })
    expect(state.activeImage).toBe('http://replaced.jpg')
    expect(state.originalImage).toBe('') // unchanged
  })

  it('toggles active tool', () => {
    let state = editorReducer(initialEditorState, { type: 'SET_TOOL', payload: 'crop' })
    expect(state.activeTool).toBe('crop')
    state = editorReducer(state, { type: 'SET_TOOL', payload: null })
    expect(state.activeTool).toBeNull()
  })

  it('updates adjustments partially', () => {
    const state = editorReducer(initialEditorState, {
      type: 'SET_ADJUSTMENTS',
      payload: { brightness: 150 },
    })
    expect(state.adjustments.brightness).toBe(150)
    expect(state.adjustments.contrast).toBe(100) // unchanged
  })

  it('resets adjustments to defaults', () => {
    const modified = editorReducer(initialEditorState, {
      type: 'SET_ADJUSTMENTS',
      payload: { brightness: 50, contrast: 200 },
    })
    const state = editorReducer(modified, { type: 'RESET_ADJUSTMENTS' })
    expect(state.adjustments).toEqual(initialEditorState.adjustments)
  })

  it('adds and removes annotations', () => {
    const annotation = {
      id: '1',
      type: 'text' as const,
      points: [{ x: 0, y: 0 }],
      color: '#ff0000',
      label: 'test',
    }
    let state = editorReducer(initialEditorState, { type: 'ADD_ANNOTATION', payload: annotation })
    expect(state.annotations).toHaveLength(1)
    expect(state.annotations[0].label).toBe('test')
    state = editorReducer(state, { type: 'REMOVE_ANNOTATION', payload: '1' })
    expect(state.annotations).toHaveLength(0)
  })

  it('sets action and preset', () => {
    let state = editorReducer(initialEditorState, { type: 'SET_ACTION', payload: 'remove_bg' })
    expect(state.selectedAction).toBe('remove_bg')
    state = editorReducer(state, { type: 'SET_PRESET', payload: { name: 'marble' } })
    expect(state.selectedPreset).toEqual({ name: 'marble' })
  })

  it('sets validation status', () => {
    const state = editorReducer(initialEditorState, {
      type: 'SET_VALIDATION_STATUS',
      payload: 'approved',
    })
    expect(state.validationStatus).toBe('approved')
  })

  it('sets generating flag', () => {
    const state = editorReducer(initialEditorState, {
      type: 'SET_GENERATING',
      payload: true,
    })
    expect(state.isGenerating).toBe(true)
  })

  it('sets zoom', () => {
    const state = editorReducer(initialEditorState, { type: 'SET_ZOOM', payload: 2.5 })
    expect(state.zoom).toBe(2.5)
  })

  it('sets user instruction', () => {
    const state = editorReducer(initialEditorState, {
      type: 'SET_INSTRUCTION',
      payload: 'make it brighter',
    })
    expect(state.userInstruction).toBe('make it brighter')
  })

  it('returns same state for unknown action', () => {
    const state = editorReducer(initialEditorState, { type: 'UNKNOWN' } as any)
    expect(state).toBe(initialEditorState)
  })
})
