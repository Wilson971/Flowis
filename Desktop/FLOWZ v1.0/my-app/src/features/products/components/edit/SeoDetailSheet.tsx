"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    CircleAlert,
    AlertTriangle,
    Sparkles,
    Check,
    X,
    Loader2,
    RotateCcw,
} from "lucide-react";
import { cn, stripHtml } from "@/lib/utils";
import { useProductEditContext } from "../../context/ProductEditContext";
import { getSeoLevel } from "@/lib/seo/constants";
import { getScoreBadgeStyle } from "@/lib/seo/scoreColors";
import { calculateProductSeoScore } from "@/lib/seo/analyzer";
import type { SeoFieldType, SeoIssue, ProductSeoInput } from "@/types/seo";
import type { ProductFormValues } from "../../schemas/product-schema";

// ============================================================================
// CONSTANTS
// ============================================================================

const FIELD_LABELS: Record<string, string> = {
    title: "Titre",
    short_description: "Description courte",
    description: "Description longue",
    meta_title: "Meta titre",
    meta_description: "Meta description",
    slug: "URL (slug)",
    images: "Images",
    alt_text: "Texte alternatif",
    keyword_presence: "Mot-cle principal",
    cta_detection: "Appel a l'action",
    gsc_traffic_signal: "Signal trafic GSC",
};

const BASE_FIELDS: SeoFieldType[] = [
    "meta_title",
    "meta_description",
    "title",
    "short_description",
    "description",
    "slug",
    "images",
    "alt_text",
];

const FIELD_DOM_ID: Partial<Record<SeoFieldType, string>> = {
    title: "field-title",
    short_description: "field-short-description",
    description: "field-description",
    meta_title: "field-meta-title",
    meta_description: "field-meta-description",
    slug: "field-slug",
    images: "field-images",
    alt_text: "field-images",
};

/** Fields that can be auto-fixed via /api/seo/suggest */
const FIXABLE_FIELDS: SeoFieldType[] = [
    "meta_title",
    "meta_description",
    "title",
    "short_description",
    "description",
    "slug",
    "cta_detection",
];

const isFixable = (field: SeoFieldType) => FIXABLE_FIELDS.includes(field);

/** Map issue field → API field param */
const getApiField = (field: SeoFieldType): string =>
    field === "cta_detection" ? "meta_description" : field;

/** Map issue field → form field for setValue */
const getFormField = (field: SeoFieldType): keyof ProductFormValues | null => {
    if (field === "cta_detection") return "meta_description";
    const validFields: SeoFieldType[] = ["meta_title", "meta_description", "title", "short_description", "description", "slug"];
    return validFields.includes(field) ? (field as keyof ProductFormValues) : null;
};

// ============================================================================
// TYPES
// ============================================================================

type Suggestion = { text: string; rationale: string };

type IssueSuggestionState = {
    status: "idle" | "loading" | "loaded" | "accepted" | "error";
    suggestions?: Suggestion[];
    selectedIndex?: number;
    error?: string;
};

// ============================================================================
// COMPONENT
// ============================================================================

interface SeoDetailSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const SeoDetailSheet = ({ open, onOpenChange }: SeoDetailSheetProps) => {
    const { seoAnalysis, selectedStore } = useProductEditContext();
    const { getValues, setValue } = useFormContext<ProductFormValues>();

    const [suggestionStates, setSuggestionStates] = useState<Record<string, IssueSuggestionState>>({});
    const [isBatchFixing, setIsBatchFixing] = useState(false);

    const { overallScore, fieldScores, issues } = seoAnalysis || {
        overallScore: 0,
        fieldScores: {} as Record<string, number>,
        issues: [] as SeoIssue[],
    };

    const sortedIssues = useMemo(
        () =>
            [...issues]
                .filter((i) => i.severity === "critical" || i.severity === "warning")
                .sort((a, b) => {
                    if (a.severity === "critical" && b.severity !== "critical") return -1;
                    if (a.severity !== "critical" && b.severity === "critical") return 1;
                    return 0;
                }),
        [issues]
    );

    const fixableIssues = useMemo(
        () => sortedIssues.filter((i) => isFixable(i.field)),
        [sortedIssues]
    );

    // ─── Helpers ──────────────────────────────────────────────

    const buildProductSeoInput = useCallback(
        (overrides?: Partial<Record<string, string>>): ProductSeoInput => {
            const images = getValues("images") || [];
            return {
                title: overrides?.title ?? (getValues("title") || ""),
                meta_title: overrides?.meta_title ?? (getValues("meta_title") || ""),
                meta_description: overrides?.meta_description ?? (getValues("meta_description") || ""),
                short_description: stripHtml(overrides?.short_description ?? (getValues("short_description") || "")),
                description: stripHtml(overrides?.description ?? (getValues("description") || "")),
                slug: overrides?.slug ?? (getValues("slug") || ""),
                images: Array.isArray(images)
                    ? images.map((img: any) => ({ src: img?.src || img?.url || "", alt: img?.alt || "" }))
                    : [],
            };
        },
        [getValues]
    );

    const getProjectedFieldScore = useCallback(
        (field: SeoFieldType, suggestionText: string): number => {
            const formField = getApiField(field);
            const input = buildProductSeoInput({ [formField]: suggestionText });
            const result = calculateProductSeoScore(input);
            return result.fieldScores[formField] ?? 0;
        },
        [buildProductSeoInput]
    );

    // ─── Actions ──────────────────────────────────────────────

    const scrollToField = useCallback(
        (field: SeoFieldType) => {
            onOpenChange(false);
            setTimeout(() => {
                const domId = FIELD_DOM_ID[field];
                if (!domId) return;
                const el = document.getElementById(domId);
                if (!el) return;
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.add("ring-2", "ring-primary", "ring-offset-2", "transition-shadow", "duration-300");
                setTimeout(() => {
                    el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "transition-shadow", "duration-300");
                }, 1500);
            }, 300);
        },
        [onOpenChange]
    );

    const fetchSuggestion = useCallback(
        async (field: SeoFieldType) => {
            setSuggestionStates((prev) => ({ ...prev, [field]: { status: "loading" } }));

            const apiField = getApiField(field);
            const currentValue = String(getValues(apiField as keyof ProductFormValues) || "");
            const productTitle = getValues("title") || "";
            const description = stripHtml(String(getValues("description") || ""));

            try {
                const res = await fetch("/api/seo/suggest", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        field: apiField,
                        current_value: currentValue,
                        product_title: productTitle,
                        product_description: description.substring(0, 500),
                        store_name: selectedStore?.name,
                    }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || `HTTP ${res.status}`);
                }

                const data = await res.json();
                setSuggestionStates((prev) => ({
                    ...prev,
                    [field]: { status: "loaded", suggestions: data.suggestions, selectedIndex: 0 },
                }));
            } catch (err: any) {
                setSuggestionStates((prev) => ({
                    ...prev,
                    [field]: { status: "error", error: err.message || "Erreur de generation" },
                }));
            }
        },
        [getValues, selectedStore]
    );

    const fixAll = useCallback(async () => {
        setIsBatchFixing(true);
        const uniqueFields = [...new Set(fixableIssues.map((i) => i.field))];
        await Promise.allSettled(uniqueFields.map((field) => fetchSuggestion(field)));
        setIsBatchFixing(false);
    }, [fixableIssues, fetchSuggestion]);

    const acceptSuggestion = useCallback(
        (field: SeoFieldType) => {
            const state = suggestionStates[field];
            if (!state?.suggestions || state.selectedIndex === undefined) return;

            const suggestion = state.suggestions[state.selectedIndex];
            const formField = getFormField(field);
            if (!formField) return;

            setValue(formField, suggestion.text, { shouldDirty: true });
            setSuggestionStates((prev) => ({
                ...prev,
                [field]: { ...prev[field], status: "accepted" },
            }));
        },
        [suggestionStates, setValue]
    );

    const rejectSuggestion = useCallback((field: SeoFieldType) => {
        setSuggestionStates((prev) => ({ ...prev, [field]: { status: "idle" } }));
    }, []);

    const selectSuggestion = useCallback((field: SeoFieldType, index: number) => {
        setSuggestionStates((prev) => ({
            ...prev,
            [field]: { ...prev[field], selectedIndex: index },
        }));
    }, []);

    // ─── Render ───────────────────────────────────────────────

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[440px] sm:max-w-[440px] p-0 flex flex-col">
                {/* Header */}
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/30 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <SheetTitle className="text-[15px] font-semibold tracking-tight">
                                Analyse SEO detaillee
                            </SheetTitle>
                            <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                                Score par champ et recommandations
                            </SheetDescription>
                        </div>
                        {(() => {
                            const badgeStyle = getScoreBadgeStyle(overallScore);
                            return (
                                <span
                                    className={cn(
                                        "text-xs font-semibold tabular-nums px-2.5 py-1 rounded-lg border",
                                        badgeStyle.text,
                                        badgeStyle.bg,
                                        badgeStyle.border
                                    )}
                                >
                                    {overallScore}/100
                                </span>
                            );
                        })()}
                    </div>
                </SheetHeader>

                {/* Scrollable content */}
                <ScrollArea className="flex-1 min-h-0">
                    <div className="px-6 py-6 space-y-6">
                        {/* Fix All Button */}
                        {fixableIssues.length > 0 && (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-9 gap-2 text-[12px] font-semibold border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                                onClick={fixAll}
                                disabled={isBatchFixing}
                            >
                                {isBatchFixing ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Sparkles className="h-3.5 w-3.5" />
                                )}
                                {isBatchFixing
                                    ? "Generation en cours..."
                                    : `Tout corriger avec l'IA (${fixableIssues.length})`}
                            </Button>
                        )}

                        {/* Section 1: Score per field */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                                Score par champ
                            </h4>
                            <div className="space-y-3">
                                {BASE_FIELDS.map((field) => {
                                    const score = fieldScores[field] ?? 0;
                                    const level = getSeoLevel(score);

                                    return (
                                        <div key={field} className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[13px] font-medium text-foreground">
                                                    {FIELD_LABELS[field] || field}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-medium tabular-nums text-muted-foreground/60">
                                                        {score}/100
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded",
                                                            level.textColor,
                                                            `${level.bgColor}/10`
                                                        )}
                                                    >
                                                        {level.label}
                                                    </span>
                                                </div>
                                            </div>
                                            <Progress
                                                value={score}
                                                className="h-1.5 bg-muted/40 rounded-full"
                                                indicatorClassName={cn(
                                                    "rounded-full transition-all duration-500",
                                                    score >= 70
                                                        ? "bg-success"
                                                        : score >= 50
                                                            ? "bg-amber-500"
                                                            : score >= 30
                                                                ? "bg-orange-500"
                                                                : "bg-red-500"
                                                )}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section 2: Issues */}
                        {sortedIssues.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                                    Problemes a corriger
                                </h4>
                                <div className="space-y-3">
                                    {sortedIssues.map((issue, index) => (
                                        <IssueCard
                                            key={`${issue.field}-${index}`}
                                            issue={issue}
                                            state={suggestionStates[issue.field] || { status: "idle" }}
                                            fieldScore={fieldScores[issue.field] ?? 0}
                                            onFix={() => fetchSuggestion(issue.field)}
                                            onAccept={() => acceptSuggestion(issue.field)}
                                            onReject={() => rejectSuggestion(issue.field)}
                                            onSelect={(i) => selectSuggestion(issue.field, i)}
                                            onScrollToField={() => scrollToField(issue.field)}
                                            getProjectedScore={(text) => getProjectedFieldScore(issue.field, text)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty state */}
                        {sortedIssues.length === 0 && overallScore > 0 && (
                            <div className="text-center py-6">
                                <p className="text-sm font-medium text-success">Excellent travail !</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Votre fiche produit est bien optimisee.
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};

// ============================================================================
// ISSUE CARD SUB-COMPONENT
// ============================================================================

interface IssueCardProps {
    issue: SeoIssue;
    state: IssueSuggestionState;
    fieldScore: number;
    onFix: () => void;
    onAccept: () => void;
    onReject: () => void;
    onSelect: (index: number) => void;
    onScrollToField: () => void;
    getProjectedScore: (text: string) => number;
}

const IssueCard = ({
    issue,
    state,
    fieldScore,
    onFix,
    onAccept,
    onReject,
    onSelect,
    onScrollToField,
    getProjectedScore,
}: IssueCardProps) => {
    const isCritical = issue.severity === "critical";
    const hasScrollTarget = !!FIELD_DOM_ID[issue.field];
    const canFix = isFixable(issue.field);

    // ─── Accepted state ───────────────────────────────────
    if (state.status === "accepted") {
        return (
            <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    <p className="text-[13px] font-semibold tracking-tight text-success">
                        {FIELD_LABELS[issue.field] || issue.field}
                    </p>
                    <span className="ml-auto text-[11px] font-medium tabular-nums text-success">
                        Correction appliquee
                    </span>
                </div>
            </div>
        );
    }

    // ─── Loading state ────────────────────────────────────
    if (state.status === "loading") {
        return (
            <div
                className={cn(
                    "rounded-xl border p-4 space-y-3",
                    isCritical ? "border-destructive/20 bg-destructive/5" : "border-warning/20 bg-warning/5"
                )}
            >
                <div className="flex items-start gap-2">
                    {isCritical ? (
                        <CircleAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    ) : (
                        <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    )}
                    <p
                        className={cn(
                            "text-[13px] font-semibold tracking-tight",
                            isCritical ? "text-destructive" : "text-warning"
                        )}
                    >
                        {issue.title}
                    </p>
                </div>
                <div className="flex items-center gap-2 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Generation des suggestions...</span>
                </div>
            </div>
        );
    }

    // ─── Loaded state (suggestions preview) ───────────────
    if (state.status === "loaded" && state.suggestions) {
        return (
            <div
                className={cn(
                    "rounded-xl border p-4 space-y-3",
                    isCritical ? "border-destructive/20 bg-destructive/5" : "border-warning/20 bg-warning/5"
                )}
            >
                <div className="flex items-start gap-2">
                    {isCritical ? (
                        <CircleAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    ) : (
                        <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    )}
                    <p
                        className={cn(
                            "text-[13px] font-semibold tracking-tight",
                            isCritical ? "text-destructive" : "text-warning"
                        )}
                    >
                        {issue.title}
                    </p>
                </div>

                <p className="text-[11px] font-medium text-muted-foreground">
                    Choisissez une suggestion :
                </p>

                <div className="space-y-2">
                    {state.suggestions.map((suggestion, i) => {
                        const isSelected = state.selectedIndex === i;
                        const projected = getProjectedScore(suggestion.text);
                        const delta = projected - fieldScore;

                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => onSelect(i)}
                                className={cn(
                                    "w-full text-left rounded-lg border p-3 transition-colors cursor-pointer",
                                    isSelected
                                        ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                                        : "border-border/30 bg-background/50 hover:border-border/60"
                                )}
                            >
                                <p className="text-[12px] font-medium text-foreground leading-relaxed">
                                    &ldquo;{suggestion.text}&rdquo;
                                </p>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                                        Score projete: {projected}/100
                                    </span>
                                    {delta > 0 && (
                                        <span className="text-[10px] font-semibold tabular-nums text-success">
                                            +{delta}
                                        </span>
                                    )}
                                </div>
                                {suggestion.rationale && (
                                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                                        {suggestion.rationale}
                                    </p>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Accept / Reject */}
                <div className="flex gap-2">
                    <Button
                        type="button"
                        size="sm"
                        className="flex-1 h-7 text-[11px] font-semibold gap-1.5 bg-success hover:bg-success/90 text-white"
                        onClick={onAccept}
                    >
                        <Check className="h-3 w-3" />
                        Accepter
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px] font-semibold gap-1.5 text-muted-foreground hover:text-foreground"
                        onClick={onReject}
                    >
                        <X className="h-3 w-3" />
                        Rejeter
                    </Button>
                </div>
            </div>
        );
    }

    // ─── Error state ──────────────────────────────────────
    if (state.status === "error") {
        return (
            <div
                className={cn(
                    "rounded-xl border p-4 space-y-2",
                    isCritical ? "border-destructive/20 bg-destructive/5" : "border-warning/20 bg-warning/5"
                )}
            >
                <div className="flex items-start gap-2">
                    {isCritical ? (
                        <CircleAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    ) : (
                        <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                        <p
                            className={cn(
                                "text-[13px] font-semibold tracking-tight",
                                isCritical ? "text-destructive" : "text-warning"
                            )}
                        >
                            {issue.title}
                        </p>
                        <p className="text-xs text-destructive/70 mt-0.5">{state.error}</p>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-[11px] font-semibold gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={onFix}
                >
                    <RotateCcw className="h-3 w-3" />
                    Reessayer
                </Button>
            </div>
        );
    }

    // ─── Idle state (default) ─────────────────────────────
    return (
        <div
            className={cn(
                "rounded-xl border p-4 space-y-2",
                isCritical ? "border-destructive/20 bg-destructive/5" : "border-warning/20 bg-warning/5"
            )}
        >
            {/* Issue header */}
            <div className="flex items-start gap-2">
                {isCritical ? (
                    <CircleAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                ) : (
                    <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                    <p
                        className={cn(
                            "text-[13px] font-semibold tracking-tight",
                            isCritical ? "text-destructive" : "text-warning"
                        )}
                    >
                        {issue.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {issue.description}
                    </p>
                    {issue.recommendation && (
                        <p className="text-xs text-foreground/70 mt-1.5 leading-relaxed">
                            {issue.recommendation}
                        </p>
                    )}
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
                {canFix && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-7 text-[11px] font-semibold gap-1.5 text-primary hover:bg-primary/10 hover:text-primary"
                        onClick={onFix}
                    >
                        <Sparkles className="h-3 w-3" />
                        Corriger avec l&apos;IA
                    </Button>
                )}
                {hasScrollTarget && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "h-7 text-[11px] font-semibold gap-1.5 group/btn",
                            canFix ? "text-muted-foreground hover:text-foreground" : "flex-1",
                            !canFix && (isCritical
                                ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                                : "text-warning hover:bg-warning/10 hover:text-warning")
                        )}
                        onClick={onScrollToField}
                    >
                        Voir le champ
                        <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                    </Button>
                )}
            </div>
        </div>
    );
};
