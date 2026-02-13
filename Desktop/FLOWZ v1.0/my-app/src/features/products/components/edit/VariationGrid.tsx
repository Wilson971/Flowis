"use client";

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
    Image as ImageIcon,
    Expand,
    Trash2,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
    EditableVariation,
    VariationStatus,
} from "../../hooks/useVariationManager";

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
    isLoading?: boolean;
}

// ============================================================================
// STATUS INDICATOR STYLES
// ============================================================================

const statusBorderColors: Record<VariationStatus, string> = {
    synced: "border-l-emerald-500",
    new: "border-l-blue-500",
    modified: "border-l-amber-500",
    deleted: "border-l-red-500",
};

const statusLabels: Record<VariationStatus, string> = {
    synced: "Synchronisé",
    new: "Nouveau",
    modified: "Modifié",
    deleted: "Supprimé",
};

// ============================================================================
// COMPONENT
// ============================================================================

export function VariationGrid({
    variations,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    onUpdateField,
    onDelete,
    onOpenDetail,
    isLoading,
}: VariationGridProps) {
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

    // Extract unique attribute names for column headers
    const attrNames = getUniqueAttributeNames(variations);

    return (
        <div className="rounded-lg border border-border overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead className="w-[40px]">
                                <Checkbox
                                    checked={
                                        selectedIds.size === variations.length &&
                                        variations.length > 0
                                    }
                                    onCheckedChange={onToggleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="w-[50px]">Img</TableHead>
                            {attrNames.map((name) => (
                                <TableHead key={name} className="min-w-[80px]">
                                    {name}
                                </TableHead>
                            ))}
                            <TableHead className="w-[120px]">SKU</TableHead>
                            <TableHead className="w-[110px]">Prix</TableHead>
                            <TableHead className="w-[110px]">Promo</TableHead>
                            <TableHead className="w-[90px]">Stock</TableHead>
                            <TableHead className="w-[110px]">Statut</TableHead>
                            <TableHead className="w-[80px]" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {variations.map((variation) => (
                            <VariationRow
                                key={variation._localId}
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
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

// ============================================================================
// ROW
// ============================================================================

function VariationRow({
    variation,
    attrNames,
    isSelected,
    onToggleSelect,
    onUpdateField,
    onDelete,
    onOpenDetail,
}: {
    variation: EditableVariation;
    attrNames: string[];
    isSelected: boolean;
    onToggleSelect: () => void;
    onUpdateField: (field: keyof EditableVariation, value: unknown) => void;
    onDelete: () => void;
    onOpenDetail: () => void;
}) {
    const attrMap = new Map(
        variation.attributes.map((a) => [a.name, a.option])
    );

    return (
        <TableRow
            className={cn(
                "border-l-4 transition-colors",
                statusBorderColors[variation._status],
                variation._status === "deleted" && "opacity-40 line-through"
            )}
        >
            {/* Checkbox */}
            <TableCell>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={onToggleSelect}
                />
            </TableCell>

            {/* Image */}
            <TableCell>
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center overflow-hidden border cursor-pointer group relative">
                    {variation.image?.src ? (
                        <img
                            src={variation.image.src}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-[9px] text-white font-medium">
                            Changer
                        </span>
                    </div>
                </div>
            </TableCell>

            {/* Attribute Columns */}
            {attrNames.map((name) => (
                <TableCell key={name}>
                    <Badge variant="outline" className="text-xs font-normal">
                        {attrMap.get(name) || "—"}
                    </Badge>
                </TableCell>
            ))}

            {/* SKU */}
            <TableCell>
                <Input
                    defaultValue={variation.sku}
                    className="h-8 text-xs"
                    onBlur={(e) => {
                        if (e.target.value !== variation.sku) {
                            onUpdateField("sku", e.target.value);
                        }
                    }}
                    disabled={variation._status === "deleted"}
                />
            </TableCell>

            {/* Regular Price */}
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
                    disabled={variation._status === "deleted"}
                />
            </TableCell>

            {/* Sale Price */}
            <TableCell>
                <Input
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={variation.salePrice}
                    className="h-8 text-xs w-24"
                    placeholder="—"
                    onBlur={(e) => {
                        if (e.target.value !== variation.salePrice) {
                            onUpdateField("salePrice", e.target.value);
                        }
                    }}
                    disabled={variation._status === "deleted"}
                />
            </TableCell>

            {/* Stock */}
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
                    disabled={variation._status === "deleted"}
                />
            </TableCell>

            {/* Status */}
            <TableCell>
                <Select
                    value={variation.status}
                    onValueChange={(val) => onUpdateField("status", val)}
                    disabled={variation._status === "deleted"}
                >
                    <SelectTrigger className="h-8 text-xs w-24">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="publish">Publié</SelectItem>
                        <SelectItem value="private">Privé</SelectItem>
                        <SelectItem value="draft">Brouillon</SelectItem>
                    </SelectContent>
                </Select>
            </TableCell>

            {/* Actions */}
            <TableCell>
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={onOpenDetail}
                        title="Détails"
                    >
                        <Expand className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={onDelete}
                        title="Supprimer"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}

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
