import {
  QUALITY_CONFIG,
  ASPECT_RATIO_CONFIG,
  VIEW_ANGLE_PROMPTS,
  mapCreativityToTemperature,
  type GenerationQuality,
  type AspectRatio,
  type ViewAngle,
} from '../types/studio';
import type { BrandStyle } from '../types/studio';
import type { SceneMood } from '../constants/productTaxonomy';

// Color name mapping for hex to human readable
const COLOR_NAME_MAP: Record<string, string> = {
  '#FF0000': 'red', '#ff0000': 'red',
  '#00FF00': 'green', '#00ff00': 'green',
  '#0000FF': 'blue', '#0000ff': 'blue',
  '#FFFFFF': 'white', '#ffffff': 'white',
  '#000000': 'black',
  '#FFD700': 'gold', '#ffd700': 'gold',
  '#C0C0C0': 'silver', '#c0c0c0': 'silver',
  '#FFA500': 'orange', '#ffa500': 'orange',
  '#800080': 'purple',
  '#FFC0CB': 'pink', '#ffc0cb': 'pink',
  '#A52A2A': 'brown', '#a52a2a': 'brown',
  '#808080': 'gray',
  '#F5F5DC': 'beige', '#f5f5dc': 'beige',
  '#000080': 'navy',
  '#008080': 'teal',
  '#FF6347': 'coral', '#ff6347': 'coral',
  '#4B0082': 'indigo', '#4b0082': 'indigo',
  '#00FFFF': 'cyan', '#00ffff': 'cyan',
  '#FF00FF': 'magenta', '#ff00ff': 'magenta',
  '#00FF00': 'lime', '#00ff00': 'lime',
  '#40E0D0': 'turquoise', '#40e0d0': 'turquoise',
  '#800020': 'burgundy',
  '#808000': 'olive',
  '#36454F': 'charcoal', '#36454f': 'charcoal',
  '#FFFFF0': 'ivory', '#fffff0': 'ivory',
  '#E6E6FA': 'lavender', '#e6e6fa': 'lavender',
  '#CD853F': 'peru', '#cd853f': 'peru',
  '#D2691E': 'chocolate', '#d2691e': 'chocolate',
  '#708090': 'slate gray',
  '#2F4F4F': 'dark slate', '#2f4f4f': 'dark slate',
  '#B8860B': 'dark goldenrod', '#b8860b': 'dark goldenrod',
};

/**
 * Convert hex color to human-readable color name
 * Falls back to hex if no match found
 */
export function hexToColorName(hex: string): string {
  const normalized = hex.toLowerCase();
  return COLOR_NAME_MAP[normalized] || `color ${hex}`;
}

/**
 * Build brand style modifiers for the prompt
 */
export function buildBrandStyleModifiers(brandStyle: BrandStyle): string {
  const parts: string[] = [];

  if (brandStyle.brand_colors && brandStyle.brand_colors.length > 0) {
    const colorNames = brandStyle.brand_colors.map(hexToColorName);
    parts.push(`Incorporate the brand colors: ${colorNames.join(', ')}`);
  }

  if (brandStyle.prompt_modifier) {
    parts.push(brandStyle.prompt_modifier);
  }

  return parts.join('. ');
}

// ══════════════════════════════════════════════════════════════════════════════
// PHOTOGRAPHY TECHNIQUE BLOCKS
// ══════════════════════════════════════════════════════════════════════════════

const PHOTOGRAPHY_BLOCKS: Record<GenerationQuality, string> = {
  standard:
    'Professional product photography, studio lighting, sharp focus.',
  high:
    'Professional product photography with three-point lighting setup (key light at 45°, fill light, rim light). Shot with 85mm lens at f/5.6 for sharp product detail. 5600K daylight balanced. Clean specular highlights on reflective surfaces.',
  ultra:
    'Award-winning commercial product photography. Three-point lighting: soft key light through 4ft diffusion panel at 45°, subtle fill at -30° (2:1 ratio), hair/rim light from behind at 160°. Shot with Phase One 100MP, 120mm Macro lens at f/8, focus-stacked for edge-to-edge sharpness. 5600K daylight balanced, RAW processed. Precise specular highlight management, controlled shadow density, fabric texture at micro level. Film-like color grading with lifted shadows and controlled highlight rolloff.',
};

/**
 * Build photography-specific technical instructions based on quality level.
 * Returns an empty string for 'standard' quality (handled by the basic quality modifier).
 */
export function buildPhotographyBlock(quality: GenerationQuality): string {
  if (quality === 'standard') return '';
  return PHOTOGRAPHY_BLOCKS[quality];
}

// ══════════════════════════════════════════════════════════════════════════════
// MATERIAL-SPECIFIC RENDERING HINTS
// ══════════════════════════════════════════════════════════════════════════════

const MATERIAL_HINTS_MAP: Record<string, string> = {
  professional:
    'Preserve specular highlights on metallic surfaces, subsurface scattering on organic materials, precise fabric texture rendering.',
  luxury:
    'Preserve specular highlights on metallic surfaces, subsurface scattering on organic materials, precise fabric texture rendering.',
  lifestyle:
    'Natural material rendering, soft diffuse lighting on fabrics, gentle shadow gradients.',
  natural:
    'Natural material rendering, soft diffuse lighting on fabrics, gentle shadow gradients.',
  artistic:
    'Dramatic specular highlights, deep shadow contrast, controlled reflection management.',
  dramatic:
    'Dramatic specular highlights, deep shadow contrast, controlled reflection management.',
};

const DEFAULT_MATERIAL_HINT = 'Accurate material and texture representation.';

/**
 * Get material-specific rendering hints based on the preset mood.
 */
export function getMaterialHints(presetMood?: SceneMood | string): string {
  if (!presetMood) return DEFAULT_MATERIAL_HINT;
  return MATERIAL_HINTS_MAP[presetMood] ?? DEFAULT_MATERIAL_HINT;
}

// ══════════════════════════════════════════════════════════════════════════════
// PROMPT BUILDER
// ══════════════════════════════════════════════════════════════════════════════

interface BuildPromptOptions {
  presetPromptModifier?: string;
  presetMood?: SceneMood | string;
  customPrompt?: string;
  productName?: string;
  quality: GenerationQuality;
  aspectRatio: AspectRatio;
  viewAngle?: ViewAngle;
  brandStyle?: BrandStyle | null;
  creativity: number;
}

/**
 * Build the enhanced prompt for Gemini image generation
 * Combines: preset + quality + ratio + angle + brand + custom prompt
 */
export function buildEnhancedPrompt(options: BuildPromptOptions): string {
  const parts: string[] = [];

  // Base instruction
  parts.push('Edit the product in this image to create a professional e-commerce photograph.');

  // Product name context
  if (options.productName) {
    parts.push(`The product is: ${options.productName}.`);
  }

  // Scene preset modifier
  if (options.presetPromptModifier) {
    parts.push(`Scene: ${options.presetPromptModifier}`);
  }

  // Quality modifier
  const qualityConfig = QUALITY_CONFIG[options.quality];
  if (qualityConfig) {
    parts.push(qualityConfig.promptModifier);
  }

  // Photography technique block (high & ultra only)
  if (options.quality === 'high' || options.quality === 'ultra') {
    const photoBlock = buildPhotographyBlock(options.quality);
    if (photoBlock) {
      parts.push(photoBlock);
    }

    // Material-specific rendering hints
    const materialHints = getMaterialHints(options.presetMood);
    parts.push(materialHints);
  }

  // Aspect ratio modifier
  const ratioConfig = ASPECT_RATIO_CONFIG[options.aspectRatio];
  if (ratioConfig) {
    parts.push(ratioConfig.promptModifier);
  }

  // View angle
  if (options.viewAngle && options.viewAngle !== 'front') {
    parts.push(VIEW_ANGLE_PROMPTS[options.viewAngle]);
  }

  // Brand style modifiers
  if (options.brandStyle) {
    const brandMod = buildBrandStyleModifiers(options.brandStyle);
    if (brandMod) {
      parts.push(brandMod);
    }
  }

  // Custom prompt (user-written)
  if (options.customPrompt && options.customPrompt.trim()) {
    parts.push(options.customPrompt.trim());
  }

  // Keep product intact instruction
  parts.push('Keep the product clearly visible and the main focus of the image. Do not alter the product itself, only change the background and environment.');

  return parts.join(' ');
}

/**
 * Get temperature from creativity level
 */
export function getTemperature(creativity: number): number {
  return mapCreativityToTemperature(creativity);
}
