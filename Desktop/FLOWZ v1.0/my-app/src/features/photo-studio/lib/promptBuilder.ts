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

interface BuildPromptOptions {
  presetPromptModifier?: string;
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
