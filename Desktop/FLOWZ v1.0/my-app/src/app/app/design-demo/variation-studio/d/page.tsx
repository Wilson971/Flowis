"use client";

import { useState, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { motion } from "framer-motion";
import { Maximize2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motionTokens, styles } from "@/lib/design-system";
import Link from "next/link";

import type { ProductFormValues } from "@/features/products/schemas/product-schema";
import type { EditableVariation } from "@/features/products/hooks/useVariationManager";
import { MOCK_VARIATIONS, MOCK_FORM_DEFAULTS } from "@/features/products/components/edit/demo/mock-data";
import { ProposalD_Fullscreen } from "@/features/products/components/edit/demo/ProposalD_Fullscreen";

export default function ProposalDPage() {
    const form = useForm<ProductFormValues>({
        defaultValues: MOCK_FORM_DEFAULTS,
    });

    const [variations, setVariations] = useState<EditableVariation[]>(MOCK_VARIATIONS);

    const handleUpdateField = useCallback(
        (localId: string, field: keyof EditableVariation, value: unknown) => {
            setVariations((prev) =>
                prev.map((v) =>
                    v._localId === localId
                        ? { ...v, [field]: value, _status: v._status === "new" ? "new" : "modified" }
                        : v
                )
            );
        },
        []
    );

    const handleDelete = useCallback((localId: string) => {
        setVariations((prev) =>
            prev.map((v) =>
                v._localId === localId ? { ...v, _status: "deleted" as const } : v
            )
        );
    }, []);

    const activeVariations = variations.filter((v) => v._status !== "deleted");

    return (
        <FormProvider {...form}>
            <div className="h-screen flex flex-col">
                {/* Fixed Header */}
                <motion.div
                    variants={motionTokens.variants.slideUp}
                    initial="hidden"
                    animate="visible"
                    className="flex-none border-b border-border/50 bg-card/50 backdrop-blur-sm"
                >
                    <div className="container mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Link href="/app/design-demo/variations-modal-demo">
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                        Retour
                                    </Button>
                                </Link>

                                <div className="flex items-center gap-2">
                                    <Maximize2 className="h-5 w-5 text-primary" />
                                    <h1 className={styles.text.h3}>Proposition D : Fullscreen Studio</h1>
                                    <Badge variant="outline" className="ml-2">Démo</Badge>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-center">
                                    <p className="text-sm font-bold text-primary">84-89%</p>
                                    <p className="text-[10px] text-muted-foreground">espace gagné</p>
                                </div>
                                <Badge variant="outline" className="text-xs">Haute complexité</Badge>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Fullscreen Content */}
                <div className="flex-1 min-h-0 bg-gradient-to-br from-background via-background to-muted/20">
                    <motion.div
                        variants={motionTokens.variants.fadeIn}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.1 }}
                        className="h-full"
                    >
                        <ProposalD_Fullscreen
                            variations={activeVariations}
                            onUpdateField={handleUpdateField}
                            onDelete={handleDelete}
                        />
                    </motion.div>
                </div>
            </div>
        </FormProvider>
    );
}
