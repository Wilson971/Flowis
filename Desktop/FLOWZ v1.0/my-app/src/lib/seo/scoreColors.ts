/**
 * Utilitaires unifiés pour les couleurs de score SEO
 * Palette 5 niveaux : emerald → green → amber → orange → red
 */
import { getSeoLevel } from './constants';
import type { SeoLevel, SeoLevelKey } from '@/types/seo';

// ============================================================================
// CORE COLOR GETTERS (use getSeoLevel internally)
// ============================================================================

/**
 * Retourne la classe Tailwind text-* pour un score
 */
export const getScoreColor = (score: number): string => {
    return getSeoLevel(score).textColor;
};

/**
 * Retourne la classe Tailwind bg-* pour un score
 */
export const getScoreBgColor = (score: number): string => {
    return getSeoLevel(score).bgColor;
};

/**
 * Retourne la classe Tailwind border-* pour un score
 */
export const getScoreBorderColor = (score: number): string => {
    return getSeoLevel(score).borderColor;
};

/**
 * Retourne la couleur hex du stroke pour SVG/canvas
 */
export const getScoreStrokeColor = (score: number): string => {
    return getSeoLevel(score).strokeColor;
};

/**
 * Retourne le label du niveau (Excellent, Bon, Moyen, Faible, Critique)
 */
export const getScoreLabel = (score: number): string => {
    return getSeoLevel(score).label;
};

/**
 * Retourne la clé du niveau
 */
export const getScoreLevelKey = (score: number): SeoLevelKey => {
    return getSeoLevel(score).key;
};

// ============================================================================
// CONFIG OBJECT (for components that need multiple values)
// ============================================================================

export interface ScoreColorConfig {
    primary: string; // hex color for SVG stroke
    secondary: string; // CSS background with transparency
    text: string; // Tailwind text class
    bg: string; // Tailwind bg class
    border: string; // Tailwind border class
    label: string; // French label
    level: SeoLevel; // Full level object
}

/**
 * Retourne un objet config complet pour un score
 * Usage: const config = getScoreColorConfig(score);
 *        <circle stroke={config.primary} />
 *        <span className={config.text}>{config.label}</span>
 */
export const getScoreColorConfig = (score: number): ScoreColorConfig => {
    const level = getSeoLevel(score);

    return {
        primary: level.strokeColor,
        secondary: `${level.strokeColor}22`, // hex + 13% opacity
        text: level.textColor,
        bg: level.bgColor,
        border: level.borderColor,
        label: level.label,
        level,
    };
};

// ============================================================================
// BADGE STYLES (for SEO field editors, badges, etc.)
// ============================================================================

export interface ScoreBadgeStyle {
    bg: string;
    text: string;
    border: string;
    label: string;
}

/**
 * Retourne les classes pour un badge de score (fond transparent + texte + bordure)
 */
export const getScoreBadgeStyle = (score: number): ScoreBadgeStyle => {
    const level = getSeoLevel(score);

    const styles: Record<SeoLevelKey, ScoreBadgeStyle> = {
        excellent: {
            bg: 'bg-success/10',
            text: 'text-success',
            border: 'border-success/20',
            label: 'Excellent',
        },
        good: {
            bg: 'bg-success/10',
            text: 'text-success',
            border: 'border-success/20',
            label: 'Bon',
        },
        average: {
            bg: 'bg-amber-500/10',
            text: 'text-amber-500',
            border: 'border-amber-500/20',
            label: 'Moyen',
        },
        poor: {
            bg: 'bg-orange-500/10',
            text: 'text-orange-500',
            border: 'border-orange-500/20',
            label: 'Faible',
        },
        critical: {
            bg: 'bg-red-500/10',
            text: 'text-red-500',
            border: 'border-red-500/20',
            label: 'Critique',
        },
    };

    return styles[level.key];
};

// ============================================================================
// STATUS COLORS (for product list cards, badges, etc.)
// ============================================================================

export interface SeoStatusColors {
    bg: string;
    text: string;
    border: string;
    progress: string;
}

/**
 * Retourne les classes Tailwind pour un status card complet (light + dark)
 */
export const getSeoStatusColors = (score: number | null): SeoStatusColors => {
    if (score === null || score === undefined) {
        return {
            bg: 'bg-muted',
            text: 'text-muted-foreground',
            border: 'border-border',
            progress: 'bg-muted-foreground/30',
        };
    }

    const level = getSeoLevel(score);

    const colorMap: Record<SeoLevelKey, SeoStatusColors> = {
        excellent: {
            bg: 'bg-success/15',
            text: 'text-success',
            border: 'border-success/30',
            progress: 'bg-success',
        },
        good: {
            bg: 'bg-success/15',
            text: 'text-success',
            border: 'border-success/30',
            progress: 'bg-success',
        },
        average: {
            bg: 'bg-amber-100 dark:bg-amber-900/30',
            text: 'text-amber-700 dark:text-amber-400',
            border: 'border-amber-300 dark:border-amber-700',
            progress: 'bg-amber-500',
        },
        poor: {
            bg: 'bg-orange-100 dark:bg-orange-900/30',
            text: 'text-orange-700 dark:text-orange-400',
            border: 'border-orange-300 dark:border-orange-700',
            progress: 'bg-orange-500',
        },
        critical: {
            bg: 'bg-red-100 dark:bg-red-900/30',
            text: 'text-red-700 dark:text-red-400',
            border: 'border-red-300 dark:border-red-700',
            progress: 'bg-red-500',
        },
    };

    return colorMap[level.key];
};
