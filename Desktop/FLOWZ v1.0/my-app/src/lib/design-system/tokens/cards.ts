/**
 * Design System - Card Tokens
 *
 * Structure de tokens réutilisables pour les cartes de l'application.
 * Utilise une palette unifiée basée sur le thème (primary + neutres).
 *
 * IMPORTANT: Toutes les couleurs utilisent les variables du thème
 * pour éviter l'effet "sapin de noël" avec des couleurs disparates.
 *
 * @see ./typography.ts pour les valeurs de référence
 */

import { typographyTokens } from "./typography";

// ============================================
// TYPES
// ============================================

export type CardStyle =
    | "default"
    | "glassmorphism"
    | "premium-action"
    | "elevated"
    | "outlined";

export type CardColorPreset = "primary" | "secondary" | "muted" | "accent";

// ============================================
// GRADIENT PRESETS (pour icônes et accents)
// Utilise uniquement primary et ses variantes
// ============================================

export const cardGradientPresets: Record<
    CardColorPreset,
    {
        gradient: string;
        shadowColor: string;
        hoverShadow: string;
        viaColor: string;
        accentLine: string;
    }
> = {
    primary: {
        // Using CSS utility class for solid gradient background
        gradient: "gradient-primary-icon",
        shadowColor: "shadow-primary/25",
        hoverShadow: "hover:shadow-primary/40",
        viaColor: "via-primary/60",
        accentLine: "from-primary/60",
    },
    secondary: {
        // Slightly lighter gradient
        gradient: "gradient-secondary-icon",
        shadowColor: "shadow-primary/20",
        hoverShadow: "hover:shadow-primary/30",
        viaColor: "via-primary/50",
        accentLine: "from-primary/50",
    },
    muted: {
        gradient: "gradient-muted-icon",
        shadowColor: "shadow-muted-foreground/10",
        hoverShadow: "hover:shadow-muted-foreground/20",
        viaColor: "via-muted-foreground/30",
        accentLine: "from-muted-foreground/40",
    },
    accent: {
        // Accent uses same as primary
        gradient: "gradient-primary-icon",
        shadowColor: "shadow-primary/25",
        hoverShadow: "hover:shadow-primary/40",
        viaColor: "via-primary/60",
        accentLine: "from-primary/60",
    },
};

// ============================================
// CARD BASE STYLES
// ============================================

export const cardBaseStyles: Record<
    CardStyle,
    {
        container: string;
        hover: string;
        transition: string;
    }
> = {
    default: {
        container: "bg-card border border-border rounded-lg",
        hover: "hover:shadow-md",
        transition: "transition-all duration-200",
    },
    glassmorphism: {
        container:
            "bg-background/80 backdrop-blur-xl border border-border/40 rounded-xl",
        hover: "hover:shadow-lg",
        transition: "transition-all duration-300",
    },
    "premium-action": {
        container: "bg-surface-1/80 border border-border/40 rounded-2xl",
        hover:
            "hover:bg-surface-2 hover:shadow-xl hover:-translate-y-0.5",
        transition: "transition-all duration-300 ease-out",
    },
    elevated: {
        container: "bg-card border border-border/60 rounded-xl shadow-lg",
        hover: "hover:shadow-2xl hover:-translate-y-1",
        transition: "transition-all duration-300",
    },
    outlined: {
        container: "bg-transparent border-2 border-border rounded-lg",
        hover: "hover:bg-muted/20",
        transition: "transition-all duration-200",
    },
};

// ============================================
// PREMIUM ACTION CARD STYLES
// Style spécifique pour les cartes d'action comme QuickActionsCard
// ============================================

export const premiumActionCardStyles = {
    // Container principal
    container: {
        base: "h-full flex flex-col p-5 relative overflow-hidden rounded-2xl",
        withTopLine: true,
    },

    // Ligne de gradient en haut - utilise primary uniquement
    topAccentLine: {
        base: "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
        gradient: "from-primary/40 via-primary to-primary/40",
    },

    // Header avec icône - utilise tokens typographiques
    header: {
        container: "pb-5",
        iconWrapper:
            "p-2 rounded-md bg-gradient-to-br from-primary/15 to-primary/10 border border-primary/20",
        title: typographyTokens.scale.heading4.cssClass,
        subtitle: `${typographyTokens.scale.bodySm.cssClass} text-muted-foreground`,
    },

    // Carte d'action individuelle
    actionItem: {
        base: "group relative flex items-center gap-4 w-full p-4 rounded-2xl text-left",
        background: "bg-surface-1/80 hover:bg-surface-2",
        border: "border border-border/40",
        animation:
            "transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-0.5",

        // Overlay gradient au hover
        overlay: {
            base: "absolute inset-0 rounded-2xl transition-opacity duration-300",
            gradient: "bg-gradient-to-br opacity-0 group-hover:opacity-[0.03]",
        },

        // Icône avec gradient - la classe gradient-* gère le background
        icon: {
            wrapper: "relative flex-shrink-0 p-3 rounded-xl shadow-lg",
            animation:
                "transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
            iconClass: "h-5 w-5 text-white",
            shine:
                "absolute inset-0 rounded-xl bg-gradient-to-tr from-white/25 via-transparent to-transparent opacity-60",
        },

        // Contenu texte
        content: {
            wrapper: "relative flex-1 min-w-0",
            title: `${typographyTokens.scale.labelLg.cssClass} text-foreground group-hover:text-primary transition-colors duration-200`,
            description: `${typographyTokens.scale.bodyXs.cssClass} text-muted-foreground`,
        },

        // Badge
        badge: typographyTokens.scale.labelSm.cssClass,

        // Flèche indicatrice
        arrow: {
            wrapper:
                "relative flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0",
            button: "p-2 rounded-full bg-gradient-to-br shadow-md",
            icon: "h-3 w-3 text-white",
        },

        // Ligne shine en bas
        bottomLine: {
            base: "absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-px",
            gradient: "bg-gradient-to-r from-transparent to-transparent",
            animation:
                "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        },
    },

    // Variante compacte pour ActivityTimeline
    compactItem: {
        base: "group relative flex items-center gap-2.5 pb-4",
        icon: {
            wrapper:
                "relative z-10 w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0 transition-all duration-200",
            iconClass: "h-3 w-3",
        },
        content: {
            wrapper: "flex-1 min-w-0 py-0.5",
            title: `${typographyTokens.scale.labelBase.cssClass} text-foreground`,
            meta: `${typographyTokens.scale.labelSm.cssClass} text-muted-foreground normal-case`,
        },
        timeline: "absolute top-0 left-[13px] h-full w-px bg-border/30",
    },
} as const;

// ============================================
// FRAMER MOTION ANIMATION VARIANTS
// ============================================

export const cardAnimationVariants = {
    // Animation d'entrée staggerée (QuickActionsCard style)
    staggeredSlideIn: {
        hidden: {
            opacity: 0,
            x: -20,
        },
        visible: (i: number) => ({
            opacity: 1,
            x: 0,
            transition: {
                delay: i * 0.08,
                duration: 0.4,
                ease: [0.23, 1, 0.32, 1] as const,
            },
        }),
    },

    // Animation fade-in simple
    fadeIn: {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.3 },
        },
    },

    // Animation scale-in
    scaleIn: {
        hidden: {
            opacity: 0,
            scale: 0.95,
        },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.3,
                ease: [0.23, 1, 0.32, 1] as const,
            },
        },
    },

    // Animation slide-up
    slideUp: {
        hidden: {
            opacity: 0,
            y: 20,
        },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.1,
                duration: 0.4,
                ease: [0.23, 1, 0.32, 1] as const,
            },
        }),
    },

    // Animation slide-in from right
    slideInRight: {
        hidden: {
            opacity: 0,
            x: 20,
        },
        visible: (i: number) => ({
            opacity: 1,
            x: 0,
            transition: {
                delay: i * 0.08,
                duration: 0.4,
                ease: [0.23, 1, 0.32, 1] as const,
            },
        }),
    },
} as const;

// ============================================
// HOVER EFFECTS
// ============================================

export const cardHoverEffects = {
    // Lift effect (élévation au hover)
    lift: "hover:-translate-y-0.5 hover:shadow-xl",
    liftHigh: "hover:-translate-y-1 hover:shadow-2xl",

    // Scale effect
    scale: "hover:scale-[1.02]",
    scaleSubtle: "hover:scale-[1.01]",

    // Glow effect - removed per user request
    glow: "",
    glowPrimary: "",

    // Border highlight - removed per user request
    borderHighlight: "",
    borderGlow: "",

    // Combined premium effect
    premium: "hover:-translate-y-0.5 hover:shadow-xl",
} as const;

// ============================================
// ICON CONTAINER STYLES
// ============================================

export const cardIconStyles = {
    // Base avec gradient - utilise primary
    gradientBase: {
        wrapper: "relative flex-shrink-0 rounded-xl bg-gradient-to-br shadow-lg",
        shine:
            "absolute inset-0 rounded-xl bg-gradient-to-tr from-white/25 via-transparent to-transparent opacity-60",
        hover:
            "transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
    },

    // Tailles
    sizes: {
        sm: { wrapper: "p-2", icon: "h-4 w-4" },
        md: { wrapper: "p-3", icon: "h-5 w-5" },
        lg: { wrapper: "p-4", icon: "h-6 w-6" },
    },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtient les classes CSS pour une carte premium action
 */
export const getPremiumActionClasses = (
    colorPreset: CardColorPreset,
): string => {
    const preset = cardGradientPresets[colorPreset];
    const styles = premiumActionCardStyles.actionItem;

    return [
        styles.base,
        styles.background,
        styles.border,
        styles.animation,
        preset.shadowColor,
        preset.hoverShadow,
    ].join(" ");
};

/**
 * Obtient les classes pour le container d'icône gradient
 */
export const getIconGradientClasses = (
    colorPreset: CardColorPreset,
    size: "sm" | "md" | "lg" = "md",
): string => {
    const preset = cardGradientPresets[colorPreset];
    const iconSize = cardIconStyles.sizes[size];

    return [
        cardIconStyles.gradientBase.wrapper,
        iconSize.wrapper,
        preset.gradient,
        preset.shadowColor,
        cardIconStyles.gradientBase.hover,
    ].join(" ");
};

// ============================================
// STATUS COLORS (for badges and indicators)
// Uses theme semantic colors
// ============================================

export const statusColors = {
    success: {
        bg: "bg-status-success-muted",
        text: "text-status-success-text",
        border: "border-status-success-border",
    },
    warning: {
        bg: "bg-status-warning-muted",
        text: "text-status-warning-text",
        border: "border-status-warning-border",
    },
    error: {
        bg: "bg-status-error-muted",
        text: "text-status-error-text",
        border: "border-status-error-border",
    },
    info: {
        bg: "bg-status-info-muted",
        text: "text-status-info-text",
        border: "border-status-info-border",
    },
    neutral: {
        bg: "bg-muted",
        text: "text-muted-foreground",
        border: "border-border",
    },
} as const;

/**
 * Obtient les classes pour un statut
 */
export const getStatusClasses = (status: keyof typeof statusColors): string => {
    const colors = statusColors[status];
    return `${colors.bg} ${colors.text} ${colors.border}`;
};

// ============================================
// EXPORTS
// ============================================

export const cardTokens = {
    gradients: cardGradientPresets,
    styles: cardBaseStyles,
    premiumAction: premiumActionCardStyles,
    animations: cardAnimationVariants,
    hover: cardHoverEffects,
    icons: cardIconStyles,
    status: statusColors,
    getPremiumActionClasses,
    getIconGradientClasses,
    getStatusClasses,
} as const;
