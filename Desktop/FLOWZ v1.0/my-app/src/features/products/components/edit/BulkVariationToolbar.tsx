"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Trash2,
    DollarSign,
    Package,
    Tag,
    CheckCircle2,
    X,
    ShieldCheck,
    Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditableVariation } from "../../hooks/useVariationManager";

interface BulkVariationToolbarProps {
    selectedCount: number;
    onBulkUpdate: (field: keyof EditableVariation, value: unknown) => void;
    onDeleteSelected: () => void;
    onClearSelection: () => void;
}

export function BulkVariationToolbar({
    selectedCount,
    onBulkUpdate,
    onDeleteSelected,
    onClearSelection,
}: BulkVariationToolbarProps) {
    if (selectedCount === 0) return null;

    return (
        <div
            className={cn(
                "flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-4 py-2"
            )}
        >
            <CheckCircle2 className="h-4 w-4 text-foreground/70 shrink-0" />
            <span className="text-[13px] font-medium text-foreground tabular-nums">
                {selectedCount} sélectionnée(s)
            </span>

            <div className="flex items-center gap-1.5 ml-2">
                <BulkPriceAction
                    label="Prix"
                    icon={<DollarSign className="h-3.5 w-3.5" />}
                    onApply={(value) => onBulkUpdate("regularPrice", value)}
                />
                <BulkPriceAction
                    label="Promo"
                    icon={<Tag className="h-3.5 w-3.5" />}
                    onApply={(value) => onBulkUpdate("salePrice", value)}
                />
                <BulkStockAction
                    onApply={(value) => onBulkUpdate("stockQuantity", value)}
                />
                <BulkStatusAction
                    onApply={(value) =>
                        onBulkUpdate("status", value as "publish" | "private" | "draft")
                    }
                />
                <BulkBackordersAction
                    onApply={(value) =>
                        onBulkUpdate("backorders", value as "no" | "notify" | "yes")
                    }
                />
                <BulkTaxStatusAction
                    onApply={(value) =>
                        onBulkUpdate("taxStatus", value as "taxable" | "shipping" | "none")
                    }
                />

                <div className="w-px h-5 bg-border mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-[11px]"
                    onClick={onDeleteSelected}
                >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Supprimer
                </Button>
            </div>

            <div className="ml-auto">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={onClearSelection}
                >
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}

// ============================================================================
// SUB-ACTIONS
// ============================================================================

function BulkPriceAction({
    label,
    icon,
    onApply,
}: {
    label: string;
    icon: React.ReactNode;
    onApply: (value: string) => void;
}) {
    const [value, setValue] = useState("");
    const [open, setOpen] = useState(false);

    const handleApply = () => {
        if (value) {
            onApply(value);
            setValue("");
            setOpen(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]">
                    {icon}
                    <span className="ml-1">{label}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3" align="start">
                <div className="space-y-2">
                    <p className="text-[11px] font-medium">Définir {label.toLowerCase()}</p>
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="0.00"
                        className="h-8"
                        onKeyDown={(e) => e.key === "Enter" && handleApply()}
                    />
                    <Button
                        type="button"
                        size="sm"
                        className="w-full h-7 text-[11px] rounded-lg font-medium"
                        onClick={handleApply}
                        disabled={!value}
                    >
                        Appliquer
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function BulkStockAction({
    onApply,
}: {
    onApply: (value: number) => void;
}) {
    const [value, setValue] = useState("");
    const [open, setOpen] = useState(false);

    const handleApply = () => {
        if (value) {
            onApply(parseInt(value, 10));
            setValue("");
            setOpen(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]">
                    <Package className="h-3.5 w-3.5" />
                    <span className="ml-1">Stock</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3" align="start">
                <div className="space-y-2">
                    <p className="text-[11px] font-medium">Définir stock</p>
                    <Input
                        type="number"
                        min="0"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="0"
                        className="h-8"
                        onKeyDown={(e) => e.key === "Enter" && handleApply()}
                    />
                    <Button
                        type="button"
                        size="sm"
                        className="w-full h-7 text-[11px] rounded-lg font-medium"
                        onClick={handleApply}
                        disabled={!value}
                    >
                        Appliquer
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function BulkStatusAction({
    onApply,
}: {
    onApply: (value: string) => void;
}) {
    return (
        <Select onValueChange={onApply}>
            <SelectTrigger className="h-7 w-auto text-[11px] border">
                <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="publish">Publié</SelectItem>
                <SelectItem value="private">Privé</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
            </SelectContent>
        </Select>
    );
}

function BulkBackordersAction({
    onApply,
}: {
    onApply: (value: string) => void;
}) {
    return (
        <Select onValueChange={onApply}>
            <SelectTrigger className="h-7 w-auto text-[11px] border">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder="Préco." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="no">Non</SelectItem>
                <SelectItem value="notify">Notifier</SelectItem>
                <SelectItem value="yes">Oui</SelectItem>
            </SelectContent>
        </Select>
    );
}

function BulkTaxStatusAction({
    onApply,
}: {
    onApply: (value: string) => void;
}) {
    return (
        <Select onValueChange={onApply}>
            <SelectTrigger className="h-7 w-auto text-[11px] border">
                <Receipt className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder="Taxe" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="taxable">Taxable</SelectItem>
                <SelectItem value="shipping">Livraison</SelectItem>
                <SelectItem value="none">Aucun</SelectItem>
            </SelectContent>
        </Select>
    );
}
