/**
 * Design System - Badge Tokens
 * 
 * Structure de tokens réutilisables pour tous les badges de l'application.
 * Ces tokens définissent les variantes, tailles et styles des badges.
 */

import { LucideIcon } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export type BadgeVariant =
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral'
    | 'sync'      // Pour les états de synchronisation
    | 'edit'      // Pour les états d'édition
    | 'pending'   // Pour les états en attente
    | 'active';   // Pour les états actifs

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

// ============================================
// VARIANT STYLES (Couleurs & Gradients)
// ============================================

export const badgeVariantStyles: Record<BadgeVariant, {
    gradient: string;
    text: string;
    indicatorColor: string;
}> = {
    success: {
        gradient: 'from-success/10 via-success/8 to-success/10',
        text: 'text-success',
        indicatorColor: 'bg-success',
    },
    warning: {
        gradient: 'from-warning/10 via-warning/8 to-warning/10',
        text: 'text-warning',
        indicatorColor: 'bg-warning',
    },
    danger: {
        gradient: 'from-destructive/10 via-destructive/8 to-destructive/10',
        text: 'text-destructive',
        indicatorColor: 'bg-destructive',
    },
    info: {
        gradient: 'from-info/10 via-info/8 to-info/10',
        text: 'text-info',
        indicatorColor: 'bg-info',
    },
    neutral: {
        gradient: 'from-muted via-muted/90 to-muted',
        text: 'text-muted-foreground',
        indicatorColor: 'bg-muted-foreground',
    },
    sync: {
        gradient: 'from-primary/10 via-primary/8 to-primary/10',
        text: 'text-primary',
        indicatorColor: 'bg-primary',
    },
    edit: {
        gradient: 'from-warning/10 via-warning/8 to-warning/10',
        text: 'text-warning',
        indicatorColor: 'bg-warning',
    },
    pending: {
        gradient: 'from-info/10 via-info/8 to-info/10',
        text: 'text-info',
        indicatorColor: 'bg-info',
    },
    active: {
        gradient: 'from-primary/10 via-primary/8 to-primary/10',
        text: 'text-primary',
        indicatorColor: 'bg-primary',
    },
};

// ============================================
// SIZE STYLES (Dimensions & Typography)
// ============================================

export const badgeSizeStyles: Record<BadgeSize, {
    text: string;
    padding: string;
    iconSize: string;
    indicatorSize: string;
    gap: string;
}> = {
    xs: {
        text: 'text-[9px]',
        padding: 'px-2 py-0.5',
        iconSize: 'h-2.5 w-2.5',
        indicatorSize: 'w-1 h-1',
        gap: 'gap-1',
    },
    sm: {
        text: 'text-[10px]',
        padding: 'px-2.5 py-1',
        iconSize: 'h-3 w-3',
        indicatorSize: 'w-1 h-1',
        gap: 'gap-1',
    },
    md: {
        text: 'text-xs',
        padding: 'px-3 py-1.5',
        iconSize: 'h-3.5 w-3.5',
        indicatorSize: 'w-1.5 h-1.5',
        gap: 'gap-1.5',
    },
    lg: {
        text: 'text-sm',
        padding: 'px-4 py-2',
        iconSize: 'h-4 w-4',
        indicatorSize: 'w-2 h-2',
        gap: 'gap-2',
    },
};

// ============================================
// BASE STYLES (Classes communes)
// ============================================

export const badgeBaseStyles = {
    container: 'inline-flex items-center',
    badge: [
        'bg-gradient-to-r',
        'border-0',
        'font-bold',
        'uppercase',
        'tracking-wider',
        'rounded-full',
        'backdrop-blur-sm',
    ].join(' '),
    indicator: 'rounded-full animate-pulse',
} as const;

// ============================================
// PRESET BADGES (Badges prédéfinis avec icônes)
// ============================================

export type BadgePreset = {
    label: string;
    variant: BadgeVariant;
    iconName: string; // Nom de l'icône Lucide
};

export const badgePresets: Record<string, BadgePreset> = {
    // États de synchronisation
    synced: {
        label: 'Synchronisé',
        variant: 'sync',
        iconName: 'Cloud',
    },
    syncing: {
        label: 'Synchronisation...',
        variant: 'info',
        iconName: 'CloudUpload',
    },
    syncError: {
        label: 'Erreur sync',
        variant: 'danger',
        iconName: 'CloudOff',
    },

    // États d'édition
    modified: {
        label: 'Modifié',
        variant: 'edit',
        iconName: 'Pencil',
    },
    draft: {
        label: 'Brouillon',
        variant: 'warning',
        iconName: 'FileEdit',
    },

    // États de publication
    published: {
        label: 'Publié',
        variant: 'success',
        iconName: 'CheckCircle2',
    },
    unpublished: {
        label: 'Non publié',
        variant: 'neutral',
        iconName: 'EyeOff',
    },

    // États actifs
    active: {
        label: 'Actif',
        variant: 'active',
        iconName: 'Zap',
    },
    inactive: {
        label: 'Inactif',
        variant: 'neutral',
        iconName: 'Moon',
    },

    // États de connexion
    connected: {
        label: 'Connecté',
        variant: 'success',
        iconName: 'Wifi',
    },
    disconnected: {
        label: 'Déconnecté',
        variant: 'danger',
        iconName: 'WifiOff',
    },

    // États d'attente
    pending: {
        label: 'En attente',
        variant: 'pending',
        iconName: 'Clock',
    },
    processing: {
        label: 'Traitement...',
        variant: 'info',
        iconName: 'Loader2',
    },

    // États SEO/Optimisation
    optimized: {
        label: 'Optimisé',
        variant: 'success',
        iconName: 'Sparkles',
    },
    needsOptimization: {
        label: 'À optimiser',
        variant: 'warning',
        iconName: 'AlertTriangle',
    },

    // États de validation
    approved: {
        label: 'Approuvé',
        variant: 'success',
        iconName: 'ThumbsUp',
    },
    rejected: {
        label: 'Rejeté',
        variant: 'danger',
        iconName: 'ThumbsDown',
    },

    // États IA
    aiGenerated: {
        label: 'IA',
        variant: 'info',
        iconName: 'Sparkles',
    },
    aiPending: {
        label: 'IA en cours',
        variant: 'pending',
        iconName: 'Bot',
    },

    // États de complétion
    completed: {
        label: 'Terminé',
        variant: 'success',
        iconName: 'CheckCircle2',
    },
    inProgress: {
        label: 'En cours',
        variant: 'info',
        iconName: 'Play',
    },
    cancelled: {
        label: 'Annulé',
        variant: 'neutral',
        iconName: 'XCircle',
    },
    failed: {
        label: 'Échoué',
        variant: 'danger',
        iconName: 'XCircle',
    },
    deletionScheduled: {
        label: 'Suppression planifiée',
        variant: 'danger',
        iconName: 'Clock',
    },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtient les classes CSS pour un badge
 */
export const getBadgeClasses = (
    variant: BadgeVariant,
    size: BadgeSize = 'md'
): string => {
    const variantStyle = badgeVariantStyles[variant];
    const sizeStyle = badgeSizeStyles[size];

    return [
        badgeBaseStyles.badge,
        variantStyle.gradient,
        variantStyle.text,
        sizeStyle.text,
        sizeStyle.padding,
        sizeStyle.gap,
    ].join(' ');
};

/**
 * Obtient les classes CSS pour l'indicateur (dot)
 */
export const getIndicatorClasses = (
    variant: BadgeVariant,
    size: BadgeSize = 'md'
): string => {
    const variantStyle = badgeVariantStyles[variant];
    const sizeStyle = badgeSizeStyles[size];

    return [
        badgeBaseStyles.indicator,
        variantStyle.indicatorColor,
        sizeStyle.indicatorSize,
    ].join(' ');
};

/**
 * Obtient les classes CSS pour l'icône
 */
export const getIconClasses = (
    variant: BadgeVariant,
    size: BadgeSize = 'md'
): string => {
    const variantStyle = badgeVariantStyles[variant];
    const sizeStyle = badgeSizeStyles[size];

    return [
        variantStyle.text,
        sizeStyle.iconSize,
    ].join(' ');
};

export const badgeTokens = {
    variants: badgeVariantStyles,
    sizes: badgeSizeStyles,
    base: badgeBaseStyles,
    presets: badgePresets,
    getBadgeClasses,
    getIndicatorClasses,
    getIconClasses,
} as const;
