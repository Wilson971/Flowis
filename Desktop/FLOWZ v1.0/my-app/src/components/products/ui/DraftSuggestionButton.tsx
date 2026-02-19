"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface DraftSuggestionButtonProps {
    field: string;
    hasDraft: boolean;
    onOpen: (field: string) => void;
}

/**
 * Button to view an AI-generated draft suggestion for a specific field.
 * Shared between ProductGeneralTab and ProductSeoTab.
 * Renders nothing if no draft is available for the field.
 */
export const DraftSuggestionButton = ({ field, hasDraft, onOpen }: DraftSuggestionButtonProps) => {
    if (!hasDraft) return null;
    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpen(field)}
            className="gap-1.5 h-7 px-2.5 text-xs font-semibold border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        >
            <Sparkles className="h-3.5 w-3.5" />
            Voir la suggestion
        </Button>
    );
};
