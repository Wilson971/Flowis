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
import { VariationImageGalleryModal, type GalleryImage } from "./variation-grid/VariationImageGalleryModal";
import { useVariationManager } from "../../hooks/useVariationManager";
import { useVariationImageUpload } from "@/hooks/variations/useVariationImages";
import { useDirtyVariationsCount } from "@/hooks/products/useProductVariations";
import { toast } from "sonner";
import type { ProductFormValues } from "../../schemas/product-schema";
import type { VariationImage } from "@/hooks/products/useProductVariations";

// ============================================================================
// CONSTANTS
// ============================================================================

const ATTR_ACCENT = "bg-muted/40 text-foreground";

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
    /** Callback to register a dirty check so parent can block publish when variations are unsaved */
    onRegisterDirtyCheck?: (dirtyFn: () => boolean) => void;
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
    onRegisterDirtyCheck,
}: ProductVariationsTabProps) {
    const { watch } = useFormContext<ProductFormValues>();
    const { remove } = useFieldArray({ name: "attributes" });
    const attributes = watch("attributes") || [];
    const formImages = watch("images") || [];

    // ===== UI STATE =====
    const [dialogOpen, setDialogOpen] = useState(false);
    const [studioTab, setStudioTab] = useState<"attributs" | "grille">("attributs");
    const [detailVariationId, setDetailVariationId] = useState<string | null>(null);
    const [selectedAttributeIndex, setSelectedAttributeIndex] = useState<number | null>(null);
    const [galleryVariationId, setGalleryVariationId] = useState<string | null>(null);

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

    useEffect(() => {
        if (onRegisterDirtyCheck) {
            onRegisterDirtyCheck(() => managerRef.current.hasUnsavedChanges);
        }
    }, [onRegisterDirtyCheck]);

    // Auto-select first attribute when attributes change
    useEffect(() => {
        if (attributes.length > 0 && selectedAttributeIndex === null) {
            setSelectedAttributeIndex(0);
        }
        if (selectedAttributeIndex !== null && selectedAttributeIndex >= attributes.length) {
            setSelectedAttributeIndex(attributes.length > 0 ? attributes.length - 1 : null);
        }
    }, [attributes.length, selectedAttributeIndex]);


    // NOTE: Auto-generation was removed — variations must come from DB or metadata
    // (which preserve WooCommerce external IDs). Auto-generating replaces real
    // variations with local-only copies that lack externalId, causing push-to-store
    // to create duplicates instead of updating existing WC variations.
    // Users can still manually click "Générer" to create the cartesian product.

    // ===== COMPUTED =====
    const variationAttributes = attributes.filter(
        (a) => a.variation && a.options.length > 0
    );
    const canGenerate = variationAttributes.length > 0;

    const variationAttributeCount = useMemo(
        () => attributes.filter((a) => a.variation === true).length,
        [attributes]
    );

    // Build a map of attribute name → available options for inline editing
    // Serialize options to a stable key so useMemo recalculates when option values change
    // (watch() may return the same array reference with mutated contents)
    const attributeOptionsKey = JSON.stringify(
        attributes.filter((a) => a.variation).map((a) => [a.name, a.options])
    );
    const parentAttributeOptions = useMemo(() => {
        const map = new Map<string, string[]>();
        for (const attr of attributes) {
            if (attr.variation && attr.options?.length > 0) {
                map.set(attr.name, attr.options);
            }
        }
        return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attributeOptionsKey]);

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

    // Cascade rename: when an attribute option is renamed in the detail panel,
    // update all variations that reference the old value
    const handleRenameOption = useCallback(
        (attributeName: string, oldValue: string, newValue: string) => {
            for (const variation of manager.variations) {
                const attr = variation.attributes.find(
                    (a) => a.name === attributeName && a.option === oldValue
                );
                if (attr) {
                    const newAttrs = variation.attributes.map((a) =>
                        a.name === attributeName && a.option === oldValue
                            ? { ...a, option: newValue }
                            : a
                    );
                    manager.updateVariationField(variation._localId, "attributes", newAttrs);
                }
            }
        },
        [manager.variations, manager.updateVariationField]
    );

    // When an attribute option is removed, unset it on affected variations
    const handleRemoveOption = useCallback(
        (attributeName: string, removedValue: string) => {
            for (const variation of manager.variations) {
                const attr = variation.attributes.find(
                    (a) => a.name === attributeName && a.option === removedValue
                );
                if (attr) {
                    const newAttrs = variation.attributes.map((a) =>
                        a.name === attributeName && a.option === removedValue
                            ? { ...a, option: "" }
                            : a
                    );
                    manager.updateVariationField(variation._localId, "attributes", newAttrs);
                }
            }
        },
        [manager.variations, manager.updateVariationField]
    );

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

    // Product gallery images + variation images for the picker
    const productGalleryImages: GalleryImage[] = useMemo(() => {
        const seen = new Set<string>();
        const images: GalleryImage[] = [];

        // Product main gallery
        for (const [i, img] of formImages.entries()) {
            if (img.src && !seen.has(img.src)) {
                seen.add(img.src);
                images.push({
                    id: img.id ?? `img-${i}`,
                    src: img.src,
                    alt: img.alt || "",
                    name: img.name || "",
                });
            }
        }

        // Variation images
        for (const v of manager.variations) {
            if (v.image?.src && !seen.has(v.image.src)) {
                seen.add(v.image.src);
                const label = v.attributes.map((a) => a.option).join(" / ");
                images.push({
                    id: v.image.id ?? `var-${v._localId}`,
                    src: v.image.src,
                    alt: v.image.alt || "",
                    name: label || v.image.name || "",
                });
            }
        }

        return images;
    }, [formImages, manager.variations]);

    const handleGallerySelectImage = useCallback(
        (image: GalleryImage) => {
            if (!galleryVariationId) return;
            const variationImage: VariationImage = {
                id: typeof image.id === "number" ? image.id : Date.now(),
                src: image.src,
                name: image.name || "",
                alt: image.alt || "",
            };
            manager.updateVariationField(galleryVariationId, "image", variationImage);
        },
        [galleryVariationId, manager.updateVariationField]
    );

    const handleGalleryUpload = useCallback(
        (file: File) => {
            if (!galleryVariationId) return;
            handleVariationImageUpload(galleryVariationId, file);
        },
        [galleryVariationId, handleVariationImageUpload]
    );

    const galleryVariation = galleryVariationId
        ? manager.variations.find((v) => v._localId === galleryVariationId) ?? null
        : null;

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
            <Card className={cn("rounded-xl border border-border/40")}>
                <CardContent className="relative p-6">
                    <div className="absolute inset-0 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] pointer-events-none" />
                    {/* Top bar: title + open button */}
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border/50")}>
                                <Shuffle className="h-4 w-4 text-foreground/70" />
                            </div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                                    Variations
                                </h3>
                                <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-medium border-0 bg-muted/60 text-muted-foreground">
                                    <span className="tabular-nums">{manager.stats.total}</span>
                                </Badge>
                                {manager.hasUnsavedChanges && (
                                    <Badge
                                        variant="outline"
                                        className="h-5 rounded-full px-2 text-[10px] font-medium border-0 bg-amber-500/10 text-amber-600"
                                    >
                                        <AlertCircle className="mr-1 h-3 w-3" />
                                        <span className="tabular-nums">{manager.stats.new + manager.stats.modified + manager.stats.deleted}</span> modif.
                                    </Badge>
                                )}
                                {dirtyVariationsCount > 0 && !manager.hasUnsavedChanges && (
                                    <Badge
                                        variant="outline"
                                        className="h-5 rounded-full px-2 text-[10px] font-medium border-0 bg-sky-500/10 text-sky-600"
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
                            className="h-8 text-[11px] rounded-lg gap-1.5 font-medium transition-colors ml-auto px-3"
                        >
                            <Settings2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Gérer les Variations</span>
                        </Button>
                    </div>

                    <Separator className="my-4" />

                    {/* Summary stats grid */}
                    <div className="relative grid grid-cols-3 gap-4">
                        <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Attributs</p>
                            <p className="text-[13px] tabular-nums font-medium text-foreground">
                                {variationAttributeCount}
                            </p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Fourchette prix</p>
                            <p className="text-[13px] tabular-nums font-medium text-foreground">
                                {priceRange}
                            </p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Stock total</p>
                            <p className="text-[13px] tabular-nums font-medium text-foreground">
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
                                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border/50")}>
                                    <Shuffle className="h-4 w-4 text-foreground/70" />
                                </div>
                                <span className="text-[15px] font-semibold tracking-tight text-foreground">
                                    Variation Studio
                                </span>
                            </div>

                            <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-medium border-0 bg-muted/60 text-muted-foreground">
                                <span className="tabular-nums">{manager.stats.total}</span> variations
                            </Badge>

                            {manager.hasUnsavedChanges && (
                                <Badge
                                    variant="outline"
                                    className="h-5 rounded-full px-2 text-[10px] font-medium border-0 bg-amber-500/10 text-amber-600"
                                >
                                    <AlertCircle className="mr-1 h-3 w-3" />
                                    <span className="tabular-nums">{manager.stats.new + manager.stats.modified + manager.stats.deleted}</span> modif.
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
                                className="h-8 text-[11px] rounded-lg gap-1.5 font-medium transition-colors"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Générer
                            </Button>

                            {/* Save & Close button */}
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSaveAndClose}
                                disabled={manager.isSaving}
                                className="h-8 text-[11px] rounded-lg gap-1.5 font-medium"
                            >
                                {manager.isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                <Save className="h-3.5 w-3.5" />
                                Enregistrer &amp; Fermer
                            </Button>
                        </div>

                        {/* ── Body: Sidebar tabs + Content ── */}
                        <div className="flex flex-1 min-h-0">
                            {/* VERTICAL TAB BAR */}
                            <div className="w-[64px] shrink-0 border-r border-border bg-muted/20 flex flex-col items-center py-3 gap-1">
                                <button
                                    type="button"
                                    onClick={() => setStudioTab("attributs")}
                                    className={cn(
                                        "flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 w-[56px] transition-colors",
                                        studioTab === "attributs"
                                            ? "bg-muted/60 text-foreground"
                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    )}
                                >
                                    <SlidersHorizontal className="h-[18px] w-[18px]" />
                                    <span className="text-[10px] font-medium leading-none">Attributs</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStudioTab("grille")}
                                    className={cn(
                                        "flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 w-[56px] transition-colors",
                                        studioTab === "grille"
                                            ? "bg-muted/60 text-foreground"
                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    )}
                                >
                                    <LayoutGrid className="h-[18px] w-[18px]" />
                                    <span className="text-[10px] font-medium leading-none">Grille</span>
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
                                        <div className="grid grid-rows-2 gap-6 h-full min-h-0">
                                            {/* ── SECTION: Attributs ── */}
                                            <div className="min-h-0 flex flex-col gap-2">
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                                                    <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Attribut sélectionné</span>
                                                </div>
                                            {selectedAttributeIndex !== null && attributes[selectedAttributeIndex] ? (
                                                <div className="min-h-0 overflow-y-auto flex-1">
                                                    <AttributeDetailPanel
                                                        index={selectedAttributeIndex}
                                                        onRemove={() => handleRemoveAttribute(selectedAttributeIndex)}
                                                        onGenerate={canGenerate ? handleGenerate : undefined}
                                                        variationCount={manager.variations.length}
                                                        onRenameOption={handleRenameOption}
                                                        onRemoveOption={handleRemoveOption}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="min-h-0 flex-1 flex items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-muted/20">
                                                    <p className="text-sm text-muted-foreground">Sélectionnez un attribut</p>
                                                </div>
                                            )}
                                            </div>

                                            {/* ── SECTION: Variations ── */}
                                            <div className="min-h-0 h-full flex flex-col gap-2">
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                                                    <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Variations</span>
                                                </div>
                                                <VariationGrid
                                                    variations={manager.variations}
                                                    selectedIds={manager.selectedIds}
                                                    onToggleSelect={manager.toggleSelect}
                                                    onToggleSelectAll={manager.toggleSelectAll}
                                                    onUpdateField={manager.updateVariationField}
                                                    onDelete={manager.deleteVariation}
                                                    onOpenDetail={setDetailVariationId}
                                                    onImageClick={setGalleryVariationId}
                                                    isLoading={manager.isLoading}
                                                    changeCounter={manager.changeCounter}
                                                    uploadingVariationId={uploadingVariationId}
                                                    parentAttributeOptions={parentAttributeOptions}
                                                    onDuplicateVariation={manager.duplicateVariation}
                                                    onCopyFieldToSelected={manager.copyFieldToSelected}
                                                    onCopyAllFieldsToSelected={manager.copyAllFieldsToSelected}
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
                                            <p className="text-[13px] font-semibold tracking-tight text-foreground">
                                                Grille de variations
                                            </p>
                                            <BulkVariationToolbar
                                                selectedCount={manager.selectedIds.size}
                                                onBulkUpdate={manager.bulkUpdateField}
                                                onDeleteSelected={manager.deleteSelected}
                                                onClearSelection={manager.clearSelection}
                                            />
                                        </div>

                                        {/* Monochrome attribute legend bar */}
                                        {attributes.filter((a) => a.variation).length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {attributes
                                                    .filter((a) => a.variation)
                                                    .map((attr) => {
                                                        return (
                                                            <div
                                                                key={attr.name}
                                                                className={cn(
                                                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs",
                                                                    ATTR_ACCENT
                                                                )}
                                                            >
                                                                <div className="h-2 w-2 rounded-full shrink-0 bg-foreground/40" />
                                                                <span className="font-medium text-foreground">
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
                                            onImageClick={setGalleryVariationId}
                                            isLoading={manager.isLoading}
                                            changeCounter={manager.changeCounter}
                                            uploadingVariationId={uploadingVariationId}
                                            onDuplicateVariation={manager.duplicateVariation}
                                            onCopyFieldToSelected={manager.copyFieldToSelected}
                                            onCopyAllFieldsToSelected={manager.copyAllFieldsToSelected}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Footer ── */}
                        <div className="h-10 shrink-0 border-t border-border bg-muted/30 flex items-center px-4 text-xs text-muted-foreground gap-4">
                            <span><span className="tabular-nums">{manager.stats.total}</span> variations</span>
                            <Separator orientation="vertical" className="h-4" />
                            <span><span className="tabular-nums">{manager.stats.new}</span> nouvelle(s)</span>
                            <span><span className="tabular-nums">{manager.stats.modified}</span> modifiée(s)</span>
                            <span><span className="tabular-nums">{manager.stats.deleted}</span> supprimée(s)</span>
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
                onImageClick={() => {
                    if (detailVariationId) {
                        setGalleryVariationId(detailVariationId);
                    }
                }}
                isUploadingImage={
                    !!detailVariationId &&
                    uploadingVariationId === detailVariationId
                }
                parentAttributeOptions={parentAttributeOptions}
            />

            {/* Image Gallery Modal */}
            <VariationImageGalleryModal
                open={!!galleryVariationId}
                onOpenChange={(open) => { if (!open) setGalleryVariationId(null); }}
                productImages={productGalleryImages}
                currentImageSrc={galleryVariation?.image?.src ?? null}
                onSelectImage={handleGallerySelectImage}
                onUploadImage={handleGalleryUpload}
                isUploading={!!galleryVariationId && uploadingVariationId === galleryVariationId}
            />
        </motion.div>
    );
}
