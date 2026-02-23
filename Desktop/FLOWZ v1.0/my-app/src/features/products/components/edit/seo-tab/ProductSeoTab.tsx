"use client";

import React, { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ProductFormValues } from "../../../hooks/useProductForm";
import { useProductEditContext } from "../../../context/ProductEditContext";
import { motion } from "framer-motion";
import { getProductCardTheme } from "@/lib/design-system";
import { Globe } from "lucide-react";
import { AISuggestionModal } from "@/components/products/ui/AISuggestionModal";
import { SeoAISuggestionModal } from "@/components/seo/SeoAISuggestionModal";
import { GscKeywordsPanel } from "@/components/products/ui/GscKeywordsPanel";
import { useGscKeywords } from "@/hooks/integrations/useGscKeywords";
import type { ProductSeoInput } from "@/types/seo";

import { ScoreOverview } from "./ScoreOverview";
import { SerpPreviewSection } from "./SerpPreviewSection";
import { SeoFieldEditorsSection } from "./SeoFieldEditors";
import { NonTextCriteria } from "./NonTextCriteria";

// ============================================================================
// Main Component
// ============================================================================

export const ProductSeoTab = () => {
    const theme = getProductCardTheme('ProductSeoTab');
    const { control, setValue, getValues } = useFormContext<ProductFormValues>();
    const { selectedStore, dirtyFieldsData } = useProductEditContext();
    const isDirtyField = (field: string) => dirtyFieldsData?.dirtyFieldsContent?.includes(field);

    // SEO Analysis from Context
    const { seoAnalysis, runSeoAnalysis, remainingProposals, draftActions, contentBuffer } = useProductEditContext();
    const { overallScore, fieldScores, issues, isAnalyzing } = seoAnalysis || {
        overallScore: 0, fieldScores: {}, issues: [], isAnalyzing: false
    };

    // Modal state for draft AI suggestions
    const [modalOpen, setModalOpen] = useState(false);
    const [modalField, setModalField] = useState<string>("");

    // Modal state for Gemini coaching
    const [coachingOpen, setCoachingOpen] = useState(false);
    const [coachingField, setCoachingField] = useState<string>("");
    const [coachingFieldLabel, setCoachingFieldLabel] = useState<string>("");

    const hasDraft = (field: string) => remainingProposals.includes(field);

    const openSuggestionModal = (field: string) => {
        setModalField(field);
        setModalOpen(true);
    };

    const getModalCurrentValue = (field: string): string => {
        if (field === "seo.title") return getValues("meta_title") || "";
        if (field === "seo.description") return getValues("meta_description") || "";
        return "";
    };

    const getModalSuggestedValue = (field: string): string => {
        const draft = contentBuffer?.draft_generated_content;
        if (!draft) return "";
        if (field === "seo.title") return draft.seo?.title || "";
        if (field === "seo.description") return draft.seo?.description || "";
        return "";
    };

    // Field label mapping for coaching modal
    const FIELD_LABELS: Record<string, string> = {
        meta_title: "Meta Titre",
        meta_description: "Meta Description",
        title: "Titre Produit",
        short_description: "Description Courte",
        description: "Description",
        slug: "Slug URL",
    };

    // AI suggest handler for field editors
    const handleAISuggest = (fieldName: string) => {
        const draftField = fieldName === "meta_title" ? "seo.title" : fieldName === "meta_description" ? "seo.description" : fieldName;
        if (hasDraft(draftField)) {
            openSuggestionModal(draftField);
            return;
        }
        setCoachingField(fieldName);
        setCoachingFieldLabel(FIELD_LABELS[fieldName] || fieldName);
        setCoachingOpen(true);
    };

    // Handle applying AI suggestion to form field
    const handleApplyCoachingSuggestion = (value: string) => {
        if (coachingField === "meta_title") setValue("meta_title", value, { shouldDirty: true });
        else if (coachingField === "meta_description") setValue("meta_description", value, { shouldDirty: true });
        else if (coachingField === "slug") setValue("slug", value, { shouldDirty: true });
    };

    // Domain & favicon
    const shopUrl = selectedStore?.platform_connections?.shop_url || "www.votre-boutique.com";
    const domain = shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const favicon = selectedStore?.platform_connections?.site_icon ||
        selectedStore?.platform_connections?.site_icon_url ||
        selectedStore?.platform_connections?.favicon ||
        selectedStore?.platform_connections?.logo_url ||
        `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

    // Watched form values
    const metaTitle = useWatch({ control, name: "meta_title" }) || "";
    const metaDescription = useWatch({ control, name: "meta_description" }) || "";
    const slug = useWatch({ control, name: "slug" }) || "";
    const productTitle = useWatch({ control, name: "title" }) || "";
    const shortDescription = useWatch({ control, name: "short_description" });
    const description = useWatch({ control, name: "description" });
    const productDesc = description || shortDescription || "";
    const status = useWatch({ control, name: "status" });
    const isDraft = status === 'draft';

    const previewDesc = (metaDescription || productDesc).replace(/<[^>]*>/g, '').substring(0, 160);
    const previewTitle = metaTitle || productTitle;

    // GSC keywords for this product's permalink
    const permalink = useWatch({ control, name: "permalink" as any }) as string | null | undefined;
    const { data: gscKeywords } = useGscKeywords(permalink);

    // Build ProductSeoInput from current form values for score projection
    const images = useWatch({ control, name: "images" }) || [];
    const productSeoInput: ProductSeoInput = {
        title: productTitle,
        meta_title: metaTitle,
        meta_description: metaDescription,
        short_description: (shortDescription || "").replace(/<[^>]*>/g, ''),
        description: (description || "").replace(/<[^>]*>/g, ''),
        slug: slug,
        images: Array.isArray(images) ? images.map((img: any) => ({
            src: img?.src || img?.url || "",
            alt: img?.alt || "",
        })) : [],
        focus_keyword: undefined,
        gsc_data: gscKeywords || undefined,
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-4"
        >
            {/* SECTION 1: Score Overview with Gauges */}
            <Card className={theme.container}>
                <div className={theme.glassReflection} />
                <div className={theme.gradientAccent} />

                <CardHeader className="pb-4 border-b border-border/10 mb-2 px-5 bg-muted/20 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className={theme.iconContainer}>
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                                Visibilité Web
                            </p>
                            <h3 className="text-sm font-extrabold tracking-tight text-foreground">
                                Score SEO Produit
                            </h3>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-5 relative z-10">
                    <ScoreOverview
                        overallScore={overallScore}
                        fieldScores={fieldScores}
                        issues={issues}
                        isAnalyzing={isAnalyzing}
                    />
                </CardContent>
            </Card>

            {/* SECTION 2: SERP Preview */}
            <SerpPreviewSection
                theme={theme}
                previewTitle={previewTitle}
                previewDesc={previewDesc}
                slug={slug}
                isDraft={isDraft}
                domain={domain}
                favicon={favicon}
            />

            {/* SECTION 3: Field Editors */}
            <SeoFieldEditorsSection
                theme={theme}
                fieldScores={fieldScores}
                isDirtyField={isDirtyField}
                hasDraft={hasDraft}
                openSuggestionModal={openSuggestionModal}
                handleAISuggest={handleAISuggest}
                domain={domain}
            />

            {/* SECTION 4: Non-text criteria */}
            <Card className={theme.container}>
                <div className={theme.glassReflection} />
                <CardContent className="p-5 relative z-10 space-y-4">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Critères complémentaires
                    </h3>
                    <NonTextCriteria fieldScores={fieldScores} />
                    <p className="text-[11px] text-muted-foreground">
                        Ces critères sont calculés automatiquement à partir du contenu produit.
                    </p>
                </CardContent>
            </Card>

            {/* SECTION 5: GSC Keywords */}
            <GscKeywordsPanel
                pageUrl={permalink}
                onSetFocusKeyword={(keyword) => {
                    setValue("focus_keyword" as any, keyword, { shouldDirty: true });
                }}
            />

            {/* Gemini AI Coaching Modal */}
            <SeoAISuggestionModal
                open={coachingOpen}
                onOpenChange={setCoachingOpen}
                field={coachingField}
                fieldLabel={coachingFieldLabel}
                currentValue={coachingField === "meta_title" ? metaTitle : coachingField === "meta_description" ? metaDescription : coachingField === "slug" ? slug : ""}
                productInput={productSeoInput}
                onApply={handleApplyCoachingSuggestion}
                storeName={selectedStore?.name}
                gscKeywords={gscKeywords?.slice(0, 10)?.map(kw => ({
                    query: kw.query,
                    impressions: kw.impressions,
                    position: kw.position,
                }))}
            />

            {/* Draft AI Suggestion Modal for SEO fields */}
            {modalField && contentBuffer?.draft_generated_content && (
                <AISuggestionModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    productTitle={productTitle || "Sans titre"}
                    field={modalField === "seo.title" ? "Titre SEO" : "Meta-description"}
                    currentValue={getModalCurrentValue(modalField)}
                    suggestedValue={getModalSuggestedValue(modalField)}
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
