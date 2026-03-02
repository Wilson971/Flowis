"use client";

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
    RefreshCw,
    AlertTriangle,
    Loader2,
    Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePushSingleProduct, useRevertToOriginal } from "@/hooks/products";
import { FIELD_LABELS } from "@/lib/productHelpers";
import { toast } from "sonner";
import type { ProductFormValues } from "../../../schemas/product-schema";

interface SyncStatusCardV2Props {
    productId: string;
    lastSyncedAt?: string | null;
    dirtyFields?: string[];
    hasConflict?: boolean;
    onResolveConflicts?: () => void;
}

function formatRelativeTime(dateStr: string | null | undefined): string {
    if (!dateStr) return "Jamais synchronisé";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Il y a quelques secondes";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffHour < 24) return `Il y a ${diffHour}h`;
    if (diffDay < 7) return `Il y a ${diffDay}j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

type SyncStatus = "synced" | "pending" | "conflict";

function getSyncStatus(
    dirtyFields: string[],
    hasConflict: boolean
): SyncStatus {
    if (hasConflict) return "conflict";
    if (dirtyFields.length > 0) return "pending";
    return "synced";
}

const STATUS_CONFIG: Record<SyncStatus, {
    label: string;
    description: string;
}> = {
    synced: {
        label: "Synchronisé",
        description: "Le produit est à jour avec la boutique.",
    },
    pending: {
        label: "Modifications en attente",
        description: "",
    },
    conflict: {
        label: "Conflit détecté",
        description: "Des modifications ont été faites sur la boutique et localement.",
    },
};

const STATUS_DOT_CLASS: Record<SyncStatus, string> = {
    synced: "bg-emerald-500",
    pending: "bg-amber-500",
    conflict: "bg-red-500",
};

export const SyncStatusCardV2 = ({
    productId,
    lastSyncedAt,
    dirtyFields = [],
    hasConflict = false,
    onResolveConflicts,
}: SyncStatusCardV2Props) => {
    const [showRevertDialog, setShowRevertDialog] = useState(false);
    const { getValues } = useFormContext<ProductFormValues>();

    const pushMutation = usePushSingleProduct();
    const revertMutation = useRevertToOriginal();

    const syncStatus = getSyncStatus(dirtyFields, hasConflict);
    const config = STATUS_CONFIG[syncStatus];

    const handleSync = () => {
        const title = getValues("title");
        if (!title?.trim()) {
            toast.warning("Titre requis", {
                description: "Le produit doit avoir un titre avant d'être synchronisé avec la boutique.",
            });
            return;
        }

        pushMutation.mutate({ product_ids: [productId] });
    };

    const handleRevert = () => {
        revertMutation.mutate(
            { productIds: [productId] },
            {
                onSuccess: () => {
                    toast.success("Modifications annulées");
                    setShowRevertDialog(false);
                },
                onError: (error: any) => {
                    toast.error(
                        error?.message || "Erreur lors de l'annulation"
                    );
                    setShowRevertDialog(false);
                },
            }
        );
    };

    const isSyncing = pushMutation.isPending;
    const isReverting = revertMutation.isPending;

    return (
        <>
            <div className="rounded-xl border border-border/40 bg-card">
                {/* Dark overlay */}
                <div className="rounded-xl bg-black/5 dark:bg-white/[0.02]">
                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50">
                            <RefreshCw className="h-[18px] w-[18px] text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-[15px] font-semibold tracking-tight">
                                    Synchronisation
                                </p>
                                <div className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT_CLASS[syncStatus])} />
                            </div>
                            <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                                {formatRelativeTime(lastSyncedAt)}
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-4 py-3 space-y-3">
                        {/* Dirty fields as info rows */}
                        {syncStatus === "pending" && dirtyFields.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-[11px] text-muted-foreground/60">
                                    {dirtyFields.length} champ{dirtyFields.length > 1 ? "s" : ""} modifié{dirtyFields.length > 1 ? "s" : ""}
                                </p>
                                <div className="space-y-1">
                                    {dirtyFields.slice(0, 6).map((field) => (
                                        <div
                                            key={field}
                                            className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2"
                                        >
                                            <span className="text-[11px] text-muted-foreground">
                                                {FIELD_LABELS[field] || field}
                                            </span>
                                            <span className="h-5 rounded-full px-2 text-[10px] font-medium border-0 bg-amber-500/10 text-amber-600 ml-auto inline-flex items-center">
                                                Modifié
                                            </span>
                                        </div>
                                    ))}
                                    {dirtyFields.length > 6 && (
                                        <p className="text-[10px] text-muted-foreground/50 px-3">
                                            +{dirtyFields.length - 6} autres champs
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Conflict message */}
                        {syncStatus === "conflict" && (
                            <p className="text-[12px] text-red-500">
                                {config.description}
                            </p>
                        )}

                        {/* Synced message */}
                        {syncStatus === "synced" && (
                            <p className="text-[12px] text-muted-foreground/60">
                                {config.description}
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {/* Sync / Resolve button */}
                            {syncStatus !== "synced" && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 h-7 text-[11px] rounded-lg font-medium"
                                    onClick={
                                        syncStatus === "conflict" && onResolveConflicts
                                            ? onResolveConflicts
                                            : handleSync
                                    }
                                    disabled={isSyncing}
                                >
                                    {isSyncing ? (
                                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                                    ) : syncStatus === "conflict" ? (
                                        <AlertTriangle className="h-3 w-3 mr-1.5" />
                                    ) : (
                                        <RefreshCw className="h-3 w-3 mr-1.5" />
                                    )}
                                    {syncStatus === "conflict"
                                        ? "Résoudre"
                                        : isSyncing
                                            ? "Sync..."
                                            : "Synchroniser"
                                    }
                                </Button>
                            )}

                            {/* Revert button */}
                            {syncStatus === "pending" && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 rounded-lg text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10"
                                    onClick={() => setShowRevertDialog(true)}
                                    disabled={isReverting}
                                >
                                    {isReverting ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Undo2 className="h-3 w-3" />
                                    )}
                                </Button>
                            )}

                            {/* Force sync for synced state */}
                            {syncStatus === "synced" && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="w-full h-7 text-[11px] rounded-lg font-medium"
                                    onClick={handleSync}
                                    disabled={isSyncing}
                                >
                                    {isSyncing ? (
                                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-3 w-3 mr-1.5" />
                                    )}
                                    Forcer la sync
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Revert confirmation dialog */}
            <AlertDialog open={showRevertDialog} onOpenChange={setShowRevertDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Annuler les modifications ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action remettra le contenu du produit à sa dernière version synchronisée depuis la boutique. Toutes les modifications non synchronisées seront perdues.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Garder les modifications</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRevert}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Annuler les modifications
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
