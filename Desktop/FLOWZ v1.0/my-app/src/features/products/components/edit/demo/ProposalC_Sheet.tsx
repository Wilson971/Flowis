"use client";

import { useState, useCallback, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shuffle, ChevronDown, RefreshCw, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

import { AttributeBuilder } from "../AttributeBuilder";
import { VariationGrid } from "../VariationGrid";
import { BulkVariationToolbar } from "../BulkVariationToolbar";
import type { EditableVariation } from "../../../hooks/useVariationManager";
import type { ProductFormValues } from "../../../schemas/product-schema";

// ============================================================================
// TYPES
// ============================================================================

interface ProposalCProps {
    variations: EditableVariation[];
    onUpdateField: (localId: string, field: keyof EditableVariation, value: unknown) => void;
    onDelete: (localId: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProposalC_Sheet({
    variations,
    onUpdateField,
    onDelete,
}: ProposalCProps) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Read attributes from form context
    const { watch } = useFormContext<ProductFormValues>();
    const attributes = watch("attributes") || [];

    // ===== SELECTION HANDLERS =====

    const toggleSelect = useCallback(
        (localId: string) => {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(localId)) {
                    next.delete(localId);
                } else {
                    next.add(localId);
                }
                return next;
            });
        },
        []
    );

    const toggleSelectAll = useCallback(() => {
        setSelectedIds((prev) => {
            if (prev.size === variations.length && variations.length > 0) {
                return new Set();
            }
            return new Set(variations.map((v) => v._localId));
        });
    }, [variations]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    // ===== BULK HANDLERS =====

    const bulkUpdateField = useCallback(
        (field: keyof EditableVariation, value: unknown) => {
            for (const localId of selectedIds) {
                onUpdateField(localId, field, value);
            }
        },
        [selectedIds, onUpdateField]
    );

    const deleteSelected = useCallback(() => {
        for (const localId of selectedIds) {
            onDelete(localId);
        }
        setSelectedIds(new Set());
    }, [selectedIds, onDelete]);

    // ===== COMPUTED STATS =====

    const activeVariations = useMemo(
        () => variations.filter((v) => v._status !== "deleted"),
        [variations]
    );

    const variationAttributeCount = useMemo(
        () => attributes.filter((a) => a.variation === true).length,
        [attributes]
    );

    const priceRange = useMemo(() => {
        const prices = activeVariations
            .map((v) => parseFloat(v.regularPrice) || 0)
            .filter((p) => p > 0);
        if (prices.length === 0) return "N/A";
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        if (min === max) return `${min.toFixed(2)} \u20AC`;
        return `${min.toFixed(2)} \u2013 ${max.toFixed(2)} \u20AC`;
    }, [activeVariations]);

    const totalStock = useMemo(
        () =>
            activeVariations.reduce(
                (sum, v) => sum + (v.stockQuantity ?? 0),
                0
            ),
        [activeVariations]
    );

    const stats = useMemo(() => {
        const total = activeVariations.length;
        const modified = variations.filter((v) => v._status === "modified").length;
        const newCount = variations.filter((v) => v._status === "new").length;
        return { total, modified, new: newCount };
    }, [variations, activeVariations]);

    // ===== RENDER =====

    return (
        <>
            {/* ── Inline Summary Card ── */}
            <Card className="rounded-xl">
                <CardContent className="p-6">
                    {/* Top bar: title + open button */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Shuffle className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-foreground">
                                        Variations
                                    </h3>
                                    <Badge variant="secondary" className="text-xs">
                                        {activeVariations.length}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                        Proposition C
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Gérez les déclinaisons depuis un panneau dédié
                                </p>
                            </div>
                        </div>

                        <Button
                            type="button"
                            onClick={() => setSheetOpen(true)}
                            className="rounded-lg"
                        >
                            Gérer les variations
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    <Separator className="my-4" />

                    {/* Summary stats grid */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Attributs</p>
                            <p className="text-sm font-medium text-foreground">
                                {variationAttributeCount}
                            </p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Fourchette prix</p>
                            <p className="text-sm font-medium text-foreground">
                                {priceRange}
                            </p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Stock total</p>
                            <p className="text-sm font-medium text-foreground">
                                {totalStock}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Sheet Panel (700px) ── */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent
                    className="w-[600px] sm:w-[700px] flex flex-col"
                    side="right"
                >
                    {/* Header */}
                    <SheetHeader>
                        <SheetTitle>
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                    <Shuffle className="h-4 w-4 text-primary" />
                                </div>
                                <span>Gestion des variations</span>
                                <Badge variant="secondary" className="text-xs">
                                    {activeVariations.length}
                                </Badge>
                            </div>
                        </SheetTitle>
                        <SheetDescription>
                            Configurez les attributs et gérez les déclinaisons de votre produit.
                        </SheetDescription>
                    </SheetHeader>

                    <Separator />

                    {/* Scrollable content area */}
                    <div className="flex-1 overflow-y-auto space-y-6 py-4">
                        {/* Collapsible AttributeBuilder */}
                        <Collapsible defaultOpen={false}>
                            <CollapsibleTrigger asChild>
                                <button
                                    type="button"
                                    className={cn(
                                        "group rounded-lg border border-border/50 bg-muted/30 px-4 py-3",

                                        "hover:bg-muted/50 transition-colors cursor-pointer",
                                        "w-full flex items-center justify-between"
                                    )}
                                >
                                    <span className="text-sm font-medium text-foreground">
                                        Attributs du produit
                                    </span>
                                    <ChevronDown
                                        className={cn(
                                            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                                            "group-data-[state=open]:rotate-180"
                                        )}
                                    />
                                </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-4">
                                <AttributeBuilder />
                            </CollapsibleContent>
                        </Collapsible>

                        <Separator />

                        {/* Grid header + generate button */}
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-foreground">
                                Grille de variations
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled
                                className="rounded-lg"
                            >
                                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                                Générer
                            </Button>
                        </div>

                        {/* Bulk toolbar */}
                        <BulkVariationToolbar
                            selectedCount={selectedIds.size}
                            onBulkUpdate={bulkUpdateField}
                            onDeleteSelected={deleteSelected}
                            onClearSelection={clearSelection}
                        />

                        {/* Variation grid - no max-h, scrolling handled by parent */}
                        <VariationGrid
                            variations={variations}
                            selectedIds={selectedIds}
                            onToggleSelect={toggleSelect}
                            onToggleSelectAll={toggleSelectAll}
                            onUpdateField={onUpdateField}
                            onDelete={onDelete}
                            onOpenDetail={() => {}}
                        />
                    </div>

                    <Separator />

                    {/* Footer */}
                    <div className="py-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                            {stats.total} variation(s) · {stats.modified} modifiée(s) · {stats.new} nouvelle(s)
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSheetOpen(false)}
                            className="rounded-lg"
                        >
                            Fermer
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
