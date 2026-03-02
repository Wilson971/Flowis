"use client";

import React, { useState } from "react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Layout } from "lucide-react";
import { ProductFormValues } from "../../../schemas/product-schema";
import { motion } from "framer-motion";
import { ScoreBadge, SeoScoreBar, calculateScore } from "@/components/products/ProductSeoForm";
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import { useProductEditContext } from "../../../context/ProductEditContext";
import { FieldStatusBadge } from "@/components/products/FieldStatusBadge";
import { AISuggestionModal } from "@/components/products/ui/AISuggestionModal";
import { DraftSuggestionButton } from "@/components/products/ui/DraftSuggestionButton";
import { motionTokens } from "@/lib/design-system";
import { cn } from "@/lib/utils";

export const GeneralTabV2 = () => {
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

    // Strip HTML tags for accurate character counts
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
            variants={motionTokens.variants.slideUp}
            initial="hidden"
            animate="visible"
        >
            {/* Card shell */}
            <div className="rounded-xl border border-border/40 bg-card relative group overflow-hidden">
                <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />
                <div className="relative z-10">
                    {/* Card header */}
                    <div className="flex items-center gap-3 p-6 pb-4 border-b border-border/30">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 shrink-0">
                            <Layout className="h-[18px] w-[18px] text-foreground/70" />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Contenu general</h3>
                            <p className="text-xs text-muted-foreground">Titre, descriptions et contenu du produit</p>
                        </div>
                    </div>

                    {/* Content area */}
                    <div className="p-6 space-y-6">
                        {/* Product Title Section */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <label className="text-[13px] font-medium text-foreground">
                                        Titre du produit <span className="text-destructive">*</span>
                                    </label>
                                    <FieldStatusBadge hasDraft={hasDraft("title")} isDirty={isDirty("title")} />
                                    {renderFieldActions("title")}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-medium tabular-nums text-muted-foreground/60">{title.length} caracteres</span>
                                    <ScoreBadge score={titleScore} />
                                </div>
                            </div>
                            <Input
                                id="title"
                                {...register("title", { required: true })}
                                className="rounded-lg text-sm"
                                placeholder="Entrez le titre du produit"
                            />
                            <SeoScoreBar score={titleScore} />
                        </div>

                        {/* Short Description Section */}
                        <div className={cn("space-y-2 border-t border-border/30 pt-6")}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <label className="text-[13px] font-medium text-foreground">Description courte</label>
                                    <FieldStatusBadge hasDraft={hasDraft("short_description")} isDirty={isDirty("short_description")} />
                                    {renderFieldActions("short_description")}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-medium tabular-nums text-muted-foreground/60">{shortDescPlainText.length} caracteres</span>
                                    <ScoreBadge score={shortDescScore} />
                                </div>
                            </div>
                            <Controller
                                name="short_description"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden focus-within:border-primary/30">
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
                            <SeoScoreBar score={shortDescScore} />
                        </div>

                        {/* Detailed Description Section */}
                        <div className={cn("space-y-2 border-t border-border/30 pt-6")}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <label className="text-[13px] font-medium text-foreground">Description detaillee</label>
                                    <FieldStatusBadge hasDraft={hasDraft("description")} isDirty={isDirty("description")} />
                                    {renderFieldActions("description")}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-medium tabular-nums text-muted-foreground/60">{descriptionPlainText.length} caracteres</span>
                                    <ScoreBadge score={descriptionScore} />
                                </div>
                            </div>
                            <Controller
                                name="description"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden focus-within:border-primary/30">
                                        <TipTapEditor
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                            placeholder="Saisissez la description detaillee du produit..."
                                            minHeight={250}
                                            maxHeight={500}
                                        />
                                    </div>
                                )}
                            />
                            <SeoScoreBar score={descriptionScore} />
                        </div>
                    </div>
                </div>
            </div>

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
