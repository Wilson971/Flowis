'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { styles } from '@/lib/design-system';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, ChevronRight } from 'lucide-react';
import type { CategoryTree } from '@/hooks/products/useProductCategories';

interface CategoryDetailPanelProps {
  category: CategoryTree | null;
}

export function CategoryDetailPanel({ category }: CategoryDetailPanelProps) {
  if (!category) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <p className={cn(styles.text.bodyMuted)}>
            Sélectionnez une catégorie
          </p>
        </CardContent>
      </Card>
    );
  }

  const pathSegments = category.path
    ? category.path.split(' > ').filter(Boolean)
    : [category.name];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className={cn(styles.text.h3)}>{category.name}</CardTitle>
            <p className="font-mono text-sm text-muted-foreground">{category.slug}</p>
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <Package className="h-3.5 w-3.5" />
            {category.product_count ?? 0} produit{(category.product_count ?? 0) !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Breadcrumb path */}
        {pathSegments.length > 1 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {pathSegments.map((segment, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                <span className={cn(i === pathSegments.length - 1 && 'text-foreground font-medium')}>
                  {segment}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {category.description && (
          <div className="space-y-1">
            <p className={cn(styles.text.label)}>Description</p>
            <p className={cn(styles.text.body)}>{category.description}</p>
          </div>
        )}

        {/* Image */}
        {category.image_url && (
          <div className="space-y-1">
            <p className={cn(styles.text.label)}>Image</p>
            <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl border">
              <Image
                src={category.image_url}
                alt={category.name}
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
