/**
 * Scene Presets - Legacy + New Smart System
 *
 * This file maintains backward compatibility while providing access to the new
 * Smart Scene Engine with 40+ niche-specific presets.
 *
 * @see nicheScenePresets.ts for the new intelligent scene system
 * @see productTaxonomy.ts for product classification types
 */

import type { ScenePresetLegacy } from '../types/studio';
import {
  NICHE_SCENE_PRESETS,
  getPresetById as getSmartPresetById,
  getPresetsForCategory,
  searchPresets,
  SCENE_CATEGORY_LABELS,
  MOOD_LABELS,
  type ScenePreset as SmartScenePreset,
} from './nicheScenePresets';

// ══════════════════════════════════════════════════════════════════════════════
// LEGACY PRESETS - Kept for backward compatibility
// ══════════════════════════════════════════════════════════════════════════════

/**
 * @deprecated Use NICHE_SCENE_PRESETS from nicheScenePresets.ts instead
 * These legacy presets are kept for backward compatibility with existing code
 */
export const SCENE_PRESETS: ScenePresetLegacy[] = [
  {
    id: 'studio-minimalist',
    name: 'Studio Minimalist (White BG)',
    description: 'Professional e-commerce look with soft shadows',
    promptModifier: 'on a seamless white infinity background, professional studio lighting, soft shadows, 4k product photography',
    thumbnail: 'https://picsum.photos/id/1060/200/200',
    category: 'studio',
  },
  {
    id: 'marble-countertop',
    name: 'Marble Countertop',
    description: 'Marble countertop with morning light',
    promptModifier: 'sitting on a white marble kitchen countertop, blurred modern kitchen background, morning sunlight coming from window, photorealistic',
    thumbnail: 'https://picsum.photos/id/1080/200/200',
    category: 'indoor',
  },
  {
    id: 'wooden-table',
    name: 'Wooden Table (Warm)',
    description: 'Warm wooden surface with natural lighting',
    promptModifier: 'on a warm wooden table, natural daylight, cozy atmosphere, lifestyle photography',
    thumbnail: 'https://picsum.photos/id/1018/200/200',
    category: 'indoor',
  },
  {
    id: 'nature-outdoor',
    name: 'Nature / Outdoor Sunlight',
    description: 'Outdoor natural vibe with sunlight',
    promptModifier: 'placed on a smooth grey rock in a forest, dappled sunlight, shallow depth of field, nature photography',
    thumbnail: 'https://picsum.photos/id/1018/200/200',
    category: 'outdoor',
  },
  {
    id: 'luxury-dark',
    name: 'Luxury / Dark Mode',
    description: 'Elegant dark mood with gold accents',
    promptModifier: 'on a dark black textured surface, dramatic rim lighting, elegant atmosphere, luxury product photography',
    thumbnail: 'https://picsum.photos/id/1048/200/200',
    category: 'studio',
  },
  {
    id: 'neon-cyberpunk',
    name: 'Neon / Cyberpunk',
    description: 'Futuristic neon aesthetic',
    promptModifier: 'in a cyberpunk environment with neon lights, dark background, vibrant colors, futuristic atmosphere',
    thumbnail: 'https://picsum.photos/id/114/200/200',
    category: 'creative',
  },
  {
    id: 'podium',
    name: 'Podium',
    description: 'Minimalist 3D geometric podium',
    promptModifier: 'on a pastel colored geometric podium, minimalist design, soft directional lighting, 3d render style',
    thumbnail: 'https://picsum.photos/id/114/200/200',
    category: 'creative',
  },
  {
    id: 'lifestyle-home',
    name: 'Lifestyle (Home Environment)',
    description: 'Product in a home setting',
    promptModifier: 'in a modern home environment, natural lighting, lifestyle photography, cozy and inviting atmosphere',
    thumbnail: 'https://picsum.photos/id/1080/200/200',
    category: 'indoor',
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// RE-EXPORTS FROM NEW SYSTEM
// ══════════════════════════════════════════════════════════════════════════════

// Re-export all smart scene presets for easy access
export {
  NICHE_SCENE_PRESETS,
  getSmartPresetById,
  getPresetsForCategory,
  searchPresets,
  SCENE_CATEGORY_LABELS,
  MOOD_LABELS,
};

export type { SmartScenePreset };

// ══════════════════════════════════════════════════════════════════════════════
// UNIFIED PRESET ACCESS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get a preset by ID from either legacy or new system
 * First checks new smart presets, falls back to legacy
 */
export const getPresetById = (id: string): ScenePresetLegacy | SmartScenePreset | undefined => {
  // First try new smart presets
  const smartPreset = getSmartPresetById(id);
  if (smartPreset) return smartPreset;

  // Fall back to legacy presets
  return SCENE_PRESETS.find(p => p.id === id);
};

/**
 * Get prompt modifier for a preset ID
 * Works with both legacy and new preset IDs
 */
export const getPromptModifier = (presetId: string): string | undefined => {
  const preset = getPresetById(presetId);
  return preset?.promptModifier;
};

/**
 * Get all available presets (merged legacy + new)
 * New presets take precedence if IDs conflict
 */
export const getAllPresets = (): (ScenePresetLegacy | SmartScenePreset)[] => {
  const newIds = new Set(NICHE_SCENE_PRESETS.map(p => p.id));

  // Include all new presets
  const allPresets: (ScenePresetLegacy | SmartScenePreset)[] = [...NICHE_SCENE_PRESETS];

  // Add legacy presets that don't exist in new system
  for (const legacyPreset of SCENE_PRESETS) {
    if (!newIds.has(legacyPreset.id)) {
      allPresets.push(legacyPreset);
    }
  }

  return allPresets;
};

/**
 * Total count of available presets
 */
export const TOTAL_PRESET_COUNT = NICHE_SCENE_PRESETS.length;

// ══════════════════════════════════════════════════════════════════════════════
// LEGACY CATEGORY LABELS (for backward compatibility)
// ══════════════════════════════════════════════════════════════════════════════

export const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  studio: 'Studio',
  indoor: 'Int\u00e9rieur',
  outdoor: 'Ext\u00e9rieur',
  creative: 'Cr\u00e9atif',
};
