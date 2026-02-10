/**
 * Blog Filter Component
 *
 * Filter controls for blog articles (status, category)
 */

import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ArticleStatus } from "@/types/blog";

const STATUS_OPTIONS: { value: ArticleStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'published', label: 'Publiés' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'scheduled', label: 'Planifiés' },
  { value: 'ai_generated', label: 'Générés par IA' },
  { value: 'pending', label: 'En attente' },
];

type BlogFilterProps = {
  statusFilter: ArticleStatus | 'all';
  categoryFilter?: string;
  categories?: string[];
  onStatusChange: (status: string | null) => void;
  onCategoryChange?: (category: string | null) => void;
  onReset: () => void;
  className?: string;
};

export const BlogFilter = ({
  statusFilter,
  categoryFilter,
  categories = [],
  onStatusChange,
  onCategoryChange,
  onReset,
  className,
}: BlogFilterProps) => {
  const hasActiveFilters = statusFilter !== 'all' || (categoryFilter && categoryFilter !== 'all');

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Status Filter */}
      <Select
        value={statusFilter}
        onValueChange={(val) => onStatusChange(val === 'all' ? null : val)}
      >
        <SelectTrigger className="h-9 w-[160px] text-xs bg-muted/50 border-input">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-xs">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Category Filter */}
      {categories.length > 0 && onCategoryChange && (
        <Select
          value={categoryFilter || 'all'}
          onValueChange={(val) => onCategoryChange(val === 'all' ? null : val)}
        >
          <SelectTrigger className="h-9 w-[160px] text-xs bg-muted/50 border-input">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Toutes les catégories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category} className="text-xs">
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Reset Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5 mr-1.5" />
          Réinitialiser
        </Button>
      )}
    </div>
  );
};
