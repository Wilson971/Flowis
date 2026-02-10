/**
 * Types pour le Dashboard V2
 * Basé sur les spécifications fonctionnelles - Refonte KPI Cards Interactive
 */

// Matrice de poids pour le calcul du temps économisé (en minutes)
// Ces valeurs doivent correspondre à la fonction get_time_weight() dans PostgreSQL
export const TIME_WEIGHTS = {
  // Produit
  product_title: 2,              // Titre produit - Réflexion + rédaction courte
  product_short_description: 5,  // Description courte - Synthèse des caractéristiques
  product_description: 15,       // Description complète - Storytelling, mise en forme
  product_seo_title: 2,          // Titre SEO - Respect des contraintes de caractères
  product_meta_description: 4,   // Méta-description - Incitation au clic, mots-clés
  product_alt_text: 1,           // Alt text images - Description purement descriptive
  // Blog
  blog_ideas: 10,                // Idées/Sujets - Brainstorming
  blog_article: 120,             // Article complet (2h) - Rédaction, structure, recherche
} as const;

// Taux horaire par défaut pour le calcul ROI (en euros)
export const DEFAULT_HOURLY_RATE = 30;

// Type union pour les champs de contenu (correspond à l'enum PostgreSQL content_field_type)
export type ContentFieldType =
  | 'product_title'
  | 'product_short_description'
  | 'product_description'
  | 'product_seo_title'
  | 'product_meta_description'
  | 'product_alt_text'
  | 'blog_ideas'
  | 'blog_article';

// Types de champs générés pour les produits
export type ProductContentField =
  | 'title'
  | 'short_description'
  | 'description'
  | 'seo_title'
  | 'seo_description'
  | 'alt_text';

// Types de champs générés pour le blog  
export type BlogContentField =
  | 'ideas'
  | 'article';

// Contexte du dashboard (header) - V2 avec erreurs sync
export type DashboardContext = {
  selectedShopId: string | null;
  selectedShopName: string;
  selectedShopPlatform: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'pending' | null;
  totalAccountShops: number;
  activeShopsCount: number;
  shopStats: {
    totalProducts: number;
    totalCategories: number;
    totalBlogPosts: number;
    syncErrors: number; // Produits non synchronisés
  };
};

// Stats SEO pour la carte Santé SEO
export type SEOHealthStats = {
  averageScore: number; // Score moyen 0-100
  analyzedProductsCount: number; // Nombre de produits analysés
  criticalCount: number; // Produits score < 40
  warningCount: number; // Produits score 40-70
  goodCount: number; // Produits score > 70
  topIssue: string | null; // Catégorie SEO la plus faible
};

// Stats Blog pour la carte Contenu Blog
export type BlogStats = {
  totalArticles: number;
  publishedCount: number;
  draftCount: number;
  lastCreatedAt: string | null; // Date de dernière création
};

// Breakdown des champs produits générés par type
export type ProductFieldsBreakdown = {
  title: number;
  short_description: number;
  description: number;
  seo_title: number;
  seo_description: number;
  alt_text: number;
};

// KPIs du dashboard - V2 avec nouvelles cartes
export type DashboardKPIs = {
  period: 'current_month' | 'last_month' | 'all_time';

  // Carte 1: Santé SEO Globale
  seoHealth: SEOHealthStats;

  // Carte 2: Couverture du Catalogue
  productContentGeneratedCount: number;  // Nombre total de champs produits
  productFieldsBreakdown: ProductFieldsBreakdown; // Répartition par type de champ
  catalogCoveragePercent: number; // % du catalogue optimisé
  totalFieldsToOptimize: number; // Total des champs restants

  // Carte 3: Contenu Blog
  blogStats: BlogStats;

  // Carte 4: Temps Économisé / ROI
  timeSavedMinutes: number; // Temps économisé en minutes
  moneySavedEuros: number; // Valeur en euros (basée sur hourlyRate)

  // Legacy (pour compatibilité)
  activeShopsCount: number;
  blogContentGeneratedCount: number;
};

// Réponse API complète du dashboard
export type DashboardData = {
  context: DashboardContext;
  kpiCards: DashboardKPIs;
  isLoading: boolean;
};

// Type pour le sélecteur de période
export type KPIPeriod = 'current_month' | 'last_month' | 'all_time';

// Hook return type
export interface UseDashboardKPIsReturn {
  context: DashboardContext | undefined;
  kpis: DashboardKPIs | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Fonctions utilitaires
export const formatTimeSaved = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
};

export const formatMoneySaved = (euros: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(euros);
};

export const calculateMoneySaved = (minutes: number, hourlyRate: number = DEFAULT_HOURLY_RATE): number => {
  const hours = minutes / 60;
  return Math.round(hours * hourlyRate);
};

export const formatRelativeTime = (dateStr: string | null): string => {
  if (!dateStr) return 'Jamais';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  return `Il y a ${Math.floor(diffDays / 30)} mois`;
};

export const calculateTimeSaved = (
  productFields: Record<ProductContentField, number>,
  blogFields: Record<BlogContentField, number>
): number => {
  let total = 0;

  // Temps pour les champs produits
  if (productFields.title) total += productFields.title * TIME_WEIGHTS.product_title;
  if (productFields.short_description) total += productFields.short_description * TIME_WEIGHTS.product_short_description;
  if (productFields.description) total += productFields.description * TIME_WEIGHTS.product_description;
  if (productFields.seo_title) total += productFields.seo_title * TIME_WEIGHTS.product_seo_title;
  if (productFields.seo_description) total += productFields.seo_description * TIME_WEIGHTS.product_meta_description;
  if (productFields.alt_text) total += productFields.alt_text * TIME_WEIGHTS.product_alt_text;

  // Temps pour les champs blog
  if (blogFields.ideas) total += blogFields.ideas * TIME_WEIGHTS.blog_ideas;
  if (blogFields.article) total += blogFields.article * TIME_WEIGHTS.blog_article;

  return total;
};

// ============================================================================
// CONNECTION HEALTH TYPES
// ============================================================================

export type ConnectionStatus = 'healthy' | 'warning' | 'error' | 'unknown';

export interface ConnectionHealth {
  status: ConnectionStatus;
  platform: 'shopify' | 'woocommerce' | 'unknown';
  storeName: string;
  lastVerified: Date;
  lastSync: Date;
  nextScheduledSync: Date;
  errorMessage?: string;
}

export interface UseConnectionHealthReturn {
  connectionHealth: ConnectionHealth | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  testConnection: () => Promise<boolean>;
  refetch: () => Promise<void>;
}
