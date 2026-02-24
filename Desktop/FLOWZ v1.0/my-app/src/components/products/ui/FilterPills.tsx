import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FilterPill = {
    id: string;
    label: string;
    value: string;
};

const FILTER_ACCENTS: Record<string, string> = {
    status:      'text-emerald-500',
    type:        'text-blue-500',
    category:    'text-violet-500',
    ai_status:   'text-violet-500',
    sync_status: 'text-emerald-500',
    stock:       'text-amber-500',
    price_range: 'text-emerald-500',
    sales:       'text-amber-500',
    seo_score:   'text-blue-500',
};

type FilterPillsProps = {
    activeFilters: FilterPill[];
    onRemoveFilter: (id: string) => void;
    onClearAll: () => void;
};

export const FilterPills = React.memo(({
    activeFilters,
    onRemoveFilter,
    onClearAll,
}: FilterPillsProps) => {
    if (activeFilters.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="text-[11px] text-muted-foreground/60 font-medium mr-1">
                Filtres :
            </span>
            {activeFilters.map((filter) => (
                <div
                    key={filter.id}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 bg-card/60 backdrop-blur-xl border border-white/[0.08] text-[11px]"
                >
                    <span className="text-muted-foreground">{filter.label}:</span>
                    <span className={cn("font-semibold", FILTER_ACCENTS[filter.id] || 'text-foreground')}>
                        {filter.value}
                    </span>
                    <button
                        onClick={() => onRemoveFilter(filter.id)}
                        className="ml-0.5 rounded-full p-0.5 text-muted-foreground/50 focus:outline-none"
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
                    className="h-6 px-2 text-[11px] text-muted-foreground/50 rounded-full"
                >
                    Tout effacer
                </Button>
            )}
        </div>
    );
});

FilterPills.displayName = 'FilterPills';
