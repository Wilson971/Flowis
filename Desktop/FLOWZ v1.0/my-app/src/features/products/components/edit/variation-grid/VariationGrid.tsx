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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_VISIBLE } from "./VariationGridColumns";
import type { VariationGridProps } from "./VariationGridColumns";
import { getUniqueAttributeNames, Package2Icon } from "./helpers";
import { ColumnSelector } from "./ColumnSelector";
import { VariationRow } from "./VariationRow";

/** Compact table header cell — Vercel Pro overline style */
function Th({ children }: { children: React.ReactNode }) {
    return (
        <TableHead className="h-8 px-3 py-0 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider whitespace-nowrap">
            {children}
        </TableHead>
    );
}

export function VariationGrid({
    variations,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    onUpdateField,
    onDelete,
    onOpenDetail,
    onImageClick,
    isLoading,
    changeCounter,
    uploadingVariationId,
    visibleColumns: externalCols,
    onVisibleColumnsChange,
    parentAttributeOptions,
    onDuplicateVariation,
    onCopyFieldToSelected,
    onCopyAllFieldsToSelected,
}: VariationGridProps) {
    // Internal state (used when no external control)
    const [internalCols, setInternalCols] = useState<Set<string>>(
        new Set(DEFAULT_VISIBLE)
    );

    const cols = externalCols ?? internalCols;
    const setCols = onVisibleColumnsChange ?? setInternalCols;

    const show = (key: string) => cols.has(key);

    // Must be called before any early return to respect Rules of Hooks
    const attrNames = useMemo(() => getUniqueAttributeNames(variations), [variations]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground opacity-0 animate-[spin_1s_linear_infinite,fadeIn_200ms_ease-out_200ms_forwards]" />
                <p className="text-xs text-muted-foreground mt-3">Chargement des variations…</p>
            </div>
        );
    }

    if (variations.length === 0) {
        return (
            <div className="py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 mx-auto mb-3">
                    <Package2Icon className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-[13px] font-medium text-foreground">Aucune variation</p>
                <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs mx-auto">
                    Ajoutez des attributs avec des valeurs puis cliquez sur &quot;Générer les variations&quot;.
                </p>
            </div>
        );
    }

    return (
        <Card className="h-full flex flex-col overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/50 flex-none">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-[15px] font-semibold tracking-tight text-foreground flex items-center gap-2">
                        Tableau des variations
                        <Badge variant="secondary" className="text-[10px] h-5 px-2 font-medium bg-muted/60 text-muted-foreground border-0 tabular-nums">
                            {variations.length}
                        </Badge>
                    </CardTitle>
                    <ColumnSelector visibleColumns={cols} onChange={setCols} />
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-auto min-h-0 p-0">
                <div className="min-w-full inline-block align-top">
                    <Table className="table-fixed w-full bg-card [&_td]:px-3 [&_td]:py-2">
                        {/* Column widths defined once with colgroup */}
                        <colgroup>
                            <col style={{ width: '36px' }} />
                            {show("image") && <col style={{ width: '52px' }} />}
                            {attrNames.map((name) => (
                                <col key={`col-attr-${name}`} style={{ minWidth: '70px' }} />
                            ))}
                            {show("sku") && <col style={{ width: '100px' }} />}
                            {show("prix") && <col style={{ width: '90px' }} />}
                            {show("promo") && <col style={{ width: '90px' }} />}
                            {show("stock") && <col style={{ width: '70px' }} />}
                            {show("weight") && <col style={{ width: '60px' }} />}
                            {show("dimensions") && <col style={{ width: '120px' }} />}
                            {show("gtin") && <col style={{ width: '110px' }} />}
                            {show("manageStock") && <col style={{ width: '44px' }} />}
                            {show("backorders") && <col style={{ width: '100px' }} />}
                            {show("taxStatus") && <col style={{ width: '90px' }} />}
                            {show("taxClass") && <col style={{ width: '80px' }} />}
                            {show("dateOnSaleFrom") && <col style={{ width: '120px' }} />}
                            {show("dateOnSaleTo") && <col style={{ width: '120px' }} />}
                            {show("description") && <col style={{ width: '130px' }} />}
                            {show("statut") && <col style={{ width: '90px' }} />}
                            <col style={{ width: '64px' }} />
                        </colgroup>

                        {/* Sticky header */}
                        <TableHeader className="sticky top-0 z-20 bg-card border-b border-border/40">
                            <TableRow className="hover:bg-transparent">
                            {/* Fixed: Checkbox */}
                            <TableHead className="h-8 w-[36px] sticky left-0 bg-card z-30 px-3 py-0">
                                <Checkbox
                                    checked={
                                        selectedIds.size === variations.length &&
                                        variations.length > 0
                                    }
                                    onCheckedChange={onToggleSelectAll}
                                />
                            </TableHead>
                            {show("image") && <Th>Img</Th>}
                            {attrNames.map((name) => (
                                <Th key={name}>{name}</Th>
                            ))}
                            {show("sku") && <Th>SKU</Th>}
                            {show("prix") && <Th>Prix</Th>}
                            {show("promo") && <Th>Promo</Th>}
                            {show("stock") && <Th>Stock</Th>}
                            {show("weight") && <Th>Poids</Th>}
                            {show("dimensions") && <Th>Dim.</Th>}
                            {show("gtin") && <Th>GTIN</Th>}
                            {show("manageStock") && <Th>Stk</Th>}
                            {show("backorders") && <Th>Préco.</Th>}
                            {show("taxStatus") && <Th>Taxe</Th>}
                            {show("taxClass") && <Th>Cl. taxe</Th>}
                            {show("dateOnSaleFrom") && <Th>Début</Th>}
                            {show("dateOnSaleTo") && <Th>Fin</Th>}
                            {show("description") && <Th>Desc.</Th>}
                            {show("statut") && <Th>Statut</Th>}
                            <TableHead className="h-8 w-[64px]" />
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
                                onImageClick={
                                    onImageClick
                                        ? () => onImageClick(variation._localId)
                                        : undefined
                                }
                                isUploading={uploadingVariationId === variation._localId}
                                show={show}
                                parentAttributeOptions={parentAttributeOptions}
                                selectedCount={selectedIds.size}
                                onDuplicate={
                                    onDuplicateVariation
                                        ? () => onDuplicateVariation(variation._localId)
                                        : undefined
                                }
                                onCopyFieldToSelected={
                                    onCopyFieldToSelected
                                        ? (field) => onCopyFieldToSelected(variation._localId, field)
                                        : undefined
                                }
                                onCopyAllToSelected={
                                    onCopyAllFieldsToSelected
                                        ? () => onCopyAllFieldsToSelected(variation._localId)
                                        : undefined
                                }
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
        </Card>
    );
}
