
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Control, useFormContext, useWatch } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import {
    calculateWordCount,
    detectKeyword,
    calculateKeywordDensity,
    calculateScoreFromThresholds
} from '@/lib/seo/analyzer';
import { OPTIMAL_LENGTHS, FIELD_WEIGHTS } from '@/lib/seo/constants';
import { SeoAnalysisData, SeoFieldType, SeoIssue } from '@/types/seo';
import { ProductFormValues } from '../schemas/product-schema';

interface UseSeoAnalysisProps {
    control?: Control<ProductFormValues>;
}

export const useSeoAnalysis = ({ control: propsControl }: UseSeoAnalysisProps = {}) => {
    const supabase = createClient();
    const formContext = useFormContext<ProductFormValues>();
    // Use provided control OR fallback to context. Context might be null if used outside FormProvider.
    const control = propsControl || formContext?.control;

    // Watch all relevant fields
    const title = useWatch({ control, name: 'title' }) || "";
    const description = useWatch({ control, name: 'description' }) || "";
    const shortDescription = useWatch({ control, name: 'short_description' }) || "";
    const metaTitle = useWatch({ control, name: 'meta_title' }) || "";
    const metaDescription = useWatch({ control, name: 'meta_description' }) || "";
    const slug = useWatch({ control, name: 'slug' }) || "";

    // State for server-side analysis (mocked or real)
    const [serverAnalysis, setServerAnalysis] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // 1. Client-Side Immediate Analysis
    const clientAnalysis = useMemo(() => {
        const issues: SeoIssue[] = [];
        const fieldScores: Record<string, number> = {};

        // --- Title Analysis ---
        const titleLen = title.length;
        let titleScore = calculateScoreFromThresholds(titleLen, OPTIMAL_LENGTHS.title);
        fieldScores['title'] = titleScore;

        if (titleLen === 0) {
            issues.push({
                field: 'title', severity: 'critical', title: 'Titre manquant',
                description: 'Le titre est obligatoire.', score: 0
            });
        } else if (titleLen < OPTIMAL_LENGTHS.title.acceptable_min) {
            issues.push({
                field: 'title', severity: 'warning', title: 'Titre trop court',
                description: `Le titre fait ${titleLen} caractères (min: ${OPTIMAL_LENGTHS.title.acceptable_min}).`, score: titleScore
            });
        }

        // --- Meta Title Analysis (No Fallback to Title for scoring) ---
        const metaTitleLen = metaTitle.length;
        let metaTitleScore = calculateScoreFromThresholds(metaTitleLen, OPTIMAL_LENGTHS.meta_title);
        fieldScores['meta_title'] = metaTitleScore;

        // --- Description Analysis ---
        const descWordCount = calculateWordCount(description);
        let descScore = calculateScoreFromThresholds(descWordCount, {
            min: OPTIMAL_LENGTHS.description.min_words,
            optimal: OPTIMAL_LENGTHS.description.optimal_words,
            max: OPTIMAL_LENGTHS.description.max_words
        });
        fieldScores['description'] = descScore; // Keep for Product Description field

        // --- Meta Description Analysis (Specific) ---
        const metaDescLen = metaDescription.length;
        let metaDescScore = calculateScoreFromThresholds(metaDescLen, OPTIMAL_LENGTHS.meta_description);
        fieldScores['meta_description'] = metaDescScore; // Specific score for Meta Desc

        if (descWordCount < 50) {
            issues.push({
                field: 'description', severity: 'warning', title: 'Description courte',
                description: 'La description est très succincte.', score: descScore
            });
        }

        // --- Calculate Overall Score (Client Estimate) ---
        // Weighted average
        let totalWeight = 0;
        let weightedSum = 0;

        // Helper to add to sum
        const addScore = (field: SeoFieldType, score: number) => {
            weightedSum += score * FIELD_WEIGHTS[field];
            totalWeight += FIELD_WEIGHTS[field];
        };

        addScore('title', titleScore);
        addScore('meta_title', metaTitleScore);
        addScore('description', descScore);
        addScore('meta_description', metaDescScore);
        // Add defaults for others to avoid skewing too much
        addScore('slug', slug ? 80 : 0);

        const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

        return {
            overallScore,
            fieldScores,
            issues
        };
    }, [title, description, shortDescription, metaTitle, metaDescription, slug]);

    // 2. Server-Side Analysis Trigger
    const runServerAnalysis = useCallback(async () => {
        setIsAnalyzing(true);
        try {
            // DISABLED: Edge Function deployment failed due to permissions. 
            // We rely on client-side analysis for now.

            // Artificial delay to simulate network request
            await new Promise(resolve => setTimeout(resolve, 800));

            /* 
            const { data, error } = await supabase.functions.invoke('seo-analyzer', {
                body: {
                    override_content: { title, description, meta_title: metaTitle, meta_description: metaDescription },
                    fields: ['title', 'description']
                }
            });

            if (error) throw error;
            setServerAnalysis(data);
            */

            console.warn("Server-side analysis is disabled (Edge Function not deployed). Using client-side analysis.");
        } catch (err) {
            console.error("Server analysis failed.", err);
        } finally {
            setIsAnalyzing(false);
        }
    }, [title, description, metaTitle, metaDescription]);

    // Debounce effect for server analysis (optional - for now we might trigger it on demand or blur, 
    // but let's just leave it manual or on specific events to avoid spamming the failed endpoint)
    // useEffect(() => {
    //   const timer = setTimeout(runServerAnalysis, 2000);
    //   return () => clearTimeout(timer);
    // }, [runServerAnalysis]);


    // 3. Merge Data (Prioritize Server if available, else Client)
    const analysisData: SeoAnalysisData = useMemo(() => {
        if (serverAnalysis && serverAnalysis.success) {
            return {
                overallScore: serverAnalysis.score,
                fieldScores: { ...clientAnalysis.fieldScores, ...serverAnalysis.fieldScores },
                issues: [...clientAnalysis.issues, ...(serverAnalysis.issues || [])], // Merge or replace
                isAnalyzing
            };
        }
        return {
            ...clientAnalysis,
            isAnalyzing
        };
    }, [clientAnalysis, serverAnalysis, isAnalyzing]);

    return {
        analysisData,
        runServerAnalysis
    };
};
