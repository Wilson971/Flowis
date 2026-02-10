"use client";

/**
 * StudioToolbar
 *
 * Unified toolbar for the Photo Studio page.
 * Provides search, filter bar, view mode toggle, and product count.
 * Mirrors the ProductsToolbar + ProductsFilter pattern.
 */

import React from "react";
import { Search, LayoutGrid, List, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  StudioFilterBar,
  type StudioStatusFilter,
  type PlatformFilter,
  type ImageCountFilter,
} from "./StudioFilterBar";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StudioViewMode = "grid" | "list";

interface StudioToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  viewMode: StudioViewMode;
  onViewModeChange: (mode: StudioViewMode) => void;
  productCount: number;
  statusFilter: StudioStatusFilter;
  platformFilter: PlatformFilter;
  imageCountFilter: ImageCountFilter;
  onStatusFilterChange: (value: StudioStatusFilter) => void;
  onPlatformFilterChange: (value: PlatformFilter) => void;
  onImageCountFilterChange: (value: ImageCountFilter) => void;
  onResetFilters: () => void;
}

// ---------------------------------------------------------------------------
// View mode config
// ---------------------------------------------------------------------------

const VIEW_MODES: Array<{
  key: StudioViewMode;
  icon: React.ReactNode;
  label: string;
}> = [
  {
    key: "grid",
    icon: <LayoutGrid className="h-4 w-4" />,
    label: "Grille",
  },
  {
    key: "list",
    icon: <List className="h-4 w-4" />,
    label: "Liste",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StudioToolbar({
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  productCount,
  statusFilter,
  platformFilter,
  imageCountFilter,
  onStatusFilterChange,
  onPlatformFilterChange,
  onImageCountFilterChange,
  onResetFilters,
}: StudioToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Top row: search + view toggle + count */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => onSearchChange("")}
              aria-label="Effacer la recherche"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/50">
          {VIEW_MODES.map((vm) => (
            <button
              key={vm.key}
              onClick={() => onViewModeChange(vm.key)}
              className={cn(
                "flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200",
                viewMode === vm.key
                  ? "bg-background text-foreground border border-border shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title={vm.label}
            >
              {vm.icon}
            </button>
          ))}
        </div>

        {/* Product count */}
        <div className="text-sm text-muted-foreground ml-auto">
          {productCount} produit{productCount !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Filter row */}
      <StudioFilterBar
        statusFilter={statusFilter}
        platformFilter={platformFilter}
        imageCountFilter={imageCountFilter}
        onStatusChange={onStatusFilterChange}
        onPlatformChange={onPlatformFilterChange}
        onImageCountChange={onImageCountFilterChange}
        onReset={onResetFilters}
      />
    </div>
  );
}
