"use client";

import React, { useState, useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
    Link2,
    TrendingUp,
    ShoppingBag,
    Shuffle,
    Plus,
    X,
    Package,
} from "lucide-react";
import { ProductFormValues } from "../../schemas/product-schema";
import { getProductCardTheme } from "@/lib/design-system";

interface LinkedProduct {
    id: number;
    name?: string;
}

interface LinkedProductsCardProps {
    /** Available products for selection (from parent) */
    availableProducts?: LinkedProduct[];
    /** Loading state */
    isLoadingProducts?: boolean;
}

/**
 * LinkedProductsCard
 *
 * Carte pour gérer les produits liés:
 * - upsell_ids (ventes incitatives)
 * - cross_sell_ids (ventes croisées)
 * - related_ids (produits similaires)
 */
export const LinkedProductsCard = ({
    availableProducts = [],
    isLoadingProducts = false,
}: LinkedProductsCardProps) => {
    const { setValue, control, getValues } = useFormContext<ProductFormValues>();

    const upsellIds = useWatch({ control, name: "upsell_ids" }) || [];
    const crossSellIds = useWatch({ control, name: "cross_sell_ids" }) || [];
    const relatedIds = useWatch({ control, name: "related_ids" }) || [];

    const [newUpsellId, setNewUpsellId] = useState("");
    const [newCrossSellId, setNewCrossSellId] = useState("");

    // Helper to find product name by ID
    const getProductName = useCallback(
        (id: number) => {
            const product = availableProducts.find((p) => p.id === id);
            return product?.name || `#${id}`;
        },
        [availableProducts]
    );

    // Add product to a list
    const addProduct = useCallback(
        (field: "upsell_ids" | "cross_sell_ids", idString: string) => {
            const id = parseInt(idString, 10);
            if (isNaN(id) || id <= 0) return;

            const currentIds = getValues(field) || [];
            if (!currentIds.includes(id)) {
                setValue(field, [...currentIds, id], { shouldDirty: true });
            }
        },
        [getValues, setValue]
    );

    // Remove product from a list
    const theme = getProductCardTheme('LinkedProductsCard');

    const removeProduct = useCallback(
        (field: "upsell_ids" | "cross_sell_ids" | "related_ids", id: number) => {
            const currentIds = getValues(field) || [];
            setValue(
                field,
                currentIds.filter((i: number) => i !== id),
                { shouldDirty: true }
            );
        },
        [getValues, setValue]
    );

    // Render product badges
    const renderProductBadges = (
        ids: number[],
        field: "upsell_ids" | "cross_sell_ids" | "related_ids",
        emptyText: string
    ) => {
        if (!ids || ids.length === 0) {
            return (
                <p className="text-xs text-muted-foreground italic py-2">
                    {emptyText}
                </p>
            );
        }

        return (
            <div className="flex flex-wrap gap-1.5">
                <AnimatePresence>
                    {ids.map((id) => (
                        <motion.div
                            key={id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            <Badge
                                variant="secondary"
                                className="text-[10px] h-6 gap-1.5 pr-1 bg-muted/50 hover:bg-muted"
                            >
                                <Package className="h-3 w-3" />
                                <span className="max-w-[100px] truncate">
                                    {getProductName(id)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeProduct(field, id)}
                                    className="ml-0.5 h-4 w-4 rounded-full hover:bg-destructive/20 flex items-center justify-center transition-colors"
                                >
                                    <X className="h-2.5 w-2.5" />
                                </button>
                            </Badge>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
        >
            <Card className={theme.container}>
                {/* Glass reflection */}
                <div className={theme.glassReflection} />
                {/* Gradient accent */}
                <div className={theme.gradientAccent} />

                <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className={theme.iconContainer}>
                            <Link2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                                Recommandations
                            </p>
                            <h3 className="text-sm font-extrabold tracking-tight text-foreground">
                                Produits liés
                            </h3>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-3 relative z-10">
                    <Tabs defaultValue="upsell" className="w-full">
                        <TabsList className="grid grid-cols-3 mb-4 h-8">
                            <TabsTrigger value="upsell" className="text-[10px] gap-1 px-2">
                                <TrendingUp className="h-3 w-3" />
                                Upsell
                                {upsellIds.length > 0 && (
                                    <Badge variant="secondary" className="h-4 px-1 text-[9px] ml-1">
                                        {upsellIds.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="crosssell" className="text-[10px] gap-1 px-2">
                                <ShoppingBag className="h-3 w-3" />
                                Cross-sell
                                {crossSellIds.length > 0 && (
                                    <Badge variant="secondary" className="h-4 px-1 text-[9px] ml-1">
                                        {crossSellIds.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="related" className="text-[10px] gap-1 px-2">
                                <Shuffle className="h-3 w-3" />
                                Similaires
                                {relatedIds.length > 0 && (
                                    <Badge variant="secondary" className="h-4 px-1 text-[9px] ml-1">
                                        {relatedIds.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        {/* Upsell Products */}
                        <TabsContent value="upsell" className="space-y-3 mt-0">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold flex items-center gap-2">
                                    <TrendingUp className="h-3 w-3 text-success" />
                                    Ventes incitatives
                                </Label>
                                <p className="text-[10px] text-muted-foreground">
                                    Produits suggérés sur la page produit (upgrade)
                                </p>
                            </div>
                            {renderProductBadges(
                                upsellIds,
                                "upsell_ids",
                                "Aucun produit upsell"
                            )}
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    placeholder="ID produit"
                                    value={newUpsellId}
                                    onChange={(e) => setNewUpsellId(e.target.value)}
                                    className="bg-background/50 border border-border/50 h-7 text-xs flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={() => {
                                        addProduct("upsell_ids", newUpsellId);
                                        setNewUpsellId("");
                                    }}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Cross-sell Products */}
                        <TabsContent value="crosssell" className="space-y-3 mt-0">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold flex items-center gap-2">
                                    <ShoppingBag className="h-3 w-3 text-primary" />
                                    Ventes croisées
                                </Label>
                                <p className="text-[10px] text-muted-foreground">
                                    Produits suggérés dans le panier
                                </p>
                            </div>
                            {renderProductBadges(
                                crossSellIds,
                                "cross_sell_ids",
                                "Aucun produit cross-sell"
                            )}
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    placeholder="ID produit"
                                    value={newCrossSellId}
                                    onChange={(e) => setNewCrossSellId(e.target.value)}
                                    className="bg-background/50 border border-border/50 h-7 text-xs flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={() => {
                                        addProduct("cross_sell_ids", newCrossSellId);
                                        setNewCrossSellId("");
                                    }}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Related Products (read-only, auto-generated by WooCommerce) */}
                        <TabsContent value="related" className="space-y-3 mt-0">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold flex items-center gap-2">
                                    <Shuffle className="h-3 w-3 text-purple-500" />
                                    Produits similaires
                                </Label>
                                <p className="text-[10px] text-muted-foreground">
                                    Générés automatiquement par WooCommerce (lecture seule)
                                </p>
                            </div>
                            {renderProductBadges(
                                relatedIds,
                                "related_ids",
                                "Aucun produit similaire détecté"
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </motion.div>
    );
};
