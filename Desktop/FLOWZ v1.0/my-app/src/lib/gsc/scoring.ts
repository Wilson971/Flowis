/**
 * GSC Opportunity Scoring & Trend Utilities
 *
 * Score formula: impressions × (1/position) × (1 - ctr), normalized 0-100
 * Trend: compare position between 7d and 28d datasets
 */

import type { GscOpportunityKeyword } from './types';

// ============================================
// SCORE CALCULATION
// ============================================

export interface ScoredOpportunity extends GscOpportunityKeyword {
    score: number;
    scoreLabel: 'Élevé' | 'Moyen' | 'Faible';
    scoreColor: 'success' | 'warning' | 'error';
    trend: 'up' | 'down' | 'stable' | 'new';
    trendDelta: number | null;
}

/**
 * Raw score = impressions × (1/position) × (1 - ctr)
 * Then normalized to 0-100 within the dataset
 */
function computeRawScore(kw: GscOpportunityKeyword): number {
    if (kw.position <= 0) return 0;
    return kw.impressions * (1 / kw.position) * (1 - kw.ctr);
}

function getScoreLabel(score: number): ScoredOpportunity['scoreLabel'] {
    if (score >= 70) return 'Élevé';
    if (score >= 40) return 'Moyen';
    return 'Faible';
}

function getScoreColor(score: number): ScoredOpportunity['scoreColor'] {
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'error';
}

/**
 * Score and enrich a list of opportunity keywords.
 *
 * @param keywords - Keywords from the 28d dataset (or active period)
 * @param compareKeywords - Keywords from the 7d dataset (for trend comparison)
 */
export function scoreOpportunities(
    keywords: GscOpportunityKeyword[],
    compareKeywords?: GscOpportunityKeyword[]
): ScoredOpportunity[] {
    if (!keywords.length) return [];

    // Compute raw scores
    const rawScores = keywords.map((kw) => ({
        kw,
        raw: computeRawScore(kw),
    }));

    // Find max for normalization
    const maxRaw = Math.max(...rawScores.map((r) => r.raw), 1);

    // Build lookup map for 7d data (by query)
    const compareMap = new Map<string, GscOpportunityKeyword>();
    if (compareKeywords) {
        for (const ck of compareKeywords) {
            compareMap.set(ck.query.toLowerCase(), ck);
        }
    }

    // Build lookup for 28d queries to detect "new" keywords
    const baseQuerySet = new Set(keywords.map((kw) => kw.query.toLowerCase()));

    return rawScores.map(({ kw, raw }) => {
        const score = Math.round((raw / maxRaw) * 100);
        const queryKey = kw.query.toLowerCase();
        const compare7d = compareMap.get(queryKey);

        let trend: ScoredOpportunity['trend'] = 'stable';
        let trendDelta: number | null = null;

        if (compareKeywords) {
            if (compare7d) {
                // Both periods have this keyword — compare positions
                const delta = kw.position - compare7d.position;
                trendDelta = Math.round(delta * 10) / 10;

                if (delta < -0.5) trend = 'up';      // position decreased = improved
                else if (delta > 0.5) trend = 'down'; // position increased = declined
                else trend = 'stable';
            } else {
                // Keyword exists in 28d but NOT in 7d — it's NOT new (it disappeared recently)
                trend = 'stable';
                trendDelta = null;
            }
        }

        return {
            ...kw,
            score,
            scoreLabel: getScoreLabel(score),
            scoreColor: getScoreColor(score),
            trend,
            trendDelta,
        };
    }).sort((a, b) => b.score - a.score);
}

/**
 * Detect "new" keywords: present in 7d data but absent from 28d data.
 * These are keywords that recently entered the target position range.
 */
export function detectNewKeywords(
    keywords28d: GscOpportunityKeyword[],
    keywords7d: GscOpportunityKeyword[]
): Set<string> {
    const set28d = new Set(keywords28d.map((kw) => kw.query.toLowerCase()));
    const newKeywords = new Set<string>();

    for (const kw of keywords7d) {
        if (!set28d.has(kw.query.toLowerCase())) {
            newKeywords.add(kw.query.toLowerCase());
        }
    }

    return newKeywords;
}

// ============================================
// SEO RECOMMENDATIONS
// ============================================

export interface SeoRecommendation {
    type: 'title' | 'meta' | 'content' | 'internal_link' | 'heading';
    priority: 'high' | 'medium' | 'low';
    text: string;
}

/**
 * Generate contextual SEO recommendations for a keyword opportunity.
 */
export function generateRecommendations(opp: ScoredOpportunity): SeoRecommendation[] {
    const recommendations: SeoRecommendation[] = [];

    // Position-based recommendations
    if (opp.position >= 8 && opp.position <= 12) {
        recommendations.push({
            type: 'title',
            priority: 'high',
            text: `Intégrez "${opp.query}" dans le title tag de la page pour gagner les positions top 5.`,
        });
        recommendations.push({
            type: 'heading',
            priority: 'high',
            text: `Ajoutez un H2 ou H3 contenant "${opp.query}" pour renforcer la pertinence sémantique.`,
        });
    } else if (opp.position > 12) {
        recommendations.push({
            type: 'content',
            priority: 'high',
            text: `Créez ou enrichissez un paragraphe dédié à "${opp.query}" (300+ mots) sur cette page.`,
        });
        recommendations.push({
            type: 'internal_link',
            priority: 'medium',
            text: `Ajoutez 2-3 liens internes vers cette page avec l'ancre "${opp.query}".`,
        });
    }

    // CTR-based recommendations
    if (opp.ctr < 0.02 && opp.impressions > 50) {
        recommendations.push({
            type: 'meta',
            priority: 'high',
            text: `CTR très faible (${(opp.ctr * 100).toFixed(1)}%). Réécrivez la meta description pour inciter au clic.`,
        });
    } else if (opp.ctr < 0.05) {
        recommendations.push({
            type: 'meta',
            priority: 'medium',
            text: `CTR sous la moyenne (${(opp.ctr * 100).toFixed(1)}%). Ajoutez un appel à l'action dans la meta description.`,
        });
    }

    // Impression-based
    if (opp.impressions > 500 && opp.clicks < 10) {
        recommendations.push({
            type: 'title',
            priority: 'high',
            text: `${opp.impressions} impressions mais peu de clics — le titre ne capte pas l'attention. Testez un angle différent.`,
        });
    }

    // If no specific recommendations, add generic ones
    if (recommendations.length === 0) {
        recommendations.push({
            type: 'content',
            priority: 'medium',
            text: `Optimisez le contenu de la page pour mieux cibler "${opp.query}".`,
        });
    }

    return recommendations;
}
