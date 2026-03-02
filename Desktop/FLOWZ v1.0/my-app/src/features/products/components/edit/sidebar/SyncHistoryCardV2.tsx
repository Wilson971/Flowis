"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    History,
    ChevronRight,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSyncHistory, type SyncHistoryEntry } from "@/hooks/products";
import { useForceStoreContent } from "@/hooks/products";
import { toast } from "sonner";

interface SyncHistoryCardV2Props {
    productId: string;
}

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "À l'instant";
    if (diffMin < 60) return `${diffMin} min`;
    if (diffHour < 24) return `${diffHour}h`;
    if (diffDay < 7) return `${diffDay}j`;
    return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const ACTION_LABELS: Record<string, string> = {
    push_to_store: "Sync vers boutique",
    pull_from_store: "Import depuis boutique",
    sync_product: "Synchronisation",
    revert: "Annulation",
    conflict_resolved: "Conflit résolu",
    batch_push: "Sync groupée",
};

type EventType = "push" | "pull" | "conflict" | "revert";

function getEventType(action: string): EventType {
    if (action === "push_to_store" || action === "batch_push") return "push";
    if (action === "pull_from_store" || action === "sync_product") return "pull";
    if (action === "conflict_resolved") return "conflict";
    if (action === "revert") return "revert";
    return "push";
}

const DOT_COLOR_MAP: Record<EventType, string> = {
    push: "bg-emerald-500",
    pull: "bg-primary",
    conflict: "bg-red-500",
    revert: "bg-amber-500",
};

export const SyncHistoryCardV2 = ({ productId }: SyncHistoryCardV2Props) => {
    const { data: history = [], isLoading } = useSyncHistory(productId, 20);
    const [showAll, setShowAll] = useState(false);
    const [showRestoreDialog, setShowRestoreDialog] = useState(false);

    const forceStoreMutation = useForceStoreContent();

    const handleRestore = () => {
        forceStoreMutation.mutate(
            { productId },
            {
                onSuccess: () => {
                    toast.success("Contenu de la boutique restauré");
                    setShowRestoreDialog(false);
                },
                onError: (error: any) => {
                    toast.error(error?.message || "Erreur lors de la restauration");
                    setShowRestoreDialog(false);
                },
            }
        );
    };

    const displayedHistory = history.slice(0, 5);
    const hasMore = history.length > 5;

    if (isLoading) return null;

    return (
        <>
            <div className="rounded-xl border border-border/40 bg-card">
                {/* Dark overlay */}
                <div className="rounded-xl bg-black/5 dark:bg-white/[0.02]">
                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50">
                            <History className="h-[18px] w-[18px] text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-[15px] font-semibold tracking-tight">
                                Historique de sync
                            </p>
                            {history.length > 0 && (
                                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                                    {history.length} événement{history.length > 1 ? "s" : ""}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-4 py-3">
                        {history.length === 0 ? (
                            <div className="py-6 text-center">
                                <p className="text-xs text-muted-foreground/60">
                                    Aucun historique de synchronisation
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Timeline */}
                                <div className="space-y-0">
                                    {displayedHistory.map((entry, i) => {
                                        const eventType = getEventType(entry.action);
                                        const fieldsChanged = (entry.metadata as any)?.fields_changed;

                                        return (
                                            <div key={entry.id} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className={cn(
                                                        "h-2 w-2 rounded-full mt-1.5 shrink-0",
                                                        entry.success
                                                            ? DOT_COLOR_MAP[eventType]
                                                            : "bg-red-500"
                                                    )} />
                                                    {i < displayedHistory.length - 1 && (
                                                        <div className="w-px flex-1 bg-border/40 my-1" />
                                                    )}
                                                </div>
                                                <div className="pb-4">
                                                    <p className="text-[13px] text-foreground">
                                                        {ACTION_LABELS[entry.action] || entry.action}
                                                        {!entry.success && (
                                                            <span className="text-red-500 ml-1">(échec)</span>
                                                        )}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                                                        {formatRelativeTime(entry.created_at)}
                                                    </p>
                                                    {fieldsChanged && Array.isArray(fieldsChanged) && fieldsChanged.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {fieldsChanged.slice(0, 3).map((f: string) => (
                                                                <span
                                                                    key={f}
                                                                    className="text-[10px] px-1.5 py-0.5 rounded-lg bg-muted/40 text-muted-foreground/60"
                                                                >
                                                                    {f}
                                                                </span>
                                                            ))}
                                                            {fieldsChanged.length > 3 && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-muted/40 text-muted-foreground/60">
                                                                    +{fieldsChanged.length - 3}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                                    {hasMore && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="flex-1 h-7 text-[11px] rounded-lg font-medium text-muted-foreground/60"
                                            onClick={() => setShowAll(true)}
                                        >
                                            Voir tout ({history.length})
                                            <ChevronRight className="h-3 w-3 ml-1" />
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-[11px] rounded-lg font-medium"
                                        onClick={() => setShowRestoreDialog(true)}
                                        disabled={forceStoreMutation.isPending}
                                    >
                                        {forceStoreMutation.isPending && (
                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        )}
                                        Restaurer boutique
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Full History Dialog */}
            <Dialog open={showAll} onOpenChange={setShowAll}>
                <DialogContent className="max-w-lg max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Historique de synchronisation
                        </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="space-y-0">
                            {history.map((entry, i) => {
                                const eventType = getEventType(entry.action);
                                const fieldsChanged = (entry.metadata as any)?.fields_changed;

                                return (
                                    <div key={entry.id} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={cn(
                                                "h-2 w-2 rounded-full mt-1.5 shrink-0",
                                                entry.success
                                                    ? DOT_COLOR_MAP[eventType]
                                                    : "bg-red-500"
                                            )} />
                                            {i < history.length - 1 && (
                                                <div className="w-px flex-1 bg-border/40 my-1" />
                                            )}
                                        </div>
                                        <div className="pb-4">
                                            <p className="text-[13px] text-foreground">
                                                {ACTION_LABELS[entry.action] || entry.action}
                                                {!entry.success && (
                                                    <span className="text-red-500 ml-1">(échec)</span>
                                                )}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                                                {formatRelativeTime(entry.created_at)}
                                            </p>
                                            {fieldsChanged && Array.isArray(fieldsChanged) && fieldsChanged.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {fieldsChanged.slice(0, 3).map((f: string) => (
                                                        <span
                                                            key={f}
                                                            className="text-[10px] px-1.5 py-0.5 rounded-lg bg-muted/40 text-muted-foreground/60"
                                                        >
                                                            {f}
                                                        </span>
                                                    ))}
                                                    {fieldsChanged.length > 3 && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-muted/40 text-muted-foreground/60">
                                                            +{fieldsChanged.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* Restore confirmation */}
            <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restaurer le contenu boutique ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action remplacera le contenu local par la dernière version synchronisée depuis la boutique. Toutes les modifications locales non synchronisées seront perdues.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRestore}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Restaurer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
