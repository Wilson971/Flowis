/**
 * SeoFieldRecommendations - Recommandations SEO pour les champs produit
 */
'use client';

import { useMemo } from 'react';
import {
    AlertCircle,
    CheckCircle,
    XCircle,
    Info,
    Lightbulb,
    ChevronDown,
    ChevronUp,
    Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export type SeoFieldType = 'title' | 'description' | 'short_description' | 'seo_title' | 'seo_description' | 'slug' | 'image_alt';

export interface SeoFieldAnalysis {
    field: SeoFieldType;
    value: string;
    score: number;
    issues: SeoIssue[];
    recommendations: SeoRecommendation[];
}

export interface SeoIssue {
    type: 'error' | 'warning' | 'info';
    message: string;
    suggestion?: string;
}

export interface SeoRecommendation {
    priority: 'high' | 'medium' | 'low';
    message: string;
    action?: string;
}

interface SeoFieldRecommendationsProps {
    field: SeoFieldType;
    value: string;
    focusKeyword?: string;
    onGenerateClick?: () => void;
    className?: string;
}

// ============================================================================
// Field Configuration
// ============================================================================

const fieldConfig: Record<SeoFieldType, {
    label: string;
    minLength: number;
    maxLength: number;
    optimalMin: number;
    optimalMax: number;
}> = {
    title: {
        label: 'Titre produit',
        minLength: 10,
        maxLength: 200,
        optimalMin: 30,
        optimalMax: 70,
    },
    description: {
        label: 'Description',
        minLength: 100,
        maxLength: 5000,
        optimalMin: 300,
        optimalMax: 2000,
    },
    short_description: {
        label: 'Description courte',
        minLength: 50,
        maxLength: 400,
        optimalMin: 100,
        optimalMax: 200,
    },
    seo_title: {
        label: 'Titre SEO',
        minLength: 30,
        maxLength: 60,
        optimalMin: 50,
        optimalMax: 60,
    },
    seo_description: {
        label: 'Meta description',
        minLength: 120,
        maxLength: 160,
        optimalMin: 150,
        optimalMax: 160,
    },
    slug: {
        label: 'Slug URL',
        minLength: 3,
        maxLength: 75,
        optimalMin: 10,
        optimalMax: 50,
    },
    image_alt: {
        label: 'Texte alternatif',
        minLength: 10,
        maxLength: 125,
        optimalMin: 50,
        optimalMax: 100,
    },
};

// ============================================================================
// Analysis Functions
// ============================================================================

function analyzeField(
    field: SeoFieldType,
    value: string,
    focusKeyword?: string
): SeoFieldAnalysis {
    const config = fieldConfig[field];
    const issues: SeoIssue[] = [];
    const recommendations: SeoRecommendation[] = [];
    let score = 100;

    const length = value?.length || 0;
    const words = value?.split(/\s+/).filter(Boolean) || [];
    const wordCount = words.length;

    // Length checks
    if (length === 0) {
        issues.push({
            type: 'error',
            message: `${config.label} est vide`,
            suggestion: `Ajoutez un contenu d'au moins ${config.minLength} caractères`,
        });
        score = 0;
    } else if (length < config.minLength) {
        issues.push({
            type: 'warning',
            message: `${config.label} trop court (${length}/${config.minLength} min)`,
            suggestion: `Ajoutez ${config.minLength - length} caractères supplémentaires`,
        });
        score -= 30;
    } else if (length > config.maxLength) {
        issues.push({
            type: 'error',
            message: `${config.label} trop long (${length}/${config.maxLength} max)`,
            suggestion: `Réduisez de ${length - config.maxLength} caractères`,
        });
        score -= 40;
    } else if (length < config.optimalMin) {
        issues.push({
            type: 'info',
            message: `Longueur en dessous de l'optimal (${length}/${config.optimalMin}-${config.optimalMax})`,
        });
        score -= 10;
    } else if (length > config.optimalMax) {
        issues.push({
            type: 'info',
            message: `Longueur au-dessus de l'optimal (${length}/${config.optimalMin}-${config.optimalMax})`,
        });
        score -= 5;
    }

    // Focus keyword checks
    if (focusKeyword && length > 0) {
        const keywordLower = focusKeyword.toLowerCase();
        const valueLower = value.toLowerCase();

        if (!valueLower.includes(keywordLower)) {
            issues.push({
                type: 'warning',
                message: `Mot-clé "${focusKeyword}" absent`,
                suggestion: `Intégrez naturellement le mot-clé principal`,
            });
            score -= 20;
            recommendations.push({
                priority: 'high',
                message: `Ajoutez le mot-clé "${focusKeyword}" dans le contenu`,
                action: 'add_keyword',
            });
        } else {
            // Check keyword position for titles
            if ((field === 'title' || field === 'seo_title') && !valueLower.startsWith(keywordLower)) {
                recommendations.push({
                    priority: 'medium',
                    message: `Placez le mot-clé en début de titre pour un meilleur impact SEO`,
                    action: 'move_keyword',
                });
            }
        }
    }

    // Field-specific checks
    if (field === 'description' || field === 'short_description') {
        // Check for HTML (might be okay in rich editors)
        if (value?.includes('<script') || value?.includes('javascript:')) {
            issues.push({
                type: 'error',
                message: 'Contenu potentiellement dangereux détecté',
            });
            score -= 50;
        }

        // Readability check
        if (wordCount > 0) {
            const avgWordLength = length / wordCount;
            if (avgWordLength > 8) {
                recommendations.push({
                    priority: 'low',
                    message: 'Utilisez des mots plus simples pour améliorer la lisibilité',
                });
            }
        }
    }

    if (field === 'seo_description') {
        // Call to action check
        const ctaWords = ['découvrez', 'achetez', 'profitez', 'commandez', 'essayez', 'obtenez'];
        const hasCTA = ctaWords.some(word => value?.toLowerCase().includes(word));

        if (!hasCTA && length > 0) {
            recommendations.push({
                priority: 'medium',
                message: 'Ajoutez un appel à l\'action pour améliorer le CTR',
                action: 'add_cta',
            });
        }
    }

    if (field === 'slug') {
        // Slug format check
        if (value?.includes(' ')) {
            issues.push({
                type: 'error',
                message: 'Le slug ne doit pas contenir d\'espaces',
                suggestion: 'Remplacez les espaces par des tirets',
            });
            score -= 30;
        }
        if (/[^a-z0-9-]/.test(value || '')) {
            issues.push({
                type: 'warning',
                message: 'Le slug contient des caractères spéciaux',
                suggestion: 'Utilisez uniquement des lettres minuscules, chiffres et tirets',
            });
            score -= 15;
        }
    }

    // Generate recommendations if not too many issues
    if (issues.filter(i => i.type === 'error').length === 0 && recommendations.length === 0) {
        if (score >= 80) {
            recommendations.push({
                priority: 'low',
                message: 'Excellent ! Le contenu est bien optimisé',
            });
        }
    }

    return {
        field,
        value,
        score: Math.max(0, Math.min(100, score)),
        issues,
        recommendations,
    };
}

// ============================================================================
// Components
// ============================================================================

function IssueIcon({ type }: { type: SeoIssue['type'] }) {
    switch (type) {
        case 'error':
            return <XCircle className="h-4 w-4 text-red-500" />;
        case 'warning':
            return <AlertCircle className="h-4 w-4 text-amber-500" />;
        case 'info':
            return <Info className="h-4 w-4 text-blue-500" />;
    }
}

export function SeoFieldRecommendations({
    field,
    value,
    focusKeyword,
    onGenerateClick,
    className,
}: SeoFieldRecommendationsProps) {
    const [isOpen, setIsOpen] = useState(false);

    const analysis = useMemo(
        () => analyzeField(field, value, focusKeyword),
        [field, value, focusKeyword]
    );

    const config = fieldConfig[field];
    const length = value?.length || 0;
    const lengthPercent = Math.min(100, (length / config.maxLength) * 100);

    const hasIssues = analysis.issues.length > 0;
    const errorCount = analysis.issues.filter(i => i.type === 'error').length;
    const warningCount = analysis.issues.filter(i => i.type === 'warning').length;

    const scoreColor = analysis.score >= 80
        ? 'text-green-600'
        : analysis.score >= 60
            ? 'text-amber-600'
            : 'text-red-600';

    return (
        <div className={cn('rounded-lg border bg-card p-3 space-y-3', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={cn('text-lg font-bold', scoreColor)}>
                        {analysis.score}
                    </span>
                    <span className="text-sm text-muted-foreground">/100</span>

                    {errorCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                            {errorCount} erreur{errorCount > 1 ? 's' : ''}
                        </Badge>
                    )}
                    {warningCount > 0 && (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                            {warningCount} avertissement{warningCount > 1 ? 's' : ''}
                        </Badge>
                    )}
                </div>

                {onGenerateClick && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onGenerateClick}
                    >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Générer
                    </Button>
                )}
            </div>

            {/* Length indicator */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Longueur</span>
                    <span className={cn(
                        length < config.minLength && 'text-amber-600',
                        length > config.maxLength && 'text-red-600'
                    )}>
                        {length} / {config.maxLength}
                    </span>
                </div>
                <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                    <div
                        className={cn(
                            'absolute inset-y-0 left-0 rounded-full transition-all',
                            length < config.minLength && 'bg-amber-500',
                            length >= config.minLength && length <= config.maxLength && 'bg-green-500',
                            length > config.maxLength && 'bg-red-500'
                        )}
                        style={{ width: `${lengthPercent}%` }}
                    />
                    {/* Optimal zone indicator */}
                    <div
                        className="absolute inset-y-0 bg-green-500/20 border-x border-green-500"
                        style={{
                            left: `${(config.optimalMin / config.maxLength) * 100}%`,
                            width: `${((config.optimalMax - config.optimalMin) / config.maxLength) * 100}%`,
                        }}
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    Zone optimale: {config.optimalMin}-{config.optimalMax} caractères
                </p>
            </div>

            {/* Issues & Recommendations */}
            {hasIssues && (
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-between"
                        >
                            <span className="text-sm">
                                {analysis.issues.length} problème{analysis.issues.length > 1 ? 's' : ''} · {analysis.recommendations.length} recommandation{analysis.recommendations.length > 1 ? 's' : ''}
                            </span>
                            {isOpen ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 pt-2">
                        {/* Issues */}
                        {analysis.issues.map((issue, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-2 text-sm p-2 rounded bg-muted/50"
                            >
                                <IssueIcon type={issue.type} />
                                <div className="flex-1">
                                    <p>{issue.message}</p>
                                    {issue.suggestion && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            💡 {issue.suggestion}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Recommendations */}
                        {analysis.recommendations.map((rec, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-2 text-sm p-2 rounded bg-blue-50 dark:bg-blue-950/20"
                            >
                                <Lightbulb className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                <p className="text-blue-700 dark:text-blue-400">{rec.message}</p>
                            </div>
                        ))}
                    </CollapsibleContent>
                </Collapsible>
            )}

            {/* All good message */}
            {!hasIssues && analysis.score >= 80 && (
                <div className="flex items-center gap-2 text-sm text-green-600 p-2 rounded bg-green-50 dark:bg-green-950/20">
                    <CheckCircle className="h-4 w-4" />
                    <span>Excellent ! Ce champ est bien optimisé.</span>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Quick Score Component
// ============================================================================

export function SeoFieldScore({
    field,
    value,
    focusKeyword,
    size = 'sm',
}: {
    field: SeoFieldType;
    value: string;
    focusKeyword?: string;
    size?: 'sm' | 'md';
}) {
    const analysis = useMemo(
        () => analyzeField(field, value, focusKeyword),
        [field, value, focusKeyword]
    );

    const color = analysis.score >= 80
        ? 'bg-green-500'
        : analysis.score >= 60
            ? 'bg-amber-500'
            : 'bg-red-500';

    return (
        <div className={cn('flex items-center gap-1.5', size === 'sm' ? 'text-xs' : 'text-sm')}>
            <div className={cn('rounded-full', color, size === 'sm' ? 'h-2 w-2' : 'h-3 w-3')} />
            <span className="text-muted-foreground">{analysis.score}</span>
        </div>
    );
}
