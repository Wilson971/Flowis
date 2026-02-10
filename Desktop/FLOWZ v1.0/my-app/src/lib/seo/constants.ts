/**
 * Constantes et seuils pour l'analyse SEO
 */

import { SeoFieldType } from '@/types/seo';

/**
 * Poids des champs pour le calcul du score global
 */
export const FIELD_WEIGHTS: Record<SeoFieldType, number> = {
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

/**
 * Longueurs optimales par champ (caractères)
 */
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

/**
 * Power words pour détecter les CTA
 */
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

/**
 * Seuils de score pour déterminer la sévérité
 */
export const SCORE_THRESHOLDS = {
    critical: 0, // 0-40
    warning: 40, // 40-70
    info: 70, // 70-85
    success: 85, // 85-100
} as const;

/**
 * Labels des champs pour l'UI
 */
export const FIELD_LABELS: Record<SeoFieldType, string> = {
    title: 'Titre',
    short_description: 'Description courte',
    description: 'Description longue',
    meta_title: 'Titre SEO',
    meta_description: 'Méta-description',
    slug: 'URL (slug)',
    images: 'Images',
    keywords: 'Mots-clés',
    semantic_quality: 'Qualité sémantique',
};
