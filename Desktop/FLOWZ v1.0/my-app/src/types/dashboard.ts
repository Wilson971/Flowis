/**
 * Types pour le Dashboard V2
 * Basé sur les spécifications fonctionnelles - Refonte KPI Cards Interactive
 */

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
  /** Score SEO du mois précédent (depuis kpi_snapshots M-1), null si pas encore de snapshot */
  seoScorePrevMonth: number | null;

  // Carte 2: Couverture du Catalogue IA
  productContentGeneratedCount: number;
  productFieldsBreakdown: ProductFieldsBreakdown;
  /** % produits avec working_content IS NOT NULL (contenu IA généré) */
  catalogCoveragePercent: number;
  totalFieldsToOptimize: number;
  /** Produits avec contenu IA (working_content IS NOT NULL) */
  aiOptimizedProducts: number;
  /** Produits avec contenu IA le mois précédent (depuis kpi_snapshots M-1) */
  aiOptimizedPrevMonth: number | null;

  // Carte 3: Contenu Blog
  blogStats: BlogStats;

  // Connexion boutique
  /** Dernière sync réelle depuis stores.last_synced_at */
  storeLastSyncedAt: string | null;

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
