"use client";

import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/design-system";
import { ExternalLink, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductFormValues } from "../../schemas/product-schema";

/**
 * ExternalProductCard
 *
 * Carte pour les produits externes (affiliés):
 * - external_url (URL du produit externe)
 * - button_text (texte du bouton d'achat)
 *
 * Cette carte ne s'affiche que si product_type === 'external'
 */
export const ExternalProductCard = () => {
    const { register, control } = useFormContext<ProductFormValues>();

    const productType = useWatch({ control, name: "product_type" });

    // Only show for external products
    if (productType !== "external") {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={motionTokens.transitions.fast}
        >
            <Card className="rounded-xl border border-border/40 bg-card relative group overflow-hidden">
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />

                <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
                            <ExternalLink className="h-[18px] w-[18px] text-foreground/70" />
                        </div>
                        <div>
                            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-0.5">
                                Produit Affilié
                            </p>
                            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                                Lien externe
                            </h3>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 p-4 pt-3 relative z-10">
                    {/* External URL */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                            <Label htmlFor="external_url" className="text-xs font-semibold tracking-tight">
                                URL du produit
                            </Label>
                        </div>
                        <Input
                            id="external_url"
                            type="url"
                            {...register("external_url")}
                            placeholder="https://exemple.com/produit"
                            className="bg-background/50 border border-border/50 h-8 text-xs px-3"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            URL vers le site externe où le produit peut être acheté
                        </p>
                    </div>

                    {/* Button Text */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />
                            <Label htmlFor="button_text" className="text-xs font-semibold tracking-tight">
                                Texte du bouton
                            </Label>
                        </div>
                        <Input
                            id="button_text"
                            {...register("button_text")}
                            placeholder="Acheter sur le site partenaire"
                            className="bg-background/50 border border-border/50 h-8 text-xs px-3"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Texte affiché sur le bouton d'achat (par défaut: "Acheter")
                        </p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};
