/**
 * Client-Side SEO Analyzer v2.0
 *
 * Provides instant SEO feedback without API calls.
 * Analyzes keyword density, readability, structure, and more.
 */

import { CTA_WORDS, PRODUCT_FIELD_THRESHOLDS, PRODUCT_SEO_WEIGHTS, getSeoLevel } from './constants';
import type { ProductSeoInput, ProductSeoResult, ProductSeoCriterion, SeoIssue, SeoFieldType } from '@/types/seo';

// ============================================================================
// TYPES
// ============================================================================

export interface SeoScore {
  overall: number;
  keyword: number;
  readability: number;
  structure: number;
  meta: number;
}

export interface KeywordAnalysisItem {
  keyword: string;
  count: number;
  density: number;
  status: 'low' | 'optimal' | 'high';
  inTitle: boolean;
  inHeadings: boolean;
  inFirstParagraph: boolean;
}

export interface ReadabilityMetrics {
  avgSentenceLength: number;
  avgWordLength: number;
  paragraphCount: number;
  avgParagraphLength: number;
  fleschScore: number;
  level: 'easy' | 'medium' | 'hard';
}

export interface StructureAnalysis {
  hasTitle: boolean;
  headingCount: number;
  h2Count: number;
  h3Count: number;
  hasIntro: boolean;
  hasConclusion: boolean;
  hasFAQ: boolean;
  listCount: number;
  imageCount: number;
  linkCount: number;
}

export interface SeoProblem {
  type: 'error' | 'warning' | 'info' | 'success';
  category: 'keyword' | 'readability' | 'structure' | 'meta' | 'length';
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export interface RealTimeSeoAnalysis {
  score: SeoScore;
  keywords: KeywordAnalysisItem[];
  readability: ReadabilityMetrics;
  structure: StructureAnalysis;
  problems: SeoProblem[];
  wordCount: number;
  characterCount: number;
  estimatedReadTime: number;
}

/**
 * Compte le nombre de mots dans un texte
 */
export function calculateWordCount(text: string | null | undefined): number {
    if (!text) return 0;
    const cleanText = extractHtmlText(text);
    return cleanText.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

/**
 * Compte le nombre de caractères dans un texte (sans HTML)
 */
export function calculateCharacterCount(text: string | null | undefined): number {
    if (!text) return 0;
    const cleanText = extractHtmlText(text);
    return cleanText.length;
}

/**
 * Extrait le texte d'un contenu HTML
 */
export function extractHtmlText(html: string | null | undefined): string {
    if (!html) return '';

    // Supprimer les balises HTML
    let text = html.replace(/<[^>]*>/g, ' ');

    // Décoder les entités HTML
    text = text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    // Normaliser les espaces
    text = text.replace(/\s+/g, ' ').trim();

    return text;
}

/**
 * Détecte la présence d'un mot-clé dans un texte
 */
export function detectKeyword(
    text: string | null | undefined,
    keyword: string | null | undefined,
    caseSensitive = false
): boolean {
    if (!text || !keyword) return false;

    const searchText = caseSensitive ? text : text.toLowerCase();
    const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();

    return searchText.includes(searchKeyword);
}

/**
 * Calcule la densité d'un mot-clé dans un texte
 */
export function calculateKeywordDensity(
    text: string | null | undefined,
    keyword: string | null | undefined
): number {
    if (!text || !keyword) return 0;

    const cleanText = extractHtmlText(text).toLowerCase();
    const keywordLower = keyword.toLowerCase();

    // Compter les occurrences du mot-clé
    const words = cleanText.split(/\s+/).filter((w) => w.length > 0);
    const keywordOccurrences = words.filter((w) => w.includes(keywordLower)).length;

    if (words.length === 0) return 0;

    return keywordOccurrences / words.length;
}

/**
 * Détecte la présence d'un appel à l'action (CTA)
 */
export function detectCTA(text: string | null | undefined): boolean {
    if (!text) return false;

    const cleanText = extractHtmlText(text).toLowerCase();

    return CTA_WORDS.some((word) => cleanText.includes(word));
}

/**
 * Calcule le score basé sur une valeur et des seuils
 */
export function calculateScoreFromThresholds(
    value: number,
    thresholds: {
        min: number;
        optimal: number;
        max: number;
        acceptable_min?: number;
        acceptable_max?: number;
    }
): number {
    // Si dans la zone optimale
    if (value >= thresholds.optimal - 5 && value <= thresholds.optimal + 5) {
        return 100;
    }

    // Si dans la zone acceptable
    const acceptableMin = thresholds.acceptable_min ?? thresholds.min;
    const acceptableMax = thresholds.acceptable_max ?? thresholds.max;

    if (value >= acceptableMin && value <= acceptableMax) {
        // Score proportionnel à la distance de l'optimal
        const distance = Math.abs(value - thresholds.optimal);
        const maxDistance = Math.max(
            thresholds.optimal - acceptableMin,
            acceptableMax - thresholds.optimal
        );
        return Math.max(60, 100 - (distance / maxDistance) * 40);
    }

    // En dehors de la zone acceptable
    if (value < acceptableMin) {
        const ratio = value / acceptableMin;
        return Math.max(0, Math.round(ratio * 50));
    }

    if (value > acceptableMax) {
        const excess = value - acceptableMax;
        const maxExcess = acceptableMax * 0.5; // 50% de dépassement max
        const ratio = Math.min(1, excess / maxExcess);
        return Math.max(0, Math.round(50 - ratio * 50));
    }

    return 0;
}

// ============================================================================
// v2.0: REAL-TIME SEO ANALYSIS
// ============================================================================

/**
 * Count occurrences of a word in text (case insensitive)
 */
function countKeywordOccurrences(text: string, keyword: string): number {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
  return (text.match(regex) || []).length;
}

/**
 * Calculate Flesch Reading Ease Score (adapted for French)
 */
function calculateFleschScore(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch formula adapted for French
  const score = 207 - (1.015 * avgSentenceLength) - (73.6 * avgSyllablesPerWord);
  return Math.max(0, Math.min(100, score));
}

/**
 * Simple syllable counter (approximation for French)
 */
function countSyllables(word: string): number {
  const normalized = word.toLowerCase().replace(/[^a-zéèêëàâäùûüôöîïç]/g, '');
  if (normalized.length <= 3) return 1;

  const vowelGroups = normalized.match(/[aeiouyéèêëàâäùûüôöîï]+/gi) || [];
  let count = vowelGroups.length;

  // Silent 'e' at end
  if (normalized.endsWith('e') && !normalized.endsWith('ée')) {
    count = Math.max(1, count - 1);
  }

  return Math.max(1, count);
}

/**
 * Extract headings from markdown content
 */
function extractMarkdownHeadings(content: string): { level: number; text: string }[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: { level: number; text: string }[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({ level: match[1].length, text: match[2].trim() });
  }

  return headings;
}

/**
 * Get first paragraph of content (for keyword position check)
 */
function getFirstParagraph(content: string): string {
  const withoutHeadings = content.replace(/^#{1,6}\s+.+$/gm, '');
  const paragraphs = withoutHeadings.split(/\n\s*\n/).filter(p => p.trim().length > 50);
  return paragraphs[0] || '';
}

/**
 * Main real-time SEO analyzer
 * Provides instant feedback without API calls
 */
export function analyzeRealTimeSeo(
  content: string,
  keywords: string[] = [],
  options: {
    title?: string;
    metaDescription?: string;
    targetWordCount?: number;
  } = {}
): RealTimeSeoAnalysis {
  const { title = '', metaDescription = '', targetWordCount = 1500 } = options;

  // Basic metrics
  const cleanContent = extractHtmlText(content);
  const words = cleanContent.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const characterCount = cleanContent.length;
  const estimatedReadTime = Math.ceil(wordCount / 200);

  // Structure analysis
  const headings = extractMarkdownHeadings(content);
  const h2Count = headings.filter(h => h.level === 2).length;
  const h3Count = headings.filter(h => h.level === 3).length;
  const firstParagraph = getFirstParagraph(content);

  const structure: StructureAnalysis = {
    hasTitle: title.length > 0 || headings.some(h => h.level === 1),
    headingCount: headings.length,
    h2Count,
    h3Count,
    hasIntro: firstParagraph.length > 100,
    hasConclusion: /conclusion|résumé|pour\s+conclure|en\s+conclusion/i.test(content),
    hasFAQ: /faq|questions?\s+fréquentes?|q\s*:\s*/i.test(content),
    listCount: (content.match(/^[-*]\s|^\d+\.\s/gm) || []).length,
    imageCount: (content.match(/!\[.*?\]\(.*?\)/g) || []).length,
    linkCount: (content.match(/\[.*?\]\(https?:\/\/.*?\)/g) || []).length,
  };

  // Keyword analysis
  const keywordAnalysis: KeywordAnalysisItem[] = keywords.map(keyword => {
    const count = countKeywordOccurrences(cleanContent, keyword);
    const density = wordCount > 0 ? (count / wordCount) * 100 : 0;
    const inTitle = title.toLowerCase().includes(keyword.toLowerCase());
    const inHeadings = headings.some(h => h.text.toLowerCase().includes(keyword.toLowerCase()));
    const inFirstParagraph = firstParagraph.toLowerCase().includes(keyword.toLowerCase());

    let status: 'low' | 'optimal' | 'high' = 'optimal';
    if (density < 0.5) status = 'low';
    else if (density > 3) status = 'high';

    return { keyword, count, density: Math.round(density * 100) / 100, status, inTitle, inHeadings, inFirstParagraph };
  });

  // Readability analysis
  const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
  const avgWordLength = words.length > 0 ? words.reduce((sum, w) => sum + w.length, 0) / words.length : 0;
  const fleschScore = calculateFleschScore(cleanContent);

  let readabilityLevel: 'easy' | 'medium' | 'hard' = 'medium';
  if (fleschScore >= 60) readabilityLevel = 'easy';
  else if (fleschScore < 40) readabilityLevel = 'hard';

  const readability: ReadabilityMetrics = {
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    paragraphCount: paragraphs.length,
    avgParagraphLength: paragraphs.length > 0 ? Math.round(wordCount / paragraphs.length) : 0,
    fleschScore: Math.round(fleschScore),
    level: readabilityLevel,
  };

  // Problems detection
  const problems: SeoProblem[] = [];

  // Length problems
  if (wordCount < 300) {
    problems.push({ type: 'error', category: 'length', message: 'Article trop court (< 300 mots)', priority: 'high' });
  } else if (wordCount < targetWordCount * 0.8) {
    problems.push({ type: 'warning', category: 'length', message: `${wordCount}/${targetWordCount} mots`, priority: 'medium' });
  } else {
    problems.push({ type: 'success', category: 'length', message: `${wordCount}/${targetWordCount} mots`, priority: 'low' });
  }

  // Keyword problems
  keywordAnalysis.forEach((kw, idx) => {
    if (kw.status === 'low') {
      problems.push({ type: 'warning', category: 'keyword', message: `"${kw.keyword}" peu présent (${kw.density}%)`, priority: 'medium' });
    } else if (kw.status === 'high') {
      problems.push({ type: 'warning', category: 'keyword', message: `"${kw.keyword}" sur-optimisé (${kw.density}%)`, priority: 'high' });
    }
    if (!kw.inTitle && idx === 0) {
      problems.push({ type: 'warning', category: 'keyword', message: 'Mot-clé principal absent du titre', priority: 'high' });
    }
  });

  // Structure problems
  if (h2Count < 2) problems.push({ type: 'warning', category: 'structure', message: 'Ajoutez plus de sections H2', priority: 'medium' });
  if (structure.imageCount === 0) problems.push({ type: 'info', category: 'structure', message: 'Aucune image détectée', priority: 'low' });

  // Meta problems
  if (!title || title.length < 30) problems.push({ type: 'error', category: 'meta', message: 'Titre meta trop court', priority: 'high' });
  else if (title.length > 60) problems.push({ type: 'warning', category: 'meta', message: 'Titre meta trop long', priority: 'medium' });

  if (!metaDescription || metaDescription.length < 100) problems.push({ type: 'warning', category: 'meta', message: 'Meta description trop courte', priority: 'medium' });

  // Calculate scores
  const keywordScore = keywords.length > 0
    ? Math.min(100, keywordAnalysis.reduce((sum, kw) => {
        let score = kw.status === 'optimal' ? 30 : kw.status === 'low' ? 15 : 5;
        if (kw.inTitle) score += 25;
        if (kw.inHeadings) score += 20;
        if (kw.inFirstParagraph) score += 15;
        return sum + score;
      }, 0) / keywords.length)
    : 50;

  const readabilityScore = Math.min(100, Math.max(0, fleschScore + 20));
  const structureScore = Math.min(100,
    50 + (structure.hasTitle ? 10 : 0) + (structure.hasIntro ? 10 : 0) +
    (structure.hasConclusion ? 10 : 0) + (h2Count >= 2 ? 10 : 0) + (structure.listCount > 0 ? 5 : 0) +
    (structure.imageCount > 0 ? 5 : 0)
  );
  const metaScore = Math.min(100,
    (title && title.length >= 30 && title.length <= 60 ? 50 : title ? 25 : 0) +
    (metaDescription && metaDescription.length >= 100 && metaDescription.length <= 160 ? 50 : metaDescription ? 25 : 0)
  );
  const overallScore = Math.round((keywordScore * 0.3) + (readabilityScore * 0.2) + (structureScore * 0.3) + (metaScore * 0.2));

  return {
    score: { overall: overallScore, keyword: Math.round(keywordScore), readability: Math.round(readabilityScore), structure: structureScore, meta: metaScore },
    keywords: keywordAnalysis,
    readability,
    structure,
    problems: problems.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority])),
    wordCount,
    characterCount,
    estimatedReadTime,
  };
}

// ============================================================================
// SCORE UTILITIES (legacy — used by blog components)
// ============================================================================

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Bon';
  if (score >= 40) return 'À améliorer';
  return 'Faible';
}

// ============================================================================
// v3.0: UNIFIED PRODUCT SEO SCORING ENGINE
// ============================================================================

/**
 * Score a text field by character length against ideal thresholds.
 * Returns 0-100.
 */
function scoreByCharLength(
    text: string | null | undefined,
    thresholds: { min: number; idealMin: number; idealMax: number; max: number }
): number {
    const clean = extractHtmlText(text);
    const len = clean.length;

    if (len === 0) return 0;
    if (len < thresholds.min) return Math.round((len / thresholds.min) * 40);
    if (len >= thresholds.idealMin && len <= thresholds.idealMax) return 100;
    if (len < thresholds.idealMin) {
        const range = thresholds.idealMin - thresholds.min;
        const pos = len - thresholds.min;
        return Math.round(40 + (pos / range) * 60);
    }
    if (len <= thresholds.max) {
        const range = thresholds.max - thresholds.idealMax;
        const excess = len - thresholds.idealMax;
        return Math.round(100 - (excess / range) * 30);
    }
    // Beyond max
    const overMax = len - thresholds.max;
    const buffer = thresholds.max * 0.5;
    return Math.max(0, Math.round(70 - (overMax / buffer) * 70));
}

/**
 * Score the slug field by word count and format.
 */
function scoreSlug(slug: string | null | undefined): { score: number; issues: SeoIssue[] } {
    const issues: SeoIssue[] = [];
    const field: SeoFieldType = 'slug';

    if (!slug || slug.trim() === '') {
        issues.push({
            field, severity: 'critical', score: 0,
            title: 'Slug URL manquant',
            description: 'Aucun slug défini pour ce produit.',
            recommendation: 'Ajoutez un slug URL descriptif (ex: mon-produit-bio).',
        });
        return { score: 0, issues };
    }

    const cleanSlug = slug.replace(/^\/+|\/+$/g, '');
    const isClean = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(cleanSlug);
    const words = cleanSlug.split('-').filter(w => w.length > 0);
    const wordCount = words.length;

    let score = 0;
    const t = PRODUCT_FIELD_THRESHOLDS.slug;

    if (wordCount < t.minWords) {
        score = Math.round((wordCount / t.minWords) * 50);
        issues.push({
            field, severity: 'warning', score,
            title: 'Slug trop court',
            description: `${wordCount} mot(s) — visez ${t.idealMinWords}–${t.idealMaxWords} mots.`,
            recommendation: 'Enrichissez le slug avec des mots-clés pertinents.',
        });
    } else if (wordCount >= t.idealMinWords && wordCount <= t.idealMaxWords) {
        score = 100;
    } else if (wordCount > t.idealMaxWords && wordCount <= t.maxWords) {
        score = Math.round(100 - ((wordCount - t.idealMaxWords) / (t.maxWords - t.idealMaxWords)) * 30);
    } else if (wordCount > t.maxWords) {
        score = Math.max(20, Math.round(70 - ((wordCount - t.maxWords) / t.maxWords) * 50));
        issues.push({
            field, severity: 'warning', score,
            title: 'Slug trop long',
            description: `${wordCount} mots — les URLs courtes sont mieux référencées.`,
            recommendation: `Réduisez à ${t.idealMaxWords} mots maximum.`,
        });
    }

    if (!isClean) {
        score = Math.min(score, 40);
        issues.push({
            field, severity: 'warning', score,
            title: 'Format de slug non optimal',
            description: 'Le slug contient des caractères non recommandés.',
            recommendation: 'Utilisez uniquement des minuscules, chiffres et tirets (ex: mon-produit-bio).',
        });
    }

    return { score, issues };
}

/**
 * Score image count.
 */
function scoreImages(images: ProductSeoInput['images']): { score: number; issues: SeoIssue[] } {
    const issues: SeoIssue[] = [];
    const field: SeoFieldType = 'images';
    const count = images.length;

    let score: number;
    if (count === 0) {
        score = 0;
        issues.push({
            field, severity: 'warning', score: 0,
            title: 'Aucune image produit',
            description: 'Les images augmentent le taux de conversion et le référencement.',
            recommendation: 'Ajoutez au moins 3 photos de qualité.',
        });
    } else if (count === 1) {
        score = 40;
        issues.push({
            field, severity: 'info', score: 40,
            title: 'Une seule image',
            description: 'Plusieurs angles améliorent l\'expérience utilisateur.',
            recommendation: 'Ajoutez 2–4 images supplémentaires.',
        });
    } else if (count === 2) {
        score = 65;
    } else if (count >= 3 && count < 5) {
        score = 85;
    } else {
        score = 100;
    }

    return { score, issues };
}

/**
 * Score alt text coverage across images.
 */
function scoreAltText(images: ProductSeoInput['images']): { score: number; issues: SeoIssue[] } {
    const issues: SeoIssue[] = [];
    const field: SeoFieldType = 'alt_text';

    if (images.length === 0) {
        return { score: 0, issues: [{ field, severity: 'info', score: 0, title: 'Pas d\'images pour vérifier les alt texts', description: 'Ajoutez d\'abord des images au produit.', recommendation: null }] };
    }

    const withAlt = images.filter(img => img.alt && img.alt.trim().length > 0).length;
    const ratio = withAlt / images.length;
    const score = Math.round(ratio * 100);

    if (ratio < 1) {
        const missing = images.length - withAlt;
        issues.push({
            field, severity: ratio === 0 ? 'critical' : 'warning', score,
            title: `${missing} image(s) sans texte alternatif`,
            description: `${withAlt}/${images.length} images ont un alt text renseigné.`,
            recommendation: 'Décrivez chaque image avec un alt text incluant le mot-clé principal.',
        });
    }

    return { score, issues };
}

/**
 * Score keyword presence across key fields (bonus criterion).
 */
function scoreKeywordPresence(input: ProductSeoInput): { score: number; issues: SeoIssue[] } {
    const issues: SeoIssue[] = [];
    const field: SeoFieldType = 'keyword_presence';
    const kw = input.focus_keyword?.trim().toLowerCase();

    if (!kw) {
        return { score: 0, issues: [{ field, severity: 'info', score: 0, title: 'Aucun mot-clé principal défini', description: 'Définissez un mot-clé focus pour améliorer le score.', recommendation: 'Renseignez le mot-clé principal du produit.' }] };
    }

    const checks = [
        { name: 'titre', text: input.title },
        { name: 'titre SEO', text: input.meta_title },
        { name: 'méta-description', text: input.meta_description },
        { name: 'slug', text: input.slug },
    ];

    let found = 0;
    const missing: string[] = [];

    for (const check of checks) {
        if (detectKeyword(check.text, kw)) {
            found++;
        } else {
            missing.push(check.name);
        }
    }

    const score = Math.round((found / checks.length) * 100);

    if (missing.length > 0) {
        issues.push({
            field, severity: found === 0 ? 'critical' : 'warning', score,
            title: `Mot-clé absent de ${missing.length} champ(s)`,
            description: `"${input.focus_keyword}" manque dans : ${missing.join(', ')}.`,
            recommendation: `Intégrez "${input.focus_keyword}" naturellement dans ces champs.`,
        });
    }

    return { score, issues };
}

/**
 * Score CTA presence in meta description and short description (bonus criterion).
 */
function scoreCTA(input: ProductSeoInput): { score: number; issues: SeoIssue[] } {
    const issues: SeoIssue[] = [];
    const field: SeoFieldType = 'cta_detection';

    const inMeta = detectCTA(input.meta_description);
    const inShort = detectCTA(input.short_description);

    let score: number;
    if (inMeta && inShort) {
        score = 100;
    } else if (inMeta || inShort) {
        score = 60;
        issues.push({
            field, severity: 'info', score: 60,
            title: 'CTA partiel',
            description: `Appel à l'action détecté dans ${inMeta ? 'la méta-description' : 'la description courte'} uniquement.`,
            recommendation: 'Ajoutez un verbe d\'action (découvrez, profitez...) dans les deux champs.',
        });
    } else {
        score = 0;
        issues.push({
            field, severity: 'warning', score: 0,
            title: 'Aucun appel à l\'action détecté',
            description: 'Les CTA améliorent le taux de clic dans les résultats Google.',
            recommendation: 'Ajoutez un mot d\'action : achetez, découvrez, profitez, commandez...',
        });
    }

    return { score, issues };
}

/**
 * Score GSC traffic signal (bonus criterion).
 * Returns neutral score (50) if no GSC data — never penalizes.
 */
function scoreGscTrafficSignal(gscData?: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>): { score: number; issues: SeoIssue[] } {
    const issues: SeoIssue[] = [];
    const field: SeoFieldType = 'gsc_traffic_signal';

    if (!gscData || gscData.length === 0) {
        // No GSC connected — neutral score, no penalty
        return { score: 50, issues: [] };
    }

    const topKeyword = gscData[0]; // sorted by impressions desc from RPC

    // Score based on impressions (log scale)
    const impressionScore = Math.min(80, Math.log10(Math.max(topKeyword.impressions, 1)) * 25);

    // Bonus if position <= 10 (first page of Google)
    const positionBonus = topKeyword.position <= 10 ? 20 : topKeyword.position <= 20 ? 10 : 0;

    const score = Math.min(100, Math.round(impressionScore + positionBonus));

    if (topKeyword.position > 20) {
        issues.push({
            field, severity: 'info', score,
            title: `Position moyenne : ${topKeyword.position.toFixed(1)}`,
            description: `Le mot-clé "${topKeyword.query}" est en position ${topKeyword.position.toFixed(1)} sur Google.`,
            recommendation: 'Optimisez le contenu pour viser les 10 premières positions.',
        });
    }

    if (topKeyword.impressions > 0 && topKeyword.ctr < 0.02) {
        issues.push({
            field, severity: 'info', score,
            title: `CTR faible (${(topKeyword.ctr * 100).toFixed(1)}%)`,
            description: `Le mot-clé "${topKeyword.query}" a des impressions mais un faible taux de clic.`,
            recommendation: 'Améliorez le meta title et la meta description pour inciter au clic.',
        });
    }

    return { score, issues };
}

/**
 * Score a text field and generate issues.
 */
function scoreTextField(
    value: string | null | undefined,
    fieldKey: SeoFieldType,
    label: string,
    thresholds: { min: number; idealMin: number; idealMax: number; max: number }
): { score: number; issues: SeoIssue[] } {
    const issues: SeoIssue[] = [];
    const clean = extractHtmlText(value);
    const len = clean.length;

    if (len === 0) {
        issues.push({
            field: fieldKey, severity: 'critical', score: 0,
            title: `${label} manquant`,
            description: `Le champ ${label.toLowerCase()} est vide.`,
            recommendation: `Rédigez un ${label.toLowerCase()} de ${thresholds.idealMin}–${thresholds.idealMax} caractères.`,
        });
        return { score: 0, issues };
    }

    const score = scoreByCharLength(value, thresholds);

    if (len < thresholds.min) {
        issues.push({
            field: fieldKey, severity: 'warning', score,
            title: `${label} trop court`,
            description: `${len} caractères — minimum recommandé : ${thresholds.min}.`,
            recommendation: `Enrichissez pour atteindre ${thresholds.idealMin}–${thresholds.idealMax} caractères.`,
        });
    } else if (len > thresholds.max) {
        issues.push({
            field: fieldKey, severity: 'warning', score,
            title: `${label} trop long`,
            description: `${len} caractères — Google tronquera au-delà de ${thresholds.max}.`,
            recommendation: `Réduisez à ${thresholds.idealMax} caractères maximum.`,
        });
    }

    return { score, issues };
}

/**
 * ========================================================================
 * MAIN: Calculate unified product SEO score
 * Pure function — no React, no Supabase, no side effects.
 * ========================================================================
 */
export function calculateProductSeoScore(input: ProductSeoInput): ProductSeoResult {
    const t = PRODUCT_FIELD_THRESHOLDS;

    // Score each criterion
    const metaTitleResult = scoreTextField(input.meta_title, 'meta_title', 'Titre SEO', t.meta_title);
    const metaDescResult = scoreTextField(input.meta_description, 'meta_description', 'Méta-description', t.meta_description);
    const titleResult = scoreTextField(input.title, 'title', 'Titre', t.title);
    const shortDescResult = scoreTextField(input.short_description, 'short_description', 'Description courte', t.short_description);
    const descResult = scoreTextField(input.description, 'description', 'Description longue', t.description);
    const slugResult = scoreSlug(input.slug);
    const imagesResult = scoreImages(input.images);
    const altTextResult = scoreAltText(input.images);
    const keywordResult = scoreKeywordPresence(input);
    const ctaResult = scoreCTA(input);
    const gscResult = scoreGscTrafficSignal(input.gsc_data);

    // Build criteria array
    const criteriaMap: Array<{ key: SeoFieldType; label: string; score: number; issues: SeoIssue[] }> = [
        { key: 'meta_title', label: 'Titre SEO', ...metaTitleResult },
        { key: 'meta_description', label: 'Méta-description', ...metaDescResult },
        { key: 'title', label: 'Titre', ...titleResult },
        { key: 'short_description', label: 'Description courte', ...shortDescResult },
        { key: 'description', label: 'Description longue', ...descResult },
        { key: 'slug', label: 'URL (slug)', ...slugResult },
        { key: 'images', label: 'Images', ...imagesResult },
        { key: 'alt_text', label: 'Alt text images', ...altTextResult },
        { key: 'keyword_presence', label: 'Mot-clé principal', ...keywordResult },
        { key: 'cta_detection', label: 'Appel à l\'action', ...ctaResult },
        { key: 'gsc_traffic_signal', label: 'Signal trafic GSC', ...gscResult },
    ];

    const criteria: ProductSeoCriterion[] = criteriaMap.map(c => {
        const weightConfig = PRODUCT_SEO_WEIGHTS[c.key] ?? { weight: 1, isBonus: false };
        return {
            key: c.key,
            label: c.label,
            score: c.score,
            weight: weightConfig.weight,
            issues: c.issues,
            isBonus: weightConfig.isBonus,
        };
    });

    // Calculate overall: weighted average of base criteria + bonus points
    const baseCriteria = criteria.filter(c => !c.isBonus);
    const bonusCriteria = criteria.filter(c => c.isBonus);

    const totalBaseWeight = baseCriteria.reduce((sum, c) => sum + c.weight, 0);
    const baseWeightedSum = baseCriteria.reduce((sum, c) => sum + c.score * c.weight, 0);
    const baseScore = totalBaseWeight > 0 ? baseWeightedSum / totalBaseWeight : 0;

    // Bonus: each bonus criterion contributes proportionally to its weight / totalBonusWeight * maxBonusPoints
    const maxBonusPoints = 8; // Maximum bonus points that can be added
    const totalBonusWeight = bonusCriteria.reduce((sum, c) => sum + c.weight, 0);
    const bonusPoints = totalBonusWeight > 0
        ? bonusCriteria.reduce((sum, c) => sum + (c.score / 100) * (c.weight / totalBonusWeight) * maxBonusPoints, 0)
        : 0;

    const overall = Math.min(100, Math.round(baseScore + bonusPoints));

    // Collect all issues
    const allIssues = criteria.flatMap(c => c.issues);

    // Build fieldScores record
    const fieldScores: Record<string, number> = {};
    for (const c of criteria) {
        fieldScores[c.key] = c.score;
    }

    return {
        overall,
        level: getSeoLevel(overall),
        criteria,
        issues: allIssues.sort((a, b) => {
            const severityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        }),
        fieldScores,
    };
}

// ============================================================================
// SEO BREAKDOWN — Aggregate criteria into 4 categories for dashboard display
// ============================================================================

export interface SeoBreakdown {
    // 4-category aggregates /25 (legacy + radar radar summary)
    titles: number;       // /25 — meta_title + title
    descriptions: number; // /25 — meta_description + short_description + description
    images: number;       // /25 — images + alt_text
    technical: number;    // /25 — slug + bonus criteria
    // Per-field scores 0-100 — populated from v2+ analyzer, optional for backwards compat
    f_meta_title?: number;       // meta_title score 0-100
    f_title?: number;            // product title score 0-100
    f_meta_description?: number; // meta_description score 0-100
    f_description?: number;      // avg(short_description, description) 0-100
    f_images?: number;           // avg(images_count, alt_text) 0-100
    f_slug?: number;             // slug/URL score 0-100
}

/**
 * Compute a 4-category breakdown from SEO criteria.
 * Each category is normalized to /25 (total = 100).
 */
export function computeSeoBreakdown(criteria: ProductSeoCriterion[]): SeoBreakdown {
    const byKey = new Map(criteria.map(c => [c.key, c]));

    const weightedAvg = (keys: SeoFieldType[]): number => {
        let totalW = 0;
        let sumWS = 0;
        for (const k of keys) {
            const c = byKey.get(k);
            if (c) {
                totalW += c.weight;
                sumWS += c.score * c.weight;
            }
        }
        return totalW > 0 ? sumWS / totalW : 0;
    };

    // Each category: weighted average of its fields (0-100), then scaled to /25
    const titlesAvg = weightedAvg(['meta_title', 'title']);
    const descriptionsAvg = weightedAvg(['meta_description', 'short_description', 'description']);
    const imagesAvg = weightedAvg(['images', 'alt_text']);
    const technicalAvg = weightedAvg(['slug', 'keyword_presence', 'cta_detection', 'gsc_traffic_signal']);

    const get = (key: SeoFieldType) => byKey.get(key)?.score ?? 0;

    return {
        titles:       Math.round(titlesAvg * 25 / 100),
        descriptions: Math.round(descriptionsAvg * 25 / 100),
        images:       Math.round(imagesAvg * 25 / 100),
        technical:    Math.round(technicalAvg * 25 / 100),
        // Per-field scores 0-100
        f_meta_title:       get('meta_title'),
        f_title:            get('title'),
        f_meta_description: get('meta_description'),
        f_description:      Math.round((get('short_description') + get('description')) / 2),
        f_images:           Math.round((get('images') + get('alt_text')) / 2),
        f_slug:             get('slug'),
    };
}
