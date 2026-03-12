"use client";

import React, { useMemo } from "react";
import {
    TableCell,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditableVariation } from "../../../hooks/useVariationManager";
import {
    statusBorderColors,
    statusBgColors,
    statusLabels,
} from "./VariationGridColumns";
import { useVariationContextMenu } from "./VariationRowContextMenu";

export const VariationRow = React.memo(function VariationRow({
    variation,
    attrNames,
    isSelected,
    onToggleSelect,
    onUpdateField,
    onDelete,
    onOpenDetail,
    onImageClick,
    isUploading,
    show,
    parentAttributeOptions,
    onDuplicate,
    onCopyFieldToSelected,
    onCopyAllToSelected,
    selectedCount,
}: {
    variation: EditableVariation;
    attrNames: string[];
    isSelected: boolean;
    onToggleSelect: () => void;
    onUpdateField: (field: keyof EditableVariation, value: unknown) => void;
    onDelete: () => void;
    onOpenDetail: () => void;
    onImageClick?: () => void;
    isUploading?: boolean;
    show: (key: string) => boolean;
    parentAttributeOptions?: Map<string, string[]>;
    onDuplicate?: () => void;
    onCopyFieldToSelected?: (field: keyof EditableVariation) => void;
    onCopyAllToSelected?: () => void;
    selectedCount?: number;
}) {
    const attrMap = useMemo(
        () => new Map(variation.attributes.map((a) => [a.name, a.option])),
        [variation.attributes]
    );
    const isDeleted = variation._status === "deleted";

    const { onContextMenu, contextMenuPortal } = useVariationContextMenu({
        variation,
        hasSelection: (selectedCount ?? 0) > 0,
        selectedCount: selectedCount ?? 0,
        onDuplicate: () => onDuplicate?.(),
        onDelete,
        onOpenDetail,
        onCopyFieldToSelected: (field) => onCopyFieldToSelected?.(field),
        onCopyAllToSelected: () => onCopyAllToSelected?.(),
    });

    return (
        <>
        <TableRow
            onContextMenu={onContextMenu}
            className={cn(
                "border-l-2 transition-colors group",
                statusBorderColors[variation._status],
                statusBgColors[variation._status],
                "hover:bg-muted/30",
                isDeleted && "opacity-40 line-through"
            )}
        >
            {/* Fixed: Checkbox with Status Indicator */}
            <TableCell className="sticky left-0 bg-card group-hover:bg-muted/30 z-10 transition-colors !px-3">
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
                                        "h-2 w-2 rounded-full",
                                        variation._status === "synced" && "bg-success",
                                        variation._status === "new" && "bg-primary",
                                        variation._status === "modified" && "bg-amber-500",
                                        variation._status === "deleted" && "bg-destructive"
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
                            "h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden",
                            "border border-border/40 ring-1 ring-border/30 cursor-pointer group/img relative",
                            "transition-[box-shadow]",
                            "hover:ring-border/60"
                        )}
                        onClick={() => onImageClick?.()}
                    >
                        {isUploading ? (
                            <div className="flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin text-foreground/70" />
                            </div>
                        ) : variation.image?.src ? (
                            <img
                                src={variation.image.src}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                        )}
                        {!isUploading && (
                            <div className={cn(
                                "absolute inset-0 bg-background/80 opacity-0 group-hover/img:opacity-100",
                                "flex items-center justify-center transition-opacity"
                            )}>
                                <ImageIcon className="h-3.5 w-3.5 text-foreground/70" />
                            </div>
                        )}
                    </div>
                </TableCell>
            )}

            {/* Attribute Columns — Select from parent attribute options */}
            {attrNames.map((name) => {
                const currentOption = attrMap.get(name) || "";
                const options = parentAttributeOptions?.get(name);
                return (
                    <TableCell key={name}>
                        {options && options.length > 0 ? (
                            <Select
                                value={currentOption}
                                onValueChange={(val) => {
                                    const newAttrs = variation.attributes.map((a) =>
                                        a.name === name ? { ...a, option: val } : a
                                    );
                                    if (!variation.attributes.some((a) => a.name === name)) {
                                        newAttrs.push({ name, option: val });
                                    }
                                    onUpdateField("attributes", newAttrs);
                                }}
                                disabled={isDeleted}
                            >
                                <SelectTrigger className="h-7 text-[11px] w-24">
                                    <SelectValue placeholder="—" />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.map((opt) => (
                                        <SelectItem key={opt} value={opt}>
                                            {opt}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <span className="text-xs text-muted-foreground px-2">
                                {currentOption || "—"}
                            </span>
                        )}
                    </TableCell>
                );
            })}

            {/* SKU */}
            {show("sku") && (
                <TableCell>
                    <Input
                        defaultValue={variation.sku}
                        className="h-7 text-[11px]"
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
                        className="h-7 text-[11px] w-20"
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
                        className="h-7 text-[11px] w-20"
                        placeholder={"\u2014"}
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
                            "h-7 text-[11px] w-16",
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
                        className="h-7 text-[11px] w-14"
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

            {/* Dimensions (compact read-only -- editable in sheet) */}
            {show("dimensions") && (
                <TableCell>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap tabular-nums">
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
                        className="h-7 text-[11px] w-24"
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
                        <SelectTrigger className="h-7 text-[11px] w-24">
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
                        <SelectTrigger className="h-7 text-[11px] w-20">
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
                        className="h-7 text-[11px] w-16"
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
                        className="h-7 text-[11px] w-28"
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
                        className="h-7 text-[11px] w-28"
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
                        className="text-[11px] text-muted-foreground truncate block max-w-[120px]"
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
                        <SelectTrigger className="h-7 text-[11px] w-24 border-border/50 font-medium">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="publish">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Publié
                                </div>
                            </SelectItem>
                            <SelectItem value="private">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    Privé
                                </div>
                            </SelectItem>
                            <SelectItem value="draft">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
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
                            "h-7 w-7 rounded-lg",
                            "hover:bg-muted/60 hover:text-foreground",
                            "transition-colors"
                        )}
                        onClick={onOpenDetail}
                        aria-label="Ouvrir les détails"
                    >
                        <Expand className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-7 w-7 rounded-lg",
                            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                            "transition-colors"
                        )}
                        onClick={onDelete}
                        aria-label="Supprimer cette variation"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
        {contextMenuPortal}
        </>
    );
});
