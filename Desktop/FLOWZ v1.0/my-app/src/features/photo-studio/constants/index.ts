/**
 * Photo Studio Constants - Barrel Export
 */

// Product taxonomy types and data
export {
  type ProductCategory,
  type ProductMaterial,
  type ProductStyle,
  type TargetAudience,
  type SceneMood,
  type Seasonality,
  type ProductAnalysisResult,
  CATEGORY_RELATIONSHIPS,
  STYLE_MOOD_COMPATIBILITY,
  AUDIENCE_MOOD_COMPATIBILITY,
  CATEGORY_LABELS,
  MATERIAL_LABELS,
  STYLE_LABELS,
} from './productTaxonomy';

// Niche scene presets (smart system)
export {
  type ScenePreset,
  NICHE_SCENE_PRESETS,
  getPresetsBySceneCategory,
  getPresetsByMood,
  getPresetsForCategory,
  getPresetById as getSmartPresetById,
  searchPresets,
  SCENE_CATEGORY_LABELS,
  MOOD_LABELS,
} from './nicheScenePresets';

// Legacy + unified scene presets
export {
  SCENE_PRESETS,
  type SmartScenePreset,
  getPresetById,
  getPromptModifier,
  getAllPresets,
  TOTAL_PRESET_COUNT,
  LEGACY_CATEGORY_LABELS,
} from './scenePresets';

// View presets
export {
  VIEW_PRESETS,
  getViewPresetById,
  VIEW_ANGLE_LABELS,
} from './viewPresets';
