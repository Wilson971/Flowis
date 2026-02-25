"use client";

import React from "react";
import Link from "next/link";
import { useFormContext, useWatch } from "react-hook-form";
import { ArrowLeft, Loader2, ExternalLink, Check, Undo2, Redo2, CloudUpload, Save, Upload } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";
import type { ProductFormValues } from "../../schemas/product-schema";
import { StatusPill } from "./StatusPill";
import { SyncPill } from "./SyncPill";

// ============================================================================
// TITLE DISPLAY (isolated re-renders)
// ============================================================================

const ProductTitleDisplay = () => {
    const { control } = useFormContext<ProductFormValues>();
    const title = useWatch({ control, name: "title" });
    const displayTitle = title || "Nouveau produit";
    return (
        <h1 className="text-xl font-bold tracking-tight text-foreground truncate">
            {displayTitle}
        </h1>
    );
};

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

export interface ProductEditorHeaderProps {
    product: Product;
    productId: string;
    selectedStore: any;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
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
// HELPER: Build product URL for external link
// ============================================================================

function buildProductUrl(
    product: Product,
    selectedStore: any
): string | null {
    const metadata = product.metadata || {};
    const platform = product.platform;

    if (platform === 'shopify') {
        const handle = (product as any).handle || metadata.handle;
        const shopUrl = selectedStore?.platform_connections?.shop_url || '';
        if (handle && shopUrl) {
            const cleanUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
            return `https://${cleanUrl}/products/${handle}`;
        }
    } else if (platform === 'woocommerce') {
        const permalink = metadata.permalink || null;
        if (permalink) return permalink;

        const shopUrl = selectedStore?.platform_connections?.shop_url;
        const slug = product.slug || metadata.slug;
        if (shopUrl && slug) {
            const baseUrl = shopUrl.replace(/\/$/, '');
            return `${baseUrl}/product/${slug}/`;
        }
    }

    return null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ProductEditorHeader = ({
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
}: ProductEditorHeaderProps) => {
    const hasPendingChanges = dirtyFieldsContent.length > 0;
    const productUrl = buildProductUrl(product, selectedStore);

    return (
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 border-b border-border/10 mb-6">
            <div className="flex items-center justify-between gap-3">
                {/* Left: Back + Title block */}
                <div className="flex items-center gap-2.5 min-w-0">
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0">
                        <Link href="/app/products">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>

                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5">
                            {(product.platform || "Produit").toUpperCase()}
                            {product.platform_product_id && ` #${product.platform_product_id}`}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <ProductTitleDisplay />
                            {productUrl && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <a
                                                href={productUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        </TooltipTrigger>
                                        <TooltipContent>Voir en ligne</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Everything inline */}
                <div className="flex items-center gap-3 shrink-0">
                    {/* Status + Sync pills */}
                    <StatusPill />
                    <SyncPill
                        productId={productId}
                        dirtyFields={dirtyFieldsContent}
                        lastSyncedAt={product.last_synced_at}
                        hasConflict={hasConflict}
                        onResolveConflicts={onResolveConflicts}
                    />

                    {/* Save status indicator */}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {isSaving ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Sauvegarde...</>
                        ) : isPublishing ? (
                            <><CloudUpload className="w-3 h-3 animate-pulse text-primary" /> Publication...</>
                        ) : saveStatus === 'error' ? (
                            <span className="text-destructive">Erreur</span>
                        ) : isDirty ? (
                            <span className="text-amber-500">Non enregistré</span>
                        ) : (
                            <><Check className="w-3 h-3" /> Sauvegardé</>
                        )}
                    </span>

                    {/* Undo / Redo */}
                    <TooltipProvider delayDuration={300}>
                        <div className="flex items-center gap-0.5">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={history.undo}
                                        disabled={!history.canUndo}
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    >
                                        <Undo2 className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Annuler (Ctrl+Z)</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={history.redo}
                                        disabled={!history.canRedo}
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    >
                                        <Redo2 className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Rétablir (Ctrl+Y)</TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>

                    {/* History counter */}
                    <span className="text-xs text-muted-foreground/50 font-medium tabular-nums">
                        {history.historyIndex}/{history.historyLength}
                    </span>

                    <div className="w-px h-6 bg-border/30 hidden sm:block mx-1" />

                    <Button
                        variant="outline"
                        onClick={onReset}
                        disabled={!isDirty || isSaving}
                        className="h-10 px-6 font-bold text-xs uppercase tracking-widest border-border/50 hover:bg-muted/50 transition-all"
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={isSaving}
                        variant="outline"
                        className="h-10 px-6 font-extrabold text-xs uppercase tracking-widest border-primary/25 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-sm hover:shadow-primary/20"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Envoi...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Enregistrer
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={onPublish}
                        disabled={isPublishing || isDirty || (!hasPendingChanges && !hasConflict)}
                        variant="outline"
                        className={cn(
                            "h-10 px-6 font-extrabold text-xs uppercase tracking-widest transition-all",
                            hasPendingChanges
                                ? "border-primary bg-primary/15 text-primary hover:bg-primary/25 dark:bg-primary/20 dark:hover:bg-primary/30 shadow-[0_0_15px_-5px_hsl(var(--chart-1))]"
                                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        {isPublishing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Publication...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Publier
                                {hasPendingChanges && (
                                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] font-bold bg-primary/20 text-primary dark:text-primary border-0">
                                        {dirtyFieldsContent.length}
                                    </Badge>
                                )}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
