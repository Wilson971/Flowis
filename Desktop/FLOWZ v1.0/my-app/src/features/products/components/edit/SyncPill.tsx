"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Loader2, RefreshCw, CheckCircle2, Clock, AlertTriangle, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";
import { usePushSingleProduct, useRevertToOriginal } from "@/hooks/products";
import { FIELD_LABELS } from "@/lib/productHelpers";
import type { ProductFormValues } from "../../schemas/product-schema";

// ============================================================================
// SYNC STATUS CONFIG
// ============================================================================

const SYNC_STATUS_CONFIG = {
    synced: {
        label: "Synchronis\u00e9",
        shortLabel: "Sync",
        dotClass: "bg-emerald-500",
        pillBorder: "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10",
        textClass: "text-emerald-700 dark:text-emerald-400",
        icon: CheckCircle2,
    },
    pending: {
        label: "Modifications en attente",
        shortLabel: "modif.",
        dotClass: "bg-amber-500",
        pillBorder: "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10",
        textClass: "text-amber-700 dark:text-amber-400",
        icon: Clock,
    },
    conflict: {
        label: "Conflit d\u00e9tect\u00e9",
        shortLabel: "Conflit",
        dotClass: "bg-red-500",
        pillBorder: "border-red-500/30 bg-red-500/5 hover:bg-red-500/10 animate-pulse",
        textClass: "text-red-700 dark:text-red-400",
        icon: AlertTriangle,
    },
} as const;

type SyncStatus = keyof typeof SYNC_STATUS_CONFIG;

// ============================================================================
// HELPERS
// ============================================================================

export function formatRelativeTime(dateStr: string | null | undefined): string {
    if (!dateStr) return "Jamais";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffMin < 1) return "\u00e0 l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    if (diffHour < 24) return `il y a ${diffHour}h`;
    if (diffDay < 7) return `il y a ${diffDay}j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ============================================================================
// COMPONENT
// ============================================================================

export interface SyncPillProps {
    productId: string;
    dirtyFields: string[];
    lastSyncedAt?: string | null;
    hasConflict: boolean;
    onResolveConflicts: () => void;
}

export const SyncPill = ({ productId, dirtyFields, lastSyncedAt, hasConflict, onResolveConflicts }: SyncPillProps) => {
    const [showRevertDialog, setShowRevertDialog] = React.useState(false);
    const { getValues } = useFormContext<ProductFormValues>();
    const pushMutation = usePushSingleProduct();
    const revertMutation = useRevertToOriginal();

    const status: SyncStatus = hasConflict ? "conflict" : dirtyFields.length > 0 ? "pending" : "synced";
    const config = SYNC_STATUS_CONFIG[status];
    const isSyncing = pushMutation.isPending;
    const isReverting = revertMutation.isPending;

    const handleSync = () => {
        const title = getValues("title");
        if (!title?.trim()) {
            toast.warning("Titre requis", {
                description: "Le produit doit avoir un titre avant d'\u00eatre synchronis\u00e9 avec la boutique.",
            });
            return;
        }

        pushMutation.mutate({ product_ids: [productId] });
    };

    const handleRevert = () => {
        revertMutation.mutate(
            { productIds: [productId] },
            {
                onSuccess: () => { toast.success("Modifications annul\u00e9es"); setShowRevertDialog(false); },
                onError: (err: any) => { toast.error(err?.message || "Erreur"); setShowRevertDialog(false); },
            }
        );
    };

    const pillLabel = status === "pending"
        ? `${dirtyFields.length} ${config.shortLabel}`
        : status === "synced"
            ? formatRelativeTime(lastSyncedAt)
            : config.shortLabel;

    return (
        <>
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border transition-colors text-sm font-medium cursor-pointer",
                            config.pillBorder,
                        )}
                    >
                        {isSyncing ? (
                            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        ) : (
                            <span className={cn("w-2 h-2 rounded-full shrink-0", config.dotClass)} />
                        )}
                        <span className={config.textClass}>{pillLabel}</span>
                    </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-0" sideOffset={8}>
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-border/10">
                        <div className="flex items-center gap-2">
                            <config.icon className={cn("w-4 h-4", config.textClass)} />
                            <span className="text-sm font-semibold">{config.label}</span>
                        </div>
                        {lastSyncedAt && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                                Derni\u00e8re sync : {formatRelativeTime(lastSyncedAt)}
                            </p>
                        )}
                    </div>

                    {/* Dirty fields */}
                    {status === "pending" && dirtyFields.length > 0 && (
                        <div className="px-4 py-2.5 border-b border-border/10">
                            <p className="text-[10px] text-muted-foreground mb-1.5">Champs modifi\u00e9s :</p>
                            <div className="flex flex-wrap gap-1">
                                {dirtyFields.slice(0, 8).map((field) => (
                                    <span
                                        key={field}
                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                    >
                                        {FIELD_LABELS[field] || field}
                                    </span>
                                ))}
                                {dirtyFields.length > 8 && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                        +{dirtyFields.length - 8}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Conflict message */}
                    {status === "conflict" && (
                        <div className="px-4 py-2.5 border-b border-border/10">
                            <p className="text-xs text-red-600 dark:text-red-400">
                                Le produit a \u00e9t\u00e9 modifi\u00e9 sur la boutique et localement.
                            </p>
                        </div>
                    )}

                    {/* Synced message */}
                    {status === "synced" && (
                        <div className="px-4 py-2.5 border-b border-border/10">
                            <p className="text-xs text-muted-foreground">
                                Le produit est \u00e0 jour avec la boutique.
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="px-4 py-3 flex gap-2">
                        {status === "conflict" && onResolveConflicts ? (
                            <Button type="button" size="sm" variant="destructive" className="flex-1 h-7 text-xs" onClick={onResolveConflicts}>
                                <AlertTriangle className="w-3 h-3 mr-1.5" />
                                R\u00e9soudre
                            </Button>
                        ) : status !== "synced" ? (
                            <>
                                <Button type="button" size="sm" className="flex-1 h-7 text-xs" onClick={handleSync} disabled={isSyncing}>
                                    {isSyncing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1.5" />}
                                    Synchroniser
                                </Button>
                                <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowRevertDialog(true)} disabled={isReverting}>
                                    <Undo2 className="w-3 h-3 mr-1" />
                                </Button>
                            </>
                        ) : (
                            <Button type="button" size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={handleSync} disabled={isSyncing}>
                                {isSyncing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1.5" />}
                                Forcer la sync
                            </Button>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Revert confirmation */}
            <AlertDialog open={showRevertDialog} onOpenChange={setShowRevertDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Annuler les modifications ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Le contenu sera remis \u00e0 sa derni\u00e8re version synchronis\u00e9e. Toutes les modifications non synchronis\u00e9es seront perdues.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Garder</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRevert} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Annuler les modifications
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
