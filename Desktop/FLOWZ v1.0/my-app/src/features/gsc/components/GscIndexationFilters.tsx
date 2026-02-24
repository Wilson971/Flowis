"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Zap, X } from "lucide-react";
import type { GscUrlFilterRule } from "@/lib/gsc/types";

interface GscIndexationFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    filterRule: GscUrlFilterRule | null;
    filterValue: string;
    onFilterChange: (rule: GscUrlFilterRule | null, value: string) => void;
    onMassIndex: () => void;
    isMassIndexing: boolean;
    totalFiltered: number;
}

export function GscIndexationFilters({
    search,
    onSearchChange,
    filterRule,
    filterValue,
    onFilterChange,
    onMassIndex,
    isMassIndexing,
    totalFiltered,
}: GscIndexationFiltersProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [localRule, setLocalRule] = useState<GscUrlFilterRule>(filterRule || "contains");
    const [localValue, setLocalValue] = useState(filterValue);

    const handleApplyFilter = () => {
        onFilterChange(localValue ? localRule : null, localValue);
    };

    const handleClearFilter = () => {
        setLocalValue("");
        onFilterChange(null, "");
    };

    return (
        <div className="space-y-3">
            {/* Search bar */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Filtrer par nom..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 h-8 text-xs"
                    />
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 text-xs"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                >
                    <Filter className="h-3.5 w-3.5" />
                    {showAdvanced ? "Masquer" : "Filtres"}
                </Button>
            </div>

            {/* Advanced filter panel */}
            {showAdvanced && (
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 p-4 rounded-xl border border-border/40 bg-muted/30">
                    <div className="space-y-1 flex-shrink-0">
                        <label className="text-xs font-medium">Regle</label>
                        <Select
                            value={localRule}
                            onValueChange={(v) => setLocalRule(v as GscUrlFilterRule)}
                        >
                            <SelectTrigger className="w-[180px] h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="contains" className="text-xs">L&apos;URL contient</SelectItem>
                                <SelectItem value="not_contains" className="text-xs">L&apos;URL ne contient pas</SelectItem>
                                <SelectItem value="starts_with" className="text-xs">L&apos;URL commence par</SelectItem>
                                <SelectItem value="ends_with" className="text-xs">L&apos;URL se termine par</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                        <label className="text-xs font-medium">Valeur</label>
                        <Input
                            placeholder="/produit/"
                            value={localValue}
                            onChange={(e) => setLocalValue(e.target.value)}
                            className="h-8 text-xs"
                            onKeyDown={(e) => e.key === "Enter" && handleApplyFilter()}
                        />
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={handleApplyFilter}
                        >
                            Filtrer
                        </Button>
                        {filterRule && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs gap-1"
                                onClick={handleClearFilter}
                            >
                                <X className="h-3 w-3" />
                                Reset
                            </Button>
                        )}
                        <Button
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                            onClick={onMassIndex}
                            disabled={isMassIndexing || totalFiltered === 0}
                        >
                            <Zap className={cn("h-3.5 w-3.5", isMassIndexing && "animate-pulse")} />
                            Indexer {totalFiltered} page{totalFiltered > 1 ? "s" : ""}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
