"use client";

import React, { useState, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Image as ImageIcon,
    Expand,
    Trash2,
    Loader2,
    Settings2,
    RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
    EditableVariation,
    VariationStatus,
} from "../../hooks/useVariationManager";

// ============================================================================
// COLUMN CONFIGURATION
// ============================================================================

interface GridColumn {
    key: string;
    label: string;
    defaultVisible: boolean;
    /** Fixed columns are always visible and not in the selector */
    fixed?: boolean;
}

const GRID_COLUMNS: GridColumn[] = [
    { key: "checkbox", label: "", defaultVisible: true, fixed: true },
    { key: "image", label: "Img", defaultVisible: true },
    // Dynamic attribute columns are injected at render time
    { key: "sku", label: "SKU", defaultVisible: true },
    { key: "prix", label: "Prix", defaultVisible: true },
    { key: "promo", label: "Promo", defaultVisible: true },
    { key: "stock", label: "Stock", defaultVisible: true },
    { key: "weight", label: "Poids", defaultVisible: false },
    { key: "dimensions", label: "Dimensions", defaultVisible: false },
    { key: "gtin", label: "GTIN/EAN", defaultVisible: false },
    { key: "manageStock", label: "Gérer stock", defaultVisible: false },
    { key: "backorders", label: "Précommandes", defaultVisible: false },
    { key: "taxStatus", label: "Statut fiscal", defaultVisible: false },
    { key: "taxClass", label: "Classe taxe", defaultVisible: false },
    { key: "dateOnSaleFrom", label: "Début promo", defaultVisible: false },
    { key: "dateOnSaleTo", label: "Fin promo", defaultVisible: false },
    { key: "description", label: "Description", defaultVisible: false },
    { key: "statut", label: "Statut", defaultVisible: true },
    { key: "actions", label: "", defaultVisible: true, fixed: true },
];

const DEFAULT_VISIBLE = new Set(
    GRID_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key)
);

/** Columns that appear in the selector (non-fixed) */
const SELECTABLE_COLUMNS = GRID_COLUMNS.filter((c) => !c.fixed);

// ============================================================================
// TYPES
// ============================================================================

interface VariationGridProps {
    variations: EditableVariation[];
    selectedIds: Set<string>;
    onToggleSelect: (localId: string) => void;
    onToggleSelectAll: () => void;
    onUpdateField: (
        localId: string,
        field: keyof EditableVariation,
        value: unknown
    ) => void;
    onDelete: (localId: string) => void;
    onOpenDetail: (localId: string) => void;
    onImageUpload?: (localId: string, file: File) => void;
    isLoading?: boolean;
    changeCounter?: number;
    uploadingVariationId?: string | null;
    /** External column visibility control */
    visibleColumns?: Set<string>;
    onVisibleColumnsChange?: (cols: Set<string>) => void;
}

// ============================================================================
// STATUS STYLES
// ============================================================================

const statusBorderColors: Record<VariationStatus, string> = {
    synced: "border-l-emerald-500",
    new: "border-l-blue-500",
    modified: "border-l-amber-500",
    deleted: "border-l-red-500",
};

const statusBgColors: Record<VariationStatus, string> = {
    synced: "bg-emerald-500/5",
    new: "bg-blue-500/5",
    modified: "bg-amber-500/5",
    deleted: "bg-red-500/5",
};

const statusLabels: Record<VariationStatus, string> = {
    synced: "Synchronisée",
    new: "Nouvelle",
    modified: "Modifiée",
    deleted: "Supprimée",
};

// ============================================================================
// COLUMN SELECTOR
// ============================================================================

function ColumnSelector({
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

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

// ============================================================================
// ROW
// ============================================================================

const VariationRow = React.memo(function VariationRow({
    variation,
    attrNames,
    isSelected,
    onToggleSelect,
    onUpdateField,
    onDelete,
    onOpenDetail,
    onImageUpload,
    isUploading,
    show,
}: {
    variation: EditableVariation;
    attrNames: string[];
    isSelected: boolean;
    onToggleSelect: () => void;
    onUpdateField: (field: keyof EditableVariation, value: unknown) => void;
    onDelete: () => void;
    onOpenDetail: () => void;
    onImageUpload?: (file: File) => void;
    isUploading?: boolean;
    show: (key: string) => boolean;
}) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const attrMap = useMemo(
        () => new Map(variation.attributes.map((a) => [a.name, a.option])),
        [variation.attributes]
    );
    const isDeleted = variation._status === "deleted";

    return (
        <TableRow
            className={cn(
                "border-l-4 transition-all duration-200 group",
                statusBorderColors[variation._status],
                statusBgColors[variation._status],
                "hover:bg-muted/30",
                isDeleted && "opacity-40 line-through"
            )}
        >
            {/* Fixed: Checkbox with Status Indicator */}
            <TableCell className="sticky left-0 bg-background group-hover:bg-muted/30 z-10 transition-colors">
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelect}
                    />
                    <TooltipProvider delayDuration={200}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn(
                                        "h-2 w-2 rounded-full transition-all",
                                        variation._status === "synced" && "bg-emerald-500",
                                        variation._status === "new" && "bg-blue-500",
                                        variation._status === "modified" && "bg-amber-500",
                                        variation._status === "deleted" && "bg-red-500"
                                    )}
                                />
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p className="text-xs">{statusLabels[variation._status]}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </TableCell>

            {/* Image */}
            {show("image") && (
                <TableCell>
                    <div
                        className={cn(
                            "h-16 w-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden",
                            "border-2 border-border/50 cursor-pointer group/img relative",
                            "transition-all duration-200",
                            "hover:border-primary hover:shadow-md hover:scale-105"
                        )}
                        onClick={() => onImageUpload && fileInputRef.current?.click()}
                    >
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-1">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <span className="text-[9px] text-muted-foreground">Upload...</span>
                            </div>
                        ) : variation.image?.src ? (
                            <img
                                src={variation.image.src}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-1">
                                <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                                <span className="text-[9px] text-muted-foreground/50">Ajouter</span>
                            </div>
                        )}
                        {!isUploading && (
                            <div className={cn(
                                "absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100",
                                "flex items-center justify-center transition-all duration-200"
                            )}>
                                <span className="text-[10px] text-white font-medium">
                                    {variation.image?.src ? 'Changer' : 'Upload'}
                                </span>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && onImageUpload) onImageUpload(file);
                                e.target.value = "";
                            }}
                        />
                    </div>
                </TableCell>
            )}

            {/* Attribute Columns */}
            {attrNames.map((name) => (
                <TableCell key={name}>
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-xs font-medium border-border/50",
                            "bg-background/50 hover:border-primary/50 transition-colors"
                        )}
                    >
                        {attrMap.get(name) || "\u2014"}
                    </Badge>
                </TableCell>
            ))}

            {/* SKU */}
            {show("sku") && (
                <TableCell>
                    <Input
                        defaultValue={variation.sku}
                        className="h-8 text-xs"
                        onBlur={(e) => {
                            if (e.target.value !== variation.sku) {
                                onUpdateField("sku", e.target.value);
                            }
                        }}
                        disabled={isDeleted}
                    />
                </TableCell>
            )}

            {/* Regular Price */}
            {show("prix") && (
                <TableCell>
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={variation.regularPrice}
                        className="h-8 text-xs w-24"
                        onBlur={(e) => {
                            if (e.target.value !== variation.regularPrice) {
                                onUpdateField("regularPrice", e.target.value);
                            }
                        }}
                        disabled={isDeleted}
                    />
                </TableCell>
            )}

            {/* Sale Price */}
            {show("promo") && (
                <TableCell>
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={variation.salePrice}
                        className="h-8 text-xs w-24"
                        placeholder="\u2014"
                        onBlur={(e) => {
                            if (e.target.value !== variation.salePrice) {
                                onUpdateField("salePrice", e.target.value);
                            }
                        }}
                        disabled={isDeleted}
                    />
                </TableCell>
            )}

            {/* Stock */}
            {show("stock") && (
                <TableCell>
                    <Input
                        type="number"
                        min="0"
                        defaultValue={variation.stockQuantity ?? ""}
                        className={cn(
                            "h-8 text-xs w-20",
                            variation.stockStatus === "outofstock" &&
                                "border-destructive/50"
                        )}
                        onBlur={(e) => {
                            const val = e.target.value
                                ? parseInt(e.target.value, 10)
                                : null;
                            if (val !== variation.stockQuantity) {
                                onUpdateField("stockQuantity", val);
                            }
                        }}
                        disabled={isDeleted}
                    />
                </TableCell>
            )}

            {/* Weight */}
            {show("weight") && (
                <TableCell>
                    <Input
                        defaultValue={variation.weight}
                        className="h-8 text-xs w-16"
                        placeholder="kg"
                        onBlur={(e) => {
                            if (e.target.value !== variation.weight) {
                                onUpdateField("weight", e.target.value);
                            }
                        }}
                        disabled={isDeleted}
                    />
                </TableCell>
            )}

            {/* Dimensions (compact read-only — editable in sheet) */}
            {show("dimensions") && (
                <TableCell>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {variation.dimensions.length || variation.dimensions.width || variation.dimensions.height
                            ? `${variation.dimensions.length || "0"}\u00D7${variation.dimensions.width || "0"}\u00D7${variation.dimensions.height || "0"}`
                            : "\u2014"}
                    </span>
                </TableCell>
            )}

            {/* GTIN/EAN */}
            {show("gtin") && (
                <TableCell>
                    <Input
                        defaultValue={variation.globalUniqueId}
                        className="h-8 text-xs w-28"
                        placeholder="EAN/GTIN"
                        onBlur={(e) => {
                            if (e.target.value !== variation.globalUniqueId) {
                                onUpdateField("globalUniqueId", e.target.value);
                            }
                        }}
                        disabled={isDeleted}
                    />
                </TableCell>
            )}

            {/* Manage Stock (checkbox) */}
            {show("manageStock") && (
                <TableCell>
                    <Checkbox
                        checked={variation.manageStock}
                        onCheckedChange={(checked) =>
                            onUpdateField("manageStock", !!checked)
                        }
                        disabled={isDeleted}
                    />
                </TableCell>
            )}

            {/* Backorders */}
            {show("backorders") && (
                <TableCell>
                    <Select
                        value={variation.backorders}
                        onValueChange={(val) => onUpdateField("backorders", val)}
                        disabled={isDeleted}
                    >
                        <SelectTrigger className="h-8 text-xs w-28">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="no">Non</SelectItem>
                            <SelectItem value="notify">Notifier</SelectItem>
                            <SelectItem value="yes">Oui</SelectItem>
                        </SelectContent>
                    </Select>
                </TableCell>
            )}

            {/* Tax Status */}
            {show("taxStatus") && (
                <TableCell>
                    <Select
                        value={variation.taxStatus}
                        onValueChange={(val) => onUpdateField("taxStatus", val)}
                        disabled={isDeleted}
                    >
                        <SelectTrigger className="h-8 text-xs w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="taxable">Taxable</SelectItem>
                            <SelectItem value="shipping">Livraison</SelectItem>
                            <SelectItem value="none">Aucun</SelectItem>
                        </SelectContent>
                    </Select>
                </TableCell>
            )}

            {/* Tax Class */}
            {show("taxClass") && (
                <TableCell>
                    <Input
                        defaultValue={variation.taxClass}
                        className="h-8 text-xs w-20"
                        placeholder="standard"
                        onBlur={(e) => {
                            if (e.target.value !== variation.taxClass) {
                                onUpdateField("taxClass", e.target.value);
                            }
                        }}
                        disabled={isDeleted}
                    />
                </TableCell>
            )}

            {/* Date On Sale From */}
            {show("dateOnSaleFrom") && (
                <TableCell>
                    <Input
                        type="date"
                        defaultValue={variation.dateOnSaleFrom ? variation.dateOnSaleFrom.split("T")[0] : ""}
                        className="h-8 text-xs w-32"
                        onBlur={(e) => {
                            const val = e.target.value || "";
                            if (val !== (variation.dateOnSaleFrom?.split("T")[0] ?? "")) {
                                onUpdateField("dateOnSaleFrom", val);
                            }
                        }}
                        disabled={isDeleted}
                    />
                </TableCell>
            )}

            {/* Date On Sale To */}
            {show("dateOnSaleTo") && (
                <TableCell>
                    <Input
                        type="date"
                        defaultValue={variation.dateOnSaleTo ? variation.dateOnSaleTo.split("T")[0] : ""}
                        className="h-8 text-xs w-32"
                        onBlur={(e) => {
                            const val = e.target.value || "";
                            if (val !== (variation.dateOnSaleTo?.split("T")[0] ?? "")) {
                                onUpdateField("dateOnSaleTo", val);
                            }
                        }}
                        disabled={isDeleted}
                    />
                </TableCell>
            )}

            {/* Description (truncated, read-only in grid) */}
            {show("description") && (
                <TableCell>
                    <span
                        className="text-xs text-muted-foreground truncate block max-w-[140px]"
                        title={variation.description}
                    >
                        {variation.description || "\u2014"}
                    </span>
                </TableCell>
            )}

            {/* Status */}
            {show("statut") && (
                <TableCell>
                    <Select
                        value={variation.status}
                        onValueChange={(val) => onUpdateField("status", val)}
                        disabled={isDeleted}
                    >
                        <SelectTrigger
                            className={cn(
                                "h-8 text-xs w-28 border-border/50 font-medium",
                                variation.status === "publish" && "border-emerald-500/50 bg-emerald-500/5 text-emerald-700",
                                variation.status === "private" && "border-amber-500/50 bg-amber-500/5 text-amber-700",
                                variation.status === "draft" && "border-muted-foreground/50 bg-muted/30 text-muted-foreground"
                            )}
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="publish" className="text-emerald-700">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    Publié
                                </div>
                            </SelectItem>
                            <SelectItem value="private" className="text-amber-700">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                                    Privé
                                </div>
                            </SelectItem>
                            <SelectItem value="draft" className="text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                                    Brouillon
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </TableCell>
            )}

            {/* Fixed: Actions */}
            <TableCell>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-8 w-8 rounded-lg",
                            "hover:bg-primary/10 hover:text-primary",
                            "transition-all"
                        )}
                        onClick={onOpenDetail}
                        title="Ouvrir les détails"
                    >
                        <Expand className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-8 w-8 rounded-lg",
                            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                            "transition-all"
                        )}
                        onClick={onDelete}
                        title="Supprimer cette variation"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
});

// ============================================================================
// HELPERS
// ============================================================================

function getUniqueAttributeNames(variations: EditableVariation[]): string[] {
    const names = new Set<string>();
    for (const v of variations) {
        for (const attr of v.attributes) {
            names.add(attr.name);
        }
    }
    return Array.from(names);
}

/** Placeholder icon for empty state */
function Package2Icon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
            <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
            <path d="M12 3v6" />
        </svg>
    );
}
