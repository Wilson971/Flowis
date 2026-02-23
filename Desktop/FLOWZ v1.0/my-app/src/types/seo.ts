/**
 * Types pour le système d'analyse SEO des fiches produit
 */

// ============================================================================
// FIELD TYPES & SEVERITY
// ============================================================================

export type SeoFieldType =
    | 'title'
    | 'short_description'
    | 'description'
    | 'meta_title'
    | 'meta_description'
    | 'slug'
    | 'images'
    | 'alt_text'
    | 'keyword_presence'
    | 'cta_detection'
    | 'gsc_traffic_signal';

export type SeoIssueSeverity = 'critical' | 'warning' | 'info' | 'success';

// ============================================================================
// SEO LEVELS (5-tier unified system)
// ============================================================================

export type SeoLevelKey = 'excellent' | 'good' | 'average' | 'poor' | 'critical';

export interface SeoLevel {
    key: SeoLevelKey;
    label: string;
    min: number;
    textColor: string;
    bgColor: string;
    borderColor: string;
    strokeColor: string;
}

// ============================================================================
// ISSUES & FIELD ANALYSIS
// ============================================================================

/**
 * Problème SEO détecté
 */
export interface SeoIssue {
    id?: string;
    field: SeoFieldType;
    severity: SeoIssueSeverity;
    title: string;
    description: string;
    recommendation?: string | null;
    score: number; // 0-100
}

/**
 * Analyse d'un champ spécifique
 */
export interface SeoFieldAnalysis {
    field: SeoFieldType;
    score: number; // 0-100
    issues: SeoIssue[];
}

/**
 * Données formatées pour l'UI (contrat stable pour les hooks/composants existants)
 */
export interface SeoAnalysisData {
    overallScore: number;
    fieldScores: Record<string, number>;
    issues: SeoIssue[];
    isAnalyzing: boolean;
}

// ============================================================================
// PRODUCT SEO ENGINE (unified scoring)
// ============================================================================

/**
 * Input pour le moteur de scoring produit unifié
 */
/**
 * GSC keyword data (from Google Search Console)
 */
export interface GscKeywordData {
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

export interface ProductSeoInput {
    title: string;
    short_description: string;
    description: string;
    meta_title: string;
    meta_description: string;
    slug: string;
    images: Array<{ src?: string; alt?: string }>;
    focus_keyword?: string;
    gsc_data?: GscKeywordData[];
}

/**
 * Résultat d'un critère individuel
 */
export interface ProductSeoCriterion {
    key: SeoFieldType;
    label: string;
    score: number; // 0-100
    weight: number;
    issues: SeoIssue[];
    isBonus: boolean;
}

/**
 * Résultat complet du scoring produit
 */
export interface ProductSeoResult {
    overall: number; // 0-100
    level: SeoLevel;
    criteria: ProductSeoCriterion[];
    issues: SeoIssue[];
    fieldScores: Record<string, number>;
}
