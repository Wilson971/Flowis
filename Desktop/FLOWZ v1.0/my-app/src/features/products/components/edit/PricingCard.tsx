"use client";

import React, { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getProductCardTheme } from "@/lib/design-system";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, CalendarDays, Percent, Sparkles } from "lucide-react";
import { ProductFormValues } from "../../schemas/product-schema";
import { useProductEditContext } from "../../context/ProductEditContext";
import { FieldStatusBadge } from "@/components/products/FieldStatusBadge";
import { AISuggestionModal } from "@/components/products/ui/AISuggestionModal";

interface PricingCardProps {
    isVariableProduct?: boolean;
    variationsCount?: number;
    onManageVariants?: () => void;
}

/**
 * PricingCard
 *
 * Carte de tarification et gestion du stock.
 * Utilise useFormContext pour accéder au formulaire parent.
 */
export const PricingCard = ({
    isVariableProduct = false,
    variationsCount = 0,
    onManageVariants,
}: PricingCardProps) => {
    const { register, setValue, control, getValues } = useFormContext<ProductFormValues>();
    const { dirtyFieldsData, remainingProposals, draftActions, contentBuffer } = useProductEditContext();
    const isDirty = (field: string) => dirtyFieldsData?.dirtyFieldsContent?.includes(field);
    const hasDraft = (field: string) => remainingProposals.includes(field);

    // Get theme colors from design system
    const theme = getProductCardTheme('PricingCard');

    // SKU suggestion modal state
    const [skuModalOpen, setSkuModalOpen] = useState(false);

    // Utiliser useWatch au niveau du composant (pas inline dans le JSX)
    const manageStock = useWatch({ control, name: "manage_stock" });
    const isVirtual = useWatch({ control, name: "virtual" });
    const isDownloadable = useWatch({ control, name: "downloadable" });
    const onSale = useWatch({ control, name: "on_sale" });
    const backorders = useWatch({ control, name: "backorders" });

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
        >
            <Card className={theme.container}>
                {/* Glass reflection */}
                <div className={theme.glassReflection} />
                {/* Gradient accent - managed by design system */}
                <div className={theme.gradientAccent} />

                <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className={theme.iconContainer}>
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                                Vente & Stock
                            </p>
                            <h3 className="text-sm font-extrabold tracking-tight text-foreground">
                                Tarification et logistique
                            </h3>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5 p-4 pt-3 relative z-10">
                    {/* Variable product notice */}
                    {isVariableProduct && (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
                            <p className="font-medium text-foreground text-xs">
                                Produit variable — {variationsCount} variation(s)
                            </p>
                            <p className="text-xs mt-1">
                                Les prix et le stock sont gérés au niveau de chaque variation.
                                Utilisez la section Variations ci-dessous pour les modifier.
                            </p>
                        </div>
                    )}

                    {/* SKU */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="sku" className="text-xs font-semibold flex items-center gap-1.5">
                                SKU
                                <FieldStatusBadge hasDraft={hasDraft("sku")} isDirty={isDirty("sku")} />
                            </Label>
                            {hasDraft("sku") && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSkuModalOpen(true)}
                                    className="gap-1.5 h-6 px-2 text-[10px] font-semibold border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                                >
                                    <Sparkles className="h-3 w-3" />
                                    Suggestion
                                </Button>
                            )}
                        </div>
                        <Input
                            id="sku"
                            {...register("sku")}
                            placeholder="SKU-123"
                            className="bg-background/50 border border-border/50 font-mono h-8 text-xs"
                        />
                    </div>

                    {/* Prices */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="regular_price" className="text-xs font-semibold flex items-center gap-1.5">
                                    Prix régulier (€)
                                    <FieldStatusBadge isDirty={isDirty("regular_price")} />
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="regular_price"
                                        type="number"
                                        step="0.01"
                                        {...register("regular_price")}
                                        placeholder="0.00"
                                        className="bg-background/50 border border-border/50 pl-7 h-8 font-mono text-xs"
                                    />
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">
                                        €
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="sale_price" className="text-xs font-semibold flex items-center gap-1.5">
                                    Prix promo (€)
                                    <FieldStatusBadge isDirty={isDirty("sale_price")} />
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="sale_price"
                                        type="number"
                                        step="0.01"
                                        {...register("sale_price")}
                                        placeholder="0.00"
                                        className="bg-background/50 border border-border/50 pl-7 h-8 font-mono text-xs text-emerald-600"
                                    />
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">
                                        €
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Promotion Toggle */}
                        <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                                <Percent className="h-3.5 w-3.5 text-emerald-500" />
                                <Label htmlFor="on_sale" className="text-xs font-semibold text-emerald-600">
                                    En promotion
                                </Label>
                            </div>
                            <Switch
                                id="on_sale"
                                checked={onSale}
                                onCheckedChange={(c) => setValue("on_sale", c, { shouldDirty: true })}
                                className="h-4 w-7 scale-75 data-[state=checked]:bg-emerald-500"
                            />
                        </div>

                        {/* Promotion Dates - Conditional */}
                        <AnimatePresence>
                            {onSale && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-3 overflow-hidden"
                                >
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <CalendarDays className="h-3 w-3" />
                                        Période de promotion
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="date_on_sale_from" className="text-xs font-semibold">
                                                Début
                                            </Label>
                                            <Input
                                                id="date_on_sale_from"
                                                type="datetime-local"
                                                {...register("date_on_sale_from")}
                                                className="bg-background/50 border border-border/50 h-8 text-xs px-2"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="date_on_sale_to" className="text-xs font-semibold">
                                                Fin
                                            </Label>
                                            <Input
                                                id="date_on_sale_to"
                                                type="datetime-local"
                                                {...register("date_on_sale_to")}
                                                className="bg-background/50 border border-border/50 h-8 text-xs px-2"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {isVariableProduct && variationsCount > 0 && onManageVariants && (
                            <Button
                                variant="outline"
                                type="button"
                                className="w-full h-8 text-xs gap-2 border-primary/20 hover:bg-primary/5"
                                onClick={onManageVariants}
                            >
                                Gérer les variantes ({variationsCount})
                            </Button>
                        )}
                    </div>

                    <div className="h-px bg-border/40" />

                    {/* Stock */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="manage_stock" className="text-xs font-semibold">
                                Gérer le stock
                            </Label>
                            <Switch
                                id="manage_stock"
                                checked={manageStock}
                                onCheckedChange={(c) => setValue("manage_stock", c, { shouldDirty: true })}
                                className="h-4 w-7 scale-75 data-[state=checked]:bg-primary"
                            />
                        </div>
                        <AnimatePresence>
                            {manageStock && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-3 overflow-hidden"
                                >
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="stock" className="text-xs font-semibold flex items-center gap-1.5">
                                                Quantité
                                                <FieldStatusBadge isDirty={isDirty("stock")} />
                                            </Label>
                                            <Input
                                                id="stock"
                                                type="number"
                                                {...register("stock")}
                                                placeholder="0"
                                                className="bg-background/50 border border-border/50 font-mono h-8 text-xs px-3"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="low_stock_amount" className="text-xs font-semibold">
                                                Seuil stock bas
                                            </Label>
                                            <Input
                                                id="low_stock_amount"
                                                type="number"
                                                {...register("low_stock_amount")}
                                                placeholder="5"
                                                className="bg-background/50 border border-border/50 font-mono h-8 text-xs px-3"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="backorders" className="text-xs font-semibold">
                                            Rupture de stock
                                        </Label>
                                        <Select
                                            value={backorders || "no"}
                                            onValueChange={(v) => setValue("backorders", v as "no" | "notify" | "yes", { shouldDirty: true })}
                                        >
                                            <SelectTrigger className="bg-background/50 border border-border/50 h-8 text-xs">
                                                <SelectValue placeholder="Gérer les ruptures" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="no">Ne pas autoriser</SelectItem>
                                                <SelectItem value="notify">Autoriser + notifier client</SelectItem>
                                                <SelectItem value="yes">Autoriser sans notification</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="h-px bg-border/40" />

                    {/* Logistics */}
                    <div className="space-y-3">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Logistique & Dimensions
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="weight" className="text-xs font-semibold">
                                    Poids (kg)
                                </Label>
                                <Input
                                    id="weight"
                                    {...register("weight")}
                                    placeholder="0.00"
                                    className="bg-background/50 border border-border/50 font-mono h-8 text-xs px-3"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="shipping_class" className="text-xs font-semibold">
                                    Expédition
                                </Label>
                                <Input
                                    id="shipping_class"
                                    {...register("shipping_class")}
                                    placeholder="Classe"
                                    className="bg-background/50 border border-border/50 h-8 text-xs px-3"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Dimensions (L × l × H cm)</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <Input
                                    {...register("dimensions_length")}
                                    placeholder="L"
                                    className="bg-background/50 border border-border/50 font-mono h-8 text-xs text-center px-1"
                                />
                                <Input
                                    {...register("dimensions_width")}
                                    placeholder="l"
                                    className="bg-background/50 border border-border/50 font-mono h-8 text-xs text-center px-1"
                                />
                                <Input
                                    {...register("dimensions_height")}
                                    placeholder="H"
                                    className="bg-background/50 border border-border/50 font-mono h-8 text-xs text-center px-1"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-border/40" />

                    {/* Tax & Visibility */}
                    <div className="space-y-3">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Fiscalité & Visibilité
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="tax_status" className="text-xs font-semibold">
                                    Statut TVA
                                </Label>
                                <select
                                    id="tax_status"
                                    {...register("tax_status")}
                                    className="flex h-8 w-full rounded-md border border-border/50 bg-background/50 px-3 py-1 text-xs shadow-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    <option value="taxable">Taxable</option>
                                    <option value="shipping">Livraison seule</option>
                                    <option value="none">Non taxable</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="tax_class" className="text-xs font-semibold">
                                    Classe TVA
                                </Label>
                                <Input
                                    id="tax_class"
                                    {...register("tax_class")}
                                    placeholder="Standard"
                                    className="bg-background/50 border border-border/50 h-8 text-xs px-3"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="catalog_visibility" className="text-xs font-semibold">
                                Visibilité catalogue
                            </Label>
                            <select
                                id="catalog_visibility"
                                {...register("catalog_visibility")}
                                className="flex h-8 w-full rounded-md border border-border/50 bg-background/50 px-3 py-1 text-xs shadow-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="visible">Visible (catalogue + recherche)</option>
                                <option value="catalog">Catalogue uniquement</option>
                                <option value="search">Recherche uniquement</option>
                                <option value="hidden">Caché</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="virtual"
                                    checked={isVirtual}
                                    onCheckedChange={(c) => setValue("virtual", c, { shouldDirty: true })}
                                    className="h-4 w-7 scale-75 data-[state=checked]:bg-primary"
                                />
                                <Label htmlFor="virtual" className="text-xs cursor-pointer">
                                    Virtuel
                                </Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="downloadable"
                                    checked={isDownloadable}
                                    onCheckedChange={(c) => setValue("downloadable", c, { shouldDirty: true })}
                                    className="h-4 w-7 scale-75 data-[state=checked]:bg-primary"
                                />
                                <Label htmlFor="downloadable" className="text-xs cursor-pointer">
                                    Téléchargeable
                                </Label>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* AI Suggestion Modal for SKU */}
            {contentBuffer?.draft_generated_content && (
                <AISuggestionModal
                    open={skuModalOpen}
                    onOpenChange={setSkuModalOpen}
                    productTitle={getValues("title") || "Sans titre"}
                    field="SKU"
                    currentValue={getValues("sku") || ""}
                    suggestedValue={String(contentBuffer.draft_generated_content.sku || "")}
                    onAccept={async (editedValue) => {
                        if (editedValue !== undefined) {
                            await draftActions.handleAcceptField("sku", editedValue);
                        } else {
                            await draftActions.handleAcceptField("sku");
                        }
                    }}
                    onReject={async () => {
                        await draftActions.handleRejectField("sku");
                    }}
                    isProcessing={draftActions.isAccepting || draftActions.isRejecting}
                />
            )}
        </motion.div>
    );
};
