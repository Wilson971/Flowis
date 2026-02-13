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
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    History,
    CheckCircle2,
    XCircle,
    ChevronRight,
    ChevronDown,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSyncHistory, type SyncHistoryEntry } from "@/hooks/products";
import { useForceStoreContent } from "@/hooks/products";
import { getProductCardTheme } from "@/lib/design-system";
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
import { toast } from "sonner";

interface SyncHistoryCardProps {
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

function SyncHistoryItem({ entry }: { entry: SyncHistoryEntry }) {
    const fieldsChanged = (entry.metadata as any)?.fields_changed;

    return (
        <div className="flex items-start gap-2.5 py-2 first:pt-0 last:pb-0">
            <div className={cn(
                "mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                entry.success
                    ? "text-emerald-500"
                    : "text-red-500"
            )}>
                {entry.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                    <XCircle className="w-3.5 h-3.5" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium truncate">
                        {ACTION_LABELS[entry.action] || entry.action}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(entry.created_at)}
                    </span>
                </div>
                {fieldsChanged && Array.isArray(fieldsChanged) && fieldsChanged.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {fieldsChanged.slice(0, 3).map((f: string) => (
                            <span
                                key={f}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                            >
                                {f}
                            </span>
                        ))}
                        {fieldsChanged.length > 3 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                +{fieldsChanged.length - 3}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export const SyncHistoryCard = ({ productId }: SyncHistoryCardProps) => {
    const { data: history = [], isLoading } = useSyncHistory(productId, 20);
    const [isOpen, setIsOpen] = useState(false);
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

    const displayedHistory = history.slice(0, 3);
    const hasMore = history.length > 3;

    const theme = getProductCardTheme('SyncHistoryCard');

    if (isLoading) return null;
    if (history.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
        >
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <div className={cn(theme.container, "rounded-xl")}>
                    {/* Glass reflection */}
                    <div className={theme.glassReflection} />
                    {/* Gradient accent */}
                    <div className={theme.gradientAccent} />
                    {/* Trigger header */}
                    <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer relative z-10">
                        <div className="flex items-center gap-2.5">
                            <History className="h-4 w-4 text-muted-foreground" />
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                Activité
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                                {history.length} sync
                            </span>
                        </div>
                        <ChevronDown
                            className={cn(
                                "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                                isOpen && "rotate-180"
                            )}
                        />
                    </CollapsibleTrigger>

                    {/* Collapsible content */}
                    <CollapsibleContent>
                        <div className="px-4 pb-3 space-y-2 relative z-10">
                            <div className="divide-y divide-border/10">
                                {displayedHistory.map((entry) => (
                                    <SyncHistoryItem key={entry.id} entry={entry} />
                                ))}
                            </div>

                            <div className="flex gap-2 pt-1">
                                {hasMore && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="flex-1 h-7 text-xs text-muted-foreground"
                                        onClick={() => setShowAll(true)}
                                    >
                                        Voir tout ({history.length})
                                        <ChevronRight className="w-3 h-3 ml-1" />
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => setShowRestoreDialog(true)}
                                    disabled={forceStoreMutation.isPending}
                                >
                                    {forceStoreMutation.isPending ? (
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    ) : null}
                                    Restaurer boutique
                                </Button>
                            </div>
                        </div>
                    </CollapsibleContent>
                </div>
            </Collapsible>

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
                        <div className="divide-y divide-border/10">
                            {history.map((entry) => (
                                <SyncHistoryItem key={entry.id} entry={entry} />
                            ))}
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
        </motion.div>
    );
};
