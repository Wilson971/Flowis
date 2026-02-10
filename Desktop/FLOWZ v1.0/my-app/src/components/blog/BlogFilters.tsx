'use client';

/**
 * BlogFilters Component
 *
 * Search and filter controls for the blog articles list
 */

import { useState } from 'react';
import { Search, Filter, X, ChevronDown, LayoutList, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { styles } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import type { BlogFilters as BlogFiltersType, ArticleStatus } from '@/types/blog';

// ============================================================================
// STATUS OPTIONS
// ============================================================================

const STATUS_OPTIONS: { value: ArticleStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'published', label: 'Publiés' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'scheduled', label: 'Planifiés' },
  { value: 'ai_generated', label: 'Générés par IA' },
  { value: 'pending', label: 'En attente' },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'updated_at:desc', label: 'Modifié récemment' },
  { value: 'created_at:desc', label: 'Plus récent' },
  { value: 'created_at:asc', label: 'Plus ancien' },
  { value: 'title:asc', label: 'Titre A-Z' },
  { value: 'title:desc', label: 'Titre Z-A' },
  { value: 'seo_score:desc', label: 'Meilleur SEO' },
  { value: 'seo_score:asc', label: 'SEO à améliorer' },
];

// ============================================================================
// VIEW MODE TYPE
// ============================================================================

export type ViewMode = 'list' | 'grid';

// ============================================================================
// COMPONENT
// ============================================================================

interface BlogFiltersProps {
  filters: BlogFiltersType;
  onFiltersChange: (filters: BlogFiltersType) => void;
  categories?: string[];
  resultCount?: number;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function BlogFilters({
  filters,
  onFiltersChange,
  categories = [],
  resultCount,
  viewMode = 'list',
  onViewModeChange,
}: BlogFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchValue });
  };

  const handleSearchClear = () => {
    setSearchValue('');
    onFiltersChange({ ...filters, search: '' });
  };

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status as ArticleStatus | 'all',
    });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(':') as [
      BlogFiltersType['sortBy'],
      BlogFiltersType['sortOrder']
    ];
    onFiltersChange({ ...filters, sortBy, sortOrder });
  };

  const handleCategoryChange = (category: string) => {
    onFiltersChange({
      ...filters,
      category: category === 'all' ? undefined : category,
    });
  };

  const activeFiltersCount = [
    filters.status && filters.status !== 'all',
    filters.category,
    filters.search,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchValue('');
    onFiltersChange({
      status: 'all',
      category: undefined,
      search: '',
      sortBy: 'updated_at',
      sortOrder: 'desc',
    });
  };

  const currentSort = `${filters.sortBy || 'updated_at'}:${filters.sortOrder || 'desc'}`;

  return (
    <div className="space-y-4">
      {/* Search and Main Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Rechercher un article..."
            className={cn(styles.input.search, 'pl-10 pr-10')}
          />
          {searchValue && (
            <button
              type="button"
              onClick={handleSearchClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {/* Status Filter */}
        <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Filter */}
        {categories.length > 0 && (
          <Select
            value={filters.category || 'all'}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Sort */}
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="gap-2 text-muted-foreground"
          >
            <X className="h-4 w-4" />
            Effacer ({activeFiltersCount})
          </Button>
        )}

        {/* View Mode Toggle */}
        {onViewModeChange && (
          <div className="flex items-center border border-border rounded-lg p-1 ml-auto">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="h-8 w-8 p-0"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="h-8 w-8 p-0"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Active Filters & Results Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {filters.status && filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {STATUS_OPTIONS.find((o) => o.value === filters.status)?.label}
              <button
                onClick={() => handleStatusChange('all')}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              {filters.category}
              <button
                onClick={() => handleCategoryChange('all')}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              "{filters.search}"
              <button
                onClick={handleSearchClear}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>

        {resultCount !== undefined && (
          <p className={styles.text.bodySmall}>
            {resultCount} article{resultCount !== 1 ? 's' : ''} trouvé
            {resultCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}
