"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SeoFieldEditor } from "@/components/seo/SeoFieldEditor";
import { FieldStatusBadge } from "@/components/products/FieldStatusBadge";
import { DraftSuggestionButton } from "@/components/products/ui/DraftSuggestionButton";
import { ProductFormValues } from "../../../hooks/useProductForm";
import { SlugFieldSection } from "./SlugField";

export const SeoFieldEditorsSection = ({
    theme,
    fieldScores,
    isDirtyField,
    hasDraft,
    openSuggestionModal,
    handleAISuggest,
    domain,
}: {
    theme: { container: string; glassReflection: string };
    fieldScores: Record<string, number>;
    isDirtyField: (field: string) => boolean | undefined;
    hasDraft: (field: string) => boolean;
    openSuggestionModal: (field: string) => void;
    handleAISuggest: (fieldName: string) => void;
    domain: string;
}) => {
    const { control } = useFormContext<ProductFormValues>();

    const renderFieldActions = (field: string) => (
        <DraftSuggestionButton field={field} hasDraft={hasDraft(field)} onOpen={openSuggestionModal} />
    );

    return (
        <Card className={theme.container}>
            <div className={theme.glassReflection} />
            <CardContent className="p-5 relative z-10 space-y-6">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Champs SEO
                </h3>

                {/* Meta Title */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <Label className="flex items-center gap-1.5">
                            Meta Titre
                            <FieldStatusBadge hasDraft={hasDraft("seo.title")} isDirty={isDirtyField("meta_title") || isDirtyField("seo.title")} />
                        </Label>
                        {renderFieldActions("seo.title")}
                    </div>
                    <Controller
                        name="meta_title"
                        control={control}
                        render={({ field }) => (
                            <SeoFieldEditor
                                id="meta_title"
                                label=""
                                value={field.value || ""}
                                onChange={field.onChange}
                                idealLength={55}
                                score={fieldScores['meta_title']}
                                placeholder="Titre optimisé pour Google (50-60 caractères)..."
                                helperText="Le titre bleu cliquable dans les résultats de recherche."
                                onAISuggest={(fieldScores['meta_title'] ?? 0) < 60 ? () => handleAISuggest("meta_title") : undefined}
                            />
                        )}
                    />
                </div>

                {/* Meta Description */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <Label className="flex items-center gap-1.5">
                            Meta Description
                            <FieldStatusBadge hasDraft={hasDraft("seo.description")} isDirty={isDirtyField("meta_description") || isDirtyField("seo.description")} />
                        </Label>
                        {renderFieldActions("seo.description")}
                    </div>
                    <Controller
                        name="meta_description"
                        control={control}
                        render={({ field }) => (
                            <SeoFieldEditor
                                id="meta_description"
                                label=""
                                value={field.value || ""}
                                onChange={field.onChange}
                                idealLength={145}
                                multiline
                                score={fieldScores['meta_description']}
                                placeholder="Description courte et attractive (130-160 caractères)..."
                                helperText="Le texte gris sous le titre. Incluez un appel à l'action."
                                onAISuggest={(fieldScores['meta_description'] ?? 0) < 60 ? () => handleAISuggest("meta_description") : undefined}
                            />
                        )}
                    />
                </div>

                {/* Slug URL */}
                <SlugFieldSection isDirtyField={isDirtyField} domain={domain} />
            </CardContent>
        </Card>
    );
};
