'use client';

import { useState, useMemo, useCallback } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCategoryTree, useUpdateProductCategories } from '@/hooks/products/useProductCategories';
import { CategoryTreeView } from './CategoryTreeView';
import type { CategoryTree } from '@/hooks/products/useProductCategories';

interface CategoryPickerProps {
  storeId: string;
  productId: string;
  currentCategoryIds: string[];
  onCategoriesChange?: (categoryIds: string[]) => void;
}

/**
 * Filter tree recursively: keep nodes whose name matches or whose descendants match.
 */
function filterTree(nodes: CategoryTree[], query: string): CategoryTree[] {
  const lower = query.toLowerCase();
  return nodes.reduce<CategoryTree[]>((acc, node) => {
    const childMatches = filterTree(node.children, query);
    const selfMatches = node.name.toLowerCase().includes(lower);

    if (selfMatches || childMatches.length > 0) {
      acc.push({
        ...node,
        children: selfMatches ? node.children : childMatches,
      });
    }
    return acc;
  }, []);
}

export function CategoryPicker({
  storeId,
  productId,
  currentCategoryIds,
  onCategoriesChange,
}: CategoryPickerProps) {
  const { tree, isLoading } = useCategoryTree(storeId);
  const updateCategories = useUpdateProductCategories();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(currentCategoryIds),
  );
  const [search, setSearch] = useState('');

  const filteredTree = useMemo(() => {
    if (!search.trim()) return tree;
    return filterTree(tree, search.trim());
  }, [tree, search]);

  const handleToggle = useCallback(
    (categoryId: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(categoryId)) {
          next.delete(categoryId);
        } else {
          next.add(categoryId);
        }
        onCategoriesChange?.(Array.from(next));
        return next;
      });
    },
    [onCategoriesChange],
  );

  const hasChanges = useMemo(() => {
    if (selectedIds.size !== currentCategoryIds.length) return true;
    return currentCategoryIds.some((id) => !selectedIds.has(id));
  }, [selectedIds, currentCategoryIds]);

  const handleSave = () => {
    updateCategories.mutate({
      productId,
      categoryIds: Array.from(selectedIds),
    });
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-border/40 bg-card relative overflow-hidden',
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />

      <div className="relative z-10">
        {/* Search */}
        <div className="p-4 border-b border-border/40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une catégorie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tree */}
        <div className="max-h-[320px] overflow-y-auto p-2">
          <CategoryTreeView
            tree={filteredTree}
            selectedIds={selectedIds}
            onToggle={handleToggle}
            isLoading={isLoading}
            emptyMessage={
              search.trim()
                ? 'Aucune catégorie correspondante'
                : 'Aucune catégorie disponible'
            }
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border/40">
          <span className="text-xs text-muted-foreground">
            {selectedIds.size} catégorie{selectedIds.size !== 1 ? 's' : ''} sélectionnée{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || updateCategories.isPending}
          >
            {updateCategories.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
