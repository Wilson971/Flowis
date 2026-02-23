"use client";

import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sparkles, Check, X, RefreshCw, ArrowRight } from "lucide-react";
import { calculateProductSeoScore } from "@/lib/seo/analyzer";
import { getScoreColorConfig, getScoreLabel } from "@/lib/seo/scoreColors";
import { SeoScoreGauge } from "./SeoScoreGauge";
import type { ProductSeoInput } from "@/types/seo";

// ============================================================================
// Types
// ============================================================================

interface Suggestion {
    text: string;
    rationale: string;
}

interface SeoAISuggestionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    field: string;
    fieldLabel: string;
    currentValue: string;
    productInput: ProductSeoInput;
    onApply: (value: string) => void;
    storeName?: string;
    gscKeywords?: Array<{ query: string; impressions: number; position: number }>;
}

// ============================================================================
// Rate limit (localStorage, max 10 per product per day)
// ============================================================================

const RATE_LIMIT_KEY = "flowz_seo_ai_usage";
const MAX_DAILY_REQUESTS = 50;

function checkRateLimit(productId?: string): boolean {
    try {
        const raw = localStorage.getItem(RATE_LIMIT_KEY);
        if (!raw) return true;
        const data = JSON.parse(raw);
        const today = new Date().toISOString().slice(0, 10);
        const key = `${productId || "global"}_${today}`;
        return (data[key] || 0) < MAX_DAILY_REQUESTS;
    } catch {
        return true;
    }
}

function incrementRateLimit(productId?: string) {
    try {
        const raw = localStorage.getItem(RATE_LIMIT_KEY);
        const data = raw ? JSON.parse(raw) : {};
        const today = new Date().toISOString().slice(0, 10);
        const key = `${productId || "global"}_${today}`;
        data[key] = (data[key] || 0) + 1;
        // Clean old entries
        for (const k of Object.keys(data)) {
            if (!k.endsWith(today)) delete data[k];
        }
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
    } catch {
        // Silently fail
    }
}

// ============================================================================
// Component
// ============================================================================

export function SeoAISuggestionModal({
    open,
    onOpenChange,
    field,
    fieldLabel,
    currentValue,
    productInput,
    onApply,
    storeName,
    gscKeywords,
}: SeoAISuggestionModalProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // Calculate current score
    const currentResult = calculateProductSeoScore(productInput);
    const currentFieldScore = currentResult.fieldScores[field] ?? 0;

    // Calculate projected score for a suggestion
    const getProjectedScore = useCallback((suggestionText: string) => {
        const modifiedInput = { ...productInput, [field]: suggestionText };
        const result = calculateProductSeoScore(modifiedInput);
        return {
            overall: result.overall,
            fieldScore: result.fieldScores[field] ?? 0,
        };
    }, [productInput, field]);

    const fetchSuggestions = useCallback(async () => {
        if (!checkRateLimit()) {
            setError("Limite quotidienne atteinte (10 suggestions/jour). Réessayez demain.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuggestions([]);
        setSelectedIndex(null);

        try {
            const payload = {
                field,
                current_value: currentValue ?? "",
                product_title: productInput.title || "",
                product_description: productInput.description?.substring(0, 500) || "",
                focus_keyword: productInput.focus_keyword || "",
                store_name: storeName || "",
                gsc_keywords: (gscKeywords || []).filter(kw => kw.query),
            };


            const res = await fetch("/api/seo/suggest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                console.error("[SeoAISuggestionModal] API error:", data);
                const details = data.details?.length ? ` (${data.details.join(', ')})` : '';
                throw new Error((data.error || `Erreur ${res.status}`) + details);
            }

            const data = await res.json();
            setSuggestions(data.suggestions || []);
            incrementRateLimit();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue");
        } finally {
            setIsLoading(false);
        }
    }, [field, currentValue, productInput]);

    // Auto-fetch on open
    React.useEffect(() => {
        if (open && suggestions.length === 0 && !isLoading && !error) {
            fetchSuggestions();
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // Reset on close
    React.useEffect(() => {
        if (!open) {
            setSuggestions([]);
            setError(null);
            setSelectedIndex(null);
        }
    }, [open]);

    const handleApply = () => {
        if (selectedIndex !== null && suggestions[selectedIndex]) {
            onApply(suggestions[selectedIndex].text);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Coaching IA — {fieldLabel}
                    </DialogTitle>
                    <DialogDescription>
                        Suggestions optimisées par l&apos;IA pour améliorer votre score SEO.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    {/* Current value + score */}
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/10 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Valeur actuelle</span>
                            <div className="flex items-center gap-2">
                                <SeoScoreGauge score={currentFieldScore} size="sm" />
                                <span className={cn("text-xs font-bold", getScoreColorConfig(currentFieldScore).text)}>
                                    {Math.round(currentFieldScore)}/100
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-foreground break-words">
                            {currentValue || <span className="text-muted-foreground italic">Vide</span>}
                        </p>
                    </div>

                    {/* Loading skeleton */}
                    {isLoading && (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-3 rounded-xl bg-muted/20 border border-border/10 animate-pulse">
                                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-muted rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/10 text-sm text-destructive">
                            {error}
                            <Button variant="ghost" size="sm" className="ml-2 h-6 text-xs" onClick={fetchSuggestions}>
                                <RefreshCw className="h-3 w-3 mr-1" /> Réessayer
                            </Button>
                        </div>
                    )}

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                        <div className="space-y-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Suggestions IA
                            </span>
                            {suggestions.map((s, i) => {
                                const projected = getProjectedScore(s.text);
                                const projectedCfg = getScoreColorConfig(projected.fieldScore);
                                const isSelected = selectedIndex === i;
                                const scoreDiff = projected.fieldScore - currentFieldScore;

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedIndex(i)}
                                        className={cn(
                                            "w-full text-left p-3 rounded-xl border transition-all duration-200",
                                            isSelected
                                                ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                                                : "bg-muted/10 border-border/10 hover:bg-muted/20 hover:border-border/30"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground break-words">{s.text}</p>
                                                <p className="text-[11px] text-muted-foreground mt-1">{s.rationale}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <div className="flex items-center gap-1.5">
                                                    <SeoScoreGauge score={projected.fieldScore} size="sm" />
                                                    <span className={cn("text-xs font-bold", projectedCfg.text)}>
                                                        {Math.round(projected.fieldScore)}
                                                    </span>
                                                </div>
                                                {scoreDiff > 0 && (
                                                    <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                        +{Math.round(scoreDiff)}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/10">
                        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                            <X className="h-3.5 w-3.5 mr-1.5" />
                            Ignorer
                        </Button>
                        <div className="flex items-center gap-2">
                            {suggestions.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={fetchSuggestions} disabled={isLoading}>
                                    <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isLoading && "animate-spin")} />
                                    Régénérer
                                </Button>
                            )}
                            <Button
                                size="sm"
                                onClick={handleApply}
                                disabled={selectedIndex === null}
                                className="gap-1.5"
                            >
                                <Check className="h-3.5 w-3.5" />
                                Appliquer
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
