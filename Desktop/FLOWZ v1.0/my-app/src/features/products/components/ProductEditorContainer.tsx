"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { FormProvider, useWatch } from "react-hook-form";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
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
import { ProductEditorLayout } from "./edit/ProductEditorLayout";
import { ProductGeneralTab } from "./edit/ProductGeneralTab";
import { ProductMediaTab } from "./edit/ProductMediaTab";
import { ProductSeoTab } from "./edit/ProductSeoTab";
import { ProductVariationsTab } from "./edit/ProductVariationsTab";
import { ProductSidebar } from "./edit/ProductSidebar";
import { ConflictResolutionDialog } from "@/components/products/ConflictResolutionDialog";
import { useSelectedStore } from "@/contexts/StoreContext";
import { useCategories } from "@/hooks/products/useProductCategories";
import { ProductEditorHeader } from "./edit/ProductEditorHeader";

interface ProductEditorContainerProps {
    productId: string;
}

// Force HMR update
export const ProductEditorContainer = ({ productId }: ProductEditorContainerProps) => {
    // 0. Store Context
    const { selectedStore } = useSelectedStore();

    // 1. Data fetching (isFetching used for form stabilization signal)
    const { data: product, isLoading, isFetching, error, refetch: refetchProduct } = useProduct(productId);

    // 2. Shared restoring ref (coordinates between undo/redo and form sync)
    const isRestoringRef = useRef<boolean>(false);

    // 2c. Variation save ref — registered by ProductVariationsTab
    const variationSaveRef = useRef<(() => Promise<void>) | null>(null);

    // 2b. Form hook with Zod validation + restoring guard
    const methods = useProductForm({ product, isRestoringRef });

    // FIX B5: Single useWatch for product_type instead of multiple watch() in JSX
    const watchedProductType = useWatch({ control: methods.control, name: "product_type" });

    // 3. Categories fetching (avant actions pour passer les catégories disponibles)
    const { data: categories = [], isLoading: isLoadingCategories } = useCategories(selectedStore?.id);

    // 4. Actions (save, etc.) - avec les catégories pour résoudre les IDs WooCommerce
    const actions = useProductActions({ productId, availableCategories: categories });

    // 4a. Push to store (explicit publish action)
    const pushToStore = usePushSingleProduct();

    const handlePublish = useCallback(() => {
        const title = methods.getValues("title");
        if (!title?.trim()) {
            toast.warning("Titre requis", {
                description: "Le produit doit avoir un titre avant d'être publié vers la boutique.",
            });
            return;
        }
        if (methods.formState.isDirty) {
            toast.warning("Modifications non sauvegardées", {
                description: "Sauvegardez d'abord vos modifications (Ctrl+S) avant de publier.",
            });
            return;
        }
        pushToStore.push(productId);
    }, [pushToStore, productId, methods]);

    // 4b. Conflict detection
    const { data: conflictData, refetch: refetchConflicts } = useConflictDetection(productId);

    // 4c. Dirty variations count (feeds into SyncPill to show "variations" as a dirty field)
    const { data: dirtyVariationsCount = 0 } = useDirtyVariationsCount(productId, selectedStore?.id);
    const [conflictDialogOpen, setConflictDialogOpen] = useState(false);

    // 5. SEO Analysis (Lifted State)
    // We pass 'control' explicitly because we are outside the FormProvider here
    const { analysisData, runServerAnalysis } = useSeoAnalysis({ control: methods.control });

    // ------------------------------------------------------------------------
    // QUERY: Content Buffer & Drafts (NEW)
    // ------------------------------------------------------------------------
    const { data: contentBuffer, refetch: refetchContentBuffer } = useProductContent(productId);

    // Suivi des champs modifiés par l'utilisateur pour éviter les écrasements
    const userModifiedFieldsRef = useRef<Set<string>>(new Set());

    // ------------------------------------------------------------------------
    // VERSION HISTORY: Server-side versioning
    // ------------------------------------------------------------------------
    const versionManager = useProductVersionManager({
        productId,
        enabled: !isLoading && !!product,
    });

    // Callback: version creation on AI field acceptance
    const handleFieldAccepted = useCallback(() => {
        const currentValues = methods.getValues();
        versionManager.createVersion({
            product_id: productId,
            form_data: currentValues,
            trigger_type: 'ai_approval',
        }).catch(err => console.error('Failed to create ai_approval version:', err));
    }, [methods, versionManager, productId]);

    // ------------------------------------------------------------------------
    // HOOK: Draft Actions (NEW)
    // ------------------------------------------------------------------------
    const draftActions = useDraftActions({
        productId,
        storeId: selectedStore?.id,
        setValue: methods.setValue,
        userModifiedFieldsRef,
        onFieldAccepted: handleFieldAccepted,
    });

    // Calcul des calculs de champs dirty/draft
    // Merge product dirty fields with dirty variations count
    const dirtyFieldsContent = useMemo(() => {
        const fields = contentBuffer?.dirty_fields_content || [];
        if (dirtyVariationsCount > 0 && !fields.includes("variations")) {
            return [...fields, "variations"];
        }
        return fields;
    }, [contentBuffer?.dirty_fields_content, dirtyVariationsCount]);
    const hasDraft = !!contentBuffer?.draft_generated_content;
    const remainingProposals = React.useMemo(() => contentBuffer
        ? getRemainingProposals(contentBuffer.draft_generated_content, contentBuffer.working_content)
        : [], [contentBuffer]);

    const hasConflict = conflictData?.hasConflict ?? false;

    const dirtyFieldsData = {
        dirtyFieldsContent,
        contentStatus: getContentStatus(dirtyFieldsContent, hasDraft),
        hasConflict,
    };

    // (contextValue useMemo moved below after all hooks are defined)

    // ------------------------------------------------------------------------
    // UNDO/REDO: Form History
    // ------------------------------------------------------------------------
    const history = useFormHistory({
        methods,
        enabled: !isLoading && !!product,
        maxSnapshots: 50,
        debounceMs: 500,
        isRestoringRef,
    });

    // ------------------------------------------------------------------------
    // SAVE STATUS: Simple feedback for manual save button
    // ------------------------------------------------------------------------
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cleanup save status timer on unmount
    useEffect(() => {
        return () => {
            if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
        };
    }, []);

    // Form stabilization guard — extracted to dedicated hook for clarity.
    // Prevents false dirty state during initial form setup and post-save refetch cycles.
    const { formStableRef, postSaveGuardRef } = useFormStabilization({
        product, isLoading, isFetching, methods, history,
    });


    // Calculate dirty state
    // FIX: Suppress isDirty during form initialization (before formStableRef is true).
    // Prevents false "NON SAUVEGARDÉ" caused by transient isDirty during reset propagation
    // and component normalization (e.g. TipTap converting "" → "<p></p>").
    const isDirty = formStableRef.current ? methods.formState.isDirty : false;
    const hasUnsavedChanges = isDirty || (formStableRef.current && !history.isAtSavedState);

    // ------------------------------------------------------------------------
    // NAVIGATION GUARD: Prevent accidental data loss
    // ------------------------------------------------------------------------
    useNavigationGuard({
        isDirty: hasUnsavedChanges,
        enabled: true,
    });

    // ------------------------------------------------------------------------
    // SAVE: Single handler shared by keyboard shortcut (Ctrl+S) and button
    // FIX B3: Deduplicated — was previously two nearly-identical functions
    // ------------------------------------------------------------------------
    const handleManualSave = useCallback(async (data: ProductFormValues) => {
        try {
            setSaveStatus('saving');
            // Arm the post-save guard BEFORE the save so the stabilization effect
            // doesn't destabilize the form when queries are invalidated in onSuccess.
            postSaveGuardRef.current = true;

            await actions.handleSave(data);

            // Save variations if the tab registered a save function
            let variationSaveOk = true;
            if (variationSaveRef.current) {
                try {
                    await variationSaveRef.current();
                } catch (varErr) {
                    variationSaveOk = false;
                    toast.error("Erreur de sauvegarde des variations", {
                        description: varErr instanceof Error ? varErr.message : "Les variations n'ont pas pu être sauvegardées.",
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
                }).catch(err => console.error('Failed to create version:', err));
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
                description: e instanceof Error ? e.message : "Une erreur est survenue. Veuillez réessayer.",
            });
        }
    }, [actions, methods, history, versionManager, productId]);

    // Keyboard save: triggers form validation then calls shared handler
    const handleKeyboardSave = useCallback(() => {
        if (actions.isSaving) return;
        methods.handleSubmit(handleManualSave)();
    }, [actions.isSaving, methods, handleManualSave]);

    // FIX H13: Use a ref to avoid stale closure in keyboard listener.
    // useFormHistoryKeyboard registers a keydown listener that could capture
    // a stale handleKeyboardSave reference between effect cleanup cycles.
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

    // ------------------------------------------------------------------------
    // VERSION RESTORE: Callback when restoring from sidebar history
    // ------------------------------------------------------------------------
    const handleVersionRestored = useCallback((formData: ProductFormValues) => {
        isRestoringRef.current = true;
        methods.reset(structuredClone(formData), { keepDefaultValues: false });
        requestAnimationFrame(() => {
            isRestoringRef.current = false;
        });
        history.captureSnapshot('Version restaurée');
    }, [methods, history]);

    // ------------------------------------------------------------------------
    // CONTEXT VALUE: Memoized context for child components
    // (placed after all hooks to avoid TDZ issues)
    // ------------------------------------------------------------------------
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
        contentBuffer, dirtyFieldsData, remainingProposals, draftActions, history, saveStatus
    ]);

    return (
        <>
            {isLoading && (
                <div className="container max-w-7xl mx-auto py-8 space-y-8">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6">
                        <div className="space-y-6">
                            <Skeleton className="h-96 w-full" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                        <Skeleton className="h-[600px] w-full" />
                    </div>
                </div>
            )}

            {!isLoading && (error || !product) && (
                <div className="container max-w-7xl mx-auto py-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                        <h2 className="text-2xl font-bold">Produit introuvable</h2>
                        <p className="text-muted-foreground">
                            Le produit demandé n&apos;existe pas ou a été supprimé.
                        </p>
                        <Button variant="outline" asChild>
                            <Link href="/app/products">Retour à la liste</Link>
                        </Button>
                    </div>
                </div>
            )}

            {!isLoading && !error && product && (
                <FormProvider {...methods}>
                    <ProductEditContext.Provider value={contextValue}>
                        <div className="container max-w-7xl mx-auto pt-4">
                            {/* Page Header */}
                            <ProductEditorHeader
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
                                <div className="mb-6 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-destructive dark:text-destructive">
                                            Conflit détecté — {conflictData?.conflicts.length} champ{(conflictData?.conflicts.length ?? 0) > 1 ? "s" : ""} en conflit
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Le produit a été modifié sur la boutique depuis votre dernière synchronisation.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => setConflictDialogOpen(true)}
                                    >
                                        Résoudre
                                    </Button>
                                </div>
                            )}

                            {/* Layout */}
                            <form onSubmit={methods.handleSubmit(handleManualSave)} className="w-full">
                                <ProductEditorLayout
                                    sidebar={(
                                        <ProductSidebar
                                            productId={productId}
                                            availableCategories={categories}
                                            isLoadingCategories={isLoadingCategories}
                                            onVersionRestored={handleVersionRestored}
                                            isVariableProduct={watchedProductType === "variable"}
                                            variationsCount={product?.metadata?.variations_count ?? 0}
                                        />
                                    )}
                                >
                                    <ProductGeneralTab />
                                    <ProductMediaTab />
                                    {watchedProductType === "variable" && (
                                        <ProductVariationsTab
                                            productId={productId}
                                            storeId={selectedStore?.id}
                                            platformProductId={product?.platform_product_id}
                                            metadataVariants={product?.metadata?.variants as unknown[] | undefined}
                                            onRegisterSave={(saveFn) => { variationSaveRef.current = saveFn; }}
                                        />
                                    )}
                                    <ProductSeoTab />
                                </ProductEditorLayout>
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
            )}
        </>
    );
};
