"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getScoreBadgeStyle, getScoreStrokeColor } from "@/lib/seo/scoreColors";

// ============================================================================
// SCORE UTILITIES (unified)
// ============================================================================

export const calculateScore = (text: string, idealLength: number): number => {
    if (!text) return 0;
    const length = text.length;
    if (length >= idealLength * 0.85 && length <= idealLength * 1.15) return 100;
    if (length >= idealLength * 0.7 && length <= idealLength * 1.3) return 70;
    if (length >= idealLength * 0.5 && length <= idealLength * 1.5) return 40;
    return 20;
};

export const ScoreBadge = ({ score }: { score: number }) => {
    const style = getScoreBadgeStyle(score);

    return (
        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase border", style.bg, style.text, style.border)}>
            {style.label} {score > 0 && `${Math.round(score)}%`}
        </span>
    );
};

export const SeoScoreBar = ({ score }: { score: number }) => {
    const strokeColor = getScoreStrokeColor(score);

    return (
        <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden relative border border-border/10">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                    backgroundColor: strokeColor,
                    boxShadow: `0 0 10px ${strokeColor}60`,
                }}
            />
        </div>
    );
};

// ============================================================================
// FIELD EDITOR
// ============================================================================

interface SeoFieldEditorProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    idealLength: number;
    multiline?: boolean;
    placeholder?: string;
    helperText?: string;
    id?: string;
    score?: number;
    onAISuggest?: () => void;
}

export const SeoFieldEditor = ({
    label,
    value,
    onChange,
    idealLength,
    multiline = false,
    placeholder,
    helperText,
    id,
    score: externalScore,
    onAISuggest,
}: SeoFieldEditorProps) => {
    const rawScore = externalScore ?? calculateScore(value, idealLength);
    const score = Number.isFinite(rawScore) ? rawScore : 0;
    const length = value?.length || 0;
    const isOverLimit = length > idealLength * 1.5;

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <Label htmlFor={id} className="text-sm font-semibold text-foreground">
                    {label}
                </Label>
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-xs",
                        isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
                    )}>
                        {length} / {idealLength} chars
                    </span>
                    <ScoreBadge score={score} />
                    {onAISuggest && score < 60 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onAISuggest}
                            className="h-6 px-2 text-xs gap-1 text-primary hover:text-primary"
                        >
                            <Sparkles className="h-3 w-3" />
                            IA
                        </Button>
                    )}
                </div>
            </div>

            {multiline ? (
                <Textarea
                    id={id}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="min-h-[100px] bg-background/50"
                />
            ) : (
                <Input
                    id={id}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="bg-background/50"
                />
            )}

            <SeoScoreBar score={score} />

            {helperText && (
                <p className="text-xs text-muted-foreground">
                    {helperText}
                </p>
            )}
        </div>
    );
};
