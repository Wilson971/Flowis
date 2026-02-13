"use client";

import React, { useState } from "react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles, Layout } from "lucide-react";
import { ProductFormValues } from "../../schemas/product-schema";
import { motion } from "framer-motion";
import { ScoreBadge, SeoScoreBar, calculateScore } from "@/components/products/ProductSeoForm";
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import { useProductEditContext } from "../../context/ProductEditContext";
import { FieldStatusBadge } from "@/components/products/FieldStatusBadge";
import { AISuggestionModal } from "@/components/products/ui/AISuggestionModal";
import { getProductCardTheme } from "@/lib/design-system";
import { cn } from "@/lib/utils";

export const ProductGeneralTab = () => {
    const theme = getProductCardTheme('ProductGeneralTab');
    const { register, control, getValues } = useFormContext<ProductFormValues>();
    const {
        remainingProposals,
        draftActions,
        dirtyFieldsData,
        contentBuffer
    } = useProductEditContext();

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalField, setModalField] = useState<string>("");

    // Helper to check if field has a draft proposal
    const hasDraft = (field: string) => remainingProposals.includes(field);

    // Helper to check if field is dirty (unsaved local changes)
    const isDirty = (field: string) => dirtyFieldsData?.dirtyFieldsContent?.includes(field);

    // Open modal for a specific field
    const openSuggestionModal = (field: string) => {
        setModalField(field);
        setModalOpen(true);
    };

    // Watch values for scoring
    const title = useWatch({ control, name: "title" }) || "";
    const shortDesc = useWatch({ control, name: "short_description" }) || "";
    const description = useWatch({ control, name: "description" }) || "";

    const titleScore = calculateScore(title, 60);
    const shortDescScore = calculateScore(shortDesc, 160);
    // Remove HTML tags for character count
    const descriptionPlainText = description.replace(/<[^>]*>/g, '');
    const descriptionScore = calculateScore(descriptionPlainText, 500);

    // Render Action Button for a field (opens modal)
    const renderFieldActions = (field: string) => {
        if (!hasDraft(field)) return null;

        return (
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openSuggestionModal(field)}
                className="gap-1.5 h-7 px-2.5 text-xs font-semibold border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50"
            >
                <Sparkles className="h-3.5 w-3.5" />
                Voir la suggestion
            </Button>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Card className={cn(theme.container, "overflow-visible")}>
                {/* Glass reflection */}
                <div className={theme.glassReflection} />
                {/* Gradient accent */}
                <div className={theme.gradientAccent} />

                <CardHeader className="pb-4 border-b border-border/10 mb-0 px-8 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className={theme.iconContainer}>
                            <Layout className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-0.5">
                                Configuration
                            </p>
                            <h3 className="text-sm font-extrabold tracking-tight text-foreground">
                                Informations Générales
                            </h3>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-12 relative z-10">

                    {/* Product Title Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end pb-2 border-b border-border/10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Désignation</p>
                                <Label htmlFor="title" className="text-sm font-extrabold text-foreground flex items-center gap-2">
                                    Titre du produit <span className="text-destructive">*</span>
                                    <FieldStatusBadge hasDraft={hasDraft("title")} isDirty={isDirty("title")} />
                                </Label>
                            </div>
                            <div className="flex items-center gap-3">
                                {renderFieldActions("title")}
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{title.length} chars</span>
                                    <ScoreBadge score={titleScore} />
                                </div>
                            </div>
                        </div>
                        <div className="pt-2">
                            <Input
                                id="title"
                                {...register("title", { required: true })}
                                className="block w-full bg-background/50 border-border/50 focus:border-primary/50 transition-all font-medium py-6 px-4 text-lg"
                                placeholder="Entrez le titre du produit"
                            />
                                                        <div className="mt-4">
                                <SeoScoreBar score={titleScore} />
                            </div>
                        </div>
                    </div>

                    {/* Short Description Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end pb-2 border-b border-border/10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Résumé</p>
                                <Label htmlFor="short_description" className="text-sm font-extrabold text-foreground flex items-center gap-2">
                                    Description courte
                                    <FieldStatusBadge hasDraft={hasDraft("short_description")} isDirty={isDirty("short_description")} />
                                </Label>
                            </div>
                            <div className="flex items-center gap-3">
                                {renderFieldActions("short_description")}
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{shortDesc.length} chars</span>
                                    <ScoreBadge score={shortDescScore} />
                                </div>
                            </div>
                        </div>
                        <div className="pt-2">
                            <Controller
                                name="short_description"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden focus-within:border-primary/30 transition-all">
                                        <TipTapEditor
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                            placeholder="Saisissez une description courte..."
                                            minHeight={150}
                                            maxHeight={300}
                                        />
                                    </div>
                                )}
                            />
                                                        <div className="mt-4">
                                <SeoScoreBar score={shortDescScore} />
                            </div>
                        </div>
                    </div>

                    {/* Detailed Description Section - TipTap Editor */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end pb-2 border-b border-border/10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Marketing & Vente</p>
                                <Label className="text-sm font-extrabold text-foreground flex items-center gap-2">
                                    Description détaillée
                                    <FieldStatusBadge hasDraft={hasDraft("description")} isDirty={isDirty("description")} />
                                </Label>
                            </div>
                            <div className="flex items-center gap-3">
                                {renderFieldActions("description")}
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{descriptionPlainText.length} chars</span>
                                    <ScoreBadge score={descriptionScore} />
                                </div>
                            </div>
                        </div>
                        <div className="pt-2">
                            <Controller
                                name="description"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden focus-within:border-primary/30 transition-all">
                                        <TipTapEditor
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                            placeholder="Saisissez la description détaillée du produit..."
                                            minHeight={250}
                                            maxHeight={500}
                                        />
                                    </div>
                                )}
                            />
                            <div className="mt-4">
                                <SeoScoreBar score={descriptionScore} />
                            </div>
                        </div>
                    </div>

                </CardContent>
            </Card>

            {/* AI Suggestion Modal */}
            {modalField && contentBuffer?.draft_generated_content && (
                <AISuggestionModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    productTitle={getValues("title") || "Sans titre"}
                    field={modalField}
                    currentValue={String(getValues(modalField as keyof ProductFormValues) || "")}
                    suggestedValue={String(contentBuffer.draft_generated_content[modalField as keyof typeof contentBuffer.draft_generated_content] || "")}
                    onAccept={async (editedValue) => {
                        if (editedValue !== undefined) {
                            // User edited the value - we'll handle this in the accept logic
                            await draftActions.handleAcceptField(modalField, editedValue);
                        } else {
                            await draftActions.handleAcceptField(modalField);
                        }
                    }}
                    onReject={async () => {
                        await draftActions.handleRejectField(modalField);
                    }}
                    isProcessing={draftActions.isAccepting || draftActions.isRejecting}
                />
            )}
        </motion.div>
    );
};
