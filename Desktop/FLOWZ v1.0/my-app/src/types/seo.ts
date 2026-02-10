/**
 * Types pour le système d'analyse SEO des fiches produit
 */

export type SeoFieldType =
    | 'title'
    | 'short_description'
    | 'description'
    | 'meta_title'
    | 'meta_description'
    | 'slug'
    | 'images'
    | 'keywords'
    | 'semantic_quality';

export type SeoIssueSeverity = 'critical' | 'warning' | 'info' | 'success';

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
 * Données formatées pour l'UI
 */
export interface SeoAnalysisData {
    overallScore: number;
    fieldScores: Record<SeoFieldType | string, number>;
    issues: SeoIssue[];
    isAnalyzing: boolean;
}
