/**
 * Client-Side SEO Analyzer v2.0
 *
 * Provides instant SEO feedback without API calls.
 * Analyzes keyword density, readability, structure, and more.
 */

import { CTA_WORDS } from './constants';

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
// SCORE UTILITIES
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
