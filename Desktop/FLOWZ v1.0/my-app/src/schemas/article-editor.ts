/**
 * Article Editor Schemas
 *
 * Zod schemas for the standalone article editor
 * Includes AI actions, sync options, and form validation
 */

import { z } from 'zod';

// ============================================================================
// AI EDITOR ACTIONS
// ============================================================================

/**
 * Actions IA globales (sur tout l'article)
 */
export const aiGlobalActionSchema = z.enum([
  'improve_style',    // Améliorer le style
  'simplify',         // Simplifier
  'expand',           // Développer
  'correct',          // Corriger ortho/grammaire
  'change_tone',      // Changer le ton
  'translate',        // Traduire
]);

/**
 * Actions IA contextuelles (sur sélection)
 */
export const aiSelectionActionSchema = z.enum([
  'rewrite',          // Réécrire
  'expand_selection', // Étendre
  'shorten',          // Raccourcir
  'clarify',          // Clarifier
  'add_examples',     // Ajouter exemples
  'to_list',          // Transformer en liste
  'to_paragraph',     // Transformer en paragraphe
]);

/**
 * Actions de génération
 */
export const aiGenerateActionSchema = z.enum([
  'generate_intro',           // Générer introduction
  'generate_conclusion',      // Générer conclusion
  'generate_cta',             // Générer CTA
  'suggest_titles',           // Suggérer titres
  'generate_meta_description',// Générer méta description
  'generate_excerpt',         // Générer extrait
]);

/**
 * Toutes les actions IA
 */
export const aiEditorActionSchema = z.enum([
  // Global
  'improve_style',
  'simplify',
  'expand',
  'correct',
  'change_tone',
  'translate',
  // Selection
  'rewrite',
  'expand_selection',
  'shorten',
  'clarify',
  'add_examples',
  'to_list',
  'to_paragraph',
  // Generate
  'generate_intro',
  'generate_conclusion',
  'generate_cta',
  'suggest_titles',
  'generate_meta_description',
  'generate_excerpt',
]);

// ============================================================================
// OPTIONS
// ============================================================================

/**
 * Tons disponibles pour l'IA
 */
export const editorToneSchema = z.enum([
  'professional',  // Professionnel
  'casual',        // Décontracté
  'persuasive',    // Persuasif
  'informative',   // Informatif
  'friendly',      // Amical
  'formal',        // Formel
]);

/**
 * Langues supportées
 */
export const editorLanguageSchema = z.enum(['fr', 'en', 'es', 'de']);

/**
 * Plateformes de publication
 */
export const publishPlatformSchema = z.enum([
  'flowz',        // Blog local FLOWZ
  'woocommerce',  // WooCommerce
  'wordpress',    // WordPress.com
]);

/**
 * Statuts d'article
 */
export const articleEditorStatusSchema = z.enum([
  'draft',      // Brouillon
  'scheduled',  // Planifié
  'published',  // Publié
  'archived',   // Archivé
]);

/**
 * Statuts de synchronisation
 */
export const syncStatusSchema = z.enum([
  'draft',    // Non synchronisé
  'pending',  // En attente (planifié)
  'syncing',  // Synchronisation en cours
  'synced',   // Synchronisé
  'failed',   // Échec
  'partial',  // Partiellement synchronisé
]);

// ============================================================================
// AI ACTION REQUEST
// ============================================================================

/**
 * Sélection de texte dans l'éditeur
 */
export const textSelectionSchema = z.object({
  from: z.number().min(0),
  to: z.number().min(0),
  text: z.string(),
});

/**
 * Options pour une action IA
 */
export const aiActionOptionsSchema = z.object({
  tone: editorToneSchema.optional(),
  language: editorLanguageSchema.optional(),
  targetLength: z.enum(['shorter', 'same', 'longer']).optional(),
});

/**
 * Requête d'action IA
 */
export const aiActionRequestSchema = z.object({
  action: aiEditorActionSchema,
  content: z.string().min(1, 'Contenu requis').max(50000, 'Contenu trop long'),
  selection: textSelectionSchema.optional(),
  options: aiActionOptionsSchema.optional(),
});

/**
 * Résultat d'une action IA
 */
export const aiActionResultSchema = z.object({
  success: z.boolean(),
  result: z.string().optional(),
  error: z.string().optional(),
  action: aiEditorActionSchema,
  originalContent: z.string(),
  timestamp: z.string().datetime(),
});

// ============================================================================
// PUBLISH OPTIONS
// ============================================================================

/**
 * Options de publication
 */
export const publishOptionsSchema = z.object({
  mode: z.enum(['now', 'scheduled', 'draft']),
  scheduledAt: z.string().datetime().optional().nullable(),
  timezone: z.string().default('Europe/Paris'),
  platforms: z.array(publishPlatformSchema).min(1, 'Sélectionnez au moins une plateforme'),
  notifySubscribers: z.boolean().default(false),
  autoShareSocial: z.boolean().default(false),
}).refine(
  (data) => {
    // Si mode = scheduled, scheduledAt est requis
    if (data.mode === 'scheduled' && !data.scheduledAt) {
      return false;
    }
    return true;
  },
  { message: 'Date de publication requise pour la planification', path: ['scheduledAt'] }
).refine(
  (data) => {
    // Si scheduledAt est défini, doit être dans le futur (minimum 5 min)
    if (data.scheduledAt) {
      const scheduledDate = new Date(data.scheduledAt);
      const minDate = new Date(Date.now() + 5 * 60 * 1000); // +5 minutes
      return scheduledDate > minDate;
    }
    return true;
  },
  { message: 'La date doit être au minimum 5 minutes dans le futur', path: ['scheduledAt'] }
);

// ============================================================================
// ARTICLE FORM
// ============================================================================

/**
 * Format d'article WordPress
 */
export const articleFormatSchema = z.enum([
  'standard',
  'aside',
  'gallery',
  'link',
  'image',
  'quote',
  'status',
  'video',
  'audio',
  'chat',
]);

/**
 * Formulaire d'article complet
 */
export const articleFormSchema = z.object({
  // === CONTENU ===
  title: z.string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne doit pas dépasser 200 caractères'),

  slug: z.string()
    .min(1, 'Le slug est requis')
    .max(200, 'Le slug ne doit pas dépasser 200 caractères')
    .regex(/^[a-z0-9-]+$/, 'Le slug ne doit contenir que des lettres minuscules, chiffres et tirets'),

  content: z.string()
    .min(1, 'Le contenu est requis'),

  excerpt: z.string()
    .max(300, 'L\'extrait ne doit pas dépasser 300 caractères')
    .optional()
    .nullable(),

  // === MÉDIAS ===
  featured_image_url: z.string()
    .url('URL invalide')
    .optional()
    .nullable()
    .or(z.literal('')),

  featured_image_alt: z.string()
    .max(200, 'Le texte alternatif ne doit pas dépasser 200 caractères')
    .optional()
    .nullable(),

  // === ORGANISATION ===
  category: z.string().optional().nullable(),

  tags: z.array(z.string()).default([]),

  // === SEO ===
  seo_title: z.string()
    .max(70, 'Le titre SEO ne doit pas dépasser 70 caractères')
    .optional()
    .nullable(),

  seo_description: z.string()
    .max(160, 'La description SEO ne doit pas dépasser 160 caractères')
    .optional()
    .nullable(),

  seo_og_image: z.string()
    .url('URL invalide')
    .optional()
    .nullable()
    .or(z.literal('')),

  seo_canonical_url: z.string()
    .url('URL invalide')
    .optional()
    .nullable()
    .or(z.literal('')),

  no_index: z.boolean().default(false),

  // === PUBLICATION ===
  status: articleEditorStatusSchema.default('draft'),

  author_id: z.string().uuid().optional().nullable(),

  publish_mode: z.enum(['now', 'scheduled', 'draft']).default('draft'),

  scheduled_at: z.string().datetime().optional().nullable(),

  platforms: z.array(publishPlatformSchema).default(['flowz']),

  // === PARAMÈTRES WORDPRESS (from sync) ===
  comment_status: z.enum(['open', 'closed']).optional().default('open'),
  ping_status: z.enum(['open', 'closed']).optional().default('closed'),
  sticky: z.boolean().optional().default(false),
  format: articleFormatSchema.optional().default('standard'),
  template: z.string().optional().default(''),

  // === DONNÉES DE SYNC (readonly) ===
  platform_post_id: z.string().optional().nullable(), // WordPress post ID
  link: z.string().url().optional().nullable(), // Full URL on WordPress

  // === AUTEUR WORDPRESS ===
  wp_author_id: z.number().optional().nullable(),
  wp_author_name: z.string().optional().nullable(),
});

/**
 * Formulaire d'article pour la création
 */
export const createArticleSchema = articleFormSchema.omit({
  status: true,
  scheduled_at: true,
}).extend({
  status: articleEditorStatusSchema.default('draft'),
});

/**
 * Formulaire d'article pour la mise à jour
 */
export const updateArticleSchema = articleFormSchema.partial();

// ============================================================================
// WOOCOMMERCE PUBLISH OPTIONS
// ============================================================================

/**
 * Options de publication vers WooCommerce
 */
export const wcPublishOptionsSchema = z.object({
  status: z.enum(['draft', 'publish', 'pending']).default('draft'),
  categoryIds: z.array(z.number()).default([]),
  tagIds: z.array(z.number()).default([]),
  featuredImageUrl: z.string().url().optional().nullable(),
});

export type WCPublishOptionsForm = z.infer<typeof wcPublishOptionsSchema>;

// ============================================================================
// SYNC LOG
// ============================================================================

/**
 * Log de synchronisation
 */
export const syncLogSchema = z.object({
  id: z.string().uuid(),
  article_id: z.string().uuid(),
  platform: publishPlatformSchema,
  status: syncStatusSchema,
  external_id: z.string().optional().nullable(),
  external_url: z.string().url().optional().nullable(),
  error_message: z.string().optional().nullable(),
  synced_at: z.string().datetime().optional().nullable(),
  created_at: z.string().datetime(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AIGlobalAction = z.infer<typeof aiGlobalActionSchema>;
export type AISelectionAction = z.infer<typeof aiSelectionActionSchema>;
export type AIGenerateAction = z.infer<typeof aiGenerateActionSchema>;
export type AIEditorAction = z.infer<typeof aiEditorActionSchema>;
export type EditorTone = z.infer<typeof editorToneSchema>;
export type EditorLanguage = z.infer<typeof editorLanguageSchema>;
export type PublishPlatform = z.infer<typeof publishPlatformSchema>;
export type ArticleEditorStatus = z.infer<typeof articleEditorStatusSchema>;
export type SyncStatus = z.infer<typeof syncStatusSchema>;
export type TextSelection = z.infer<typeof textSelectionSchema>;
export type AIActionOptions = z.infer<typeof aiActionOptionsSchema>;
export type AIActionRequest = z.infer<typeof aiActionRequestSchema>;
export type AIActionResult = z.infer<typeof aiActionResultSchema>;
export type PublishOptions = z.infer<typeof publishOptionsSchema>;
export type ArticleForm = z.infer<typeof articleFormSchema>;
export type ArticleFormat = z.infer<typeof articleFormatSchema>;
export type CreateArticle = z.infer<typeof createArticleSchema>;
export type UpdateArticle = z.infer<typeof updateArticleSchema>;
export type SyncLog = z.infer<typeof syncLogSchema>;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Génère un slug à partir d'un titre
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/-+/g, '-') // Replace multiple - with single -
    .replace(/^-|-$/g, ''); // Remove leading/trailing -
}

/**
 * Labels français pour les actions IA
 */
export const AI_ACTION_LABELS: Record<AIEditorAction, string> = {
  // Global
  improve_style: 'Améliorer le style',
  simplify: 'Simplifier',
  expand: 'Développer',
  correct: 'Corriger',
  change_tone: 'Changer le ton',
  translate: 'Traduire',
  // Selection
  rewrite: 'Réécrire',
  expand_selection: 'Étendre',
  shorten: 'Raccourcir',
  clarify: 'Clarifier',
  add_examples: 'Ajouter exemples',
  to_list: 'En liste',
  to_paragraph: 'En paragraphe',
  // Generate
  generate_intro: 'Générer introduction',
  generate_conclusion: 'Générer conclusion',
  generate_cta: 'Générer CTA',
  suggest_titles: 'Suggérer titres',
  generate_meta_description: 'Générer méta description',
  generate_excerpt: 'Générer extrait',
};

/**
 * Labels français pour les tons
 */
export const TONE_LABELS: Record<EditorTone, string> = {
  professional: 'Professionnel',
  casual: 'Décontracté',
  persuasive: 'Persuasif',
  informative: 'Informatif',
  friendly: 'Amical',
  formal: 'Formel',
};

/**
 * Labels français pour les plateformes
 */
export const PLATFORM_LABELS: Record<PublishPlatform, string> = {
  flowz: 'FLOWZ Blog',
  woocommerce: 'WooCommerce',
  wordpress: 'WordPress',
};

/**
 * Labels français pour les statuts de sync
 */
export const SYNC_STATUS_LABELS: Record<SyncStatus, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  syncing: 'Synchronisation...',
  synced: 'Synchronisé',
  failed: 'Échec',
  partial: 'Partiel',
};
