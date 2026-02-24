"use client";

import React from "react";
import Link from "next/link";
import { useFormContext, useWatch } from "react-hook-form";
import { ArrowLeft, Save, Loader2, ExternalLink, Check, Undo2, Redo2, CloudUpload, Upload } from "lucide-react";
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
        <Tooltip>
            <TooltipTrigger asChild>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground truncate cursor-default">
                    {displayTitle}
                </h1>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start" className="max-w-[500px] text-sm font-medium">
                {displayTitle}
            </TooltipContent>
        </Tooltip>
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
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-4 sm:-mx-6 px-4 sm:px-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6 pb-4 pt-4 border-b border-border/20">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Back Button */}
                <Button variant="ghost" size="icon" asChild className="h-10 w-10 bg-muted border border-border hover:bg-muted/80 rounded-lg shrink-0 transition-colors">
                    <Link href="/app/products">
                        <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                    </Link>
                </Button>
                <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                            {product.platform || "Produit"} {product.platform_product_id && <span className="opacity-50 ml-1">#{product.platform_product_id}</span>}
                        </p>
                        {isSaving && (
                            <Badge variant="outline" className="h-4 px-1.5 py-0 text-[9px] font-bold bg-muted text-muted-foreground border-border/20 uppercase tracking-widest shrink-0">
                                <Loader2 className="w-2.5 h-2.5 mr-1 animate-spin" />
                                Sauvegarde...
                            </Badge>
                        )}
                        {isPublishing && !isSaving && (
                            <Badge variant="outline" className="h-4 px-1.5 py-0 text-[9px] font-bold bg-primary/10 text-primary dark:text-primary border-primary/20 uppercase tracking-widest shrink-0">
                                <CloudUpload className="w-2.5 h-2.5 mr-1 animate-pulse" />
                                Publication...
                            </Badge>
                        )}
                        {saveStatus === 'saved' && !isDirty && !isPublishing && !isSaving && (
                            <Badge variant="outline" className="h-4 px-1.5 py-0 text-[9px] font-bold bg-success/10 text-success border-success/20 uppercase tracking-widest shrink-0">
                                <Check className="w-2.5 h-2.5 mr-1" />
                                Sauvegardé
                            </Badge>
                        )}
                        {saveStatus === 'error' && (
                            <Badge variant="outline" className="h-4 px-1.5 py-0 text-[9px] font-bold bg-destructive/10 text-destructive border-destructive/20 uppercase tracking-widest shrink-0">
                                Erreur
                            </Badge>
                        )}
                        {isDirty && !isSaving && !isPublishing && (
                            <Badge variant="outline" className="h-4 px-1.5 py-0 text-[9px] font-bold bg-warning/10 text-warning border-warning/20 uppercase tracking-widest shrink-0">
                                Non sauvegardé
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <TooltipProvider delayDuration={400}>
                            <ProductTitleDisplay />
                        </TooltipProvider>
                        {productUrl && (
                            <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                                title="Voir en ligne"
                            >
                                <a
                                    href={productUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                {/* Status Pill */}
                <StatusPill />

                {/* Sync Pill */}
                <SyncPill
                    productId={productId}
                    dirtyFields={dirtyFieldsContent}
                    lastSyncedAt={product.last_synced_at}
                    hasConflict={hasConflict}
                    onResolveConflicts={onResolveConflicts}
                />

                <div className="w-px h-6 bg-border/30 hidden sm:block" />

                {/* Undo/Redo Controls */}
                <TooltipProvider delayDuration={300}>
                    <div className="flex items-center gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={history.undo}
                                    disabled={!history.canUndo}
                                    className="h-9 w-9"
                                >
                                    <Undo2 className="h-4 w-4" />
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
                                    className="h-9 w-9"
                                >
                                    <Redo2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>R\u00e9tablir (Ctrl+Y)</TooltipContent>
                        </Tooltip>
                        {history.historyLength > 1 && (
                            <span className="text-[10px] text-muted-foreground tabular-nums font-medium ml-0.5">
                                {history.historyIndex + 1}/{history.historyLength}
                            </span>
                        )}
                    </div>
                </TooltipProvider>

                <div className="w-px h-6 bg-border/30 hidden sm:block" />

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
    );
};
