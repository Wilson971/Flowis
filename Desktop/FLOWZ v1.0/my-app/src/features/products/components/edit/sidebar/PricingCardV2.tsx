"use client";

import React, { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AnimatePresence, motion } from "framer-motion";
import {
    CreditCard,
    CalendarDays,
    Percent,
    Sparkles,
    AlertTriangle,
    ChevronRight,
    Package,
    Truck,
    Receipt,
    Monitor,
    Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
import { ProductFormValues } from "../../../schemas/product-schema";
import { useProductEditContext } from "../../../context/ProductEditContext";
import { FieldStatusBadge } from "@/components/products/FieldStatusBadge";
import { AISuggestionModal } from "@/components/products/ui/AISuggestionModal";
import { isFieldValidatedByAI } from "@/lib/productHelpers";

interface PricingCardV2Props {
    isVariableProduct?: boolean;
    variationsCount?: number;
    onManageVariants?: () => void;
}

export const PricingCardV2 = ({
    isVariableProduct = false,
    variationsCount = 0,
    onManageVariants,
}: PricingCardV2Props) => {
    const { register, setValue, control, getValues } = useFormContext<ProductFormValues>();
    const { dirtyFieldsData, remainingProposals, draftActions, contentBuffer, generationManifest } = useProductEditContext();
    const isDirty = (field: string) => dirtyFieldsData?.dirtyFieldsContent?.includes(field);
    const hasDraft = (field: string) => remainingProposals.includes(field);
    const isValidated = (field: string) => isFieldValidatedByAI(generationManifest, field);

    const [skuModalOpen, setSkuModalOpen] = useState(false);
    const [stockOpen, setStockOpen] = useState(false);
    const [logisticsOpen, setLogisticsOpen] = useState(false);
    const [taxOpen, setTaxOpen] = useState(false);

    const manageStock = useWatch({ control, name: "manage_stock" });
    const isVirtual = useWatch({ control, name: "virtual" });
    const isDownloadable = useWatch({ control, name: "downloadable" });
    const onSale = useWatch({ control, name: "on_sale" });
    const backorders = useWatch({ control, name: "backorders" });

    return (
        <motion.div
            {...motionTokens.variants.fadeIn}
            transition={motionTokens.transitions.default}
        >
            <div className="rounded-xl border border-border/40 bg-card relative group overflow-hidden">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="p-6 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-muted/60 ring-1 ring-border/50 flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-foreground/70" />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                                    Tarification
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Prix, stock et logistique
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-border/30" />

                    <div className="p-6 pt-4 space-y-4">
                        {/* Variable product warning */}
                        {isVariableProduct && (
                            <div className="flex items-start gap-3 rounded-lg px-4 py-3 bg-amber-500/5">
                                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                                <div>
                                    <p className="text-[13px] font-medium text-foreground">
                                        Produit variable — {variationsCount} variation(s)
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Les prix sont gérés par variation
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* SKU */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="sku" className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                                    SKU
                                    <FieldStatusBadge hasDraft={hasDraft("sku")} isDirty={isDirty("sku")} isValidated={isValidated("sku")} />
                                </Label>
                                {hasDraft("sku") && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSkuModalOpen(true)}
                                        className="gap-1.5 h-6 px-2 text-[10px] font-semibold border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50 rounded-lg"
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
                                className="rounded-lg text-sm font-mono"
                            />
                        </div>

                        {/* Prices */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="regular_price" className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                                        Prix régulier
                                        <FieldStatusBadge isDirty={isDirty("regular_price")} />
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="regular_price"
                                            type="number"
                                            step="0.01"
                                            {...register("regular_price")}
                                            placeholder="0.00"
                                            className="rounded-lg text-sm font-mono pl-7"
                                        />
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-xs">
                                            €
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sale_price" className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                                        Prix promo
                                        <FieldStatusBadge isDirty={isDirty("sale_price")} />
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="sale_price"
                                            type="number"
                                            step="0.01"
                                            {...register("sale_price")}
                                            placeholder="0.00"
                                            className="rounded-lg text-sm font-mono pl-7"
                                        />
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-xs">
                                            €
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* On sale toggle */}
                            <div className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40">
                                <div className="flex items-center gap-2">
                                    <Percent className="h-4 w-4 text-foreground/70" />
                                    <span className="text-[13px] font-medium text-foreground">En promotion</span>
                                </div>
                                <Switch
                                    id="on_sale"
                                    checked={onSale}
                                    onCheckedChange={(c) => setValue("on_sale", c, { shouldDirty: true })}
                                />
                            </div>

                            {/* Promotion dates */}
                            <AnimatePresence>
                                {onSale && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={motionTokens.transitions.default}
                                        className="space-y-3 overflow-hidden"
                                    >
                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
                                            <CalendarDays className="h-3.5 w-3.5" />
                                            Période de promotion
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="date_on_sale_from" className="text-[13px] font-medium text-foreground">
                                                    Début
                                                </Label>
                                                <Input
                                                    id="date_on_sale_from"
                                                    type="datetime-local"
                                                    {...register("date_on_sale_from")}
                                                    className="rounded-lg text-sm"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="date_on_sale_to" className="text-[13px] font-medium text-foreground">
                                                    Fin
                                                </Label>
                                                <Input
                                                    id="date_on_sale_to"
                                                    type="datetime-local"
                                                    {...register("date_on_sale_to")}
                                                    className="rounded-lg text-sm"
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
                                    className="w-full text-sm gap-2 border-border/50 hover:bg-muted/40 rounded-lg"
                                    onClick={onManageVariants}
                                >
                                    Gérer les variantes ({variationsCount})
                                </Button>
                            )}
                        </div>

                        <div className="border-t border-border/30" />

                        {/* Stock - Collapsible */}
                        <Collapsible open={stockOpen} onOpenChange={setStockOpen}>
                            <CollapsibleTrigger className="flex items-center gap-2 w-full py-3 text-[13px] font-medium text-foreground hover:text-foreground transition-colors">
                                <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground/60 transition-transform", stockOpen && "rotate-90")} />
                                <Package className="h-4 w-4 text-foreground/70" />
                                Gestion du stock
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pb-4 space-y-4">
                                <div className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-foreground/70" />
                                        <span className="text-[13px] font-medium text-foreground">Gérer le stock</span>
                                    </div>
                                    <Switch
                                        id="manage_stock"
                                        checked={manageStock}
                                        onCheckedChange={(c) => setValue("manage_stock", c, { shouldDirty: true })}
                                    />
                                </div>

                                <AnimatePresence>
                                    {manageStock && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={motionTokens.transitions.default}
                                            className="space-y-4 overflow-hidden"
                                        >
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="stock" className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                                                        Quantité
                                                        <FieldStatusBadge isDirty={isDirty("stock")} />
                                                    </Label>
                                                    <Input
                                                        id="stock"
                                                        type="number"
                                                        {...register("stock")}
                                                        placeholder="0"
                                                        className="rounded-lg text-sm font-mono"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="low_stock_amount" className="text-[13px] font-medium text-foreground">
                                                        Seuil stock bas
                                                    </Label>
                                                    <Input
                                                        id="low_stock_amount"
                                                        type="number"
                                                        {...register("low_stock_amount")}
                                                        placeholder="5"
                                                        className="rounded-lg text-sm font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="backorders" className="text-[13px] font-medium text-foreground">
                                                    Rupture de stock
                                                </Label>
                                                <Select
                                                    value={backorders || "no"}
                                                    onValueChange={(v) => setValue("backorders", v as "no" | "notify" | "yes", { shouldDirty: true })}
                                                >
                                                    <SelectTrigger className="rounded-lg text-sm">
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
                            </CollapsibleContent>
                        </Collapsible>

                        <div className="border-t border-border/30" />

                        {/* Logistics - Collapsible */}
                        <Collapsible open={logisticsOpen} onOpenChange={setLogisticsOpen}>
                            <CollapsibleTrigger className="flex items-center gap-2 w-full py-3 text-[13px] font-medium text-foreground hover:text-foreground transition-colors">
                                <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground/60 transition-transform", logisticsOpen && "rotate-90")} />
                                <Truck className="h-4 w-4 text-foreground/70" />
                                Logistique &amp; Dimensions
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pb-4 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="weight" className="text-[13px] font-medium text-foreground">
                                            Poids (kg)
                                        </Label>
                                        <Input
                                            id="weight"
                                            {...register("weight")}
                                            placeholder="0.00"
                                            className="rounded-lg text-sm font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="shipping_class" className="text-[13px] font-medium text-foreground">
                                            Expédition
                                        </Label>
                                        <Input
                                            id="shipping_class"
                                            {...register("shipping_class")}
                                            placeholder="Classe"
                                            className="rounded-lg text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[13px] font-medium text-foreground">Dimensions (L x l x H cm)</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <Input
                                            {...register("dimensions_length")}
                                            placeholder="L"
                                            className="rounded-lg text-sm font-mono text-center"
                                        />
                                        <Input
                                            {...register("dimensions_width")}
                                            placeholder="l"
                                            className="rounded-lg text-sm font-mono text-center"
                                        />
                                        <Input
                                            {...register("dimensions_height")}
                                            placeholder="H"
                                            className="rounded-lg text-sm font-mono text-center"
                                        />
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>

                        <div className="border-t border-border/30" />

                        {/* Tax & Visibility - Collapsible */}
                        <Collapsible open={taxOpen} onOpenChange={setTaxOpen}>
                            <CollapsibleTrigger className="flex items-center gap-2 w-full py-3 text-[13px] font-medium text-foreground hover:text-foreground transition-colors">
                                <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground/60 transition-transform", taxOpen && "rotate-90")} />
                                <Receipt className="h-4 w-4 text-foreground/70" />
                                Fiscalité &amp; Visibilité
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pb-4 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="tax_status" className="text-[13px] font-medium text-foreground">
                                            Statut TVA
                                        </Label>
                                        <select
                                            id="tax_status"
                                            {...register("tax_status")}
                                            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        >
                                            <option value="taxable">Taxable</option>
                                            <option value="shipping">Livraison seule</option>
                                            <option value="none">Non taxable</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tax_class" className="text-[13px] font-medium text-foreground">
                                            Classe TVA
                                        </Label>
                                        <Input
                                            id="tax_class"
                                            {...register("tax_class")}
                                            placeholder="Standard"
                                            className="rounded-lg text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="catalog_visibility" className="text-[13px] font-medium text-foreground">
                                        Visibilité catalogue
                                    </Label>
                                    <select
                                        id="catalog_visibility"
                                        {...register("catalog_visibility")}
                                        className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        <option value="visible">Visible (catalogue + recherche)</option>
                                        <option value="catalog">Catalogue uniquement</option>
                                        <option value="search">Recherche uniquement</option>
                                        <option value="hidden">Caché</option>
                                    </select>
                                </div>

                                {/* Virtual / Downloadable toggles */}
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40">
                                        <div className="flex items-center gap-2">
                                            <Monitor className="h-4 w-4 text-foreground/70" />
                                            <span className="text-[13px] font-medium text-foreground">Virtuel</span>
                                        </div>
                                        <Switch
                                            id="virtual"
                                            checked={isVirtual}
                                            onCheckedChange={(c) => setValue("virtual", c, { shouldDirty: true })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40">
                                        <div className="flex items-center gap-2">
                                            <Download className="h-4 w-4 text-foreground/70" />
                                            <span className="text-[13px] font-medium text-foreground">Téléchargeable</span>
                                        </div>
                                        <Switch
                                            id="downloadable"
                                            checked={isDownloadable}
                                            onCheckedChange={(c) => setValue("downloadable", c, { shouldDirty: true })}
                                        />
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                </div>
            </div>

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
