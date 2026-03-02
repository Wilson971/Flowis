"use client";

import React, { useState } from "react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Layout } from "lucide-react";
import { ProductFormValues } from "../../schemas/product-schema";
import { motion } from "framer-motion";
import { ScoreBadge, SeoScoreBar, calculateScore } from "@/components/products/ProductSeoForm";
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import { useProductEditContext } from "../../context/ProductEditContext";
import { FieldStatusBadge } from "@/components/products/FieldStatusBadge";
import { AISuggestionModal } from "@/components/products/ui/AISuggestionModal";
import { DraftSuggestionButton } from "@/components/products/ui/DraftSuggestionButton";
import { motionTokens } from "@/lib/design-system";
import { cn } from "@/lib/utils";

export const ProductGeneralTab = () => {
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

    // Strip HTML tags for accurate character counts (raw HTML like <strong>, <p> etc. should not be counted)
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

    const titleScore = calculateScore(title, 60);
    const shortDescPlainText = stripHtml(shortDesc);
    const shortDescScore = calculateScore(shortDescPlainText, 160);
    const descriptionPlainText = stripHtml(description);
    const descriptionScore = calculateScore(descriptionPlainText, 500);

    // Render AI suggestion button for a field
    const renderFieldActions = (field: string) => (
        <DraftSuggestionButton field={field} hasDraft={hasDraft(field)} onOpen={openSuggestionModal} />
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={motionTokens.transitions.default}
        >
            <Card className="rounded-xl border border-border/40 bg-card relative group overflow-hidden">
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />

                <CardHeader className="pb-4 border-b border-border/10 mb-0 px-8 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
                            <Layout className="h-[18px] w-[18px] text-foreground/70" />
                        </div>
                        <div>
                            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-0.5">
                                Configuration
                            </p>
                            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
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
                                <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">Désignation</p>
                                <Label htmlFor="title" className="text-[15px] font-semibold tracking-tight text-foreground flex items-center gap-2">
                                    Titre du produit <span className="text-destructive">*</span>
                                    <FieldStatusBadge hasDraft={hasDraft("title")} isDirty={isDirty("title")} />
                                </Label>
                            </div>
                            <div className="flex items-center gap-3">
                                {renderFieldActions("title")}
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] font-semibold tracking-tight text-muted-foreground uppercase tracking-widest leading-none">{title.length} chars</span>
                                    <ScoreBadge score={titleScore} />
                                </div>
                            </div>
                        </div>
                        <div className="pt-2">
                            <Input
                                id="title"
                                {...register("title", { required: true })}
                                className="block w-full bg-background/50 border-border/50 focus:border-primary/50 transition-colors font-medium py-6 px-4 text-lg"
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
                                <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">Résumé</p>
                                <Label htmlFor="short_description" className="text-[15px] font-semibold tracking-tight text-foreground flex items-center gap-2">
                                    Description courte
                                    <FieldStatusBadge hasDraft={hasDraft("short_description")} isDirty={isDirty("short_description")} />
                                </Label>
                            </div>
                            <div className="flex items-center gap-3">
                                {renderFieldActions("short_description")}
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] font-semibold tracking-tight text-muted-foreground uppercase tracking-widest leading-none">{shortDescPlainText.length} chars</span>
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
                                    <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden focus-within:border-primary/30 transition-colors">
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
                                <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">Marketing & Vente</p>
                                <Label className="text-[15px] font-semibold tracking-tight text-foreground flex items-center gap-2">
                                    Description détaillée
                                    <FieldStatusBadge hasDraft={hasDraft("description")} isDirty={isDirty("description")} />
                                </Label>
                            </div>
                            <div className="flex items-center gap-3">
                                {renderFieldActions("description")}
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] font-semibold tracking-tight text-muted-foreground uppercase tracking-widest leading-none">{descriptionPlainText.length} chars</span>
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
                                    <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden focus-within:border-primary/30 transition-colors">
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
