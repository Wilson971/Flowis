"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Sparkles, ArrowRight, Edit3, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFieldLabel } from "@/lib/productHelpers";
import { TipTapEditor } from "@/components/editor/TipTapEditor";

// Fields that contain HTML and need rich text rendering
const RICH_TEXT_FIELDS = ["description", "short_description"];

function isRichTextField(field: string) {
    return RICH_TEXT_FIELDS.includes(field);
}

function stripHtml(html: string): string {
    if (typeof document !== "undefined") {
        const div = document.createElement("div");
        div.innerHTML = html;
        return div.textContent || div.innerText || "";
    }
    return html.replace(/<[^>]*>/g, "");
}

interface AISuggestionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productTitle: string;
    field: string;
    currentValue: string;
    suggestedValue: string;
    onAccept: (editedValue?: string) => Promise<void>;
    onReject: () => Promise<void>;
    isProcessing?: boolean;
}

export function AISuggestionModal({
    open,
    onOpenChange,
    productTitle,
    field,
    currentValue,
    suggestedValue,
    onAccept,
    onReject,
    isProcessing = false,
}: AISuggestionModalProps) {
    const [activeTab, setActiveTab] = useState<"compare" | "edit">("compare");
    const [editedValue, setEditedValue] = useState(suggestedValue);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    const isRich = isRichTextField(field);

    // Reset edited value when suggestedValue changes
    useEffect(() => {
        setEditedValue(suggestedValue);
        setActiveTab("compare");
    }, [suggestedValue, field]);

    const currentCharCount = useMemo(() => stripHtml(currentValue).length, [currentValue]);
    const suggestedCharCount = useMemo(() => stripHtml(suggestedValue).length, [suggestedValue]);
    const editedCharCount = useMemo(() => stripHtml(editedValue).length, [editedValue]);

    const isBusy = isProcessing || isAccepting || isRejecting;

    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            if (activeTab === "edit" && editedValue !== suggestedValue) {
                await onAccept(editedValue);
            } else {
                await onAccept();
            }
            onOpenChange(false);
        } finally {
            setIsAccepting(false);
        }
    };

    const handleReject = async () => {
        setIsRejecting(true);
        try {
            await onReject();
            onOpenChange(false);
        } finally {
            setIsRejecting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden p-0 gap-0 rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                </div>
                                <DialogTitle className="text-xl font-bold text-foreground">
                                    Suggestion IA
                                </DialogTitle>
                                <Badge className="h-6 px-2 text-xs font-semibold bg-primary/10 text-primary border-0">
                                    {getFieldLabel(field)}
                                </Badge>
                            </div>
                            <DialogDescription className="text-sm text-muted-foreground truncate">
                                {productTitle}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "compare" | "edit")} className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 pt-4 pb-2 border-b border-border/30">
                        <TabsList className="grid w-full max-w-md grid-cols-2 h-10">
                            <TabsTrigger value="compare" className="gap-2 text-xs font-semibold">
                                <ArrowRight className="h-3.5 w-3.5" />
                                Comparaison
                            </TabsTrigger>
                            <TabsTrigger value="edit" className="gap-2 text-xs font-semibold">
                                <Edit3 className="h-3.5 w-3.5" />
                                Modifier
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Compare View */}
                    <TabsContent value="compare" className="flex-1 overflow-auto px-6 py-4 mt-0">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Current Value */}
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Actuel
                                    </h3>
                                    <Badge variant="outline" className="h-6 px-2 text-[10px] font-semibold text-muted-foreground border-border/50">
                                        {currentCharCount} car.
                                    </Badge>
                                </div>
                                <div className="flex-1 p-4 rounded-xl bg-muted/30 border border-border/40 overflow-auto max-h-[50vh]">
                                    {isRich ? (
                                        <div
                                            className="prose prose-sm max-w-none text-foreground/80 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_p]:mb-2 [&_ul]:pl-4 [&_li]:mb-1 [&_strong]:font-semibold"
                                            dangerouslySetInnerHTML={{ __html: currentValue || "<p class='text-muted-foreground italic'>Aucun contenu</p>" }}
                                        />
                                    ) : (
                                        <div className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                                            {currentValue || <span className="text-muted-foreground italic">Aucun contenu</span>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Suggested Value */}
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">
                                            Suggestion IA
                                        </h3>
                                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="h-6 px-2 text-[10px] font-semibold text-primary border-primary/30">
                                            {suggestedCharCount} car.
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setEditedValue(suggestedValue);
                                                setActiveTab("edit");
                                            }}
                                            className="h-6 px-2 text-[10px] font-semibold gap-1 text-muted-foreground hover:text-foreground"
                                        >
                                            <Copy className="h-3 w-3" />
                                            Modifier
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex-1 p-4 rounded-xl bg-primary/5 border border-primary/20 overflow-auto max-h-[50vh]">
                                    {isRich ? (
                                        <div
                                            className="prose prose-sm max-w-none text-foreground [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_p]:mb-2 [&_ul]:pl-4 [&_li]:mb-1 [&_strong]:font-semibold"
                                            dangerouslySetInnerHTML={{ __html: suggestedValue }}
                                        />
                                    ) : (
                                        <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                            {suggestedValue}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Edit View */}
                    <TabsContent value="edit" className="flex-1 overflow-auto px-6 py-4 space-y-3 mt-0">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-semibold text-foreground">
                                Éditer la suggestion avant d&apos;accepter
                            </h3>
                            <Badge variant="outline" className="h-6 px-2 text-[10px] font-semibold text-muted-foreground border-border/50">
                                {editedCharCount} car.
                            </Badge>
                        </div>

                        {isRich ? (
                            <div className="rounded-xl border border-border/50 overflow-hidden">
                                <TipTapEditor
                                    value={editedValue}
                                    onChange={setEditedValue}
                                    placeholder="Modifiez le contenu suggéré..."
                                    minHeight={250}
                                    maxHeight={400}
                                />
                            </div>
                        ) : (
                            <Textarea
                                value={editedValue}
                                onChange={(e) => setEditedValue(e.target.value)}
                                rows={field === "title" || field === "seo_title" ? 3 : 8}
                                className="w-full resize-none text-sm leading-relaxed rounded-xl border-border/50 focus:border-primary/50 bg-card"
                                placeholder="Modifiez le contenu suggéré..."
                            />
                        )}

                        <p className="text-xs text-muted-foreground">
                            Modifiez le contenu puis cliquez sur Accepter. Vos modifications seront sauvegardées.
                        </p>
                    </TabsContent>
                </Tabs>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-border/40 bg-muted/20">
                    <div className="flex items-center justify-between gap-4">
                        <Button
                            variant="ghost"
                            onClick={handleReject}
                            disabled={isBusy}
                            className="gap-2 text-xs font-semibold hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                            <X className="h-4 w-4" />
                            Rejeter
                        </Button>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isBusy}
                                className="text-xs font-semibold text-foreground hover:text-foreground"
                            >
                                Annuler
                            </Button>
                            <Button
                                onClick={handleAccept}
                                disabled={isBusy}
                                className={cn(
                                    "gap-2 text-xs font-bold px-5 rounded-xl",
                                    "bg-primary text-primary-foreground",
                                    "shadow-sm shadow-primary/20",
                                    "hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25"
                                )}
                            >
                                <Check className="h-4 w-4" />
                                {activeTab === "edit" && editedValue !== suggestedValue ? "Accepter modifié" : "Accepter"}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
