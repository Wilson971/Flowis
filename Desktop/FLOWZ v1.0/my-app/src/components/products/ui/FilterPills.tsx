import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type FilterPill = {
    id: string;
    label: string;
    value: string;
};

type FilterPillsProps = {
    activeFilters: FilterPill[];
    onRemoveFilter: (id: string) => void;
    onClearAll: () => void;
};

export const FilterPills = ({
    activeFilters,
    onRemoveFilter,
    onClearAll,
}: FilterPillsProps) => {
    if (activeFilters.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground font-medium mr-1">
                Filtres actifs :
            </span>
            {activeFilters.map((filter) => (
                <Badge
                    key={filter.id}
                    variant="secondary"
                    className="px-2 py-1 text-[11px] font-medium bg-secondary/50 hover:bg-secondary/70 border border-border flex items-center gap-1 transition-colors"
                >
                    <span className="text-muted-foreground mr-1">{filter.label}:</span>
                    <span className="font-semibold text-foreground">{filter.value}</span>
                    <button
                        onClick={() => onRemoveFilter(filter.id)}
                        className="ml-1 rounded-full p-0.5 hover:bg-background/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                        aria-label={`Remove filter ${filter.label}`}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
            {activeFilters.length > 1 && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
                    className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                    Tout effacer
                </Button>
            )}
        </div>
    );
};
