'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { styles } from '@/lib/design-system';
import { useStores } from '@/hooks/stores/useStores';
import { useCategoryTree } from '@/hooks/products/useProductCategories';
import type { CategoryTree } from '@/hooks/products/useProductCategories';
import { CategoryTreeView } from '@/components/categories/CategoryTreeView';
import { CategoryDetailPanel } from '@/components/categories/CategoryDetailPanel';
import { CategorySyncButton } from '@/components/categories/CategorySyncButton';

export function CategoriesPageClient() {
  const { data: stores } = useStores();
  const storeId = stores?.[0]?.id;
  const { tree, isLoading } = useCategoryTree(storeId);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const selectedIds = useMemo(
    () => (selectedCategoryId ? new Set([selectedCategoryId]) : new Set<string>()),
    [selectedCategoryId]
  );

  const flatFind = (nodes: CategoryTree[], id: string): CategoryTree | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children?.length) {
        const found = flatFind(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedCategory = selectedCategoryId && tree
    ? flatFind(tree, selectedCategoryId)
    : null;

  const handleToggle = (categoryId: string) => {
    setSelectedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  return (
    <div className="space-y-6">
      <div className={cn(styles.layout.flexBetween)}>
        <h1 className={cn(styles.text.h2)}>Catégories</h1>
        {storeId && <CategorySyncButton storeId={storeId} />}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <CategoryTreeView
            tree={tree ?? []}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onToggle={handleToggle}
            emptyMessage="Aucune catégorie trouvée"
          />
        </div>

        <div className="col-span-2">
          <CategoryDetailPanel category={selectedCategory} />
        </div>
      </div>
    </div>
  );
}
