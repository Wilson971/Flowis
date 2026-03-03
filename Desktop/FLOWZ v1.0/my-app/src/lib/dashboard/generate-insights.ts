import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Target,
  BarChart3,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Insight {
  id: string;
  type: 'opportunity' | 'warning' | 'achievement';
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
  priority: number; // 1 = highest
}

interface InsightInput {
  seoAvgScore?: number;
  seoAvgScorePrev?: number;
  criticalCount?: number;
  totalProducts?: number;
  optimizedCount?: number;
  catalogCoveragePercent?: number;
  publishedPosts?: number;
  indexedUrls?: number;
  totalUrls?: number;
}

export function generateInsights(input: InsightInput): Insight[] {
  const insights: Insight[] = [];

  const {
    seoAvgScore,
    seoAvgScorePrev,
    criticalCount = 0,
    totalProducts = 0,
    optimizedCount = 0,
    catalogCoveragePercent = 0,
    publishedPosts = 0,
    indexedUrls = 0,
    totalUrls = 0,
  } = input;

  // 1. Critical SEO products warning
  if (criticalCount > 0) {
    insights.push({
      id: 'seo-critical',
      type: 'warning',
      icon: AlertTriangle,
      title: `${criticalCount} produit${criticalCount > 1 ? 's' : ''} avec un score SEO critique`,
      description:
        'Ces produits ont un score SEO en dessous de 40 et sont peu visibles sur les moteurs de recherche. Optimisez-les en priorité.',
      action: {
        label: 'Voir les produits critiques',
        href: '/app/products?seo=critical',
      },
      priority: 1,
    });
  }

  // 2. SEO score trending down
  if (
    seoAvgScore !== undefined &&
    seoAvgScorePrev !== undefined &&
    seoAvgScorePrev > 0 &&
    seoAvgScore < seoAvgScorePrev
  ) {
    const drop = Math.round(seoAvgScorePrev - seoAvgScore);
    insights.push({
      id: 'seo-trending-down',
      type: 'warning',
      icon: TrendingDown,
      title: `Score SEO moyen en baisse de ${drop} points`,
      description:
        'Le score SEO moyen de votre catalogue a diminué. Vérifiez les dernières modifications de produits et optimisez les descriptions.',
      action: {
        label: 'Analyser le catalogue',
        href: '/app/products',
      },
      priority: 2,
    });
  }

  // 3. SEO score trending up
  if (
    seoAvgScore !== undefined &&
    seoAvgScorePrev !== undefined &&
    seoAvgScorePrev > 0 &&
    seoAvgScore > seoAvgScorePrev
  ) {
    const gain = Math.round(seoAvgScore - seoAvgScorePrev);
    insights.push({
      id: 'seo-trending-up',
      type: 'achievement',
      icon: TrendingUp,
      title: `Score SEO en hausse de ${gain} points`,
      description:
        'Vos optimisations portent leurs fruits. Continuez sur cette lancée pour améliorer votre visibilité.',
      priority: 6,
    });
  }

  // 4. High catalog coverage achievement
  if (catalogCoveragePercent >= 80) {
    insights.push({
      id: 'catalog-coverage-high',
      type: 'achievement',
      icon: CheckCircle,
      title: `${Math.round(catalogCoveragePercent)}% de couverture catalogue`,
      description:
        'Excellente couverture ! La majorité de vos produits sont optimisés et synchronisés avec votre boutique.',
      priority: 5,
    });
  }

  // 5. Low coverage opportunity
  if (catalogCoveragePercent < 50 && totalProducts > 0) {
    const remaining = totalProducts - optimizedCount;
    insights.push({
      id: 'catalog-coverage-low',
      type: 'opportunity',
      icon: Target,
      title: `${remaining} produit${remaining > 1 ? 's' : ''} non optimisé${remaining > 1 ? 's' : ''}`,
      description:
        'Moins de la moitié de votre catalogue est optimisé. Utilisez la génération par lot pour accélérer le processus.',
      action: {
        label: 'Optimiser par lot',
        href: '/app/products?action=batch',
      },
      priority: 3,
    });
  }

  // 6. Blog content opportunity
  if (publishedPosts < 3) {
    insights.push({
      id: 'blog-opportunity',
      type: 'opportunity',
      icon: Sparkles,
      title: 'Boostez votre SEO avec du contenu blog',
      description:
        publishedPosts === 0
          ? 'Vous n\'avez pas encore publié d\'article. Le contenu blog est un levier puissant pour le référencement.'
          : `Seulement ${publishedPosts} article${publishedPosts > 1 ? 's' : ''} publié${publishedPosts > 1 ? 's' : ''}. Publiez régulièrement pour améliorer votre positionnement.`,
      action: {
        label: 'Créer un article avec FloWriter',
        href: '/app/blog/flowriter',
      },
      priority: 4,
    });
  }

  // 7. Indexation gap warning
  if (totalUrls > 0 && indexedUrls < totalUrls) {
    const gap = totalUrls - indexedUrls;
    const gapPercent = Math.round((gap / totalUrls) * 100);
    if (gapPercent > 20) {
      insights.push({
        id: 'indexation-gap',
        type: 'warning',
        icon: BarChart3,
        title: `${gap} URL${gap > 1 ? 's' : ''} non indexée${gap > 1 ? 's' : ''} (${gapPercent}%)`,
        description:
          'Une part significative de vos pages ne sont pas indexées par Google. Vérifiez les erreurs dans la Search Console.',
        action: {
          label: 'Voir le rapport d\'indexation',
          href: '/app/overview',
        },
        priority: 2,
      });
    }
  }

  // Sort by priority (lowest number = highest priority), return top 5
  return insights.sort((a, b) => a.priority - b.priority).slice(0, 5);
}
