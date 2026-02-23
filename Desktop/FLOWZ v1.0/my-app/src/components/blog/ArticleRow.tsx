'use client';

/**
 * ArticleRow Component
 *
 * Row display for a blog article (list view)
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
  FileText,
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
    return <div className="text-xs text-muted-foreground w-12 text-center">—</div>;
  }

  const color =
    score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-destructive';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={cn('text-sm font-semibold w-12 text-center', color)}>
            {score}%
          </div>
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
// ARTICLE ROW
// ============================================================================

interface ArticleRowProps {
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

export function ArticleRow({
  article,
  isSelected,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onPublish,
  onUnpublish,
  delay = 0,
}: ArticleRowProps) {
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-card hover:bg-muted/50 transition-all',
        isSelected && 'ring-2 ring-primary bg-primary/5'
      )}
    >
      {/* Selection Checkbox */}
      {onSelect && (
        <div
          className={cn(
            'transition-opacity flex-shrink-0',
            isSelected || isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(article.id, !!checked)}
          />
        </div>
      )}

      {/* Thumbnail */}
      <div className="flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-muted">
        {article.featured_image_url ? (
          <img
            src={article.featured_image_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Title & Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/app/blog/editor/${article.id}`}>
            <h3
              className={cn(
                'font-medium text-sm truncate hover:text-primary transition-colors cursor-pointer'
              )}
            >
              {article.title}
            </h3>
          </Link>
          {article.ai_generated && (
            <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          )}
        </div>
        {article.excerpt && (
          <p className="text-xs text-muted-foreground truncate max-w-xl">
            {article.excerpt}
          </p>
        )}
      </div>

      {/* Category */}
      <div className="hidden md:block w-28 flex-shrink-0">
        {article.category ? (
          <span className="text-xs text-muted-foreground truncate block">
            {article.category}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </div>

      {/* Status */}
      <div className="flex-shrink-0 w-24">
        <StatusBadge status={article.status} />
      </div>

      {/* SEO Score */}
      <div className="hidden sm:block flex-shrink-0">
        <SeoScore score={article.seo_score} />
      </div>

      {/* Date */}
      <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 w-24">
        <Calendar className="h-3 w-3" />
        {formattedDate}
      </div>

      {/* Read Time */}
      <div className="hidden xl:flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 w-16">
        <Clock className="h-3 w-3" />
        {readTime} min
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
          <Link href={`/app/blog/editor/${article.id}`}>
            <Edit className="h-4 w-4" />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/app/blog/editor/${article.id}`}>
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
    </motion.div>
  );
}
