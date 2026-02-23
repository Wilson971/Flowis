/**
 * Products Toolbar Component
 *
 * Modern toolbar with search, filters, and view controls
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
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-96">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-muted-foreground/50" />
          </span>
          <Input
            type="text"
            placeholder="Rechercher par titre, SKU, ID..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-4 h-9 w-full bg-muted/50 border-input shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all text-xs placeholder:text-muted-foreground rounded-lg transition-colors"
          />
        </div>

        {/* Actions & Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {filterComponent}

          {onColumnVisibilityChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
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
                }).map(([key, label]) => {
                  return (
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
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

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
