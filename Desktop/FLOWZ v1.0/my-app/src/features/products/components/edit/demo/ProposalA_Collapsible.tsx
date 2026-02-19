"use client";

import { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from "@/components/ui/collapsible";
import { Shuffle, ChevronDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

import { AttributeBuilder } from "../AttributeBuilder";
import { VariationGrid } from "../VariationGrid";
import { BulkVariationToolbar } from "../BulkVariationToolbar";
import type { EditableVariation } from "../../../hooks/useVariationManager";
import type { ProductFormValues } from "../../../schemas/product-schema";

// ============================================================================
// TYPES
// ============================================================================

interface ProposalAProps {
    variations: EditableVariation[];
    onUpdateField: (localId: string, field: keyof EditableVariation, value: unknown) => void;
    onDelete: (localId: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProposalA_Collapsible({
    variations,
    onUpdateField,
    onDelete,
}: ProposalAProps) {
    // Local selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Read attributes from form context for the collapsible summary badges
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

    // ===== COMPUTED =====

    const dynamicMaxHeight = `${Math.min(variations.length * 55, 400)}px`;

    return (
        <Card className="rounded-xl">
            {/* ── Header ── */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Shuffle className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">
                            Variations
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                            {variations.length}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            Proposition A
                        </Badge>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled
                    className="rounded-lg"
                >
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    Générer les variations
                </Button>
            </CardHeader>

            {/* ── Content ── */}
            <CardContent className="space-y-6">
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

                            {/* Summary badges showing attribute names + option counts */}
                            <div className="flex items-center gap-2">
                                {attributes.length > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        {attributes.map((attr, idx) => (
                                            <Badge
                                                key={idx}
                                                variant="secondary"
                                                className="text-xs font-normal"
                                            >
                                                {attr.name || "Sans nom"} ({attr.options?.length ?? 0})
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                <ChevronDown
                                    className={cn(
                                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                                        "group-data-[state=open]:rotate-180"
                                    )}
                                />
                            </div>
                        </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="pt-4">
                        <AttributeBuilder />
                    </CollapsibleContent>
                </Collapsible>

                {/* Separator between attributes and variations grid */}
                {variations.length > 0 && <Separator />}

                {/* Bulk toolbar */}
                <BulkVariationToolbar
                    selectedCount={selectedIds.size}
                    onBulkUpdate={bulkUpdateField}
                    onDeleteSelected={deleteSelected}
                    onClearSelection={clearSelection}
                />

                {/* Variation Grid with dynamic max-height */}
                <div
                    style={{ maxHeight: dynamicMaxHeight }}
                    className="overflow-y-auto"
                >
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
            </CardContent>
        </Card>
    );
}
