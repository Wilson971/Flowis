/**
 * Batch Generation Validation Schemas
 *
 * Zod schemas for validating batch product content generation requests.
 * Includes prompt injection prevention reused from FloWriter security patterns.
 */

import { z } from 'zod';
import { detectSuspiciousInput } from '@/lib/ai/prompts';

// ============================================================================
// CONTENT TYPES
// ============================================================================

export const MODULAR_CONTENT_TYPES = [
    'title',
    'short_description',
    'description',
    'seo_title',
    'meta_description',
    'sku',
    'alt_text',
] as const;

export const modularContentTypeSchema = z.enum(MODULAR_CONTENT_TYPES);

// ============================================================================
// SETTINGS SCHEMA
// ============================================================================

const skuFormatSchema = z.object({
    pattern: z.enum(['category_based', 'product_name_based', 'custom']).default('product_name_based'),
    separator: z.string().max(5).default('-'),
    max_length: z.number().int().min(4).max(50).default(12),
    prefix: z.string().max(10).optional(),
}).optional();

const structureOptionsSchema = z.object({
    h2_titles: z.boolean().default(true),
    benefits_list: z.boolean().default(true),
    benefits_count: z.number().int().min(1).max(20).default(5),
    specs_table: z.boolean().default(false),
    cta: z.boolean().default(true),
    blocks: z.array(z.any()).optional(),
    useBlockBuilder: z.boolean().optional(),
});

const wordLimitsSchema = z.object({
    title: z.number().int().min(5).max(200).optional(),
    short_description: z.number().int().min(10).max(500).optional(),
    description: z.number().int().min(50).max(5000).optional(),
    seo_title: z.number().int().min(5).max(100).optional(),
    meta_description: z.number().int().min(50).max(300).optional(),
}).default({});

export const generationSettingsSchema = z.object({
    provider: z.string().default('gemini'),
    model: z.string().default('gemini-2.0-flash'),
    tone: z.string().max(50).default('professional').refine(
        (val) => !detectSuspiciousInput(val),
        { message: 'Le ton contient du contenu invalide' }
    ),
    language: z.enum(['fr', 'en', 'es', 'de', 'it', 'pt']).default('fr'),
    word_limits: wordLimitsSchema,
    image_analysis: z.boolean().default(true),
    transform_mode: z.enum(['optimize', 'rewrite']).default('rewrite'),
    sku_format: skuFormatSchema,
    structure_options: structureOptionsSchema,
});

// ============================================================================
// BATCH REQUEST SCHEMA
// ============================================================================

export const batchGenerationRequestSchema = z.object({
    product_ids: z
        .array(z.string().uuid('ID produit invalide'))
        .min(1, 'Sélectionnez au moins 1 produit')
        .max(50, 'Maximum 50 produits par batch'),
    content_types: z
        .record(z.enum(MODULAR_CONTENT_TYPES), z.boolean().optional())
        .refine(
            (types) => Object.values(types).some((v) => v === true),
            { message: 'Sélectionnez au moins un type de contenu' }
        ),
    settings: generationSettingsSchema,
    store_id: z.string().uuid('ID boutique invalide'),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type BatchGenerationInput = z.infer<typeof batchGenerationRequestSchema>;
export type GenerationSettings = z.infer<typeof generationSettingsSchema>;
