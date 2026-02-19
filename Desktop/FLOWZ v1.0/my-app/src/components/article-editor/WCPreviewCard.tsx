'use client';

/**
 * WCPreviewCard - Preview of how the article will appear on WooCommerce/WordPress
 *
 * Shows a simplified preview with title, excerpt, featured image,
 * and first 200 characters of content as it would appear on the blog.
 */

import { Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WCPreviewCardProps {
  title: string;
  excerpt?: string;
  content: string;
  featuredImageUrl?: string;
  category?: string;
  tags?: string[];
  status: 'draft' | 'publish' | 'pending';
  className?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function truncate(text: string, maxLength: number): string {
  const clean = stripHtml(text);
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).trim() + '...';
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-muted text-muted-foreground' },
  publish: { label: 'Publie', className: 'bg-emerald-500/10 text-emerald-600' },
  pending: { label: 'En attente', className: 'bg-amber-500/10 text-amber-600' },
};

export function WCPreviewCard({
  title,
  excerpt,
  content,
  featuredImageUrl,
  category,
  tags = [],
  status,
  className,
}: WCPreviewCardProps) {
  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.draft;
  const displayExcerpt = excerpt ? stripHtml(excerpt) : truncate(content, 200);

  return (
    <Card className={cn('border-border/50 overflow-hidden', className)}>
      {/* Featured Image */}
      {featuredImageUrl ? (
        <div className="relative aspect-video bg-muted overflow-hidden">
          <img
            src={featuredImageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
          <Badge
            variant="outline"
            className={cn(
              'absolute top-2 right-2 text-[9px] font-bold uppercase border-transparent',
              statusInfo.className
            )}
          >
            {statusInfo.label}
          </Badge>
        </div>
      ) : (
        <div className="relative aspect-video bg-muted flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
          <Badge
            variant="outline"
            className={cn(
              'absolute top-2 right-2 text-[9px] font-bold uppercase border-transparent',
              statusInfo.className
            )}
          >
            {statusInfo.label}
          </Badge>
        </div>
      )}

      {/* Content Preview */}
      <CardContent className="p-4 space-y-2">
        {/* Category */}
        {category && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
            {category}
          </p>
        )}

        {/* Title */}
        <h3 className="text-sm font-extrabold leading-tight text-foreground line-clamp-2">
          {title || 'Sans titre'}
        </h3>

        {/* Excerpt */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {displayExcerpt || 'Aucun extrait disponible.'}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[9px] text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-[9px] text-muted-foreground">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
