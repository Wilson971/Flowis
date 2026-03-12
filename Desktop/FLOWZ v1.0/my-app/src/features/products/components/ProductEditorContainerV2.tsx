"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { FormProvider, useWatch } from "react-hook-form";
import { AlertTriangle, Package } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct } from "@/hooks/products/useProducts";
import { useConflictDetection, useDirtyVariationsCount } from "@/hooks/products";
import { useProductContent } from "@/hooks/products/useProductContent";
import { useDraftActions } from "@/features/products/hooks/useDraftActions";
import { getRemainingProposals, getContentStatus } from "@/lib/productHelpers";
import { useProductForm, ProductFormValues } from "../hooks/useProductForm";
import { useProductActions } from "../hooks/useProductActions";
import { useSeoAnalysis } from "../hooks/useSeoAnalysis";
import { useFormHistory } from "../hooks/useFormHistory";
import { useFormHistoryKeyboard } from "../hooks/useFormHistoryKeyboard";
import { useFormStabilization } from "../hooks/useFormStabilization";
import { useNavigationGuard } from "../hooks/useNavigationGuard";
import { usePushSingleProduct } from "@/hooks/sync/usePushToStore";
import { useProductVersionManager } from "@/hooks/products/useProductVersions";
import {
    ProductEditContext,
    ProductEditContextType,
    defaultDraftActions
} from "../context/ProductEditContext";
import { ProductEditorLayoutV2 } from "./edit/ProductEditorLayoutV2";
import { ProductEditorHeaderV2 } from "./edit/ProductEditorHeaderV2";
import { ProductEditorSidebarV2 } from "./edit/ProductEditorSidebarV2";
import { GeneralTabV2 } from "./edit/tabs/GeneralTabV2";
import { MediaTabV2 } from "./edit/tabs/MediaTabV2";
import { VariationsTabV2 } from "./edit/tabs/VariationsTabV2";
import { SeoTabV2 } from "./edit/tabs/SeoTabV2";
import { ConflictResolutionDialog } from "@/components/products/ConflictResolutionDialog";
import { useSelectedStore } from "@/contexts/StoreContext";
import { useCategories } from "@/hooks/products/useProductCategories";

interface ProductEditorContainerV2Props {
    productId: string;
}

export const ProductEditorContainerV2 = ({ productId }: ProductEditorContainerV2Props) => {
    // 0. Store Context
    const { selectedStore } = useSelectedStore();

    // 1. Data fetching
    const { data: product, isLoading, isFetching, error, refetch: refetchProduct } = useProduct(productId);

    // 2. Shared restoring ref
    const isRestoringRef = useRef<boolean>(false);
    const variationSaveRef = useRef<(() => Promise<void>) | null>(null);

    // 2b. Form hook
    const methods = useProductForm({ product, isRestoringRef });
    const watchedProductType = useWatch({ control: methods.control, name: "product_type" });

    // 3. Categories
    const { data: categories = [], isLoading: isLoadingCategories } = useCategories(selectedStore?.id);

    // 4. Actions
    const actions = useProductActions({ productId, availableCategories: categories });
    const pushToStore = usePushSingleProduct();

    const handlePublish = useCallback(() => {
        const title = methods.getValues("title");
        if (!title?.trim()) {
            toast.warning("Titre requis", {
                description: "Le produit doit avoir un titre avant d\u2019\u00eatre publi\u00e9 vers la boutique.",
            });
            return;
        }
        if (methods.formState.isDirty) {
            toast.warning("Modifications non sauvegard\u00e9es", {
                description: "Sauvegardez d\u2019abord vos modifications (Ctrl+S) avant de publier.",
            });
            return;
        }
        pushToStore.push(productId);
    }, [pushToStore, productId, methods]);

    // 4b. Conflict detection
    const { data: conflictData, refetch: refetchConflicts } = useConflictDetection(productId);

    // 4c. Dirty variations count
    const { data: dirtyVariationsCount = 0 } = useDirtyVariationsCount(productId, selectedStore?.id);
    const [conflictDialogOpen, setConflictDialogOpen] = useState(false);

    // 5. SEO Analysis
    const { analysisData, runServerAnalysis } = useSeoAnalysis({ control: methods.control });

    // Content Buffer & Drafts
    const { data: contentBuffer, refetch: refetchContentBuffer } = useProductContent(productId);
    const userModifiedFieldsRef = useRef<Set<string>>(new Set());

    // Version History
    const versionManager = useProductVersionManager({
        productId,
        enabled: !isLoading && !!product,
    });

    const handleFieldAccepted = useCallback(() => {
        const currentValues = methods.getValues();
        versionManager.createVersion({
            product_id: productId,
            form_data: currentValues,
            trigger_type: 'ai_approval',
        }).catch(() => { /* version creation is non-blocking */ });
    }, [methods, versionManager, productId]);

    // Draft Actions
    const draftActions = useDraftActions({
        productId,
        storeId: selectedStore?.id,
        setValue: methods.setValue,
        userModifiedFieldsRef,
        onFieldAccepted: handleFieldAccepted,
    });

    // Dirty fields computation
    const dirtyFieldsContent = useMemo(() => {
        const fields = contentBuffer?.dirty_fields_content || [];
        if (dirtyVariationsCount > 0 && !fields.includes("variations")) {
            return [...fields, "variations"];
        }
        return fields;
    }, [contentBuffer?.dirty_fields_content, dirtyVariationsCount]);

    const hasDraft = !!contentBuffer?.draft_generated_content;
    const remainingProposals = useMemo(() => contentBuffer
        ? getRemainingProposals(contentBuffer.draft_generated_content, contentBuffer.working_content)
        : [], [contentBuffer]);

    const hasConflict = conflictData?.hasConflict ?? false;

    const dirtyFieldsData = {
        dirtyFieldsContent,
        contentStatus: getContentStatus(dirtyFieldsContent, hasDraft),
        hasConflict,
    };

    // Undo/Redo
    const history = useFormHistory({
        methods,
        enabled: !isLoading && !!product,
        maxSnapshots: 50,
        debounceMs: 500,
        isRestoringRef,
    });

    // Save Status
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
        };
    }, []);

    // Form stabilization
    const { formStableRef, postSaveGuardRef } = useFormStabilization({
        product, isLoading, isFetching, methods, history,
    });

    const isDirty = formStableRef.current ? methods.formState.isDirty : false;
    const hasUnsavedChanges = isDirty || (formStableRef.current && !history.isAtSavedState);

    // Navigation guard
    useNavigationGuard({
        isDirty: hasUnsavedChanges,
        enabled: true,
    });

    // Save handler
    const handleManualSave = useCallback(async (data: ProductFormValues) => {
        try {
            setSaveStatus('saving');
            postSaveGuardRef.current = true;

            await actions.handleSave(data);

            let variationSaveOk = true;
            if (variationSaveRef.current) {
                try {
                    await variationSaveRef.current();
                } catch (varErr) {
                    variationSaveOk = false;
                    toast.error("Erreur de sauvegarde des variations", {
                        description: varErr instanceof Error ? varErr.message : "Les variations n\u2019ont pas pu \u00eatre sauvegard\u00e9es.",
                    });
                }
            }

            methods.reset(data, { keepDefaultValues: false });
            history.markAsSaved();

            setSaveStatus('saved');
            if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
            saveStatusTimerRef.current = setTimeout(() => {
                saveStatusTimerRef.current = null;
                setSaveStatus('idle');
            }, 3000);

            if (variationSaveOk) {
                versionManager.createVersion({
                    product_id: productId,
                    form_data: data,
                    trigger_type: 'manual_save',
                }).catch(() => { /* version creation is non-blocking */ });
            }
        } catch (e) {
            postSaveGuardRef.current = false;
            setSaveStatus('error');
            if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
            saveStatusTimerRef.current = setTimeout(() => {
                saveStatusTimerRef.current = null;
                setSaveStatus('idle');
            }, 5000);
            toast.error("Erreur de sauvegarde", {
                description: e instanceof Error ? e.message : "Une erreur est survenue. Veuillez r\u00e9essayer.",
            });
        }
    }, [actions, methods, history, versionManager, productId]);

    // Keyboard save
    const handleKeyboardSave = useCallback(() => {
        if (actions.isSaving) return;
        methods.handleSubmit(handleManualSave)();
    }, [actions.isSaving, methods, handleManualSave]);

    const handleKeyboardSaveRef = useRef(handleKeyboardSave);
    useEffect(() => {
        handleKeyboardSaveRef.current = handleKeyboardSave;
    }, [handleKeyboardSave]);

    useFormHistoryKeyboard({
        undo: history.undo,
        redo: history.redo,
        canUndo: history.canUndo,
        canRedo: history.canRedo,
        onSave: () => handleKeyboardSaveRef.current(),
        enabled: !isLoading && !!product,
    });

    // Version restore
    const handleVersionRestored = useCallback((formData: ProductFormValues) => {
        isRestoringRef.current = true;
        methods.reset(structuredClone(formData), { keepDefaultValues: false });
        requestAnimationFrame(() => {
            isRestoringRef.current = false;
        });
        history.captureSnapshot('Version restaur\u00e9e');
    }, [methods, history]);

    // Context value
    const contextValue = useMemo<ProductEditContextType>(() => ({
        productId,
        product,
        isLoading,
        form: methods,
        isSaving: actions.isSaving,
        handleSave: actions.handleSave,
        savedSnapshot: null,
        contentBuffer: contentBuffer ?? undefined,
        dirtyFieldsData,
        remainingProposals,
        generationManifest: contentBuffer?.generation_manifest ?? null,
        draftActions,
        refetchProduct,
        refetchContentBuffer,
        selectedStore,
        seoAnalysis: analysisData,
        runSeoAnalysis: runServerAnalysis,
        formHistory: history,
        saveStatus,
    }), [
        productId, product, isLoading, methods, actions.isSaving, actions.handleSave,
        refetchProduct, refetchContentBuffer, selectedStore, analysisData, runServerAnalysis,
        contentBuffer, contentBuffer?.generation_manifest, dirtyFieldsData, remainingProposals, draftActions, history, saveStatus
    ]);

    // ========================================================================
    // RENDER
    // ========================================================================

    // Loading state — Vercel Pro skeleton
    if (isLoading) {
        return (
            <div className="container max-w-7xl mx-auto py-8 space-y-6">
                {/* Header skeleton */}
                <div className="h-14 rounded-xl border border-border/40 bg-card flex items-center px-6 gap-4">
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-4 w-48 rounded" />
                    <div className="ml-auto flex items-center gap-2">
                        <Skeleton className="h-7 w-24 rounded-lg" />
                        <Skeleton className="h-8 w-28 rounded-lg" />
                    </div>
                </div>
                {/* Tabs skeleton */}
                <div className="flex items-center gap-4 border-b border-border/40 pb-2">
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                </div>
                {/* Content skeleton */}
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6">
                    <div className="space-y-4">
                        <Skeleton className="h-96 w-full rounded-xl" />
                        <Skeleton className="h-48 w-full rounded-xl" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-32 w-full rounded-xl" />
                        <Skeleton className="h-48 w-full rounded-xl" />
                        <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    // Error state — Vercel Pro empty state
    if (error || !product) {
        return (
            <div className="container max-w-7xl mx-auto py-12">
                <div className="py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 mx-auto mb-3">
                        <Package className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                    <p className="text-[15px] font-semibold tracking-tight text-foreground">
                        Produit introuvable
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs mx-auto">
                        Le produit demand\u00e9 n&apos;existe pas ou a \u00e9t\u00e9 supprim\u00e9.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[11px] rounded-lg gap-1.5 font-medium mt-4"
                        asChild
                    >
                        <Link href="/app/products">Retour \u00e0 la liste</Link>
                    </Button>
                </div>
            </div>
        );
    }

    // Main render
    return (
        <FormProvider {...methods}>
            <ProductEditContext.Provider value={contextValue}>
                <div className="container max-w-7xl mx-auto pt-4">
                    {/* Header */}
                    <ProductEditorHeaderV2
                        product={product}
                        productId={productId}
                        selectedStore={selectedStore}
                        saveStatus={saveStatus}
                        isDirty={isDirty}
                        dirtyFieldsContent={dirtyFieldsContent}
                        hasConflict={hasConflict}
                        isSaving={actions.isSaving}
                        isPublishing={pushToStore.isPending}
                        history={history}
                        onSave={() => methods.handleSubmit(handleManualSave)()}
                        onPublish={handlePublish}
                        onReset={() => methods.reset()}
                        onResolveConflicts={() => setConflictDialogOpen(true)}
                    />

                    {/* Conflict Banner */}
                    {hasConflict && (
                        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3">
                            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                            <div className="flex-1">
                                <p className="text-[13px] font-semibold tracking-tight text-foreground">
                                    Conflit d\u00e9tect\u00e9 \u2014 {conflictData?.conflicts.length} champ{(conflictData?.conflicts.length ?? 0) > 1 ? "s" : ""} en conflit
                                </p>
                                <p className="text-[11px] text-muted-foreground/60">
                                    Le produit a \u00e9t\u00e9 modifi\u00e9 sur la boutique depuis votre derni\u00e8re synchronisation.
                                </p>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="h-7 text-[11px] rounded-lg font-medium"
                                onClick={() => setConflictDialogOpen(true)}
                            >
                                R\u00e9soudre
                            </Button>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={methods.handleSubmit(handleManualSave)} className="w-full">
                        <ProductEditorLayoutV2
                            sidebar={
                                <ProductEditorSidebarV2
                                    productId={productId}
                                    availableCategories={categories}
                                    isLoadingCategories={isLoadingCategories}
                                    onVersionRestored={handleVersionRestored}
                                    isVariableProduct={watchedProductType === "variable"}
                                    variationsCount={product?.metadata?.variations_count ?? 0}
                                    lastSyncedAt={product?.last_synced_at}
                                    dirtyFields={dirtyFieldsContent}
                                    hasConflict={hasConflict}
                                    onResolveConflicts={() => setConflictDialogOpen(true)}
                                />
                            }
                        >
                            <GeneralTabV2 />
                            <MediaTabV2 />
                            {watchedProductType === "variable" && (
                                <VariationsTabV2
                                    productId={productId}
                                    storeId={selectedStore?.id}
                                    platformProductId={product?.platform_product_id}
                                    metadataVariants={product?.metadata?.variants as unknown[] | undefined}
                                    onRegisterSave={(saveFn) => { variationSaveRef.current = saveFn; }}
                                />
                            )}
                            <SeoTabV2 />
                        </ProductEditorLayoutV2>
                    </form>

                    {/* Conflict Resolution Dialog */}
                    <ConflictResolutionDialog
                        productId={productId}
                        open={conflictDialogOpen}
                        onOpenChange={setConflictDialogOpen}
                        onResolved={() => {
                            refetchProduct();
                            refetchContentBuffer();
                            refetchConflicts();
                        }}
                    />
                </div>
            </ProductEditContext.Provider>
        </FormProvider>
    );
};
