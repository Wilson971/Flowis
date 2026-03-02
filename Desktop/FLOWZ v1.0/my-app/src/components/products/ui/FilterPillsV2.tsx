/**
 * Filter Pills V2 — Vercel Pro Pattern
 * Monochrome, dense, border-0 pills
 */

import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FilterPill = {
  id: string;
  label: string;
  value: string;
};

type FilterPillsV2Props = {
  activeFilters: FilterPill[];
  onRemoveFilter: (id: string) => void;
  onClearAll: () => void;
};

export const FilterPillsV2 = React.memo(({
  activeFilters,
  onRemoveFilter,
  onClearAll,
}: FilterPillsV2Props) => {
  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-3">
      <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mr-1">
        Filtres
      </span>
      {activeFilters.map((filter) => (
        <div
          key={filter.id}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5",
            "bg-muted/40 border border-border/40 text-[11px]"
          )}
        >
          <span className="text-muted-foreground">{filter.label}:</span>
          <span className="font-medium text-foreground">{filter.value}</span>
          <button
            onClick={() => onRemoveFilter(filter.id)}
            className="ml-0.5 rounded-full p-0.5 text-muted-foreground/50 hover:text-foreground transition-colors"
            aria-label={`Supprimer le filtre ${filter.label}`}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      ))}
      {activeFilters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2 text-[11px] text-muted-foreground/50 hover:text-foreground rounded-full"
        >
          Tout effacer
        </Button>
      )}
    </div>
  );
});

FilterPillsV2.displayName = 'FilterPillsV2';
