/**
 * useSeoAnalysis (feature-scoped)
 * Reactive client-side SEO analysis driven by React Hook Form control.
 * Uses the unified calculateProductSeoScore engine from lib/seo/analyzer.
 * Returns { analysisData: SeoAnalysisData, runServerAnalysis: () => Promise<void> }
 * to match the contract expected by ProductEditorContainer & ProductEditContext.
 */
"use client";

import { useMemo, useState, useCallback } from "react";
import { Control, useWatch } from "react-hook-form";
import { ProductFormValues } from "../schemas/product-schema";
import type { SeoAnalysisData } from "@/types/seo";
import { calculateProductSeoScore } from "@/lib/seo/analyzer";

// ============================================================================
// TYPES
// ============================================================================

export interface UseSeoAnalysisProps {
    control: Control<ProductFormValues>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useSeoAnalysis({ control }: UseSeoAnalysisProps): {
    analysisData: SeoAnalysisData;
    runServerAnalysis: () => Promise<void>;
} {
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Watch all relevant fields reactively
    const title = useWatch({ control, name: "title" }) ?? "";
    const shortDescription = useWatch({ control, name: "short_description" }) ?? "";
    const description = useWatch({ control, name: "description" }) ?? "";
    const metaTitle = useWatch({ control, name: "meta_title" }) ?? "";
    const metaDescription = useWatch({ control, name: "meta_description" }) ?? "";
    const slug = useWatch({ control, name: "slug" }) ?? "";
    const images = useWatch({ control, name: "images" }) ?? [];

    const analysisData = useMemo<Omit<SeoAnalysisData, "isAnalyzing">>(() => {
        const result = calculateProductSeoScore({
            title,
            short_description: shortDescription,
            description,
            meta_title: metaTitle,
            meta_description: metaDescription,
            slug,
            images: Array.isArray(images)
                ? images.map((img: { src?: string; alt?: string }) => ({
                    src: img.src,
                    alt: img.alt,
                }))
                : [],
        });

        // Sanitize scores — division edge cases in the analyzer can produce NaN
        const safeNum = (n: number) => Number.isFinite(n) ? n : 0;
        const safeFieldScores: Record<string, number> = {};
        for (const [k, v] of Object.entries(result.fieldScores)) {
            safeFieldScores[k] = safeNum(v);
        }

        return {
            overallScore: safeNum(result.overall),
            fieldScores: safeFieldScores,
            issues: result.issues,
        };
    }, [title, shortDescription, description, metaTitle, metaDescription, slug, images]);

    /**
     * Trigger a "re-analysis" (client-side only).
     * Shows a brief loading state to give feedback to the user.
     */
    const runServerAnalysis = useCallback(async (): Promise<void> => {
        setIsAnalyzing(true);
        await new Promise<void>((resolve) => setTimeout(resolve, 600));
        setIsAnalyzing(false);
    }, []);

    return {
        analysisData: { ...analysisData, isAnalyzing },
        runServerAnalysis,
    };
}
