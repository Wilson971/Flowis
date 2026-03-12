import { describe, it, expect } from 'vitest'

// Test the validation state machine rules
describe('Validation Workflow', () => {
  const VALID_TRANSITIONS: Record<string, string[]> = {
    draft: ['approved'],
    approved: ['published', 'draft'], // draft via revoke
    published: [], // terminal state
  }

  it('draft can transition to approved', () => {
    expect(VALID_TRANSITIONS.draft).toContain('approved')
  })

  it('approved can transition to published', () => {
    expect(VALID_TRANSITIONS.approved).toContain('published')
  })

  it('approved can be revoked to draft', () => {
    expect(VALID_TRANSITIONS.approved).toContain('draft')
  })

  it('published is terminal', () => {
    expect(VALID_TRANSITIONS.published).toHaveLength(0)
  })

  it('draft cannot directly become published', () => {
    expect(VALID_TRANSITIONS.draft).not.toContain('published')
  })

  it('all states are accounted for', () => {
    const states = Object.keys(VALID_TRANSITIONS)
    expect(states).toEqual(['draft', 'approved', 'published'])
  })

  it('no state can transition to itself', () => {
    for (const [state, targets] of Object.entries(VALID_TRANSITIONS)) {
      expect(targets).not.toContain(state)
    }
  })
})
