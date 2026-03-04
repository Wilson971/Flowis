"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    CheckCircle2,
    DollarSign,
    Tag,
    Package,
    Trash2,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditableVariation } from "../../hooks/useVariationManager";

// ============================================================================
// TYPES
// ============================================================================

export interface VariationFilters {
    search: string;
    attributes: Record<string, string>;
}

interface VariationToolbarProps {
    variationAttributes: { name: string; options: string[] }[];
    filters: VariationFilters;
    onFiltersChange: (filters: VariationFilters) => void;
    selectedCount: number;
    onBulkUpdate: (field: keyof EditableVariation, value: unknown) => void;
    onDeleteSelected: () => void;
    onClearSelection: () => void;
    totalCount: number;
    filteredCount: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VariationToolbar({
    variationAttributes,
    filters,
    onFiltersChange,
    selectedCount,
    onBulkUpdate,
    onDeleteSelected,
    onClearSelection,
    totalCount,
    filteredCount,
}: VariationToolbarProps) {
    const [bulkPrice, setBulkPrice] = useState("");
    const [bulkPromo, setBulkPromo] = useState("");
    const [bulkStock, setBulkStock] = useState("");

    const handleBulkApply = (field: keyof EditableVariation, value: string, setter: (v: string) => void) => {
        if (!value) return;
        if (field === "stockQuantity") {
            onBulkUpdate(field, parseInt(value, 10));
        } else {
            onBulkUpdate(field, value);
        }
        setter("");
    };

    const isFiltered = filters.search || Object.values(filters.attributes).some((v) => v !== "");

    // ===== BULK MODE =====
    if (selectedCount > 0) {
        return (
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-primary/20 bg-primary/5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                    {selectedCount} sélectionnée(s)
                </span>

                <div className="h-5 w-px bg-border mx-1" />

                <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={bulkPrice}
                            onChange={(e) => setBulkPrice(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleBulkApply("regularPrice", bulkPrice, setBulkPrice);
                            }}
                            placeholder="Prix"
                            className="h-7 w-20 text-xs"
                        />
                    </div>

                    <div className="flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={bulkPromo}
                            onChange={(e) => setBulkPromo(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleBulkApply("salePrice", bulkPromo, setBulkPromo);
                            }}
                            placeholder="Promo"
                            className="h-7 w-20 text-xs"
                        />
                    </div>

                    <div className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            type="number"
                            min="0"
                            value={bulkStock}
                            onChange={(e) => setBulkStock(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleBulkApply("stockQuantity", bulkStock, setBulkStock);
                            }}
                            placeholder="Stock"
                            className="h-7 w-20 text-xs"
                        />
                    </div>

                    <Select onValueChange={(val) => onBulkUpdate("status", val)}>
                        <SelectTrigger className="h-7 w-auto text-xs">
                            <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="publish">Publié</SelectItem>
                            <SelectItem value="private">Privé</SelectItem>
                            <SelectItem value="draft">Brouillon</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="h-5 w-px bg-border mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs"
                    onClick={onDeleteSelected}
                >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Supprimer
                </Button>

                <div className="ml-auto">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={onClearSelection}
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        );
    }

    // ===== FILTER MODE =====
    return (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50">
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                    value={filters.search}
                    onChange={(e) =>
                        onFiltersChange({ ...filters, search: e.target.value })
                    }
                    placeholder="Rechercher SKU, attribut..."
                    className="h-8 w-48 pl-8 text-xs"
                />
            </div>

            {variationAttributes.map((attr) => (
                <Select
                    key={attr.name}
                    value={filters.attributes[attr.name] || ""}
                    onValueChange={(val) =>
                        onFiltersChange({
                            ...filters,
                            attributes: {
                                ...filters.attributes,
                                [attr.name]: val === "__all__" ? "" : val,
                            },
                        })
                    }
                >
                    <SelectTrigger className="h-8 w-auto text-xs gap-1">
                        <span className="text-muted-foreground">{attr.name}:</span>
                        <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Tous</SelectItem>
                        {attr.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                                {opt}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ))}

            {isFiltered && (
                <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px] h-5">
                        {filteredCount}/{totalCount}
                    </Badge>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                            onFiltersChange({ search: "", attributes: {} })
                        }
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}
        </div>
    );
}
