/**
 * Prompt Block Constants
 *
 * Pre-defined prompt blocks for the 4 dimensions of the prompt builder.
 * Each block contains a user-facing label, a short prompt fragment,
 * and a detailed technical prompt for professional-grade generation.
 */

import type { PromptBlock, PromptDimension } from '../types/studio'

// ─── Lighting ───────────────────────────────────────────────

export const LIGHTING_BLOCKS: PromptBlock[] = [
  {
    id: 'studio-pro',
    dimension: 'lighting',
    label: 'Studio Pro',
    promptFragment: 'professional studio lighting',
    technicalPrompt:
      'Three-point lighting setup with key light at 45 degrees, fill light at half intensity opposite side, and rim light from behind. Soft diffused shadows, even exposure across the product surface. Color temperature 5500K daylight balanced.',
  },
  {
    id: 'warm',
    dimension: 'lighting',
    label: 'Lumière chaude',
    promptFragment: 'warm golden lighting',
    technicalPrompt:
      'Warm tungsten lighting at 3200K color temperature. Soft golden glow with gentle shadow falloff. Single large softbox at 60 degrees creating inviting atmosphere. Subtle warm reflections on product surfaces.',
  },
  {
    id: 'natural',
    dimension: 'lighting',
    label: 'Lumière naturelle',
    promptFragment: 'natural window lighting',
    technicalPrompt:
      'Soft natural window light from the side, simulating overcast daylight at 6500K. Gentle directional shadows with bright highlight areas. No artificial color cast. Clean, authentic feel with soft gradients.',
  },
  {
    id: 'dramatic',
    dimension: 'lighting',
    label: 'Dramatique',
    promptFragment: 'dramatic contrast lighting',
    technicalPrompt:
      'High-contrast Rembrandt lighting with single hard key light at steep angle. Deep shadows with sharp falloff. Strong specular highlights on edges. Moody, editorial feel with controlled light spill.',
  },
  {
    id: 'neon',
    dimension: 'lighting',
    label: 'Néon',
    promptFragment: 'neon colored lighting',
    technicalPrompt:
      'Vibrant colored gel lighting with cyan and magenta accents. Multiple point lights creating colorful reflections on product surfaces. Dark background with neon rim lighting. Contemporary, bold aesthetic.',
  },
]

// ─── Angle ──────────────────────────────────────────────────

export const ANGLE_BLOCKS: PromptBlock[] = [
  {
    id: 'face',
    dimension: 'angle',
    label: 'Face',
    promptFragment: 'front facing view',
    technicalPrompt:
      'Straight-on frontal view at eye level. Camera perpendicular to the product face. Symmetrical composition centered in frame. Clean, catalog-style presentation.',
  },
  {
    id: '3-4',
    dimension: 'angle',
    label: 'Trois-quarts',
    promptFragment: 'three-quarter angle view',
    technicalPrompt:
      'Three-quarter angle at approximately 45 degrees from front. Slightly elevated camera position showing depth and dimension. Product positioned off-center following rule of thirds.',
  },
  {
    id: 'plongee',
    dimension: 'angle',
    label: 'Plongée',
    promptFragment: 'top-down overhead view',
    technicalPrompt:
      'High-angle top-down shot at 60-90 degrees looking down. Flat-lay composition style. Even lighting to minimize perspective distortion. Product centered with generous negative space around.',
  },
  {
    id: 'macro',
    dimension: 'angle',
    label: 'Macro',
    promptFragment: 'close-up macro detail',
    technicalPrompt:
      'Extreme close-up macro shot focusing on texture and material details. Shallow depth of field with bokeh background. Sharp focus on key detail area. Reveals craftsmanship and material quality.',
  },
  {
    id: 'wide',
    dimension: 'angle',
    label: 'Grand angle',
    promptFragment: 'wide angle environmental',
    technicalPrompt:
      'Wide-angle environmental shot showing the product in context with surrounding space. Lower camera position for dramatic perspective. Product as hero element within a broader scene composition.',
  },
  {
    id: 'contre-plongee',
    dimension: 'angle',
    label: 'Contre-plongée',
    promptFragment: 'low angle looking up',
    technicalPrompt:
      'Low-angle shot looking upward at the product. Camera positioned below product level. Creates imposing, powerful impression. Emphasizes height and stature of the product.',
  },
]

// ─── Ambiance ───────────────────────────────────────────────

export const AMBIANCE_BLOCKS: PromptBlock[] = [
  {
    id: 'premium',
    dimension: 'ambiance',
    label: 'Premium',
    promptFragment: 'premium luxury ambiance',
    technicalPrompt:
      'High-end luxury atmosphere with rich, deep tones. Sophisticated color palette with dark accents. Premium materials visible in environment (marble, velvet, gold). Editorial fashion magazine aesthetic.',
  },
  {
    id: 'minimal',
    dimension: 'ambiance',
    label: 'Minimaliste',
    promptFragment: 'clean minimal atmosphere',
    technicalPrompt:
      'Ultra-clean minimalist environment with maximum negative space. Neutral white or light gray backdrop. No distracting elements. Focus entirely on product form and silhouette. Scandinavian design influence.',
  },
  {
    id: 'luxe',
    dimension: 'ambiance',
    label: 'Luxe doré',
    promptFragment: 'golden luxury setting',
    technicalPrompt:
      'Opulent golden atmosphere with warm metallic accents. Rich textures like silk, satin, or brushed gold surfaces. Warm ambient glow. Jewelry-store display aesthetic with premium reflective elements.',
  },
  {
    id: 'warm-cozy',
    dimension: 'ambiance',
    label: 'Chaleureux',
    promptFragment: 'warm cozy atmosphere',
    technicalPrompt:
      'Warm, inviting domestic atmosphere with soft textures. Natural materials like wood, wool, and ceramics in scene. Warm color temperature. Lifestyle feel suggesting comfort and home. Hygge-inspired aesthetic.',
  },
  {
    id: 'clean',
    dimension: 'ambiance',
    label: 'Clean & Fresh',
    promptFragment: 'clean fresh modern feel',
    technicalPrompt:
      'Bright, airy, contemporary atmosphere. White and pastel color palette. Clean geometric shapes in environment. Fresh, modern retail aesthetic. Crisp edges and bright even lighting throughout.',
  },
  {
    id: 'industrial',
    dimension: 'ambiance',
    label: 'Industriel',
    promptFragment: 'industrial raw atmosphere',
    technicalPrompt:
      'Raw industrial setting with exposed concrete, metal, and weathered textures. Muted desaturated color palette. Urban loft aesthetic. Contrast between rough environment and refined product. Directional hard lighting.',
  },
]

// ─── Surface ────────────────────────────────────────────────

export const SURFACE_BLOCKS: PromptBlock[] = [
  {
    id: 'marble-white',
    dimension: 'surface',
    label: 'Marbre blanc',
    promptFragment: 'white marble surface',
    technicalPrompt:
      'Polished white Carrara marble surface with subtle gray veining. Smooth reflective finish creating soft product reflections. Clean, luxurious base surface. Neutral cool-toned backdrop.',
  },
  {
    id: 'wood-natural',
    dimension: 'surface',
    label: 'Bois naturel',
    promptFragment: 'natural wood surface',
    technicalPrompt:
      'Light natural oak wood surface with visible grain pattern. Matte finish with warm undertones. Organic, artisanal feel. Subtle texture providing visual interest without competing with product.',
  },
  {
    id: 'concrete',
    dimension: 'surface',
    label: 'Béton',
    promptFragment: 'concrete surface',
    technicalPrompt:
      'Smooth polished concrete surface in medium gray. Subtle texture variations and micro-imperfections for authenticity. Industrial modern base. Neutral backdrop that works with any product color.',
  },
  {
    id: 'linen',
    dimension: 'surface',
    label: 'Lin',
    promptFragment: 'linen fabric surface',
    technicalPrompt:
      'Natural linen fabric surface with visible weave texture. Off-white to cream color with gentle fabric folds. Soft, organic base creating warmth. Artisanal, handcrafted aesthetic.',
  },
  {
    id: 'metal-brushed',
    dimension: 'surface',
    label: 'Métal brossé',
    promptFragment: 'brushed metal surface',
    technicalPrompt:
      'Brushed stainless steel surface with directional grain pattern. Cool metallic reflections. High-tech, contemporary base. Creates subtle elongated highlights under the product.',
  },
]

// ─── Aggregated Exports ─────────────────────────────────────

export const ALL_PROMPT_BLOCKS: Record<PromptDimension, PromptBlock[]> = {
  lighting: LIGHTING_BLOCKS,
  angle: ANGLE_BLOCKS,
  ambiance: AMBIANCE_BLOCKS,
  surface: SURFACE_BLOCKS,
}

export const PROMPT_DIMENSION_LABELS: Record<PromptDimension, string> = {
  lighting: 'Éclairage',
  angle: 'Angle de vue',
  ambiance: 'Ambiance',
  surface: 'Surface',
}

export const PROMPT_DIMENSION_ICONS: Record<PromptDimension, string> = {
  lighting: 'Sun',
  angle: 'RotateCcw',
  ambiance: 'Palette',
  surface: 'Layers',
}
