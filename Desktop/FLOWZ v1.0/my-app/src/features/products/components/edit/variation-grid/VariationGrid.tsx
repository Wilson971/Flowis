"use client";

import React, { useState, useMemo } from "react";
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { DEFAULT_VISIBLE } from "./VariationGridColumns";
import type { VariationGridProps } from "./VariationGridColumns";
import { getUniqueAttributeNames, Package2Icon } from "./helpers";
import { ColumnSelector } from "./ColumnSelector";
import { VariationRow } from "./VariationRow";

export function VariationGrid({
    variations,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    onUpdateField,
    onDelete,
    onOpenDetail,
    onImageUpload,
    isLoading,
    changeCounter,
    uploadingVariationId,
    visibleColumns: externalCols,
    onVisibleColumnsChange,
}: VariationGridProps) {
    // Internal state (used when no external control)
    const [internalCols, setInternalCols] = useState<Set<string>>(
        new Set(DEFAULT_VISIBLE)
    );

    const cols = externalCols ?? internalCols;
    const setCols = onVisibleColumnsChange ?? setInternalCols;

    const show = (key: string) => cols.has(key);

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (variations.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <Package2Icon className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">
                    Aucune variation. Ajoutez des attributs avec des valeurs puis
                    cliquez sur &quot;Générer les variations&quot;.
                </p>
            </div>
        );
    }

    // Extract unique attribute names for column headers (memoized)
    const attrNames = useMemo(() => getUniqueAttributeNames(variations), [variations]);

    return (
        <div className="h-full flex flex-col rounded-xl border border-border shadow-sm overflow-hidden">
            {/* Column selector bar - FIXED (not scrollable) */}
            <div className="flex-none flex items-center justify-between px-4 py-2 border-b border-border/50 bg-gradient-to-r from-muted/30 to-muted/10">
                <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <span className="text-xs font-medium text-foreground">
                        Tableau des variations
                    </span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                        {variations.length}
                    </Badge>
                </div>
                <ColumnSelector visibleColumns={cols} onChange={setCols} />
            </div>

            {/* Scrollable table wrapper - single table with sticky header */}
            <div className="flex-1 overflow-auto min-h-0">
                <div className="min-w-full inline-block align-top">
                    <Table className="table-fixed w-full">
                        {/* Column widths defined once with colgroup */}
                        <colgroup>
                            <col style={{ width: '40px' }} />
                            {show("image") && <col style={{ width: '80px' }} />}
                            {attrNames.map((name, idx) => (
                                <col key={`col-attr-${idx}`} style={{ minWidth: '80px' }} />
                            ))}
                            {show("sku") && <col style={{ width: '120px' }} />}
                            {show("prix") && <col style={{ width: '110px' }} />}
                            {show("promo") && <col style={{ width: '110px' }} />}
                            {show("stock") && <col style={{ width: '90px' }} />}
                            {show("weight") && <col style={{ width: '80px' }} />}
                            {show("dimensions") && <col style={{ width: '180px' }} />}
                            {show("gtin") && <col style={{ width: '130px' }} />}
                            {show("manageStock") && <col style={{ width: '50px' }} />}
                            {show("backorders") && <col style={{ width: '120px' }} />}
                            {show("taxStatus") && <col style={{ width: '110px' }} />}
                            {show("taxClass") && <col style={{ width: '100px' }} />}
                            {show("dateOnSaleFrom") && <col style={{ width: '140px' }} />}
                            {show("dateOnSaleTo") && <col style={{ width: '140px' }} />}
                            {show("description") && <col style={{ width: '150px' }} />}
                            {show("statut") && <col style={{ width: '110px' }} />}
                            <col style={{ width: '80px' }} />
                        </colgroup>

                        {/* Sticky header */}
                        <TableHeader className="sticky top-0 z-20 bg-card shadow-sm">
                            <TableRow className="border-b border-border/50 hover:bg-card">
                            {/* Fixed: Checkbox */}
                            <TableHead className="w-[40px] sticky left-0 bg-card z-30 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                                <Checkbox
                                    checked={
                                        selectedIds.size === variations.length &&
                                        variations.length > 0
                                    }
                                    onCheckedChange={onToggleSelectAll}
                                />
                            </TableHead>
                            {show("image") && <TableHead className="w-[80px] sticky top-0 bg-card z-20">Img</TableHead>}
                            {attrNames.map((name) => (
                                <TableHead key={name} className="min-w-[80px] sticky top-0 bg-card z-20">
                                    {name}
                                </TableHead>
                            ))}
                            {show("sku") && <TableHead className="w-[120px] sticky top-0 bg-card z-20">SKU</TableHead>}
                            {show("prix") && <TableHead className="w-[110px] sticky top-0 bg-card z-20">Prix</TableHead>}
                            {show("promo") && <TableHead className="w-[110px] sticky top-0 bg-card z-20">Promo</TableHead>}
                            {show("stock") && <TableHead className="w-[90px] sticky top-0 bg-card z-20">Stock</TableHead>}
                            {show("weight") && <TableHead className="w-[80px] sticky top-0 bg-card z-20">Poids</TableHead>}
                            {show("dimensions") && <TableHead className="w-[180px] sticky top-0 bg-card z-20">Dimensions</TableHead>}
                            {show("gtin") && <TableHead className="w-[130px] sticky top-0 bg-card z-20">GTIN/EAN</TableHead>}
                            {show("manageStock") && <TableHead className="w-[50px] sticky top-0 bg-card z-20" title="Gérer stock">Stk</TableHead>}
                            {show("backorders") && <TableHead className="w-[120px] sticky top-0 bg-card z-20">Précommandes</TableHead>}
                            {show("taxStatus") && <TableHead className="w-[110px] sticky top-0 bg-card z-20">Statut fiscal</TableHead>}
                            {show("taxClass") && <TableHead className="w-[100px] sticky top-0 bg-card z-20">Classe taxe</TableHead>}
                            {show("dateOnSaleFrom") && <TableHead className="w-[140px] sticky top-0 bg-card z-20">Début promo</TableHead>}
                            {show("dateOnSaleTo") && <TableHead className="w-[140px] sticky top-0 bg-card z-20">Fin promo</TableHead>}
                            {show("description") && <TableHead className="w-[150px] sticky top-0 bg-card z-20">Description</TableHead>}
                            {show("statut") && <TableHead className="w-[110px] sticky top-0 bg-card z-20">Statut</TableHead>}
                            {/* Fixed: Actions */}
                            <TableHead className="w-[80px] sticky top-0 bg-card z-20" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {variations.map((variation) => (
                            <VariationRow
                                key={`${variation._localId}-${changeCounter ?? 0}`}
                                variation={variation}
                                attrNames={attrNames}
                                isSelected={selectedIds.has(variation._localId)}
                                onToggleSelect={() =>
                                    onToggleSelect(variation._localId)
                                }
                                onUpdateField={(field, value) =>
                                    onUpdateField(variation._localId, field, value)
                                }
                                onDelete={() => onDelete(variation._localId)}
                                onOpenDetail={() =>
                                    onOpenDetail(variation._localId)
                                }
                                onImageUpload={
                                    onImageUpload
                                        ? (file) => onImageUpload(variation._localId, file)
                                        : undefined
                                }
                                isUploading={uploadingVariationId === variation._localId}
                                show={show}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
        </div>
    );
}
