/**
 * Constantes et seuils pour l'analyse SEO unifiée
 */

import type { SeoFieldType, SeoLevel, SeoLevelKey } from '@/types/seo';

// ============================================================================
// SEO LEVELS — 5-tier unified system
// ============================================================================

export const SEO_LEVELS: SeoLevel[] = [
    {
        key: 'excellent',
        label: 'Excellent',
        min: 90,
        textColor: 'text-emerald-500',
        bgColor: 'bg-emerald-500',
        borderColor: 'border-emerald-500',
        strokeColor: '#10b981',
    },
    {
        key: 'good',
        label: 'Bon',
        min: 70,
        textColor: 'text-green-500',
        bgColor: 'bg-green-500',
        borderColor: 'border-green-500',
        strokeColor: '#22c55e',
    },
    {
        key: 'average',
        label: 'Moyen',
        min: 50,
        textColor: 'text-amber-500',
        bgColor: 'bg-amber-500',
        borderColor: 'border-amber-500',
        strokeColor: '#f59e0b',
    },
    {
        key: 'poor',
        label: 'Faible',
        min: 30,
        textColor: 'text-orange-500',
        bgColor: 'bg-orange-500',
        borderColor: 'border-orange-500',
        strokeColor: '#f97316',
    },
    {
        key: 'critical',
        label: 'Critique',
        min: 0,
        textColor: 'text-red-500',
        bgColor: 'bg-red-500',
        borderColor: 'border-red-500',
        strokeColor: '#ef4444',
    },
];

/**
 * Retourne le SeoLevel correspondant à un score
 */
export function getSeoLevel(score: number): SeoLevel {
    for (const level of SEO_LEVELS) {
        if (score >= level.min) return level;
    }
    return SEO_LEVELS[SEO_LEVELS.length - 1];
}

/**
 * Retourne la clé du niveau pour un score
 */
export function getSeoLevelKey(score: number): SeoLevelKey {
    return getSeoLevel(score).key;
}

// ============================================================================
// PRODUCT SEO CRITERIA WEIGHTS
// ============================================================================

/**
 * Poids des critères pour le calcul du score global produit
 * Base criteria: included in weighted average
 * Bonus criteria: added on top (capped at 100)
 */
export const PRODUCT_SEO_WEIGHTS: Record<string, { weight: number; isBonus: boolean }> = {
    meta_title: { weight: 2.5, isBonus: false },
    meta_description: { weight: 2.5, isBonus: false },
    title: { weight: 2.0, isBonus: false },
    short_description: { weight: 1.5, isBonus: false },
    description: { weight: 1.5, isBonus: false },
    slug: { weight: 1.0, isBonus: false },
    images: { weight: 1.0, isBonus: false },
    alt_text: { weight: 1.0, isBonus: false },
    keyword_presence: { weight: 1.5, isBonus: true },
    cta_detection: { weight: 0.5, isBonus: true },
    gsc_traffic_signal: { weight: 1.0, isBonus: true },
};

// Total base weight = 2.5 + 2.5 + 2.0 + 1.5 + 1.5 + 1.0 + 1.0 + 1.0 = 13.0
// Total bonus weight = 1.5 + 0.5 = 2.0

// ============================================================================
// OPTIMAL LENGTHS — Product fields
// ============================================================================

export const PRODUCT_FIELD_THRESHOLDS = {
    meta_title: { min: 30, idealMin: 50, idealMax: 60, max: 70 },
    meta_description: { min: 80, idealMin: 130, idealMax: 160, max: 170 },
    title: { min: 10, idealMin: 30, idealMax: 60, max: 80 },
    short_description: { min: 50, idealMin: 100, idealMax: 200, max: 300 },
    description: { min: 200, idealMin: 400, idealMax: 800, max: 5000 },
    slug: { minWords: 2, idealMinWords: 3, idealMaxWords: 5, maxWords: 8 },
} as const;

// ============================================================================
// BLOG OPTIMAL LENGTHS (legacy — used by analyzeRealTimeSeo only)
// ============================================================================

export const OPTIMAL_LENGTHS = {
    title: {
        min: 50,
        optimal: 55,
        max: 60,
        acceptable_min: 30,
        acceptable_max: 70,
    },
    short_description: {
        min: 150,
        optimal: 155,
        max: 160,
        acceptable_min: 120,
        acceptable_max: 180,
    },
    description: {
        min_words: 300,
        optimal_words: 500,
        max_words: 800,
        acceptable_min_words: 200,
    },
    meta_title: {
        min: 50,
        optimal: 55,
        max: 60,
        acceptable_min: 30,
        acceptable_max: 70,
    },
    meta_description: {
        min: 150,
        optimal: 155,
        max: 160,
        acceptable_min: 120,
        acceptable_max: 180,
    },
    slug: {
        min_words: 3,
        optimal_words: 5,
        max_words: 8,
        max_depth: 3,
    },
} as const;

// ============================================================================
// CTA POWER WORDS
// ============================================================================

export const CTA_WORDS = [
    'achetez',
    'acheter',
    'découvrez',
    'découvrir',
    'commandez',
    'commander',
    'obtenez',
    'obtenir',
    'profitez',
    'profiter',
    'essayez',
    'essayer',
    'testez',
    'tester',
    'téléchargez',
    'télécharger',
    'réservez',
    'réserver',
    'contactez',
    'contacter',
    'maintenant',
    'aujourd\'hui',
    'gratuit',
    'livraison',
    'rapide',
] as const;

// ============================================================================
// LEGACY THRESHOLDS (used by blog analyzer scoreColors — kept for compat)
// ============================================================================

export const SCORE_THRESHOLDS = {
    critical: 0, // 0-29
    poor: 30, // 30-49
    warning: 50, // 50-69
    info: 70, // 70-89
    success: 90, // 90-100
} as const;

// ============================================================================
// FIELD LABELS
// ============================================================================

export const FIELD_LABELS: Record<SeoFieldType, string> = {
    title: 'Titre',
    short_description: 'Description courte',
    description: 'Description longue',
    meta_title: 'Titre SEO',
    meta_description: 'Méta-description',
    slug: 'URL (slug)',
    images: 'Images',
    alt_text: 'Alt text images',
    keyword_presence: 'Mot-clé principal',
    cta_detection: 'Appel à l\'action',
    gsc_traffic_signal: 'Signal trafic GSC',
};

/**
 * Poids des champs legacy (blog) — gardé pour compatibilité
 */
export const FIELD_WEIGHTS: Record<string, number> = {
    title: 15,
    short_description: 10,
    description: 20,
    meta_title: 12,
    meta_description: 12,
    slug: 8,
    images: 10,
    keywords: 8,
    semantic_quality: 5,
};
