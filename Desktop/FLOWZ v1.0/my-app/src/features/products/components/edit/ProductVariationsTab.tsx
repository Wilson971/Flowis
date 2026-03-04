"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useFormContext } from "react-hook-form";
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
    Settings2,
    SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/design-system";

import { VariationGrid } from "./VariationGrid";
import { VariationToolbar, type VariationFilters } from "./VariationToolbar";
import { AttributeSheet } from "./AttributeSheet";
import { VariationDetailSheet } from "./VariationDetailSheet";
import { useVariationManager, filterVariations } from "../../hooks/useVariationManager";
import { useVariationImageUpload } from "@/hooks/variations/useVariationImages";
import { useDirtyVariationsCount } from "@/hooks/products/useProductVariations";
import { toast } from "sonner";
import type { ProductFormValues } from "../../schemas/product-schema";
import type { VariationImage } from "@/hooks/products/useProductVariations";

// ============================================================================
// TYPES
// ============================================================================

interface ProductVariationsTabProps {
    productId: string;
    storeId?: string;
    platformProductId?: string;
    metadataVariants?: unknown[];
    onRegisterSave?: (saveFn: () => Promise<void>) => void;
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
    const attributes = watch("attributes") || [];

    // ===== UI STATE =====
    const [dialogOpen, setDialogOpen] = useState(false);
    const [attributeSheetOpen, setAttributeSheetOpen] = useState(false);
    const [detailVariationId, setDetailVariationId] = useState<string | null>(null);
    const [filters, setFilters] = useState<VariationFilters>({
        search: "",
        attributes: {},
    });

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

    // Register save/dirty with parent
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

    // ===== COMPUTED =====
    const variationAttributes = useMemo(
        () =>
            attributes
                .filter((a) => a.variation && a.options.length > 0)
                .map((a) => ({ name: a.name, options: [...new Set(a.options)] as string[] })),
        [attributes]
    );

    const canGenerate = variationAttributes.length > 0;

    const filteredVariations = useMemo(
        () => filterVariations(manager.variations, filters),
        [manager.variations, filters]
    );

    const parentAttributeOptions = useMemo(() => {
        const map = new Map<string, string[]>();
        for (const attr of attributes) {
            if (attr.variation && attr.options?.length > 0) {
                map.set(attr.name, attr.options);
            }
        }
        return map;
    }, [attributes]);

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
        if (min === max) return `${min.toFixed(2)} €`;
        return `${min.toFixed(2)} – ${max.toFixed(2)} €`;
    }, [manager.variations]);

    const totalStock = useMemo(
        () => manager.variations.reduce((sum, v) => sum + (v.stockQuantity ?? 0), 0),
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

    const handleSaveAndClose = useCallback(async () => {
        if (manager.hasUnsavedChanges) {
            await manager.saveVariations();
            toast.info("Pensez à synchroniser", {
                description: "Les variations sont sauvegardées localement. Cliquez sur Sync pour mettre à jour votre boutique.",
                duration: 6000,
            });
        }
        setDialogOpen(false);
    }, [manager]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!dialogOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape" && manager.selectedIds.size > 0) {
                e.preventDefault();
                manager.clearSelection();
            }
            if (e.key === "a" && (e.ctrlKey || e.metaKey) && dialogOpen) {
                e.preventDefault();
                manager.toggleSelectAll();
            }
            if (e.key === "Delete" && manager.selectedIds.size > 0) {
                e.preventDefault();
                manager.deleteSelected();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [dialogOpen, manager.selectedIds.size, manager.clearSelection, manager.toggleSelectAll, manager.deleteSelected]);

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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Shuffle className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">Variations</h3>
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

                    <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Attributs</p>
                            <p className="text-sm font-medium text-foreground">{variationAttributeCount}</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Fourchette prix</p>
                            <p className="text-sm font-medium text-foreground">{priceRange}</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Stock total</p>
                            <p className="text-sm font-medium text-foreground">{totalStock}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Fullscreen Dialog — UNIFIED GRID ── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContentFullscreen
                    className="overflow-hidden p-0"
                    ariaTitle="Variation Studio"
                >
                    <div className="flex h-screen flex-col bg-background">
                        {/* ── Top Toolbar ── */}
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
                                <span className="font-semibold text-foreground">Variation Studio</span>
                            </div>

                            <Badge variant="secondary">{manager.stats.total} variations</Badge>

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

                            {/* Attribute Sheet trigger */}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setAttributeSheetOpen(true)}
                                className="gap-2"
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                Attributs
                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                    {variationAttributeCount}
                                </Badge>
                            </Button>

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

                        {/* ── Contextual Toolbar (filters or bulk) ── */}
                        <VariationToolbar
                            variationAttributes={variationAttributes}
                            filters={filters}
                            onFiltersChange={setFilters}
                            selectedCount={manager.selectedIds.size}
                            onBulkUpdate={manager.bulkUpdateField}
                            onDeleteSelected={manager.deleteSelected}
                            onClearSelection={manager.clearSelection}
                            totalCount={manager.variations.length}
                            filteredCount={filteredVariations.length}
                        />

                        {/* ── Grid ── */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <VariationGrid
                                variations={filteredVariations}
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
                                parentAttributeOptions={parentAttributeOptions}
                            />
                        </div>

                        {/* ── Footer ── */}
                        <div className="h-10 shrink-0 border-t border-border bg-muted/30 flex items-center px-4 text-xs text-muted-foreground gap-4">
                            <span>{manager.stats.total} variations</span>
                            <Separator orientation="vertical" className="h-4" />
                            <span>{manager.stats.new} nouvelle(s)</span>
                            <span>{manager.stats.modified} modifiée(s)</span>
                            <span>{manager.stats.deleted} supprimée(s)</span>
                            {filteredVariations.length !== manager.variations.length && (
                                <>
                                    <Separator orientation="vertical" className="h-4" />
                                    <span className="text-primary font-medium">
                                        {filteredVariations.length} affichée(s)
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </DialogContentFullscreen>
            </Dialog>

            {/* ── Attribute Sheet ── */}
            <AttributeSheet
                open={attributeSheetOpen}
                onOpenChange={setAttributeSheetOpen}
                onGenerate={handleGenerate}
                currentVariationCount={manager.variations.length}
            />

            {/* ── Detail Sheet ── */}
            <VariationDetailSheet
                variation={detailVariation}
                open={!!detailVariationId}
                onOpenChange={(open) => {
                    if (!open) setDetailVariationId(null);
                }}
                onUpdateField={(field, value) => {
                    if (detailVariationId) {
                        manager.updateVariationField(detailVariationId, field, value);
                    }
                }}
                onImageUpload={(file) => {
                    if (detailVariationId) {
                        handleVariationImageUpload(detailVariationId, file);
                    }
                }}
                isUploadingImage={
                    !!detailVariationId && uploadingVariationId === detailVariationId
                }
                parentAttributeOptions={parentAttributeOptions}
            />
        </motion.div>
    );
}
