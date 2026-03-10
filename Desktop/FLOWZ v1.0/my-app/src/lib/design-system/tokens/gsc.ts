/**
 * GSC (Google Search Console) Design Tokens
 *
 * Centralizes all GSC-specific colors mapped to the brand palette.
 * CSS variables are defined in _semantic.css (--gsc-*) and registered
 * in app.css (@theme) so Tailwind classes like `text-gsc-clicks` work.
 *
 * For Recharts (which needs raw hex/hsl), use `resolveGscColor()` to
 * read the computed CSS variable value at runtime.
 */

// ============================================================================
// TYPES
// ============================================================================

export type GscMetricKey = 'clicks' | 'impressions' | 'ctr' | 'position';

export interface GscMetricConfig {
    /** CSS variable name (e.g. '--gsc-clicks') */
    cssVar: string;
    /** Tailwind text class */
    text: string;
    /** Tailwind bg class */
    bg: string;
    /** Tailwind border class */
    border: string;
    /** French label */
    label: string;
}

// ============================================================================
// METRIC TOKENS
// ============================================================================

export const gscMetricTokens: Record<GscMetricKey, GscMetricConfig> = {
    clicks: {
        cssVar: '--gsc-clicks',
        text: 'text-gsc-clicks',
        bg: 'bg-gsc-clicks',
        border: 'border-gsc-clicks',
        label: 'Clics',
    },
    impressions: {
        cssVar: '--gsc-impressions',
        text: 'text-gsc-impressions',
        bg: 'bg-gsc-impressions',
        border: 'border-gsc-impressions',
        label: 'Impressions',
    },
    ctr: {
        cssVar: '--gsc-ctr',
        text: 'text-gsc-ctr',
        bg: 'bg-gsc-ctr',
        border: 'border-gsc-ctr',
        label: 'CTR',
    },
    position: {
        cssVar: '--gsc-position',
        text: 'text-gsc-position',
        bg: 'bg-gsc-position',
        border: 'border-gsc-position',
        label: 'Position',
    },
};

// ============================================================================
// RUNTIME COLOR RESOLVER (for Recharts / SVG / inline styles)
// ============================================================================

/**
 * Resolves a CSS variable to its computed hex/rgb value at runtime.
 * Must be called client-side (needs document).
 *
 * @example
 * const clicksColor = resolveGscColor('clicks'); // e.g. '#f59e0b'
 */
export function resolveGscColor(metric: GscMetricKey): string {
    if (typeof document === 'undefined') return '#888888';
    const value = getComputedStyle(document.documentElement)
        .getPropertyValue(gscMetricTokens[metric].cssVar)
        .trim();
    return value || '#888888';
}

/**
 * Resolves all 4 GSC metric colors at once.
 * Useful for chart components that need all colors in one call.
 *
 * @example
 * const colors = resolveAllGscColors();
 * // { clicks: '#f59e0b', impressions: '#b45309', ctr: '#fbbf24', position: '#fcd34d' }
 */
export function resolveAllGscColors(): Record<GscMetricKey, string> {
    return {
        clicks: resolveGscColor('clicks'),
        impressions: resolveGscColor('impressions'),
        ctr: resolveGscColor('ctr'),
        position: resolveGscColor('position'),
    };
}
