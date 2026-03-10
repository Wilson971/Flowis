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
// INDEXATION STATUS TOKENS
// ============================================================================

export type GscIndexationStatus =
    | 'indexed'
    | 'not_indexed'
    | 'crawled_not_indexed'
    | 'discovered_not_indexed'
    | 'noindex'
    | 'blocked_robots'
    | 'errors'
    | 'unknown';

export interface GscStatusConfig {
    cssVar: string;
    label: string;
    text: string;
    bg: string;
    border: string;
    dot: string;
}

export const gscStatusTokens: Record<GscIndexationStatus, GscStatusConfig> = {
    indexed: {
        cssVar: '--gsc-indexed',
        label: 'Indexé',
        text: 'text-gsc-indexed',
        bg: 'bg-gsc-indexed',
        border: 'border-gsc-indexed',
        dot: 'bg-gsc-indexed',
    },
    not_indexed: {
        cssVar: '--gsc-not-indexed',
        label: 'Non indexé',
        text: 'text-gsc-not-indexed',
        bg: 'bg-gsc-not-indexed',
        border: 'border-gsc-not-indexed',
        dot: 'bg-gsc-not-indexed',
    },
    crawled_not_indexed: {
        cssVar: '--gsc-crawled',
        label: 'Exploré, non indexé',
        text: 'text-gsc-crawled',
        bg: 'bg-gsc-crawled',
        border: 'border-gsc-crawled',
        dot: 'bg-gsc-crawled',
    },
    discovered_not_indexed: {
        cssVar: '--gsc-discovered',
        label: 'Découvert, non indexé',
        text: 'text-gsc-discovered',
        bg: 'bg-gsc-discovered',
        border: 'border-gsc-discovered',
        dot: 'bg-gsc-discovered',
    },
    noindex: {
        cssVar: '--gsc-noindex',
        label: 'Noindex (volontaire)',
        text: 'text-gsc-noindex',
        bg: 'bg-gsc-noindex',
        border: 'border-gsc-noindex',
        dot: 'bg-gsc-noindex',
    },
    blocked_robots: {
        cssVar: '--gsc-blocked',
        label: 'Bloqué robots.txt',
        text: 'text-gsc-blocked',
        bg: 'bg-gsc-blocked',
        border: 'border-gsc-blocked',
        dot: 'bg-gsc-blocked',
    },
    errors: {
        cssVar: '--gsc-errors',
        label: 'Erreur',
        text: 'text-gsc-errors',
        bg: 'bg-gsc-errors',
        border: 'border-gsc-errors',
        dot: 'bg-gsc-errors',
    },
    unknown: {
        cssVar: '--gsc-unknown',
        label: 'Inconnu',
        text: 'text-gsc-unknown',
        bg: 'bg-gsc-unknown',
        border: 'border-gsc-unknown',
        dot: 'bg-gsc-unknown',
    },
};

/**
 * Resolves a GSC indexation status CSS variable to its computed value.
 */
export function resolveGscStatusColor(status: GscIndexationStatus): string {
    if (typeof document === 'undefined') return '#888888';
    const value = getComputedStyle(document.documentElement)
        .getPropertyValue(gscStatusTokens[status].cssVar)
        .trim();
    return value || '#888888';
}

// ============================================================================
// POSITION DISTRIBUTION TOKENS
// ============================================================================

export type GscPositionBucket = '1-3' | '4-10' | '11-20' | '21-50' | '51+';

const GSC_POSITION_VARS: Record<GscPositionBucket, string> = {
    '1-3': '--gsc-pos-top3',
    '4-10': '--gsc-pos-top10',
    '11-20': '--gsc-pos-top20',
    '21-50': '--gsc-pos-top50',
    '51+': '--gsc-pos-beyond',
};

/**
 * Resolves position bucket color from CSS variable for Recharts.
 */
export function resolveGscPositionColor(bucket: GscPositionBucket): string {
    if (typeof document === 'undefined') return '#888888';
    const value = getComputedStyle(document.documentElement)
        .getPropertyValue(GSC_POSITION_VARS[bucket])
        .trim();
    return value || '#888888';
}

/**
 * Resolves all position bucket colors at once.
 */
export function resolveAllPositionColors(): Record<string, string> {
    return Object.fromEntries(
        (Object.keys(GSC_POSITION_VARS) as GscPositionBucket[]).map(
            (bucket) => [bucket, resolveGscPositionColor(bucket)]
        )
    );
}

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
