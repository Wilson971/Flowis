"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Sparkles, ArrowRight, CheckCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ImageAltItem {
    id: string;
    src: string;
    currentAlt: string;
    suggestedAlt: string;
}

interface ImageAltSuggestionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productTitle: string;
    images: ImageAltItem[];
    onAcceptImage: (imageIndex: number, editedAlt?: string) => Promise<void>;
    onRejectImage: (imageIndex: number) => Promise<void>;
    onAcceptAll: () => Promise<void>;
    onRejectAll: () => Promise<void>;
    isProcessing?: boolean;
}

export function ImageAltSuggestionModal({
    open,
    onOpenChange,
    productTitle,
    images,
    onAcceptImage,
    onRejectImage,
    onAcceptAll,
    onRejectAll,
    isProcessing = false,
}: ImageAltSuggestionModalProps) {
    // Track edited alt texts per image index
    const [editedAlts, setEditedAlts] = useState<Record<number, string>>({});
    // Track which images have been individually processed
    const [processedImages, setProcessedImages] = useState<Record<number, "accepted" | "rejected">>({});
    const [isAcceptingAll, setIsAcceptingAll] = useState(false);
    const [isRejectingAll, setIsRejectingAll] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setEditedAlts({});
            setProcessedImages({});
        }
    }, [open]);

    const handleEditAlt = useCallback((index: number, value: string) => {
        setEditedAlts(prev => ({ ...prev, [index]: value }));
    }, []);

    const handleAcceptSingle = useCallback(async (index: number) => {
        const editedValue = editedAlts[index];
        const hasEdit = editedValue !== undefined && editedValue !== images[index].suggestedAlt;
        await onAcceptImage(index, hasEdit ? editedValue : undefined);
        setProcessedImages(prev => ({ ...prev, [index]: "accepted" }));
    }, [editedAlts, images, onAcceptImage]);

    const handleRejectSingle = useCallback(async (index: number) => {
        await onRejectImage(index);
        setProcessedImages(prev => ({ ...prev, [index]: "rejected" }));
    }, [onRejectImage]);

    const handleAcceptAllClick = useCallback(async () => {
        setIsAcceptingAll(true);
        try {
            await onAcceptAll();
            onOpenChange(false);
        } finally {
            setIsAcceptingAll(false);
        }
    }, [onAcceptAll, onOpenChange]);

    const handleRejectAllClick = useCallback(async () => {
        setIsRejectingAll(true);
        try {
            await onRejectAll();
            onOpenChange(false);
        } finally {
            setIsRejectingAll(false);
        }
    }, [onRejectAll, onOpenChange]);

    const pendingCount = images.filter((_, i) => !processedImages[i]).length;
    const acceptedCount = Object.values(processedImages).filter(s => s === "accepted").length;
    const rejectedCount = Object.values(processedImages).filter(s => s === "rejected").length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Sparkles className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold">
                                Suggestions Alt Text
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                {productTitle} - {images.length} image{images.length > 1 ? "s" : ""}
                            </DialogDescription>
                        </div>
                    </div>
                    {/* Summary badges */}
                    <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline" className="text-[10px] font-medium">
                            {pendingCount} en attente
                        </Badge>
                        {acceptedCount > 0 && (
                            <Badge className="text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                {acceptedCount} accepté{acceptedCount > 1 ? "s" : ""}
                            </Badge>
                        )}
                        {rejectedCount > 0 && (
                            <Badge className="text-[10px] font-medium bg-destructive/10 text-destructive border-destructive/20">
                                {rejectedCount} rejeté{rejectedCount > 1 ? "s" : ""}
                            </Badge>
                        )}
                    </div>
                </DialogHeader>

                {/* Image list */}
                <ScrollArea className="flex-1 min-h-0">
                    <div className="p-6 space-y-4">
                        {images.map((img, index) => {
                            const status = processedImages[index];
                            const isEdited = editedAlts[index] !== undefined && editedAlts[index] !== img.suggestedAlt;
                            const displayedSuggestion = editedAlts[index] ?? img.suggestedAlt;

                            return (
                                <div
                                    key={img.id}
                                    className={cn(
                                        "rounded-xl border p-4 transition-all",
                                        status === "accepted" && "border-emerald-500/30 bg-emerald-500/5 opacity-60",
                                        status === "rejected" && "border-destructive/30 bg-destructive/5 opacity-60",
                                        !status && "border-border/50 bg-card/50"
                                    )}
                                >
                                    <div className="flex gap-4">
                                        {/* Thumbnail */}
                                        <div className="shrink-0">
                                            <div className="w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-muted">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={img.src}
                                                    alt={img.currentAlt || `Image ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground text-center mt-1 font-medium">
                                                Image {index + 1}
                                            </p>
                                        </div>

                                        {/* Alt text comparison */}
                                        <div className="flex-1 min-w-0 space-y-2">
                                            {/* Current */}
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                                    Actuel
                                                </p>
                                                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 break-words">
                                                    {img.currentAlt || <span className="italic">Aucun alt text</span>}
                                                </p>
                                            </div>

                                            {/* Arrow */}
                                            <div className="flex items-center gap-2">
                                                <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                                                <div className="h-px flex-1 bg-border/30" />
                                            </div>

                                            {/* Suggested (editable if not processed) */}
                                            <div>
                                                <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
                                                    Suggestion IA
                                                    {isEdited && <span className="text-amber-500 ml-1">(modifié)</span>}
                                                </p>
                                                {!status ? (
                                                    <Textarea
                                                        value={displayedSuggestion}
                                                        onChange={(e) => handleEditAlt(index, e.target.value)}
                                                        className="text-xs min-h-[48px] resize-none bg-primary/5 border-primary/20 focus:border-primary/40"
                                                        rows={2}
                                                    />
                                                ) : (
                                                    <p className="text-xs text-foreground bg-primary/5 rounded-lg px-3 py-2 break-words">
                                                        {displayedSuggestion}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="shrink-0 flex flex-col gap-1.5 justify-center">
                                            {!status ? (
                                                <>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 w-7 p-0 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                                                        onClick={() => handleAcceptSingle(index)}
                                                        disabled={isProcessing}
                                                        title="Accepter"
                                                    >
                                                        <Check className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 w-7 p-0 border-destructive/30 text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleRejectSingle(index)}
                                                        disabled={isProcessing}
                                                        title="Rejeter"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[9px] px-1.5",
                                                        status === "accepted" && "text-emerald-600 border-emerald-500/30",
                                                        status === "rejected" && "text-destructive border-destructive/30"
                                                    )}
                                                >
                                                    {status === "accepted" ? "OK" : "Non"}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between bg-muted/20">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="text-xs"
                    >
                        Fermer
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRejectAllClick}
                            disabled={isProcessing || isAcceptingAll || isRejectingAll || pendingCount === 0}
                            className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                            <XCircle className="h-3.5 w-3.5" />
                            {isRejectingAll ? "Rejet..." : "Tout rejeter"}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleAcceptAllClick}
                            disabled={isProcessing || isAcceptingAll || isRejectingAll || pendingCount === 0}
                            className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            <CheckCheck className="h-3.5 w-3.5" />
                            {isAcceptingAll ? "Acceptation..." : "Tout accepter"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
