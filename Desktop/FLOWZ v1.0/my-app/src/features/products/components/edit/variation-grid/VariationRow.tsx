"use client";

import React, { useMemo } from "react";
import {
    TableCell,
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

export const VariationRow = React.memo(function VariationRow({
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

            {/* Dimensions (compact read-only -- editable in sheet) */}
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
