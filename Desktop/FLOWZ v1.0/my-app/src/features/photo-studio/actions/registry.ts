import type { ActionHandler, StudioActionType } from './types'
import { removeBgHandler } from './remove-bg'
import { createEnhanceHandler } from './enhance'
import { createReplaceBgHandler } from './replace-bg'
import { generateAnglesHandler } from './generate-angles'
import { generateSceneHandler } from './generate-scene'
import { harmonizeHandler } from './harmonize'
import { magicEditHandler } from './magic-edit'

// ============================================================================
// ACTION REGISTRY — maps every StudioActionType to its handler
// ============================================================================

const ACTION_REGISTRY: Record<StudioActionType, ActionHandler> = {
  // Dedicated handlers
  remove_bg: removeBgHandler,
  enhance: createEnhanceHandler('enhance'),
  enhance_light: createEnhanceHandler('enhance_light'),
  enhance_color: createEnhanceHandler('enhance_color'),
  replace_bg: createReplaceBgHandler('replace_bg'),
  replace_bg_white: createReplaceBgHandler('replace_bg_white'),
  replace_bg_studio: createReplaceBgHandler('replace_bg_studio'),
  replace_bg_marble: createReplaceBgHandler('replace_bg_marble'),
  replace_bg_wood: createReplaceBgHandler('replace_bg_wood'),
  generate_angles: generateAnglesHandler,
  generate_scene: generateSceneHandler,
  harmonize: harmonizeHandler,
  magic_edit: magicEditHandler,
}

/**
 * Get the handler for a given action type.
 * Returns undefined if the action is not registered.
 */
export function getActionHandler(
  action: StudioActionType
): ActionHandler | undefined {
  return ACTION_REGISTRY[action]
}

/**
 * Type-guard: check if a string is a valid StudioActionType.
 */
export function isValidAction(action: string): action is StudioActionType {
  return action in ACTION_REGISTRY
}
