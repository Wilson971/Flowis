/**
 * Products Toolbar V2 — Vercel Pro Pattern
 * Dense, clean, monochrome
 */

import { Search, SlidersHorizontal, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { FilterPillsV2, FilterPill } from "./FilterPillsV2";
import { VisibilityState } from "@tanstack/react-table";

type ProductsToolbarV2Props = {
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

const COLUMN_LABELS: Record<string, string> = {
  image_url: "Image",
  title: "Titre / ID / SKU",
  status: "Statut",
  price: "Prix",
  stock: "Stock",
  sales: "Ventes",
  revenue: "CA",
  seo: "SEO",
  serp: "SERP",
  sync: "Sync",
};

export const ProductsToolbarV2 = ({
  searchValue,
  onSearchChange,
  filterComponent,
  activeFilters = [],
  onRemoveFilter,
  onClearAllFilters,
  columnVisibility = {},
  onColumnVisibilityChange,
  className,
}: ProductsToolbarV2Props) => {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Main row */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input
            type="text"
            placeholder="Rechercher par titre, SKU, ID..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-4 h-8 w-full bg-muted/50 border-border/40 shadow-none focus-visible:ring-1 focus-visible:ring-ring text-xs placeholder:text-muted-foreground/50 rounded-lg"
          />
        </div>

        {/* Filters + Column toggle */}
        <div className="flex items-center gap-2 ml-auto">
          {filterComponent}

          {onColumnVisibilityChange && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] rounded-lg gap-1 font-medium border-border/60 hover:bg-accent hover:text-accent-foreground"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Vue</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[200px] rounded-xl border-border/40 shadow-lg p-0">
                <div className="px-4 py-3">
                  <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                    Colonnes visibles
                  </span>
                </div>
                <div className="mx-4 border-t border-border/30" />
                <div className="py-1.5 px-1.5">
                  {Object.entries(COLUMN_LABELS).map(([key, label]) => {
                    const isVisible = columnVisibility[key] !== false;
                    return (
                      <button
                        key={key}
                        onClick={() =>
                          onColumnVisibilityChange({
                            ...columnVisibility,
                            [key]: !isVisible,
                          })
                        }
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
                          isVisible
                            ? "text-foreground hover:bg-muted/30"
                            : "text-muted-foreground/50 hover:bg-muted/30 hover:text-muted-foreground"
                        )}
                      >
                        <div className={cn(
                          "flex h-4 w-4 items-center justify-center rounded shrink-0 transition-colors",
                          isVisible
                            ? "bg-foreground"
                            : "border border-border/60"
                        )}>
                          {isVisible && <Check className="h-3 w-3 text-background" />}
                        </div>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && onRemoveFilter && onClearAllFilters && (
        <FilterPillsV2
          activeFilters={activeFilters}
          onRemoveFilter={onRemoveFilter}
          onClearAll={onClearAllFilters}
        />
      )}
    </div>
  );
};
