/**
 * Portable SEO Scorer — Deno-compatible, zero dependencies.
 * Mirrors the base-criteria logic from my-app/src/lib/seo/analyzer.ts
 * Used by sync-manager (Edge Function) to score products at import time.
 */

// ============================================================================
// THRESHOLDS & WEIGHTS (synced with my-app/src/lib/seo/constants.ts)
// ============================================================================

const THRESHOLDS = {
    meta_title:       { min: 30, idealMin: 50,  idealMax: 60,  max: 70 },
    meta_description: { min: 80, idealMin: 130, idealMax: 160, max: 170 },
    title:            { min: 10, idealMin: 30,  idealMax: 60,  max: 80 },
    short_description:{ min: 50, idealMin: 100, idealMax: 200, max: 300 },
    description:      { min: 200,idealMin: 400, idealMax: 800, max: 5000 },
} as const;

const SLUG_THRESHOLDS = { minWords: 2, idealMinWords: 3, idealMaxWords: 5, maxWords: 8 };

const WEIGHTS: Record<string, number> = {
    meta_title: 2.5,
    meta_description: 2.5,
    title: 2.0,
    short_description: 1.5,
    description: 1.5,
    slug: 1.0,
    images: 1.0,
    alt_text: 1.0,
};

// ============================================================================
// HELPERS
// ============================================================================

export function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
}

function scoreByCharLength(
    text: string,
    t: { min: number; idealMin: number; idealMax: number; max: number }
): number {
    const len = text.length;
    if (len === 0) return 0;
    if (len < t.min) return Math.round((len / t.min) * 40);
    if (len >= t.idealMin && len <= t.idealMax) return 100;
    if (len >= t.min && len < t.idealMin) {
        return Math.round(40 + ((len - t.min) / (t.idealMin - t.min)) * 60);
    }
    if (len > t.idealMax && len <= t.max) {
        return Math.round(100 - ((len - t.idealMax) / (t.max - t.idealMax)) * 30);
    }
    // len > max
    const buffer = t.max * 0.5;
    return Math.max(0, Math.round(70 - ((len - t.max) / buffer) * 70));
}

function scoreSlug(slug: string): number {
    if (!slug) return 0;
    const words = slug.split('-').filter(Boolean).length;
    const t = SLUG_THRESHOLDS;
    if (words < t.minWords) return Math.round((words / t.minWords) * 40);
    if (words >= t.idealMinWords && words <= t.idealMaxWords) return 100;
    if (words >= t.minWords && words < t.idealMinWords) {
        return Math.round(40 + ((words - t.minWords) / (t.idealMinWords - t.minWords)) * 60);
    }
    if (words > t.idealMaxWords && words <= t.maxWords) {
        return Math.round(100 - ((words - t.idealMaxWords) / (t.maxWords - t.idealMaxWords)) * 30);
    }
    return Math.max(0, 30);
}

function scoreImages(images: Array<{ src?: string; alt?: string }>): number {
    if (!images || images.length === 0) return 0;
    if (images.length === 1) return 50;
    if (images.length >= 3) return 100;
    return 75;
}

function scoreAltText(images: Array<{ src?: string; alt?: string }>): number {
    if (!images || images.length === 0) return 0;
    const withAlt = images.filter(i => i.alt && i.alt.trim().length > 0).length;
    return Math.round((withAlt / images.length) * 100);
}

// ============================================================================
// MAIN
// ============================================================================

export interface SeoScorerInput {
    title: string;
    short_description: string;
    description: string;
    meta_title: string;
    meta_description: string;
    slug: string;
    images: Array<{ src?: string; alt?: string }>;
}

export function computeBasicSeoScore(input: SeoScorerInput): number {
    const scores: Record<string, number> = {
        meta_title: scoreByCharLength(stripHtml(input.meta_title || ''), THRESHOLDS.meta_title),
        meta_description: scoreByCharLength(stripHtml(input.meta_description || ''), THRESHOLDS.meta_description),
        title: scoreByCharLength(stripHtml(input.title || ''), THRESHOLDS.title),
        short_description: scoreByCharLength(stripHtml(input.short_description || ''), THRESHOLDS.short_description),
        description: scoreByCharLength(stripHtml(input.description || ''), THRESHOLDS.description),
        slug: scoreSlug(input.slug || ''),
        images: scoreImages(input.images || []),
        alt_text: scoreAltText(input.images || []),
    };

    let totalWeight = 0;
    let weightedSum = 0;
    for (const [key, weight] of Object.entries(WEIGHTS)) {
        weightedSum += scores[key] * weight;
        totalWeight += weight;
    }

    return Math.round(weightedSum / totalWeight);
}
