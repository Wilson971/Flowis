/**
 * Card Theme System - FLOWZ Design System
 *
 * Gestion centralisée des couleurs et gradients par type de card.
 * Évite le hardcoding et garantit la cohérence visuelle.
 */

export type CardTheme = {
  /** Gradient de fond (FROM) */
  gradientFrom: string;
  /** Gradient de fond (TO) */
  gradientTo: string;
  /** Couleur de l'icon au hover (bg) */
  iconHoverBg: string;
  /** Couleur de l'icon au hover (text) */
  iconHoverText: string;
  /** Couleur du glow au hover (optionnel) */
  glowColor?: string;
  /** RGB values for hover box-shadow glow */
  glowRgba: string;
};

/**
 * Thèmes de cards par catégorie sémantique
 */
export const cardThemes = {
  /** Commerce & Vente (Pricing, Stock, Orders) */
  commerce: {
    gradientFrom: 'emerald-500',
    gradientTo: 'blue-500',
    iconHoverBg: 'emerald-500/10',
    iconHoverText: 'emerald-600',
    glowColor: 'emerald-500/10',
    glowRgba: '16,185,129',
  },

  /** Organisation & Taxonomie (Categories, Tags, Attributes) */
  organization: {
    gradientFrom: 'violet-500',
    gradientTo: 'blue-500',
    iconHoverBg: 'violet-500/10',
    iconHoverText: 'violet-600',
    glowColor: 'violet-500/10',
    glowRgba: '139,92,246',
  },

  /** Analytics & Performance (Stats, Reports, Metrics) */
  analytics: {
    gradientFrom: 'orange-500',
    gradientTo: 'amber-500',
    iconHoverBg: 'orange-500/10',
    iconHoverText: 'orange-600',
    glowColor: 'orange-500/10',
    glowRgba: '249,115,22',
  },

  /** Synchronisation & Intégrations (Sync, API, Webhooks) */
  sync: {
    gradientFrom: 'emerald-500',
    gradientTo: 'teal-500',
    iconHoverBg: 'emerald-500/10',
    iconHoverText: 'emerald-600',
    glowColor: 'emerald-500/10',
    glowRgba: '16,185,129',
  },

  /** Configuration & Options (Settings, Preferences) */
  settings: {
    gradientFrom: 'blue-500',
    gradientTo: 'cyan-500',
    iconHoverBg: 'blue-500/10',
    iconHoverText: 'blue-600',
    glowColor: 'blue-500/10',
    glowRgba: '59,130,246',
  },

  /** Contenu & Média (Images, Files, Media) */
  media: {
    gradientFrom: 'pink-500',
    gradientTo: 'rose-500',
    iconHoverBg: 'pink-500/10',
    iconHoverText: 'pink-600',
    glowColor: 'pink-500/10',
    glowRgba: '236,72,153',
  },

  /** Historique & Versions (History, Logs, Versions) */
  history: {
    gradientFrom: 'slate-500',
    gradientTo: 'gray-500',
    iconHoverBg: 'slate-500/10',
    iconHoverText: 'slate-600',
    glowColor: 'slate-500/10',
    glowRgba: '100,116,139',
  },

  /** Relations & Liens (Related, Linked, Cross-sell) */
  relations: {
    gradientFrom: 'indigo-500',
    gradientTo: 'purple-500',
    iconHoverBg: 'indigo-500/10',
    iconHoverText: 'indigo-600',
    glowColor: 'indigo-500/10',
    glowRgba: '99,102,241',
  },

  /** Temporalité & Scheduling (Dates, Schedule, Calendar) */
  temporal: {
    gradientFrom: 'amber-500',
    gradientTo: 'yellow-500',
    iconHoverBg: 'amber-500/10',
    iconHoverText: 'amber-600',
    glowColor: 'amber-500/10',
    glowRgba: '245,158,11',
  },

  /** Neutre / Par défaut */
  neutral: {
    gradientFrom: 'primary',
    gradientTo: 'primary',
    iconHoverBg: 'primary/10',
    iconHoverText: 'primary',
    glowColor: 'primary/10',
    glowRgba: '124,58,237',
  },

  /** Blanc et Gris Clair (Minimaliste) */
  light: {
    gradientFrom: 'slate-100',
    gradientTo: 'gray-100',
    iconHoverBg: 'slate-200/20',
    iconHoverText: 'slate-600',
    glowColor: 'slate-200/10',
    glowRgba: '148,163,184',
  },
} as const;

export type CardThemeKey = keyof typeof cardThemes;

/**
 * Mapping des cards du formulaire produit vers leurs thèmes
 */
export const productCardThemes: Record<string, CardThemeKey> = {
  // Commerce
  PricingCard: 'commerce',
  ExternalProductCard: 'commerce',

  // Organisation
  OrganizationCard: 'organization',
  ProductOptionsCard: 'settings',

  // Analytics
  PerformanceCard: 'analytics',

  // Sync
  SyncStatusCard: 'sync',
  SyncHistoryCard: 'history',

  // Relations
  LinkedProductsCard: 'relations',

  // Historique
  ProductVersionHistoryCard: 'history',

  // Contenu général
  ProductGeneralTab: 'neutral',

  // SEO & Référencement
  ProductSeoTab: 'analytics',
  SeoSidebarWidget: 'analytics',
} as const;

/**
 * Utilitaire pour construire les classes CSS d'une card avec son thème
 *
 * Le hover glow est appliqué directement sur le container (pas sur une div enfant)
 * car overflow-hidden coupe le box-shadow des éléments enfants.
 */
export function getCardThemeClasses(theme: CardThemeKey) {
  const themeConfig = cardThemes[theme];

  return {
    /** Classes pour le container de la card (inclut le hover glow sémantique) */
    container: `border-border/40 bg-card/90 backdrop-blur-lg overflow-hidden relative group hover:border-border hover:shadow-[0_0_20px_rgba(${themeConfig.glowRgba},0.12)] transition-all duration-500`,

    /** Classes pour l'overlay glass reflection */
    glassReflection: 'absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none',

    /** Classes pour le gradient accent */
    gradientAccent: `absolute inset-0 bg-gradient-to-br from-${themeConfig.gradientFrom}/[0.02] via-transparent to-${themeConfig.gradientTo}/[0.02] pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500`,

    /** Classes pour l'icon container */
    iconContainer: `w-10 h-10 rounded-lg bg-muted/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground shrink-0 group-hover:bg-${themeConfig.iconHoverBg} group-hover:text-${themeConfig.iconHoverText} transition-all duration-300 border border-border/50`,

    /** Valeurs brutes pour usage manuel */
    raw: themeConfig,
  };
}

/**
 * Utilitaire raccourci pour les cards produit
 */
export function getProductCardTheme(cardName: string) {
  const themeKey = productCardThemes[cardName] || 'neutral';
  return getCardThemeClasses(themeKey);
}
