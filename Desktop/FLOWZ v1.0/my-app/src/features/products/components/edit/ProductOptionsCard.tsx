"use client";

import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
    Settings2,
    Star,
    ShoppingCart,
    MessageSquare,
    ArrowUpDown,
    StickyNote,
    Package,
} from "lucide-react";
import { ProductFormValues } from "../../schemas/product-schema";

/**
 * ProductOptionsCard
 *
 * Carte pour les options avancées du produit:
 * - featured (produit mis en avant)
 * - sold_individually (vente à l'unité)
 * - purchasable (achetable)
 * - reviews_allowed (avis autorisés)
 * - menu_order (ordre d'affichage)
 * - purchase_note (note post-achat)
 */
export const ProductOptionsCard = () => {
    const { register, setValue, control } = useFormContext<ProductFormValues>();

    const featured = useWatch({ control, name: "featured" });
    const soldIndividually = useWatch({ control, name: "sold_individually" });
    const purchasable = useWatch({ control, name: "purchasable" });
    const reviewsAllowed = useWatch({ control, name: "reviews_allowed" });

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
        >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden card-elevated">
                <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                            <Settings2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                                Configuration
                            </p>
                            <h3 className="text-sm font-extrabold tracking-tight text-foreground">
                                Options du produit
                            </h3>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 p-4 pt-3">
                    {/* Toggle Options */}
                    <div className="space-y-3">
                        {/* Featured */}
                        <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-2">
                                <Star className="h-3.5 w-3.5 text-amber-500" />
                                <Label htmlFor="featured" className="text-xs font-medium cursor-pointer">
                                    Produit mis en avant
                                </Label>
                            </div>
                            <Switch
                                id="featured"
                                checked={featured}
                                onCheckedChange={(c) => setValue("featured", c, { shouldDirty: true })}
                                className="h-4 w-7 scale-75 data-[state=checked]:bg-amber-500"
                            />
                        </div>

                        {/* Purchasable */}
                        <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="h-3.5 w-3.5 text-primary" />
                                <Label htmlFor="purchasable" className="text-xs font-medium cursor-pointer">
                                    Achetable en ligne
                                </Label>
                            </div>
                            <Switch
                                id="purchasable"
                                checked={purchasable}
                                onCheckedChange={(c) => setValue("purchasable", c, { shouldDirty: true })}
                                className="h-4 w-7 scale-75 data-[state=checked]:bg-primary"
                            />
                        </div>

                        {/* Sold Individually */}
                        <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-2">
                                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                <Label htmlFor="sold_individually" className="text-xs font-medium cursor-pointer">
                                    Vente à l'unité uniquement
                                </Label>
                            </div>
                            <Switch
                                id="sold_individually"
                                checked={soldIndividually}
                                onCheckedChange={(c) => setValue("sold_individually", c, { shouldDirty: true })}
                                className="h-4 w-7 scale-75 data-[state=checked]:bg-primary"
                            />
                        </div>

                        {/* Reviews Allowed */}
                        <div className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                                <Label htmlFor="reviews_allowed" className="text-xs font-medium cursor-pointer">
                                    Autoriser les avis
                                </Label>
                            </div>
                            <Switch
                                id="reviews_allowed"
                                checked={reviewsAllowed}
                                onCheckedChange={(c) => setValue("reviews_allowed", c, { shouldDirty: true })}
                                className="h-4 w-7 scale-75 data-[state=checked]:bg-blue-500"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-border/40" />

                    {/* Menu Order */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                            <Label htmlFor="menu_order" className="text-xs font-semibold">
                                Ordre d'affichage
                            </Label>
                        </div>
                        <Input
                            id="menu_order"
                            type="number"
                            {...register("menu_order", { valueAsNumber: true })}
                            placeholder="0"
                            className="bg-background/50 border border-border/50 font-mono h-8 text-xs px-3"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Les valeurs plus basses apparaissent en premier
                        </p>
                    </div>

                    <div className="h-px bg-border/40" />

                    {/* Purchase Note */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                            <Label htmlFor="purchase_note" className="text-xs font-semibold">
                                Note post-achat
                            </Label>
                        </div>
                        <Textarea
                            id="purchase_note"
                            {...register("purchase_note")}
                            placeholder="Message envoyé au client après l'achat..."
                            className="bg-background/50 border border-border/50 text-xs min-h-[60px] resize-none"
                            rows={2}
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Ce message sera inclus dans l'email de confirmation
                        </p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};
