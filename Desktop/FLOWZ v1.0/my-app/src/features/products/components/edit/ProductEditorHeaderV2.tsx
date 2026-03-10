"use client";

import React from "react";
import Link from "next/link";
import { useFormContext, useWatch } from "react-hook-form";
import {
    ArrowLeft,
    Loader2,
    ExternalLink,
    Check,
    Undo2,
    Redo2,
    Save,
    Upload,
    RotateCcw,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";
import type { Store } from "@/types/store";
import type { ProductFormValues } from "../../schemas/product-schema";
import { StatusPill } from "./StatusPill";
import { SyncPill } from "./SyncPill";

// ============================================================================
// TITLE DISPLAY (isolated re-renders via useWatch)
// ============================================================================

const ProductTitleDisplay = () => {
    const { control } = useFormContext<ProductFormValues>();
    const title = useWatch({ control, name: "title" });
    const displayTitle = title || "Nouveau produit";
    return (
        <span className="text-[13px] font-semibold tracking-tight text-foreground truncate max-w-[300px]">
            {displayTitle}
        </span>
    );
};

// ============================================================================
// HELPER: Build product URL for external link
// ============================================================================

function buildProductUrl(
    product: Product,
    selectedStore: Store | null | undefined
): string | null {
    const metadata = product.metadata || {};
    const platform = product.platform;

    if (platform === "shopify") {
        const handle = product.handle || metadata.handle;
        const shopUrl = selectedStore?.platform_connections?.shop_url || "";
        if (handle && shopUrl) {
            const cleanUrl = shopUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
            return `https://${cleanUrl}/products/${handle}`;
        }
    } else if (platform === "woocommerce") {
        const permalink = metadata.permalink || null;
        if (permalink) return permalink;

        const shopUrl = selectedStore?.platform_connections?.shop_url;
        const slug = product.slug || metadata.slug;
        if (shopUrl && slug) {
            const baseUrl = shopUrl.replace(/\/$/, "");
            return `${baseUrl}/product/${slug}/`;
        }
    }

    return null;
}

// ============================================================================
// TYPES
// ============================================================================

interface FormHistory {
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    historyLength: number;
    historyIndex: number;
}

export interface ProductEditorHeaderV2Props {
    product: Product;
    productId: string;
    selectedStore: Store | null | undefined;
    saveStatus: "idle" | "saving" | "saved" | "error";
    isDirty: boolean;
    dirtyFieldsContent: string[];
    hasConflict: boolean;
    isSaving: boolean;
    isPublishing?: boolean;
    history: FormHistory;
    onSave: () => void;
    onPublish: () => void;
    onReset: () => void;
    onResolveConflicts: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ProductEditorHeaderV2 = ({
    product,
    productId,
    selectedStore,
    saveStatus,
    isDirty,
    dirtyFieldsContent,
    hasConflict,
    isSaving,
    isPublishing = false,
    history,
    onSave,
    onPublish,
    onReset,
    onResolveConflicts,
}: ProductEditorHeaderV2Props) => {
    const hasPendingChanges = dirtyFieldsContent.length > 0;
    const productUrl = buildProductUrl(product, selectedStore);

    return (
        <div className="sticky top-0 z-30 h-14 bg-card/80 backdrop-blur-xl border-b border-border/40 -mx-4 sm:-mx-6 px-4 sm:px-6 flex items-center">
            <div className="flex items-center justify-between gap-3 w-full">
                {/* ── Left: Back + Title + External Link + Pills ── */}
                <div className="flex items-center gap-2.5 min-w-0">
                    {/* Back button */}
                    <Button
                        variant="ghost"
                        asChild
                        className="h-7 text-[11px] rounded-lg gap-1 text-muted-foreground hover:text-foreground shrink-0"
                    >
                        <Link href="/app/products">
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Products
                        </Link>
                    </Button>

                    {/* Separator */}
                    <div className="w-px h-5 bg-border/30" />

                    {/* Title */}
                    <ProductTitleDisplay />

                    {/* External link */}
                    {productUrl && (
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <a
                                        href={productUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Voir le produit en ligne"
                                        className="p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent>Voir en ligne</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {/* Status + Sync pills */}
                    <StatusPill />
                    <SyncPill
                        productId={productId}
                        dirtyFields={dirtyFieldsContent}
                        lastSyncedAt={product.last_synced_at}
                        hasConflict={hasConflict}
                        onResolveConflicts={onResolveConflicts}
                    />
                </div>

                {/* ── Right: Save status + Undo/Redo + Actions ── */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Save status text */}
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        {isSaving ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin text-foreground/70" />
                                Sauvegarde...
                            </>
                        ) : isPublishing ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin text-foreground/70" />
                                Publication...
                            </>
                        ) : saveStatus === "error" ? (
                            <span className="text-destructive">Erreur</span>
                        ) : isDirty ? (
                            <span className="text-amber-500">Non enregistré</span>
                        ) : (
                            <>
                                <Check className="w-3 h-3 text-foreground/70" />
                                Sauvegardé
                            </>
                        )}
                    </span>

                    {/* Undo / Redo */}
                    <TooltipProvider delayDuration={300}>
                        <div className="flex items-center gap-0.5">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={history.undo}
                                        disabled={!history.canUndo}
                                        aria-label="Annuler (Ctrl+Z)"
                                        className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-30"
                                    >
                                        <Undo2 className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Annuler (Ctrl+Z)</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={history.redo}
                                        disabled={!history.canRedo}
                                        aria-label="Rétablir (Ctrl+Y)"
                                        className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-30"
                                    >
                                        <Redo2 className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Rétablir (Ctrl+Y)</TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>

                    {/* History counter */}
                    <span className="text-[10px] tabular-nums text-muted-foreground/50">
                        {history.historyIndex}/{history.historyLength}
                    </span>

                    {/* Separator */}
                    <div className="w-px h-5 bg-border/30" />

                    {/* Reset */}
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onReset}
                        disabled={!isDirty || isSaving}
                        className="h-7 text-[11px] rounded-lg gap-1 text-muted-foreground hover:text-foreground"
                    >
                        <RotateCcw className="h-3 w-3" />
                        Annuler
                    </Button>

                    {/* Save */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onSave}
                        disabled={isSaving}
                        className="h-7 text-[11px] rounded-lg gap-1 border-border/60 hover:bg-muted/50"
                    >
                        {isSaving ? (
                            <Loader2 className="h-3 w-3 animate-spin text-foreground/70" />
                        ) : (
                            <Save className="h-3 w-3 text-foreground/70" />
                        )}
                        Enregistrer
                    </Button>

                    {/* Publish */}
                    <Button
                        type="button"
                        onClick={onPublish}
                        disabled={isPublishing || isDirty || (!hasPendingChanges && !hasConflict)}
                        className="h-8 text-[11px] rounded-lg gap-1.5"
                    >
                        {isPublishing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Upload className="h-3.5 w-3.5" />
                        )}
                        Publier
                        {hasPendingChanges && !isPublishing && (
                            <Badge
                                variant="secondary"
                                className="ml-0.5 h-4 px-1 text-[9px] font-bold tabular-nums bg-primary-foreground/20 border-0"
                            >
                                {dirtyFieldsContent.length}
                            </Badge>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
