/**
 * Products Toolbar Component
 *
 * Clean toolbar: search | status tabs + filters + column toggle
 * Active filter chips below as a unified row
 */

import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { FilterPills, FilterPill } from "./FilterPills";
import { VisibilityState } from "@tanstack/react-table";

type ProductsToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterComponent?: ReactNode;
  activeFilters?: FilterPill[];
  onRemoveFilter?: (id: string) => void;
  onClearAllFilters?: () => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  className?: string;
};

export const ProductsToolbar = ({
  searchValue,
  onSearchChange,
  filterComponent,
  activeFilters = [],
  onRemoveFilter,
  onClearAllFilters,
  columnVisibility = {},
  onColumnVisibilityChange,
  className,
}: ProductsToolbarProps) => {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Main row: search left, filters + view right */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative w-full max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-muted-foreground/50" />
          </span>
          <Input
            type="text"
            placeholder="Rechercher par titre, SKU, ID..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-4 h-8 w-full bg-muted/50 border-input shadow-none focus-visible:ring-1 focus-visible:ring-ring text-xs placeholder:text-muted-foreground rounded-lg"
          />
        </div>

        {/* Filter component (status tabs + advanced filters button) */}
        <div className="flex items-center gap-2 ml-auto">
          {filterComponent}

          {onColumnVisibilityChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Vue</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries({
                  image_url: "Image",
                  title: "Titre / ID / SKU",
                  status: "Statut",
                  price: "Prix",
                  stock: "Stock",
                  sales: "Ventes",
                  revenue: "CA",
                  seo: "SEO",
                  serp: "SERP",
                  sync: "Sync"
                }).map(([key, label]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    className="capitalize"
                    checked={columnVisibility[key] !== false}
                    onCheckedChange={(value) =>
                      onColumnVisibilityChange({
                        ...columnVisibility,
                        [key]: !!value,
                      })
                    }
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Active filter chips — single unified row */}
      {activeFilters.length > 0 && onRemoveFilter && onClearAllFilters && (
        <FilterPills
          activeFilters={activeFilters}
          onRemoveFilter={onRemoveFilter}
          onClearAll={onClearAllFilters}
        />
      )}
    </div>
  );
};
