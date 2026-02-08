"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Helper components for score visualization
export const calculateScore = (text: string, idealLength: number): number => {
    if (!text) return 0;
    const length = text.length;
    // Perfect range: ideal +/- 15%
    if (length >= idealLength * 0.85 && length <= idealLength * 1.15) return 100;
    // Good range: ideal +/- 30%
    if (length >= idealLength * 0.7 && length <= idealLength * 1.3) return 70;
    // Acceptable range: ideal +/- 50%
    if (length >= idealLength * 0.5 && length <= idealLength * 1.5) return 40;
    return 20;
};

export const ScoreBadge = ({ score }: { score: number }) => {
    let color = "bg-muted text-muted-foreground";
    let label = "MANQUANT";

    if (score >= 90) {
        color = "bg-success/10 text-success border-success/20";
        label = "EXCELLENT";
    } else if (score >= 60) {
        color = "bg-info/10 text-info border-info/20";
        label = "BON";
    } else if (score >= 30) {
        color = "bg-warning/10 text-warning border-warning/20";
        label = "MOYEN";
    } else if (score > 0) {
        color = "bg-destructive/10 text-destructive border-destructive/20";
        label = "FAIBLE";
    }

    return (
        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded uppercase", color)}>
            {label} {score > 0 && `${Math.round(score)}%`}
        </span>
    );
};

export const SeoScoreBar = ({ score }: { score: number }) => {
    const getScoreColor = (s: number) => {
        if (s >= 90) return 'bg-success shadow-[0_0_10px_color-mix(in_srgb,var(--success),transparent_60%)]';
        if (s >= 60) return 'bg-info shadow-[0_0_10px_color-mix(in_srgb,var(--info),transparent_60%)]';
        if (s >= 30) return 'bg-warning shadow-[0_0_10px_color-mix(in_srgb,var(--warning),transparent_60%)]';
        return 'bg-destructive shadow-[0_0_10px_color-mix(in_srgb,var(--destructive),transparent_60%)]';
    };

    return (
        <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden relative border border-border/10">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn('h-full transition-all duration-500 rounded-full', getScoreColor(score))}
            />
        </div>
    );
};

interface SeoFieldEditorProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    idealLength: number;
    multiline?: boolean;
    placeholder?: string;
    helperText?: string;
    id?: string;
    score?: number; // External score
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
    score: externalScore
}: SeoFieldEditorProps) => {
    const score = externalScore ?? calculateScore(value, idealLength);
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
