/**
 * FloWriter v2.0 Validation Schemas
 *
 * Zod schemas for validating FloWriter data at runtime
 * Includes security validation for prompt injection prevention
 */

import { z } from 'zod';

// ============================================================================
// SECURITY PATTERNS (Prompt Injection Prevention)
// ============================================================================

const SUSPICIOUS_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/i,
  /disregard\s+(all\s+)?(previous|above|prior)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /pretend\s+(to\s+be|you\'?re)\s+/i,
  /new\s+instructions?:/i,
  /system\s*prompt:/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<<SYS>>/i,
  /<\|im_start\|>/i,
];

/**
 * Zod refinement to check for suspicious injection patterns
 */
const noInjectionPatterns = (fieldName: string) =>
  z.string().refine(
    (val) => !SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(val)),
    { message: `Le champ ${fieldName} contient du contenu invalide` }
  );

/**
 * Safe text schema with injection prevention
 */
const safeTextSchema = (maxLength: number, fieldName: string) =>
  z
    .string()
    .max(maxLength, `${fieldName} dépasse la limite de ${maxLength} caractères`)
    .refine(
      (val) => !SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(val)),
      { message: `${fieldName} contient du contenu invalide` }
    );

// ============================================================================
// BASIC TYPES
// ============================================================================

export const blockTypeSchema = z.enum([
  'heading',
  'image',
  'table',
  'quote',
  'faq',
  'code',
  'paragraph',
]);

export const headingLevelSchema = z.enum(['1', '2', '3']).transform(Number);

export const difficultyLevelSchema = z.enum(['easy', 'medium', 'hard']);

export const volumeLevelSchema = z.enum(['low', 'medium', 'high']);

export const toneTypeSchema = z.enum([
  'Expert',
  'Narratif',
  'Minimaliste',
  'Inspirant',
  'Conversationnel',
]);

export const styleTypeSchema = z.enum([
  'Journalistique',
  'Académique',
  'Blog Lifestyle',
  'Storytelling',
  'Tutorial',
]);

export const personaTypeSchema = z.enum(['beginner', 'intermediate', 'expert']);

export const languageSchema = z.enum(['fr', 'en', 'es', 'de', 'it', 'pt']);

// ============================================================================
// OUTLINE ITEM
// ============================================================================

export const outlineItemSchema = z.object({
  id: z.string().min(1),
  type: blockTypeSchema,
  title: z.string().min(1).max(500),
  level: z.number().min(1).max(3).optional(),
  seoScore: z.number().min(0).max(100).optional(),
  content: z.string().optional(),
});

export type OutlineItemInput = z.input<typeof outlineItemSchema>;
export type OutlineItemOutput = z.output<typeof outlineItemSchema>;

// ============================================================================
// TITLE SUGGESTION
// ============================================================================

export const titleSuggestionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  keywords: z.array(z.string().min(1).max(50)).min(1).max(10),
  seoScore: z.number().min(0).max(100),
  difficulty: difficultyLevelSchema,
  searchVolume: volumeLevelSchema,
  selected: z.boolean().optional(),
});

// ============================================================================
// ARTICLE CONFIG
// ============================================================================

export const articleConfigSchema = z.object({
  tone: z.string().min(1).default('Expert'),
  style: z.string().min(1).default('Blog Lifestyle'),
  targetWordCount: z.number().min(100).max(10000).default(1500),
  persona: personaTypeSchema.default('intermediate'),
  targetKeywords: z.array(z.string()).default([]),
  sources: z.array(z.string()).default([]),
  language: languageSchema.default('fr'),
  includeTableOfContents: z.boolean().default(true),
  includeFAQ: z.boolean().default(false),
  // v2.0: Custom instructions with security validation
  customInstructions: z
    .string()
    .max(1000, 'Instructions personnalisées limitées à 1000 caractères')
    .refine(
      (val) => !val || !SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(val)),
      { message: 'Les instructions contiennent du contenu invalide' }
    )
    .optional(),
  // v2.0: Preset persona for quick config
  presetPersona: z.enum(['expert-seo', 'beginner-friendly', 'storyteller', 'academic']).optional(),
});

export type ArticleConfigInput = z.input<typeof articleConfigSchema>;
export type ArticleConfigOutput = z.output<typeof articleConfigSchema>;

// ============================================================================
// GENERATION REQUEST
// ============================================================================

export const generateTitlesRequestSchema = z.object({
  topic: z.string().min(3, 'Le sujet doit contenir au moins 3 caractères').max(500),
  language: languageSchema.optional(),
  count: z.number().min(1).max(10).optional(),
});

export const generateOutlineRequestSchema = z.object({
  topic: z.string().min(3).max(500),
  title: z.string().min(5, 'Le titre doit contenir au moins 5 caractères').max(200),
  keywords: z.array(z.string()).optional(),
  language: languageSchema.optional(),
});

export const generateArticleRequestSchema = z.object({
  topic: z.string().min(3).max(500),
  title: z.string().min(5).max(200),
  outline: z.array(outlineItemSchema).min(1, 'Au moins une section est requise'),
  config: articleConfigSchema,
});

export const rewriteTextRequestSchema = z.object({
  text: z.string().min(1, 'Le texte ne peut pas être vide').max(10000),
  action: z.enum([
    'rewrite',
    'improve',
    'expand',
    'shorten',
    'translate',
    'continue',
    'factcheck',
    'simplify',
    'formalize',
  ]),
  context: z.string().max(500).optional(),
  language: languageSchema.optional(),
});

// ============================================================================
// ARTICLE DATA (Complete State)
// ============================================================================

export const articleDataSchema = z.object({
  topic: z.string(),
  title: z.string(),
  titleSuggestions: z.array(titleSuggestionSchema),
  selectedKeywords: z.array(z.string()),
  outline: z.array(outlineItemSchema),
  config: articleConfigSchema,
  content: z.string(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().max(160).optional(),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    snippet: z.string().optional(),
  })).optional(),
});

// ============================================================================
// STEP VALIDATORS
// ============================================================================

/**
 * Validate that the user can proceed from Topic step
 */
export function canProceedFromTopic(data: {
  topic: string;
  title: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.topic || data.topic.trim().length < 3) {
    errors.push('Veuillez entrer un sujet (minimum 3 caractères)');
  }

  if (!data.title || data.title.trim().length < 5) {
    errors.push('Veuillez sélectionner ou entrer un titre');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate that the user can proceed from Outline step
 */
export function canProceedFromOutline(data: {
  outline: OutlineItemOutput[];
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.outline || data.outline.length === 0) {
    errors.push('Veuillez ajouter au moins une section');
  }

  // Check that there's at least one heading
  const hasHeading = data.outline?.some((item) => item.type === 'heading');
  if (!hasHeading) {
    errors.push('L\'article doit contenir au moins un titre de section');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate that the user can proceed from Config step
 */
export function canProceedFromConfig(data: {
  config: ArticleConfigOutput;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.config.targetWordCount < 100) {
    errors.push('Le nombre de mots cible doit être au moins 100');
  }

  if (data.config.targetWordCount > 10000) {
    errors.push('Le nombre de mots cible ne peut pas dépasser 10000');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate that the article is ready for finalization
 */
export function canFinalize(data: {
  content: string;
  title: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.content || data.content.trim().length < 100) {
    errors.push('Le contenu de l\'article est trop court');
  }

  if (!data.title || data.title.trim().length < 5) {
    errors.push('Le titre est requis');
  }

  const wordCount = data.content?.split(/\s+/).filter(Boolean).length || 0;
  if (wordCount < 50) {
    errors.push('L\'article doit contenir au moins 50 mots');
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// EXPORT TYPE HELPERS
// ============================================================================

export type GenerateTitlesRequest = z.infer<typeof generateTitlesRequestSchema>;
export type GenerateOutlineRequest = z.infer<typeof generateOutlineRequestSchema>;
export type GenerateArticleRequest = z.infer<typeof generateArticleRequestSchema>;
export type RewriteTextRequest = z.infer<typeof rewriteTextRequestSchema>;
