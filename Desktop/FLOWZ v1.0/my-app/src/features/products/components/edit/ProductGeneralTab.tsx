"use client";

import React from "react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, X, RefreshCw, Wand2, Layout } from "lucide-react";
import { ProductFormValues } from "../../schemas/product-schema";
import { motion } from "framer-motion";
import { ScoreBadge, SeoScoreBar, calculateScore } from "@/components/products/ProductSeoForm";
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import { useProductEditContext } from "../../context/ProductEditContext";
import { FieldStatusBadge } from "@/components/products/FieldStatusBadge";

export const ProductGeneralTab = () => {
    const { register, control } = useFormContext<ProductFormValues>();
    const {
        remainingProposals,
        draftActions,
        dirtyFieldsData,
        contentBuffer
    } = useProductEditContext();

    // Helper to check if field has a draft proposal
    const hasDraft = (field: string) => remainingProposals.includes(field);

    // Helper to check if field is dirty (unsaved local changes)
    const isDirty = (field: string) => dirtyFieldsData?.dirtyFieldsContent?.includes(field);

    // Watch values for scoring
    const title = useWatch({ control, name: "title" }) || "";
    const shortDesc = useWatch({ control, name: "short_description" }) || "";
    const description = useWatch({ control, name: "description" }) || "";

    const titleScore = calculateScore(title, 60);
    const shortDescScore = calculateScore(shortDesc, 160);
    // Remove HTML tags for character count
    const descriptionPlainText = description.replace(/<[^>]*>/g, '');
    const descriptionScore = calculateScore(descriptionPlainText, 500);

    // Render Action Buttons for a field
    const renderFieldActions = (field: string) => {
        if (!hasDraft(field)) return null;

        return (
            <div className="flex items-center gap-1">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => draftActions.handleAcceptField(field)}
                                disabled={draftActions.isAccepting}
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Accepter la suggestion</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => draftActions.handleRejectField(field)}
                                disabled={draftActions.isRejecting}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Rejeter la suggestion</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        );
    };

    // Render Suggestion Preview (optional, simplified)
    const renderSuggestionPreview = (field: string) => {
        if (!hasDraft(field) || !contentBuffer?.draft_generated_content) return null;

        const suggestion = contentBuffer.draft_generated_content[field as keyof typeof contentBuffer.draft_generated_content];
        if (!suggestion) return null;

        return (
            <div className="mt-2 p-3 bg-indigo-50/50 rounded border border-indigo-100 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 mb-1 text-indigo-700 font-medium text-xs uppercase">
                    <Wand2 className="h-3 w-3" />
                    Suggestion IA
                </div>
                <div dangerouslySetInnerHTML={{ __html: String(suggestion) }} />
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Card className="overflow-visible border-border/50 bg-card/50 backdrop-blur-sm card-elevated">
                <CardHeader className="pb-4 border-b border-border/10 mb-0 px-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border">
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
                <CardContent className="p-8 space-y-12">

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
                            {renderSuggestionPreview("title")}
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
                            {renderSuggestionPreview("short_description")}
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
                            {renderSuggestionPreview("description")}
                            <div className="mt-4">
                                <SeoScoreBar score={descriptionScore} />
                            </div>
                        </div>
                    </div>

                </CardContent>
            </Card>
        </motion.div>
    );
};
