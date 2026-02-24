"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { styles } from "@/lib/design-system";
import {
    Trash2,
    ChevronLeft,
    ChevronRight,
    Package,
    AlertCircle,
} from "lucide-react";
import type { EditableVariation } from "@/features/products/hooks/useVariationManager";

interface ProposalD_FullscreenProps {
    variations: EditableVariation[];
    onUpdateField: (localId: string, field: keyof EditableVariation, value: unknown) => void;
    onDelete: (localId: string) => void;
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    synced:   { label: "Sync", variant: "secondary" },
    new:      { label: "Nouveau", variant: "default" },
    modified: { label: "Modifié", variant: "outline" },
    deleted:  { label: "Supprimé", variant: "destructive" },
};

const STOCK_BADGE: Record<string, string> = {
    instock:    "text-green-600 bg-green-50 border-green-200",
    outofstock: "text-red-600 bg-red-50 border-red-200",
    onbackorder:"text-yellow-600 bg-yellow-50 border-yellow-200",
};

export function ProposalD_Fullscreen({
    variations,
    onUpdateField,
    onDelete,
}: ProposalD_FullscreenProps) {
    const [selectedId, setSelectedId] = useState<string | null>(
        variations[0]?._localId ?? null
    );
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const selected = variations.find((v) => v._localId === selectedId) ?? null;

    return (
        <div className="h-full flex overflow-hidden">
            {/* Sidebar — variation list */}
            <div
                className={cn(
                    "flex-none border-r border-border bg-card transition-all duration-300",
                    sidebarOpen ? "w-64" : "w-12"
                )}
            >
                <div className="flex items-center justify-between p-3 border-b border-border">
                    {sidebarOpen && (
                        <span className={cn(styles.text.label, "truncate")}>
                            {variations.length} variation{variations.length !== 1 ? "s" : ""}
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-none"
                        onClick={() => setSidebarOpen((o) => !o)}
                    >
                        {sidebarOpen ? (
                            <ChevronLeft className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                <div className="overflow-y-auto h-[calc(100%-49px)]">
                    {variations.map((v) => {
                        const attrLabel = v.attributes.map((a) => a.option).join(" / ") || v.sku || v._localId;
                        const isSelected = v._localId === selectedId;
                        return (
                            <button
                                key={v._localId}
                                onClick={() => setSelectedId(v._localId)}
                                className={cn(
                                    "w-full text-left px-3 py-2.5 border-b border-border/50 transition-colors",
                                    "hover:bg-muted/50",
                                    isSelected && "bg-primary/10 border-l-2 border-l-primary"
                                )}
                            >
                                {sidebarOpen ? (
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-foreground truncate">
                                            {attrLabel}
                                        </p>
                                        <div className="flex items-center gap-1.5">
                                            <Badge
                                                variant={STATUS_BADGE[v._status]?.variant ?? "secondary"}
                                                className="text-[10px] px-1 py-0 h-4"
                                            >
                                                {STATUS_BADGE[v._status]?.label}
                                            </Badge>
                                            {v.regularPrice && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    {v.regularPrice}€
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <Package className="h-4 w-4 text-muted-foreground mx-auto" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main area — detail panel + table */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                {selected ? (
                    <>
                        {/* Detail panel */}
                        <div className="flex-none border-b border-border bg-card/50 p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className={styles.text.h4}>
                                            {selected.attributes.map((a) => a.option).join(" / ") || "Variation"}
                                        </h2>
                                        <Badge variant={STATUS_BADGE[selected._status]?.variant ?? "secondary"}>
                                            {STATUS_BADGE[selected._status]?.label}
                                        </Badge>
                                        <span
                                            className={cn(
                                                "text-xs px-2 py-0.5 rounded-full border",
                                                STOCK_BADGE[selected.stockStatus]
                                            )}
                                        >
                                            {selected.stockStatus === "instock"
                                                ? "En stock"
                                                : selected.stockStatus === "outofstock"
                                                ? "Rupture"
                                                : "Sur commande"}
                                        </span>
                                    </div>
                                    {selected.sku && (
                                        <p className={cn(styles.text.bodyMuted, "text-xs")}>
                                            SKU : {selected.sku}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                        onDelete(selected._localId);
                                        const next = variations.find((v) => v._localId !== selected._localId);
                                        setSelectedId(next?._localId ?? null);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Quick edit fields */}
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="space-y-1">
                                    <label className={cn(styles.text.label, "text-[11px]")}>Prix régulier</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={selected.regularPrice}
                                        onChange={(e) => onUpdateField(selected._localId, "regularPrice", e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className={cn(styles.text.label, "text-[11px]")}>Prix promo</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={selected.salePrice}
                                        onChange={(e) => onUpdateField(selected._localId, "salePrice", e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className={cn(styles.text.label, "text-[11px]")}>SKU</label>
                                    <Input
                                        value={selected.sku}
                                        onChange={(e) => onUpdateField(selected._localId, "sku", e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className={cn(styles.text.label, "text-[11px]")}>Stock</label>
                                    <Input
                                        type="number"
                                        value={selected.stockQuantity ?? ""}
                                        onChange={(e) =>
                                            onUpdateField(
                                                selected._localId,
                                                "stockQuantity",
                                                e.target.value === "" ? null : Number(e.target.value)
                                            )
                                        }
                                        className="h-8 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Variations table (fixed header) */}
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                                    <tr className="border-b border-border">
                                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Attributs</th>
                                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">SKU</th>
                                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Prix</th>
                                        <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">Stock</th>
                                        <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">Statut</th>
                                        <th className="px-4 py-2.5" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {variations.map((v) => (
                                        <tr
                                            key={v._localId}
                                            onClick={() => setSelectedId(v._localId)}
                                            className={cn(
                                                "border-b border-border/50 cursor-pointer transition-colors",
                                                "hover:bg-muted/30",
                                                v._localId === selectedId && "bg-primary/5"
                                            )}
                                        >
                                            <td className="px-4 py-2.5">
                                                <span className="font-medium text-foreground">
                                                    {v.attributes.map((a) => a.option).join(" / ") || "—"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-muted-foreground text-xs font-mono">
                                                {v.sku || "—"}
                                            </td>
                                            <td className="px-4 py-2.5 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-medium">{v.regularPrice ? `${v.regularPrice}€` : "—"}</span>
                                                    {v.salePrice && (
                                                        <span className="text-xs text-green-600">{v.salePrice}€</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <span
                                                    className={cn(
                                                        "text-xs px-2 py-0.5 rounded-full border",
                                                        STOCK_BADGE[v.stockStatus]
                                                    )}
                                                >
                                                    {v.stockQuantity !== null ? v.stockQuantity : "—"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <Badge
                                                    variant={STATUS_BADGE[v._status]?.variant ?? "secondary"}
                                                    className="text-[10px]"
                                                >
                                                    {STATUS_BADGE[v._status]?.label}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete(v._localId);
                                                        if (v._localId === selectedId) {
                                                            const next = variations.find((x) => x._localId !== v._localId);
                                                            setSelectedId(next?._localId ?? null);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-3">
                            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
                            <p className={styles.text.bodyMuted}>Aucune variation sélectionnée</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
