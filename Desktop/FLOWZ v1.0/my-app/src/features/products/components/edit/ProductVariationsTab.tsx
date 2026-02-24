"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContentFullscreen,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Shuffle,
    Loader2,
    RefreshCw,
    AlertCircle,
    ArrowLeft,
    Save,
    SlidersHorizontal,
    LayoutGrid,
    Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/design-system";

import { AttributeSidebar } from "./AttributeSidebar";
import { AttributeDetailPanel } from "./AttributeDetailPanel";
import { VariationGrid } from "./VariationGrid";
import { BulkVariationToolbar } from "./BulkVariationToolbar";
import { VariationDetailSheet } from "./VariationDetailSheet";
import { useVariationManager } from "../../hooks/useVariationManager";
import { useVariationImageUpload } from "@/hooks/variations/useVariationImages";
import { useDirtyVariationsCount } from "@/hooks/products/useProductVariations";
import { toast } from "sonner";
import type { ProductFormValues } from "../../schemas/product-schema";
import type { VariationImage } from "@/hooks/products/useProductVariations";

// ============================================================================
// CONSTANTS
// ============================================================================

const TAB_ACCENTS = [
    { border: "border-l-success", bg: "bg-success/5", dot: "bg-success", text: "text-success", badgeBg: "bg-success/10" },
    { border: "border-l-amber-500", bg: "bg-amber-500/5", dot: "bg-amber-500", text: "text-amber-600", badgeBg: "bg-amber-500/10" },
    { border: "border-l-sky-500", bg: "bg-sky-500/5", dot: "bg-sky-500", text: "text-sky-600", badgeBg: "bg-sky-500/10" },
    { border: "border-l-purple-500", bg: "bg-purple-500/5", dot: "bg-purple-500", text: "text-purple-600", badgeBg: "bg-purple-500/10" },
    { border: "border-l-rose-500", bg: "bg-rose-500/5", dot: "bg-rose-500", text: "text-rose-600", badgeBg: "bg-rose-500/10" },
    { border: "border-l-teal-500", bg: "bg-teal-500/5", dot: "bg-teal-500", text: "text-teal-600", badgeBg: "bg-teal-500/10" },
];

// ============================================================================
// TYPES
// ============================================================================

interface ProductVariationsTabProps {
    productId: string;
    storeId?: string;
    platformProductId?: string;
    metadataVariants?: unknown[];
    /** Callback to register the variation save function with the parent container */
    onRegisterSave?: (saveFn: () => Promise<void>) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductVariationsTab({
    productId,
    storeId,
    platformProductId,
    metadataVariants,
    onRegisterSave,
}: ProductVariationsTabProps) {
    const { watch } = useFormContext<ProductFormValues>();
    const { remove } = useFieldArray({ name: "attributes" });
    const attributes = watch("attributes") || [];

    // ===== UI STATE =====
    const [dialogOpen, setDialogOpen] = useState(false);
    const [studioTab, setStudioTab] = useState<"attributs" | "grille">("grille");
    const [detailVariationId, setDetailVariationId] = useState<string | null>(null);
    const [selectedAttributeIndex, setSelectedAttributeIndex] = useState<number | null>(null);

    // ===== HOOKS =====
    const manager = useVariationManager({
        productId,
        storeId,
        platformProductId,
        enabled: !!storeId,
        fallbackVariants: metadataVariants,
    });

    const { handleUpload, uploadingVariationId } = useVariationImageUpload({
        productId,
    });

    const { data: dirtyVariationsCount = 0 } = useDirtyVariationsCount(productId, storeId);

    // Register save function with parent container so "ENREGISTRER" saves variations too.
    // Use a ref to always access the latest manager state, avoiding stale closures
    // and the race condition where the useEffect cleanup briefly sets the ref to a no-op.
    const managerRef = useRef(manager);
    managerRef.current = manager;

    useEffect(() => {
        if (onRegisterSave) {
            onRegisterSave(async () => {
                const m = managerRef.current;
                if (m.hasUnsavedChanges) {
                    await m.saveVariations();
                }
            });
        }
    }, [onRegisterSave]);

    // Auto-select first attribute when attributes change
    useEffect(() => {
        if (attributes.length > 0 && selectedAttributeIndex === null) {
            setSelectedAttributeIndex(0);
        }
        if (selectedAttributeIndex !== null && selectedAttributeIndex >= attributes.length) {
            setSelectedAttributeIndex(attributes.length > 0 ? attributes.length - 1 : null);
        }
    }, [attributes.length, selectedAttributeIndex]);

    // ===== COMPUTED =====
    const variationAttributes = attributes.filter(
        (a) => a.variation && a.options.length > 0
    );
    const canGenerate = variationAttributes.length > 0;

    const variationAttributeCount = useMemo(
        () => attributes.filter((a) => a.variation === true).length,
        [attributes]
    );

    const priceRange = useMemo(() => {
        const prices = manager.variations
            .map((v) => parseFloat(v.regularPrice) || 0)
            .filter((p) => p > 0);
        if (prices.length === 0) return "N/A";
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        if (min === max) return `${min.toFixed(2)} \u20AC`;
        return `${min.toFixed(2)} \u2013 ${max.toFixed(2)} \u20AC`;
    }, [manager.variations]);

    const totalStock = useMemo(
        () =>
            manager.variations.reduce(
                (sum, v) => sum + (v.stockQuantity ?? 0),
                0
            ),
        [manager.variations]
    );

    // ===== HANDLERS =====
    const handleGenerate = useCallback(() => {
        manager.generateFromAttributes(attributes);
    }, [manager, attributes]);

    const handleVariationImageUpload = useCallback(
        (localId: string, file: File) => {
            handleUpload(localId, file, (lid: string, image: VariationImage) => {
                manager.updateVariationField(lid, "image", image);
            });
        },
        [handleUpload, manager.updateVariationField]
    );

    const handleRemoveAttribute = useCallback((index: number) => {
        remove(index);
        if (attributes.length === 1) {
            setSelectedAttributeIndex(null);
        } else if (index === selectedAttributeIndex) {
            setSelectedAttributeIndex(Math.max(0, index - 1));
        }
    }, [remove, attributes.length, selectedAttributeIndex]);

    const handleSaveAndClose = useCallback(async () => {
        if (manager.hasUnsavedChanges) {
            await manager.saveVariations();
            toast.info("Pensez à synchroniser", {
                description: "Les variations sont sauvegardées localement. Cliquez sur le bouton Sync dans le header pour mettre à jour votre boutique.",
                duration: 6000,
            });
        }
        setDialogOpen(false);
    }, [manager]);

    // Find the detail variation for the sheet
    const detailVariation = detailVariationId
        ? manager.variations.find((v) => v._localId === detailVariationId) ?? null
        : null;

    // ===== RENDER =====
    return (
        <motion.div
            variants={motionTokens.variants.fadeIn}
            initial="hidden"
            animate="visible"
        >
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
                                    {manager.stats.total}
                                </Badge>
                                {manager.hasUnsavedChanges && (
                                    <Badge
                                        variant="outline"
                                        className="text-xs border-amber-500/50 text-amber-700 bg-amber-500/10"
                                    >
                                        <AlertCircle className="mr-1 h-3 w-3" />
                                        {manager.stats.new + manager.stats.modified + manager.stats.deleted} modif.
                                    </Badge>
                                )}
                                {dirtyVariationsCount > 0 && !manager.hasUnsavedChanges && (
                                    <Badge
                                        variant="outline"
                                        className="text-xs border-sky-500/50 text-sky-700 bg-sky-500/10"
                                    >
                                        <RefreshCw className="mr-1 h-3 w-3" />
                                        Sync requise
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDialogOpen(true)}
                            className="gap-2 bg-success/5 text-success border-success/[0.02] hover:bg-success/15 hover:text-success/90 hover:border-success/20 transition-all ml-auto h-8 px-3 text-xs"
                        >
                            <Settings2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Gérer les Variations</span>
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
                                {manager.stats.total} variations
                            </Badge>

                            {manager.hasUnsavedChanges && (
                                <Badge
                                    variant="outline"
                                    className="text-xs border-amber-500/50 text-amber-700 bg-amber-500/10"
                                >
                                    <AlertCircle className="mr-1 h-3 w-3" />
                                    {manager.stats.new + manager.stats.modified + manager.stats.deleted} modif.
                                </Badge>
                            )}

                            <div className="flex-1" />

                            {/* Generate button */}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleGenerate}
                                disabled={!canGenerate}
                                className={cn(
                                    "gap-2 font-medium transition-all",
                                    canGenerate && "hover:bg-primary hover:text-primary-foreground hover:shadow-md"
                                )}
                            >
                                <RefreshCw className="h-4 w-4" />
                                Générer
                            </Button>

                            {/* Save & Close button */}
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSaveAndClose}
                                disabled={manager.isSaving}
                            >
                                {manager.isSaving ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Enregistrer &amp; Fermer
                            </Button>
                        </div>

                        {/* ── Body: Sidebar tabs + Content ── */}
                        <div className="flex flex-1 min-h-0">
                            {/* VERTICAL TAB BAR */}
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

                                        {/* Right: Details + Grid */}
                                        <div className="grid grid-rows-2 gap-4 h-full min-h-0">
                                            {/* Attribute Details Panel */}
                                            {selectedAttributeIndex !== null && attributes[selectedAttributeIndex] ? (
                                                <div className="min-h-0 overflow-y-auto">
                                                    <AttributeDetailPanel
                                                        index={selectedAttributeIndex}
                                                        onRemove={() => handleRemoveAttribute(selectedAttributeIndex)}
                                                        onGenerate={canGenerate ? handleGenerate : undefined}
                                                        variationCount={manager.variations.length}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="min-h-0 flex items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-muted/20">
                                                    <p className="text-sm text-muted-foreground">Sélectionnez un attribut</p>
                                                </div>
                                            )}

                                            {/* Variations Grid */}
                                            <div className="min-h-0 h-full">
                                                <VariationGrid
                                                    variations={manager.variations}
                                                    selectedIds={manager.selectedIds}
                                                    onToggleSelect={manager.toggleSelect}
                                                    onToggleSelectAll={manager.toggleSelectAll}
                                                    onUpdateField={manager.updateVariationField}
                                                    onDelete={manager.deleteVariation}
                                                    onOpenDetail={setDetailVariationId}
                                                    onImageUpload={handleVariationImageUpload}
                                                    isLoading={manager.isLoading}
                                                    changeCounter={manager.changeCounter}
                                                    uploadingVariationId={uploadingVariationId}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* ── Grille View ── */
                                <div className="flex-1 flex flex-col min-w-0">
                                    {/* Header: bulk toolbar + attribute legend */}
                                    <div className="p-4 border-b border-border/50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-foreground">
                                                Grille de variations
                                            </p>
                                            <BulkVariationToolbar
                                                selectedCount={manager.selectedIds.size}
                                                onBulkUpdate={manager.bulkUpdateField}
                                                onDeleteSelected={manager.deleteSelected}
                                                onClearSelection={manager.clearSelection}
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
                                            variations={manager.variations}
                                            selectedIds={manager.selectedIds}
                                            onToggleSelect={manager.toggleSelect}
                                            onToggleSelectAll={manager.toggleSelectAll}
                                            onUpdateField={manager.updateVariationField}
                                            onDelete={manager.deleteVariation}
                                            onOpenDetail={setDetailVariationId}
                                            onImageUpload={handleVariationImageUpload}
                                            isLoading={manager.isLoading}
                                            changeCounter={manager.changeCounter}
                                            uploadingVariationId={uploadingVariationId}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Footer ── */}
                        <div className="h-10 shrink-0 border-t border-border bg-muted/30 flex items-center px-4 text-xs text-muted-foreground gap-4">
                            <span>{manager.stats.total} variations</span>
                            <Separator orientation="vertical" className="h-4" />
                            <span>{manager.stats.new} nouvelle(s)</span>
                            <span>{manager.stats.modified} modifiée(s)</span>
                            <span>{manager.stats.deleted} supprimée(s)</span>
                        </div>
                    </div>
                </DialogContentFullscreen>
            </Dialog>

            {/* ── Detail Sheet (works on top of Dialog via Radix z-index) ── */}
            <VariationDetailSheet
                variation={detailVariation}
                open={!!detailVariationId}
                onOpenChange={(open) => {
                    if (!open) setDetailVariationId(null);
                }}
                onUpdateField={(field, value) => {
                    if (detailVariationId) {
                        manager.updateVariationField(
                            detailVariationId,
                            field,
                            value
                        );
                    }
                }}
                onImageUpload={(file) => {
                    if (detailVariationId) {
                        handleVariationImageUpload(detailVariationId, file);
                    }
                }}
                isUploadingImage={
                    !!detailVariationId &&
                    uploadingVariationId === detailVariationId
                }
            />
        </motion.div>
    );
}
