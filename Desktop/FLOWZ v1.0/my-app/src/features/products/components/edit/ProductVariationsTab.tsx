"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Shuffle,
    Save,
    Loader2,
    RefreshCw,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/design-system";

import { AttributeBuilder } from "./AttributeBuilder";
import { VariationGrid } from "./VariationGrid";
import { BulkVariationToolbar } from "./BulkVariationToolbar";
import { VariationDetailSheet } from "./VariationDetailSheet";
import { useVariationManager } from "../../hooks/useVariationManager";
import type { ProductFormValues } from "../../schemas/product-schema";

// ============================================================================
// TYPES
// ============================================================================

interface ProductVariationsTabProps {
    productId: string;
    storeId?: string;
    platformProductId?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductVariationsTab({
    productId,
    storeId,
    platformProductId,
}: ProductVariationsTabProps) {
    const { watch } = useFormContext<ProductFormValues>();
    const attributes = watch("attributes") || [];

    const [detailVariationId, setDetailVariationId] = useState<string | null>(
        null
    );

    const manager = useVariationManager({
        productId,
        storeId,
        platformProductId,
        enabled: !!storeId,
    });

    const variationAttributes = attributes.filter(
        (a) => a.variation && a.options.length > 0
    );
    const canGenerate = variationAttributes.length > 0;

    const handleGenerate = () => {
        manager.generateFromAttributes(attributes);
    };

    const handleSave = async () => {
        await manager.saveVariations();
    };

    // Find the detail variation for the sheet
    const detailVariation = detailVariationId
        ? manager.variations.find((v) => v._localId === detailVariationId) ??
          null
        : null;

    return (
        <motion.div
            variants={motionTokens.variants.fadeIn}
            initial="hidden"
            animate="visible"
        >
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-lg",
                                    "bg-primary/10 text-primary"
                                )}
                            >
                                <Shuffle className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-base">
                                    Variations
                                    {manager.stats.total > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="ml-2 text-xs"
                                        >
                                            {manager.stats.total}
                                        </Badge>
                                    )}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Gérez les déclinaisons de votre produit (taille,
                                    couleur, etc.)
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Unsaved changes indicator */}
                            {manager.hasUnsavedChanges && (
                                <Badge
                                    variant="outline"
                                    className="text-xs border-amber-500/50 text-amber-600 bg-amber-500/5"
                                >
                                    <AlertCircle className="mr-1 h-3 w-3" />
                                    {manager.stats.new > 0 &&
                                        `${manager.stats.new} nouvelle(s)`}
                                    {manager.stats.modified > 0 &&
                                        `${manager.stats.new > 0 ? ", " : ""}${manager.stats.modified} modifiée(s)`}
                                    {manager.stats.deleted > 0 &&
                                        `${manager.stats.new + manager.stats.modified > 0 ? ", " : ""}${manager.stats.deleted} supprimée(s)`}
                                </Badge>
                            )}

                            {/* Generate button */}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleGenerate}
                                disabled={!canGenerate}
                                title={
                                    !canGenerate
                                        ? "Ajoutez au moins un attribut de variation avec des options"
                                        : undefined
                                }
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Générer les variations
                            </Button>

                            {/* Save button */}
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSave}
                                disabled={
                                    !manager.hasUnsavedChanges || manager.isSaving
                                }
                            >
                                {manager.isSaving ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Sauvegarder
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Attribute Builder */}
                    <AttributeBuilder />

                    {/* Separator between attributes and grid */}
                    {manager.variations.length > 0 && <Separator />}

                    {/* Bulk Toolbar */}
                    <BulkVariationToolbar
                        selectedCount={manager.selectedIds.size}
                        onBulkUpdate={manager.bulkUpdateField}
                        onDeleteSelected={manager.deleteSelected}
                        onClearSelection={manager.clearSelection}
                    />

                    {/* Variation Grid */}
                    <VariationGrid
                        variations={manager.variations}
                        selectedIds={manager.selectedIds}
                        onToggleSelect={manager.toggleSelect}
                        onToggleSelectAll={manager.toggleSelectAll}
                        onUpdateField={manager.updateVariationField}
                        onDelete={manager.deleteVariation}
                        onOpenDetail={setDetailVariationId}
                        isLoading={manager.isLoading}
                    />

                    {/* Detail Sheet */}
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
                    />
                </CardContent>
            </Card>
        </motion.div>
    );
}
