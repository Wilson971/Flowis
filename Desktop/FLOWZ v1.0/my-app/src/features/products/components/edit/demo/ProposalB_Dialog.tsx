"use client";

import { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shuffle, Settings2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { AttributeBuilder } from "../AttributeBuilder";
import { VariationGrid } from "../VariationGrid";
import { BulkVariationToolbar } from "../BulkVariationToolbar";
import type { EditableVariation } from "../../../hooks/useVariationManager";
import type { ProductFormValues } from "../../../schemas/product-schema";

// ============================================================================
// TYPES
// ============================================================================

interface ProposalBProps {
    variations: EditableVariation[];
    onUpdateField: (
        localId: string,
        field: keyof EditableVariation,
        value: unknown
    ) => void;
    onDelete: (localId: string) => void;
}

// ============================================================================
// ATTRIBUTE SUMMARY BAR (local component)
// ============================================================================

function AttributeSummaryBar({ onOpenDialog }: { onOpenDialog: () => void }) {
    const { watch } = useFormContext<ProductFormValues>();
    const attributes = watch("attributes") ?? [];

    const variationAttributes = attributes.filter((attr) => attr.variation);

    return (
        <div
            className={cn(
                "rounded-lg border bg-muted/20 px-4 py-3",
                "flex items-center justify-between"
            )}
        >
            <div className="flex items-center gap-2 flex-wrap">
                {variationAttributes.length > 0 ? (
                    variationAttributes.map((attr, idx) => (
                        <Badge key={idx} variant="secondary">
                            {attr.name} ({attr.options.length})
                        </Badge>
                    ))
                ) : (
                    <span className="text-sm text-muted-foreground">
                        Aucun attribut configure
                    </span>
                )}
            </div>

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenDialog}
            >
                <Settings2 className="mr-2 h-4 w-4" />
                Configurer les attributs
            </Button>
        </div>
    );
}

// ============================================================================
// PROPOSAL B - DIALOG
// ============================================================================

export function ProposalB_Dialog({
    variations,
    onUpdateField,
    onDelete,
}: ProposalBProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // ---------- Selection handlers ----------

    const toggleSelect = useCallback((localId: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(localId)) {
                next.delete(localId);
            } else {
                next.add(localId);
            }
            return next;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        setSelectedIds((prev) => {
            if (prev.size === variations.length) {
                return new Set();
            }
            return new Set(variations.map((v) => v._localId));
        });
    }, [variations]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    // ---------- Bulk handlers (demo stubs) ----------

    const handleBulkUpdate = useCallback(
        (field: keyof EditableVariation, value: unknown) => {
            selectedIds.forEach((id) => {
                onUpdateField(id, field, value);
            });
        },
        [selectedIds, onUpdateField]
    );

    const handleDeleteSelected = useCallback(() => {
        selectedIds.forEach((id) => {
            onDelete(id);
        });
        clearSelection();
    }, [selectedIds, onDelete, clearSelection]);

    // ---------- Dynamic grid height ----------

    const gridMaxHeight = `${Math.min(variations.length * 55, 400)}px`;

    return (
        <>
            {/* ===== CARD ===== */}
            <Card className="rounded-xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className={cn(
                                    "flex h-9 w-9 items-center justify-center",
                                    "rounded-lg bg-primary/10"
                                )}
                            >
                                <Shuffle className="h-4 w-4 text-primary" />
                            </div>
                            <CardTitle className="text-base font-semibold">
                                Variations
                            </CardTitle>
                            <Badge variant="secondary" className="tabular-nums">
                                {variations.length}
                            </Badge>
                            <Badge
                                className={cn(
                                    "bg-primary/10 text-primary",
                                    "border-transparent hover:bg-primary/15"
                                )}
                            >
                                Proposition B ★
                            </Badge>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Attribute summary bar */}
                    <AttributeSummaryBar
                        onOpenDialog={() => setDialogOpen(true)}
                    />

                    {/* Separator + Grid */}
                    {variations.length > 0 && <Separator />}

                    <BulkVariationToolbar
                        selectedCount={selectedIds.size}
                        onBulkUpdate={handleBulkUpdate}
                        onDeleteSelected={handleDeleteSelected}
                        onClearSelection={clearSelection}
                    />

                    <div
                        className="overflow-y-auto"
                        style={{ maxHeight: gridMaxHeight }}
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

            {/* ===== DIALOG (sibling of Card, still child of FormProvider) ===== */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <div
                                className={cn(
                                    "flex h-9 w-9 items-center justify-center",
                                    "rounded-lg bg-primary/10"
                                )}
                            >
                                <Settings2 className="h-4 w-4 text-primary" />
                            </div>
                            Configurer les attributs
                        </DialogTitle>
                        <DialogDescription>
                            Definissez les attributs et leurs valeurs pour creer
                            des variations.
                        </DialogDescription>
                    </DialogHeader>

                    <Separator />

                    <div className="overflow-y-auto max-h-[50vh] py-4">
                        <AttributeBuilder />
                    </div>

                    <Separator />

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                        >
                            Fermer
                        </Button>
                        <Button
                            type="button"
                            disabled
                            onClick={() => setDialogOpen(false)}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Generer les variations
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
