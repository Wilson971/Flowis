/**
 * Photo Studio Types
 *
 * Combined types for image generation parameters, studio state,
 * and component-level interfaces. Ported from ecocombo-sync and
 * adapted for the FLOWZ Next.js architecture.
 */

// ══════════════════════════════════════════════════════════════════════════════
// GENERATION QUALITY & PARAMETERS
// ══════════════════════════════════════════════════════════════════════════════

/** Niveaux de qualite */
export type GenerationQuality = 'standard' | 'high' | 'ultra';

/** Formats d'image (ratios) */
export type AspectRatio = '1:1' | '4:5' | '16:9' | '9:16' | '3:4';

/** Angles de vue disponibles */
export type ViewAngle =
  | 'front'
  | 'three_quarter_left'
  | 'three_quarter_right'
  | 'side_left'
  | 'side_right'
  | 'back'
  | 'top'
  | 'detail_texture'
  | 'detail_stitching'
  | 'in_context';

/** Preset d'angles de vue */
export type ViewPreset = {
  id: string;
  name: string;
  description: string;
  icon: string;
  angles: ViewAngle[];
  imagesCount: number;
};

/** Options de generation completes */
export type GenerationOptions = {
  quality: GenerationQuality;
  aspectRatio: AspectRatio;
  creativity: number; // 0-100
  viewPresetId: string;
  viewAngles: ViewAngle[];
};

// ══════════════════════════════════════════════════════════════════════════════
// GENERATION DEFAULTS & CONFIG
// ══════════════════════════════════════════════════════════════════════════════

/** Configuration par defaut */
export const DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
  quality: 'standard',
  aspectRatio: '1:1',
  creativity: 50,
  viewPresetId: 'single',
  viewAngles: ['front'],
};

/** Mapping qualite vers parametres */
export const QUALITY_CONFIG = {
  standard: {
    label: 'Standard',
    resolution: '512px',
    promptModifier: 'Generate a good quality product image',
  },
  high: {
    label: 'Haute qualit\u00e9',
    resolution: '1024px',
    promptModifier: 'Generate a high quality, detailed product image with sharp details',
  },
  ultra: {
    label: 'Ultra HD',
    resolution: '2048px',
    promptModifier: 'Generate an ultra high definition, professional quality product image with exceptional detail and clarity',
  },
} as const;

/** Mapping ratio vers dimensions et prompt */
export const ASPECT_RATIO_CONFIG = {
  '1:1': {
    label: 'Carr\u00e9',
    description: 'Instagram, catalogues',
    width: 1024,
    height: 1024,
    promptModifier: 'in a square 1:1 aspect ratio',
  },
  '4:5': {
    label: 'Portrait',
    description: 'Instagram Feed, Pinterest',
    width: 1024,
    height: 1280,
    promptModifier: 'in a 4:5 portrait aspect ratio',
  },
  '16:9': {
    label: 'Paysage',
    description: 'Banni\u00e8res web',
    width: 1920,
    height: 1080,
    promptModifier: 'in a 16:9 landscape aspect ratio',
  },
  '9:16': {
    label: 'Story',
    description: 'Instagram/TikTok Stories',
    width: 1080,
    height: 1920,
    promptModifier: 'in a 9:16 vertical story aspect ratio',
  },
  '3:4': {
    label: 'Produit',
    description: 'Fiches e-commerce',
    width: 1024,
    height: 1365,
    promptModifier: 'in a 3:4 product aspect ratio',
  },
} as const;

/** Mapping creativite vers temperature */
export const mapCreativityToTemperature = (creativity: number): number => {
  // 0% -> 0.2, 100% -> 1.0
  return 0.2 + (creativity / 100) * 0.8;
};

/** Mapping angle vers prompt */
export const VIEW_ANGLE_PROMPTS: Record<ViewAngle, string> = {
  front: 'front view, facing the camera directly',
  three_quarter_left: 'three-quarter view from the left side',
  three_quarter_right: 'three-quarter view from the right side',
  side_left: 'side profile view from the left',
  side_right: 'side profile view from the right',
  back: 'back view, showing the rear of the product',
  top: "top-down view, bird's eye perspective",
  detail_texture: 'close-up macro shot showing texture and material details',
  detail_stitching: 'close-up shot focusing on stitching and construction details',
  in_context: 'lifestyle shot showing the product in use or in context',
};

// ══════════════════════════════════════════════════════════════════════════════
// SCENE GENERATION STATE
// ══════════════════════════════════════════════════════════════════════════════

export type SceneGenerationState =
  | 'idle'
  | 'optimistic' // Feedback immediat (creation placeholder)
  | 'processing' // Envoi API / Attente
  | 'success'
  | 'error';

/** Sous-etats detailles pour informer l'utilisateur de l'etape precise */
export type ProcessingStep =
  | 'analyzing'  // Analyse du prompt / contexte
  | 'generating' // Appel IA (Gemini)
  | 'uploading'  // Upload Storage (pour les resultats)
  | 'finishing';  // Finalisation DB

export type ProcessFeedback = {
  currentState: SceneGenerationState;
  currentStep?: ProcessingStep;
  progress?: number; // 0-100 (optionnel)
  error?: string;
  placeholderId?: string; // ID pour l'Optimistic UI
};

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT TYPES
// ══════════════════════════════════════════════════════════════════════════════

export type StudioProduct = {
  id: string;
  name: string;
  images: Array<{ id: string; src: string; alt?: string }>;
  category?: string;
  store_id?: string;
};

export type SessionImage = {
  id: string;
  url: string;
  type: 'source' | 'generated';
  status: 'loading' | 'active' | 'published';
  createdAt: number;
  sessionId?: string;
};

export type SourceImageItem = {
  id: string;
  src: string;
  alt: string;
  isPrimary?: boolean;
};

export type GenerationSettings = {
  quality: GenerationQuality;
  aspectRatio: AspectRatio;
  viewPresetId: string;
  creativityLevel: number;
};

export type ScenePresetLegacy = {
  id: string;
  name: string;
  description: string;
  promptModifier: string;
  thumbnail: string;
  category: string;
};

export type StudioJobStatus = {
  id: string;
  product_id: string;
  action: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  input_urls: string[];
  output_urls: string[] | null;
  error_message: string | null;
  product_title?: string;
};

export type BatchAction = 'remove_bg' | 'replace_bg' | 'enhance' | 'generate_angles' | 'generate_scene';

export type BrandStyle = {
  id: string;
  user_id: string;
  name: string;
  brand_colors: string[];
  prompt_modifier: string | null;
  created_at: string;
  updated_at: string;
};
