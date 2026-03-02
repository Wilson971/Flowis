"use client";

import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    SlidersHorizontal,
    Star,
    ShoppingCart,
    MessageSquare,
    ArrowUpDown,
    StickyNote,
    Package,
} from "lucide-react";
import { ProductFormValues } from "../../../schemas/product-schema";

export const OptionsCardV2 = () => {
    const { register, setValue, control } = useFormContext<ProductFormValues>();

    const featured = useWatch({ control, name: "featured" });
    const soldIndividually = useWatch({ control, name: "sold_individually" });
    const purchasable = useWatch({ control, name: "purchasable" });
    const reviewsAllowed = useWatch({ control, name: "reviews_allowed" });

    return (
        <div className="rounded-xl border border-border/40 bg-card relative group overflow-hidden">
            <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />
            <div className="relative z-10">
                {/* Header */}
                <div className="p-4 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-muted/60 ring-1 ring-border/50 flex items-center justify-center shrink-0">
                            <SlidersHorizontal className="h-5 w-5 text-foreground/70" />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Options</h3>
                            <p className="text-xs text-muted-foreground">Configuration du produit</p>
                        </div>
                    </div>
                </div>

                {/* Toggle rows */}
                <div className="px-4 pb-2 space-y-0.5">
                    {/* Featured */}
                    <div className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40">
                        <div className="flex items-center gap-2.5">
                            <Star className="h-4 w-4 text-foreground/70" />
                            <div>
                                <span className="text-[13px] font-medium text-foreground">Produit mis en avant</span>
                                <p className="text-[11px] text-muted-foreground/60">Visible en page d&apos;accueil</p>
                            </div>
                        </div>
                        <Switch
                            id="featured"
                            checked={featured}
                            onCheckedChange={(c) => setValue("featured", c, { shouldDirty: true })}
                        />
                    </div>

                    {/* Purchasable */}
                    <div className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40">
                        <div className="flex items-center gap-2.5">
                            <ShoppingCart className="h-4 w-4 text-foreground/70" />
                            <div>
                                <span className="text-[13px] font-medium text-foreground">Achetable en ligne</span>
                            </div>
                        </div>
                        <Switch
                            id="purchasable"
                            checked={purchasable}
                            onCheckedChange={(c) => setValue("purchasable", c, { shouldDirty: true })}
                        />
                    </div>

                    {/* Sold Individually */}
                    <div className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40">
                        <div className="flex items-center gap-2.5">
                            <Package className="h-4 w-4 text-foreground/70" />
                            <div>
                                <span className="text-[13px] font-medium text-foreground">Vente à l&apos;unité uniquement</span>
                            </div>
                        </div>
                        <Switch
                            id="sold_individually"
                            checked={soldIndividually}
                            onCheckedChange={(c) => setValue("sold_individually", c, { shouldDirty: true })}
                        />
                    </div>

                    {/* Reviews Allowed */}
                    <div className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40">
                        <div className="flex items-center gap-2.5">
                            <MessageSquare className="h-4 w-4 text-foreground/70" />
                            <div>
                                <span className="text-[13px] font-medium text-foreground">Autoriser les avis</span>
                            </div>
                        </div>
                        <Switch
                            id="reviews_allowed"
                            checked={reviewsAllowed}
                            onCheckedChange={(c) => setValue("reviews_allowed", c, { shouldDirty: true })}
                        />
                    </div>
                </div>

                {/* Menu Order + Purchase Note */}
                <div className="px-4 pb-4">
                    <div className="border-t border-border/30 pt-4 space-y-4">
                        {/* Menu Order */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                                <Label htmlFor="menu_order" className="text-[13px] font-medium text-foreground">
                                    Ordre d&apos;affichage
                                </Label>
                            </div>
                            <Input
                                id="menu_order"
                                type="number"
                                {...register("menu_order", { valueAsNumber: true })}
                                placeholder="0"
                                className="h-8 rounded-lg text-sm font-mono"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Les valeurs plus basses apparaissent en premier
                            </p>
                        </div>

                        {/* Purchase Note */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                                <Label htmlFor="purchase_note" className="text-[13px] font-medium text-foreground">
                                    Note post-achat
                                </Label>
                            </div>
                            <Textarea
                                id="purchase_note"
                                {...register("purchase_note")}
                                placeholder="Message envoyé au client après l'achat..."
                                className="text-sm min-h-[60px] resize-none rounded-lg"
                                rows={2}
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Ce message sera inclus dans l&apos;email de confirmation
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
