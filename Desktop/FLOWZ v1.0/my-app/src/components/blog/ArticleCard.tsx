'use client';

/**
 * ArticleCard Component
 *
 * Card display for a blog article with status, SEO score, and actions
 */

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { styles } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import type { BlogArticle, ArticleStatus } from '@/types/blog';

// ============================================================================
// STATUS BADGE
// ============================================================================

const statusConfig: Record<
  ArticleStatus,
  { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' | 'primary' }
> = {
  published: { label: 'Publié', variant: 'success' },
  publish: { label: 'Publié', variant: 'success' },
  draft: { label: 'Brouillon', variant: 'warning' },
  auto_draft: { label: 'Auto-save', variant: 'neutral' },
  scheduled: { label: 'Planifié', variant: 'info' },
  future: { label: 'Planifié', variant: 'info' },
  ai_generated: { label: 'Généré IA', variant: 'primary' },
  pending: { label: 'En attente', variant: 'neutral' },
  private: { label: 'Privé', variant: 'neutral' },
  archived: { label: 'Archivé', variant: 'neutral' },
};

function StatusBadge({ status }: { status: ArticleStatus }) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge
      className={cn(
        styles.badge.base,
        styles.badge.sm,
        styles.badge[config.variant]
      )}
    >
      {config.label}
    </Badge>
  );
}

// ============================================================================
// SEO SCORE
// ============================================================================

function SeoScore({ score }: { score?: number }) {
  if (score === undefined) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="text-xs text-muted-foreground">—</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Score SEO non calculé</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const color =
    score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-destructive';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={cn('text-sm font-semibold', color)}>{score}%</div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Score SEO: {score >= 80 ? 'Excellent' : score >= 50 ? 'Moyen' : 'À améliorer'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// ARTICLE CARD
// ============================================================================

interface ArticleCardProps {
  article: BlogArticle;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onEdit?: (article: BlogArticle) => void;
  onDuplicate?: (article: BlogArticle) => void;
  onDelete?: (article: BlogArticle) => void;
  onPublish?: (article: BlogArticle) => void;
  onUnpublish?: (article: BlogArticle) => void;
  delay?: number;
}

export function ArticleCard({
  article,
  isSelected,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onPublish,
  onUnpublish,
  delay = 0,
}: ArticleCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isPublished =
    article.status === 'published' || article.status === 'publish';

  const formattedDate = new Date(article.updated_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Calculate read time (average 200 words per minute)
  const wordCount = article.content?.split(/\s+/).length || 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        styles.card.interactive,
        'group relative overflow-hidden',
        isSelected && 'ring-2 ring-primary'
      )}
    >
      {/* Selection Checkbox */}
      {onSelect && (
        <div
          className={cn(
            'absolute top-3 left-3 z-10 transition-opacity',
            isSelected || isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(article.id, !!checked)}
          />
        </div>
      )}

      {/* Featured Image */}
      {article.featured_image_url && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={article.featured_image_url}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={article.status} />
            {article.ai_generated && (
              <Badge
                className={cn(styles.badge.base, styles.badge.sm, styles.badge.primary)}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                IA
              </Badge>
            )}
          </div>
          <SeoScore score={article.seo_score} />
        </div>

        {/* Title */}
        <Link href={`/app/blog/${article.id}`}>
          <h3
            className={cn(
              styles.text.h4,
              styles.text.lineClamp2,
              'hover:text-primary transition-colors cursor-pointer'
            )}
          >
            {article.title}
          </h3>
        </Link>

        {/* Excerpt */}
        {article.excerpt && (
          <p className={cn(styles.text.bodyMuted, styles.text.lineClamp2)}>
            {article.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {readTime} min
          </div>
          {article.category && (
            <div className="truncate max-w-[100px]">{article.category}</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild className="h-8 px-2">
              <Link href={`/app/blog/${article.id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            {onDuplicate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDuplicate(article)}
                className="h-8 px-2"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/app/blog/${article.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Link>
              </DropdownMenuItem>
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(article)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Dupliquer
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {isPublished ? (
                onUnpublish && (
                  <DropdownMenuItem onClick={() => onUnpublish(article)}>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Dépublier
                  </DropdownMenuItem>
                )
              ) : (
                onPublish && (
                  <DropdownMenuItem onClick={() => onPublish(article)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Publier
                  </DropdownMenuItem>
                )
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(article)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}
