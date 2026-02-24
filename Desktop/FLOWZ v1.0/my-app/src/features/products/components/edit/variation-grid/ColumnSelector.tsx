"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Settings2, RotateCcw } from "lucide-react";
import { SELECTABLE_COLUMNS, DEFAULT_VISIBLE } from "./VariationGridColumns";

export function ColumnSelector({
    visibleColumns,
    onChange,
}: {
    visibleColumns: Set<string>;
    onChange: (cols: Set<string>) => void;
}) {
    const toggleColumn = (key: string) => {
        const next = new Set(visibleColumns);
        if (next.has(key)) {
            next.delete(key);
        } else {
            next.add(key);
        }
        onChange(next);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                >
                    <Settings2 className="h-3.5 w-3.5" />
                    Colonnes
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-2" align="end">
                <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
                    {SELECTABLE_COLUMNS.map((col) => (
                        <label
                            key={col.key}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                            <Checkbox
                                checked={visibleColumns.has(col.key)}
                                onCheckedChange={() => toggleColumn(col.key)}
                            />
                            <span className="text-xs">{col.label}</span>
                        </label>
                    ))}
                </div>
                <div className="border-t border-border mt-1.5 pt-1.5">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full h-7 text-xs gap-1.5"
                        onClick={() => onChange(new Set(DEFAULT_VISIBLE))}
                    >
                        <RotateCcw className="h-3 w-3" />
                        Réinitialiser
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
