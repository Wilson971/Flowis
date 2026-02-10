/**
 * Design System - Typography Tokens
 * 
 * Système typographique standardisé avec échelle cohérente
 */

export const typographyTokens = {
    // ============================================
    // FAMILLES DE POLICES
    // ============================================
    fontFamilies: {
        sans: {
            value: 'Inter, ui-sans-serif, sans-serif, system-ui',
            cssVar: '--font-sans',
        },
        serif: {
            value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
            cssVar: '--font-serif',
        },
        mono: {
            value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            cssVar: '--font-mono',
        },
        geist: {
            value: "'Geist', Inter, ui-sans-serif, sans-serif, system-ui",
            cssVar: '--font-geist',
        },
        jakarta: {
            value: "'Plus Jakarta Sans', Inter, ui-sans-serif, sans-serif, system-ui",
            cssVar: '--font-jakarta',
        },
    },

    // ============================================
    // ÉCHELLE TYPOGRAPHIQUE
    // ============================================
    scale: {
        // Display (Hero, Landing)
        display2xl: {
            fontSize: '4.5rem',      // 72px
            lineHeight: '1.1',
            fontWeight: '700',
            letterSpacing: '-0.02em',
            cssClass: 'text-6xl font-bold leading-tight tracking-tight',
        },
        displayXl: {
            fontSize: '3.75rem',      // 60px
            lineHeight: '1.1',
            fontWeight: '700',
            letterSpacing: '-0.02em',
            cssClass: 'text-5xl font-bold leading-tight tracking-tight',
        },
        displayLg: {
            fontSize: '3rem',         // 48px
            lineHeight: '1.2',
            fontWeight: '700',
            letterSpacing: '-0.01em',
            cssClass: 'text-4xl font-bold leading-tight tracking-tight',
        },

        // Headings
        heading1: {
            fontSize: '2.25rem',       // 36px
            lineHeight: '1.2',
            fontWeight: '600',
            letterSpacing: '-0.01em',
            cssClass: 'text-3xl font-semibold leading-tight tracking-tight',
        },
        heading2: {
            fontSize: '1.875rem',      // 30px
            lineHeight: '1.3',
            fontWeight: '600',
            letterSpacing: '-0.01em',
            cssClass: 'text-2xl font-semibold leading-tight tracking-tight',
        },
        heading3: {
            fontSize: '1.5rem',       // 24px
            lineHeight: '1.4',
            fontWeight: '600',
            letterSpacing: '0',
            cssClass: 'text-xl font-semibold leading-snug tracking-tight',
        },
        heading4: {
            fontSize: '1.25rem',      // 20px
            lineHeight: '1.4',
            fontWeight: '600',
            letterSpacing: '0',
            cssClass: 'text-lg font-semibold leading-snug tracking-tight',
        },
        heading5: {
            fontSize: '1.125rem',     // 18px
            lineHeight: '1.33',        // 24px pour 18px (correspond à la vignette)
            fontWeight: '600',
            letterSpacing: '0',
            cssClass: 'text-base font-semibold leading-[1.33]',
        },
        heading6: {
            fontSize: '1rem',         // 16px
            lineHeight: '1.5',
            fontWeight: '600',
            letterSpacing: '0',
            cssClass: 'text-sm font-semibold leading-snug',
        },

        // Body
        bodyLg: {
            fontSize: '1.125rem',     // 18px
            lineHeight: '1.75',
            fontWeight: '400',
            letterSpacing: '0',
            cssClass: 'text-lg leading-relaxed',
        },
        bodyBase: {
            fontSize: '1rem',         // 16px
            lineHeight: '1.625',
            fontWeight: '400',
            letterSpacing: '0',
            cssClass: 'text-base leading-relaxed',
        },
        bodySm: {
            fontSize: '0.875rem',     // 14px
            lineHeight: '1.625',
            fontWeight: '400',
            letterSpacing: '0',
            cssClass: 'text-sm leading-relaxed',
        },
        bodyXs: {
            fontSize: '0.75rem',      // 12px
            lineHeight: '1.5',
            fontWeight: '400',
            letterSpacing: '0',
            cssClass: 'text-xs leading-relaxed',
        },
        // Nouveau token pour 13px (vignette 2)
        bodyXxs: {
            fontSize: '0.8125rem',    // 13px
            lineHeight: '1.54',        // 20px pour 13px
            fontWeight: '450',         // Medium-light
            letterSpacing: '0',
            cssClass: 'text-[13px] leading-[1.54] font-[450]',
        },

        // Labels
        labelLg: {
            fontSize: '0.875rem',     // 14px
            lineHeight: '1.4',
            fontWeight: '500',
            letterSpacing: '0.01em',
            cssClass: 'text-sm font-medium leading-none',
        },
        labelBase: {
            fontSize: '0.75rem',      // 12px
            lineHeight: '1.4',
            fontWeight: '500',
            letterSpacing: '0.01em',
            cssClass: 'text-xs font-medium leading-none',
        },
        // Nouveau token pour labels avec weight 450 (vignette 3)
        labelBaseLight: {
            fontSize: '0.75rem',      // 12px
            lineHeight: '1.33',       // 16px pour 12px
            fontWeight: '450',         // Medium-light
            letterSpacing: '0.01em',
            cssClass: 'text-xs leading-[1.33] font-[450]',
        },
        labelSm: {
            fontSize: '0.625rem',     // 10px
            lineHeight: '1.4',
            fontWeight: '500',
            letterSpacing: '0.05em',
            cssClass: 'text-[10px] font-medium leading-none uppercase tracking-wide',
        },

        // Caption
        caption: {
            fontSize: '0.75rem',      // 12px
            lineHeight: '1.4',
            fontWeight: '400',
            letterSpacing: '0.01em',
            cssClass: 'text-xs leading-relaxed',
        },
    },

    // ============================================
    // LETTER SPACING
    // ============================================
    letterSpacing: {
        tighter: {
            value: '-0.05em',
            cssVar: '--tracking-tighter',
        },
        tight: {
            value: '-0.025em',
            cssVar: '--tracking-tight',
        },
        normal: {
            value: '0em',
            cssVar: '--tracking-normal',
        },
        wide: {
            value: '0.025em',
            cssVar: '--tracking-wide',
        },
        wider: {
            value: '0.05em',
            cssVar: '--tracking-wider',
        },
        widest: {
            value: '0.1em',
            cssVar: '--tracking-widest',
        },
    },

    // ============================================
    // FONT WEIGHTS
    // ============================================
    fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        mediumLight: '450',      // Entre normal et medium (pour Inter variable)
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
    },

    // ============================================
    // LINE HEIGHTS
    // ============================================
    lineHeight: {
        none: '1',
        tight: '1.25',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '2',
    },
} as const;

/**
 * Helper pour obtenir les classes CSS typographiques
 */
export const getTypographyClass = (scale: keyof typeof typographyTokens.scale): string => {
    return typographyTokens.scale[scale].cssClass;
};
