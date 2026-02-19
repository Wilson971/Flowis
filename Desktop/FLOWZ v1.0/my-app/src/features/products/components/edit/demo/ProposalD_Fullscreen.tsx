"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContentFullscreen,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Shuffle,
    ArrowLeft,
    Maximize2,
    Save,
    X,
    DollarSign,
    Package,
    SlidersHorizontal,
    LayoutGrid,
    RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { TAB_ACCENTS } from "./AttributeTabsPanel";
import { AttributeBuilderV2 } from "../AttributeBuilderV2";
import { AttributeSidebar } from "../AttributeSidebar";
import { AttributeDetailPanel } from "../AttributeDetailPanel";
import { VariationGrid } from "../VariationGrid";
import { BulkVariationToolbar } from "../BulkVariationToolbar";
import type { EditableVariation } from "../../../hooks/useVariationManager";
import type { ProductFormValues } from "../../../schemas/product-schema";

// ============================================================================
// TYPES
// ============================================================================

interface ProposalDProps {
    variations: EditableVariation[];
    onUpdateField: (
        localId: string,
        field: keyof EditableVariation,
        value: unknown
    ) => void;
    onDelete: (localId: string) => void;
}

// ============================================================================
// STATUS HELPERS
// ============================================================================

const statusColors: Record<string, string> = {
    publish: "bg-emerald-500/10 text-emerald-600",
    private: "bg-amber-500/10 text-amber-600",
    draft: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
    publish: "Publie",
    private: "Prive",
    draft: "Brouillon",
};

const stockStatusLabels: Record<string, string> = {
    instock: "En stock",
    outofstock: "Rupture",
    onbackorder: "En commande",
};

const stockStatusColors: Record<string, string> = {
    instock: "text-emerald-600",
    outofstock: "text-destructive",
    onbackorder: "text-amber-600",
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ProposalD_Fullscreen({
    variations,
    onUpdateField,
    onDelete,
}: ProposalDProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [studioTab, setStudioTab] = useState<"attributs" | "grille">("grille");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
    const [selectedAttributeIndex, setSelectedAttributeIndex] = useState<number | null>(null);

    // Read attributes from form context
    const { watch } = useFormContext<ProductFormValues>();
    const { remove } = useFieldArray({ name: "attributes" });
    const attributes = watch("attributes") || [];

    // Auto-select first attribute when attributes change
    useEffect(() => {
        if (attributes.length > 0 && selectedAttributeIndex === null) {
            setSelectedAttributeIndex(0);
        }
        // If selected index is out of bounds, reset
        if (selectedAttributeIndex !== null && selectedAttributeIndex >= attributes.length) {
            setSelectedAttributeIndex(attributes.length > 0 ? attributes.length - 1 : null);
        }
    }, [attributes.length, selectedAttributeIndex]);

    const handleRemoveAttribute = useCallback((index: number) => {
        remove(index);
        // After removal, select the previous index or null if empty
        if (attributes.length === 1) {
            setSelectedAttributeIndex(null);
        } else if (index === selectedAttributeIndex) {
            setSelectedAttributeIndex(Math.max(0, index - 1));
        }
    }, [remove, attributes.length, selectedAttributeIndex]);

    // ===== SELECTION HANDLERS =====

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

    // ===== COMPUTED STATS =====

    const activeVariations = useMemo(
        () => variations.filter((v) => v._status !== "deleted"),
        [variations]
    );

    const variationAttributeCount = useMemo(
        () => attributes.filter((a) => a.variation === true).length,
        [attributes]
    );

    const priceRange = useMemo(() => {
        const prices = activeVariations
            .map((v) => parseFloat(v.regularPrice) || 0)
            .filter((p) => p > 0);
        if (prices.length === 0) return "N/A";
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        if (min === max) return `${min.toFixed(2)} \u20AC`;
        return `${min.toFixed(2)} \u2013 ${max.toFixed(2)} \u20AC`;
    }, [activeVariations]);

    const totalStock = useMemo(
        () =>
            activeVariations.reduce(
                (sum, v) => sum + (v.stockQuantity ?? 0),
                0
            ),
        [activeVariations]
    );

    const stats = useMemo(() => {
        const total = activeVariations.length;
        const synced = variations.filter((v) => v._status === "synced").length;
        const modified = variations.filter((v) => v._status === "modified").length;
        const newCount = variations.filter((v) => v._status === "new").length;
        return { total, synced, modified, new: newCount };
    }, [variations, activeVariations]);

    // ===== DETAIL PANEL =====

    const selectedVariation = useMemo(
        () =>
            selectedVariationId
                ? variations.find((v) => v._localId === selectedVariationId) ?? null
                : null,
        [selectedVariationId, variations]
    );

    const selectedAttributeTitle = useMemo(() => {
        if (!selectedVariation) return "";
        return selectedVariation.attributes
            .map((a) => a.option)
            .join(" / ");
    }, [selectedVariation]);

    // ===== RENDER =====

    return (
        <>
            {/* ── Inline Summary Card ── */}
            <Card className="rounded-xl">
                <CardContent className="p-6">
                    {/* Top bar: title + open button */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Shuffle className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">
                                    Variations
                                </h3>
                                <Badge variant="secondary" className="text-xs">
                                    {activeVariations.length}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    Proposition D
                                </Badge>
                            </div>
                        </div>

                        <Button
                            type="button"
                            onClick={() => setDialogOpen(true)}
                            className="rounded-lg"
                        >
                            <Maximize2 className="mr-2 h-4 w-4" />
                            Ouvrir le Studio
                        </Button>
                    </div>

                    <Separator className="my-4" />

                    {/* Summary stats grid */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Attributs</p>
                            <p className="text-sm font-medium text-foreground">
                                {variationAttributeCount}
                            </p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Fourchette prix</p>
                            <p className="text-sm font-medium text-foreground">
                                {priceRange}
                            </p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Stock total</p>
                            <p className="text-sm font-medium text-foreground">
                                {totalStock}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Fullscreen Dialog ── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContentFullscreen
                    className="overflow-hidden p-0"
                    ariaTitle="Variation Studio"
                >
                    {/* ── Layout: flex column fills the viewport ── */}
                    <div className="flex h-screen flex-col bg-background">
                        {/* ── Toolbar (fixed top bar) ── */}
                        <div className="h-14 shrink-0 border-b border-border bg-background flex items-center px-4 gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setDialogOpen(false)}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retour
                            </Button>

                            <Separator orientation="vertical" className="h-6" />

                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                    <Shuffle className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-semibold text-foreground">
                                    Variation Studio
                                </span>
                            </div>

                            <Badge variant="secondary">
                                {activeVariations.length} variations
                            </Badge>

                            <div className="flex-1" />

                            <Button type="button" size="sm" disabled>
                                <Save className="mr-2 h-4 w-4" />
                                Enregistrer &amp; Fermer
                            </Button>
                        </div>

                        {/* ── Body: Sidebar tabs + Content ── */}
                        <div className="flex flex-1 min-h-0">
                            {/* VERTICAL TAB BAR (sidebar navigation) */}
                            <div className="w-[64px] shrink-0 border-r border-border bg-muted/20 flex flex-col items-center py-3 gap-1">
                                <button
                                    type="button"
                                    onClick={() => setStudioTab("grille")}
                                    className={cn(
                                        "flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 w-[56px] transition-colors",
                                        studioTab === "grille"
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    )}
                                >
                                    <LayoutGrid className="h-5 w-5" />
                                    <span className="text-[10px] font-medium leading-none">Grille</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStudioTab("attributs")}
                                    className={cn(
                                        "flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 w-[56px] transition-colors",
                                        studioTab === "attributs"
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    )}
                                >
                                    <SlidersHorizontal className="h-5 w-5" />
                                    <span className="text-[10px] font-medium leading-none">Attributs</span>
                                </button>
                            </div>

                            {/* CONTENT AREA */}
                            {studioTab === "attributs" ? (
                                /* ── Attributs View ── */
                                <div className="flex-1 min-w-0 p-6">
                                    <div className="grid grid-cols-[280px_1fr] gap-4 h-full">
                                        {/* Left: Sidebar */}
                                        <AttributeSidebar
                                            activeIndex={selectedAttributeIndex}
                                            onAttributeClick={setSelectedAttributeIndex}
                                        />

                                        {/* Right: Details + Grid - Equal heights (50/50) */}
                                        <div className="grid grid-rows-2 gap-4 h-full min-h-0">
                                            {/* Attribute Details Panel - 50% height */}
                                            {selectedAttributeIndex !== null && attributes[selectedAttributeIndex] ? (
                                                <div className="min-h-0 overflow-y-auto">
                                                    <AttributeDetailPanel
                                                        index={selectedAttributeIndex}
                                                        onRemove={() => handleRemoveAttribute(selectedAttributeIndex)}
                                                        onGenerate={
                                                            attributes.filter((a) => a.variation && a.options.length > 0).length > 0
                                                                ? () => {
                                                                    // Demo: Just show a visual feedback
                                                                    console.log("Générer les variations à partir des attributs:", attributes);
                                                                }
                                                                : undefined
                                                        }
                                                        variationCount={variations.length}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="min-h-0 flex items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-muted/20">
                                                    <p className="text-sm text-muted-foreground">Sélectionnez un attribut</p>
                                                </div>
                                            )}

                                            {/* Variations Grid - 50% height with sticky header */}
                                            <div className="min-h-0 h-full">
                                                <VariationGrid
                                                    variations={variations}
                                                    selectedIds={selectedIds}
                                                    onToggleSelect={toggleSelect}
                                                    onToggleSelectAll={toggleSelectAll}
                                                    onUpdateField={onUpdateField}
                                                    onDelete={onDelete}
                                                    onOpenDetail={(localId) =>
                                                        setSelectedVariationId(localId)
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* ── Grille View ── */
                                <>
                                    <div className="flex-1 flex flex-col min-w-0">
                                        {/* Header: title + bulk toolbar + attribute legend */}
                                        <div className="p-4 border-b border-border/50 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-foreground">
                                                    Grille de variations
                                                </p>
                                                <BulkVariationToolbar
                                                    selectedCount={selectedIds.size}
                                                    onBulkUpdate={bulkUpdateField}
                                                    onDeleteSelected={deleteSelected}
                                                    onClearSelection={clearSelection}
                                                />
                                            </div>

                                            {/* Colored attribute legend bar */}
                                            {attributes.filter((a) => a.variation).length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {attributes
                                                        .filter((a) => a.variation)
                                                        .map((attr, idx) => {
                                                            const accent = TAB_ACCENTS[idx % TAB_ACCENTS.length];
                                                            return (
                                                                <div
                                                                    key={attr.name}
                                                                    className={cn(
                                                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs",
                                                                        accent.badgeBg
                                                                    )}
                                                                >
                                                                    <div className={cn("h-2 w-2 rounded-full shrink-0", accent.dot)} />
                                                                    <span className={cn("font-medium", accent.text)}>
                                                                        {attr.name}
                                                                    </span>
                                                                    <span className="text-muted-foreground">
                                                                        ({attr.options.length})
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Scrollable variation grid */}
                                        <div className="flex-1 overflow-y-auto p-4">
                                            <VariationGrid
                                                variations={variations}
                                                selectedIds={selectedIds}
                                                onToggleSelect={toggleSelect}
                                                onToggleSelectAll={toggleSelectAll}
                                                onUpdateField={onUpdateField}
                                                onDelete={onDelete}
                                                onOpenDetail={(localId) =>
                                                    setSelectedVariationId(localId)
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* RIGHT PANEL — Detail (380px, conditional) */}
                                    {selectedVariation && (
                                        <div className="w-[380px] shrink-0 border-l border-border flex flex-col">
                                            <div className="p-4 border-b border-border/50 flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-foreground truncate">
                                                    Détail: {selectedAttributeTitle}
                                                </h3>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 shrink-0"
                                                    onClick={() =>
                                                        setSelectedVariationId(null)
                                                    }
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                                {/* Pricing */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium text-foreground">
                                                            Tarification
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="rounded-lg bg-muted/30 p-3">
                                                            <p className="text-xs text-muted-foreground">
                                                                Prix régulier
                                                            </p>
                                                            <p className="text-sm font-medium text-foreground">
                                                                {selectedVariation.regularPrice
                                                                    ? `${selectedVariation.regularPrice} \u20AC`
                                                                    : "\u2014"}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-lg bg-muted/30 p-3">
                                                            <p className="text-xs text-muted-foreground">
                                                                Prix promo
                                                            </p>
                                                            <p className="text-sm font-medium text-foreground">
                                                                {selectedVariation.salePrice
                                                                    ? `${selectedVariation.salePrice} \u20AC`
                                                                    : "\u2014"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="rounded-lg bg-muted/30 p-3">
                                                        <p className="text-xs text-muted-foreground">SKU</p>
                                                        <p className="text-sm font-medium text-foreground">
                                                            {selectedVariation.sku || "\u2014"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <Separator />

                                                {/* Stock */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <Package className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium text-foreground">
                                                            Stock
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="rounded-lg bg-muted/30 p-3">
                                                            <p className="text-xs text-muted-foreground">
                                                                Quantité
                                                            </p>
                                                            <p className="text-sm font-medium text-foreground">
                                                                {selectedVariation.stockQuantity !== null
                                                                    ? selectedVariation.stockQuantity
                                                                    : "\u2014"}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-lg bg-muted/30 p-3">
                                                            <p className="text-xs text-muted-foreground">
                                                                Statut stock
                                                            </p>
                                                            <p
                                                                className={cn(
                                                                    "text-sm font-medium",
                                                                    stockStatusColors[selectedVariation.stockStatus] ??
                                                                        "text-foreground"
                                                                )}
                                                            >
                                                                {stockStatusLabels[selectedVariation.stockStatus] ??
                                                                    selectedVariation.stockStatus}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Separator />

                                                {/* Status */}
                                                <div className="space-y-3">
                                                    <span className="text-sm font-medium text-foreground">
                                                        Statut
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            className={cn(
                                                                "text-xs",
                                                                statusColors[selectedVariation.status] ??
                                                                    "bg-muted text-muted-foreground"
                                                            )}
                                                        >
                                                            {statusLabels[selectedVariation.status] ??
                                                                selectedVariation.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Statut actuel :{" "}
                                                        <span className="font-medium">
                                                            {(statusLabels[selectedVariation.status] ??
                                                                selectedVariation.status
                                                            ).toLowerCase()}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* ── Footer ── */}
                        <div className="h-10 shrink-0 border-t border-border bg-muted/30 flex items-center px-4 text-xs text-muted-foreground gap-4">
                            <span>{stats.total} variations</span>
                            <Separator orientation="vertical" className="h-4" />
                            <span>{stats.synced} synchronisee(s)</span>
                            <span>{stats.modified} modifiee(s)</span>
                            <span>{stats.new} nouvelle(s)</span>
                        </div>
                    </div>
                </DialogContentFullscreen>
            </Dialog>
        </>
    );
}
