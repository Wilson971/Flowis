"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    CheckCircle2,
    AlertTriangle,
    Clock,
    Undo2,
    CloudUpload,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { usePushSingleProduct, useRevertToOriginal } from "@/hooks/products";
import { toast } from "sonner";

interface SyncStatusCardProps {
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
    icon: React.ElementType;
    badgeClass: string;
    description: string;
}> = {
    synced: {
        label: "Synchronisé",
        icon: CheckCircle2,
        badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        description: "Le produit est à jour avec la boutique.",
    },
    pending: {
        label: "Modifications en attente",
        icon: Clock,
        badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        description: "",
    },
    conflict: {
        label: "Conflit détecté",
        icon: AlertTriangle,
        badgeClass: "bg-red-500/10 text-red-600 border-red-500/20",
        description: "Des modifications ont été faites sur la boutique et localement.",
    },
};

// Mapping des noms de champs techniques vers des labels lisibles
const FIELD_LABELS: Record<string, string> = {
    title: "Titre",
    description: "Description",
    short_description: "Description courte",
    regular_price: "Prix",
    sale_price: "Prix promo",
    stock: "Stock",
    sku: "SKU",
    slug: "Slug URL",
    "seo.title": "Meta titre",
    meta_title: "Meta titre",
    "seo.description": "Meta description",
    meta_description: "Meta description",
    categories: "Catégories",
    tags: "Tags",
    status: "Statut",
    images: "Images",
    weight: "Poids",
    dimensions: "Dimensions",
};

export const SyncStatusCard = ({
    productId,
    lastSyncedAt,
    dirtyFields = [],
    hasConflict = false,
    onResolveConflicts,
}: SyncStatusCardProps) => {
    const [showRevertDialog, setShowRevertDialog] = useState(false);

    const pushMutation = usePushSingleProduct();
    const revertMutation = useRevertToOriginal();

    const syncStatus = getSyncStatus(dirtyFields, hasConflict);
    const config = STATUS_CONFIG[syncStatus];
    const StatusIcon = config.icon;

    const handleSync = () => {
        pushMutation.mutate(
            { product_ids: [productId] },
            {
                onSuccess: () => {
                    toast.success("Synchronisation lancée vers la boutique");
                },
                onError: (error: any) => {
                    toast.error(
                        error?.message || "Erreur lors de la synchronisation"
                    );
                },
            }
        );
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
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
        >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden card-elevated">
                <CardHeader className="pb-3 border-b border-border/10 px-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                                <CloudUpload className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                                    Synchronisation
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatRelativeTime(lastSyncedAt)}
                                </p>
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-[10px] uppercase font-bold tracking-wider border",
                                config.badgeClass
                            )}
                        >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="p-5 pt-3 space-y-3">
                    {/* Dirty fields list */}
                    {syncStatus === "pending" && dirtyFields.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                                {dirtyFields.length} champ{dirtyFields.length > 1 ? "s" : ""} modifié{dirtyFields.length > 1 ? "s" : ""} :
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {dirtyFields.slice(0, 6).map((field) => (
                                    <span
                                        key={field}
                                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                    >
                                        {FIELD_LABELS[field] || field}
                                    </span>
                                ))}
                                {dirtyFields.length > 6 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground">
                                        +{dirtyFields.length - 6} autres
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Conflict message */}
                    {syncStatus === "conflict" && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                            {config.description}
                        </p>
                    )}

                    {/* Synced message */}
                    {syncStatus === "synced" && (
                        <p className="text-xs text-muted-foreground">
                            {config.description}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        {/* Sync button */}
                        {syncStatus !== "synced" && (
                            <Button
                                type="button"
                                size="sm"
                                variant={syncStatus === "conflict" ? "destructive" : "default"}
                                className="flex-1 h-8 text-xs"
                                onClick={
                                    syncStatus === "conflict" && onResolveConflicts
                                        ? onResolveConflicts
                                        : handleSync
                                }
                                disabled={isSyncing}
                            >
                                {isSyncing ? (
                                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                ) : syncStatus === "conflict" ? (
                                    <AlertTriangle className="w-3 h-3 mr-1.5" />
                                ) : (
                                    <RefreshCw className="w-3 h-3 mr-1.5" />
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
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => setShowRevertDialog(true)}
                                disabled={isReverting}
                            >
                                {isReverting ? (
                                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                ) : (
                                    <Undo2 className="w-3 h-3 mr-1.5" />
                                )}
                                Annuler
                            </Button>
                        )}

                        {/* Force sync for synced state */}
                        {syncStatus === "synced" && (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="w-full h-8 text-xs"
                                onClick={handleSync}
                                disabled={isSyncing}
                            >
                                {isSyncing ? (
                                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-3 h-3 mr-1.5" />
                                )}
                                Forcer la sync
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

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
        </motion.div>
    );
};
