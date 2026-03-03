'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motionTokens } from '@/lib/design-system';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { CategoryTree } from '@/hooks/products/useProductCategories';

interface CategoryTreeViewProps {
  tree: CategoryTree[];
  selectedIds?: Set<string>;
  onToggle?: (categoryId: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

function TreeNode({
  node,
  selectedIds,
  onToggle,
  expandedIds,
  toggleExpand,
}: {
  node: CategoryTree;
  selectedIds?: Set<string>;
  onToggle?: (categoryId: string) => void;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedIds?.has(node.id) ?? false;

  return (
    <motion.div variants={motionTokens.variants.staggerItem}>
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors hover:bg-muted/50 cursor-pointer',
        )}
        style={{ paddingLeft: `${node.level * 20 + 8}px` }}
        onClick={() => hasChildren && toggleExpand(node.id)}
      >
        {/* Expand/collapse chevron */}
        <button
          type="button"
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-lg transition-transform',
            !hasChildren && 'invisible',
          )}
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand(node.id);
          }}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground transition-transform',
              isExpanded && 'rotate-90',
            )}
          />
        </button>

        {/* Checkbox */}
        {onToggle && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggle(node.id)}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0"
          />
        )}

        {/* Folder icon */}
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-primary/70" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        {/* Category name */}
        <span className="text-sm text-foreground truncate flex-1">{node.name}</span>

        {/* Product count badge */}
        {node.product_count > 0 && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
            {node.product_count}
          </Badge>
        )}
      </div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={motionTokens.transitions.fast}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                selectedIds={selectedIds}
                onToggle={onToggle}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function CategoryTreeView({
  tree,
  selectedIds,
  onToggle,
  isLoading = false,
  emptyMessage = 'Aucune catégorie trouvée',
}: CategoryTreeViewProps) {
  // Root nodes expanded by default
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    return new Set(tree.map((node) => node.id));
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Update expanded when tree changes (new root nodes)
  useMemo(() => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      tree.forEach((node) => next.add(node.id));
      return next;
    });
  }, [tree]);

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2" style={{ paddingLeft: `${(i % 3) * 20 + 8}px` }}>
            <Skeleton className="h-4 w-4 rounded-lg" />
            <Skeleton className="h-4 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <motion.div
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-0.5"
    >
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          selectedIds={selectedIds}
          onToggle={onToggle}
          expandedIds={expandedIds}
          toggleExpand={toggleExpand}
        />
      ))}
    </motion.div>
  );
}
