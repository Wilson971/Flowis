/**
 * Utilitaires pour l'affichage des couleurs de score
 */
import { SCORE_THRESHOLDS } from './constants';

export const getScoreColor = (score: number) => {
    if (score >= SCORE_THRESHOLDS.success) return 'text-success';
    if (score >= SCORE_THRESHOLDS.info) return 'text-info';
    if (score >= SCORE_THRESHOLDS.warning) return 'text-warning';
    return 'text-destructive';
};

export const getScoreBgColor = (score: number) => {
    if (score >= SCORE_THRESHOLDS.success) return 'bg-success';
    if (score >= SCORE_THRESHOLDS.info) return 'bg-info';
    if (score >= SCORE_THRESHOLDS.warning) return 'bg-warning';
    return 'bg-destructive';
};

export const getScoreColorConfig = (score: number) => {
    if (score >= SCORE_THRESHOLDS.success) {
        return {
            primary: 'var(--success)',
            secondary: 'color-mix(in srgb, var(--success), transparent 85%)',
            text: 'text-success',
        };
    }
    if (score >= SCORE_THRESHOLDS.info) {
        return {
            primary: 'var(--info)',
            secondary: 'color-mix(in srgb, var(--info), transparent 85%)',
            text: 'text-info',
        };
    }
    if (score >= SCORE_THRESHOLDS.warning) {
        return {
            primary: 'var(--warning)',
            secondary: 'color-mix(in srgb, var(--warning), transparent 85%)',
            text: 'text-warning',
        };
    }
    return {
        primary: 'var(--destructive)',
        secondary: 'color-mix(in srgb, var(--destructive), transparent 85%)',
        text: 'text-destructive',
    };
};
