"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { FormProvider, useWatch } from "react-hook-form";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct } from "@/hooks/useProducts";
import { useConflictDetection, useDirtyVariationsCount } from "@/hooks/products";
import { useProductContent } from "@/hooks/useProductContent";
import { useDraftActions } from "@/features/products/hooks/useDraftActions";
import { getRemainingProposals, getContentStatus } from "@/lib/productHelpers";
import { useProductForm, ProductFormValues } from "../hooks/useProductForm";
import { useProductActions } from "../hooks/useProductActions";
import { useSeoAnalysis } from "../hooks/useSeoAnalysis";
import { useFormHistory } from "../hooks/useFormHistory";
import { useFormHistoryKeyboard } from "../hooks/useFormHistoryKeyboard";
import { useNavigationGuard } from "../hooks/useNavigationGuard";
import { useAutoSaveProduct } from "@/hooks/products/useProductSave";
import { transformFormToSaveData } from "../utils/transformFormToSaveData";
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
    // AUTO-SAVE: Debounced save to Supabase (no WooCommerce sync)
    // ------------------------------------------------------------------------
    const autoSave = useAutoSaveProduct();
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    // Lock: prevent auto-save while manual save is in-flight (race condition guard)
    const manualSaveLockRef = useRef<boolean>(false);
    // Cooldown: prevent auto-save from firing shortly after a manual save
    // (to avoid overwriting dirty_fields_content that was just cleared by push-to-store)
    const manualSaveCooldownRef = useRef<number>(0);

    // Form stabilization guard — prevent auto-save during initial form setup.
    // Uses isFetching signal from TanStack Query instead of an arbitrary 3s timer.
    // When isFetching goes false, we add a 200ms micro-delay to let the form reset propagate.
    const formStableRef = useRef(false);
    const formStableTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!product || isLoading || isFetching) {
            formStableRef.current = false;
            if (formStableTimerRef.current) {
                clearTimeout(formStableTimerRef.current);
                formStableTimerRef.current = null;
            }
            return;
        }

        // Data arrived and query is idle — wait for form reset + TipTap stabilization.
        // useProductForm does a re-reset at 500ms to absorb TipTap HTML normalization,
        // so we wait 700ms before marking the form as stable and saved.
        formStableTimerRef.current = setTimeout(() => {
            formStableRef.current = true;
            // Mark history as saved once form is stable — prevents false "NON SAUVEGARDÉ"
            // caused by form reset creating spurious history entries during initialization
            history.markAsSaved();
        }, 700);

        return () => {
            if (formStableTimerRef.current) clearTimeout(formStableTimerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product?.id, product?.last_synced_at, isLoading, isFetching]);

    // Watch form changes for auto-save
    useEffect(() => {
        if (!product || isLoading) return;

        const subscription = methods.watch(() => {
            // FIX: Skip auto-save until form is fully stabilized after load/sync
            if (!formStableRef.current) return;
            if (isRestoringRef.current) return;
            if (!methods.formState.isDirty) return;

            // Skip auto-save if manual save is in-flight (prevents race condition)
            if (manualSaveLockRef.current) return;

            // Skip auto-save if within cooldown period after manual save
            if (Date.now() - manualSaveCooldownRef.current < 15_000) return;

            // Cancel any previous saved-state reset timer
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
                autoSaveTimerRef.current = null;
            }

            const currentValues = methods.getValues();
            const saveData = transformFormToSaveData(currentValues, categories);

            setAutoSaveStatus('saving');
            autoSave.debouncedSave(productId, saveData, 5000);
        });

        return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product, isLoading, productId, categories]);

    // Track auto-save completion
    useEffect(() => {
        if (autoSave.isSuccess && autoSaveStatus === 'saving') {
            setAutoSaveStatus('saved');
            // Reset to idle after 3 seconds
            autoSaveTimerRef.current = setTimeout(() => {
                setAutoSaveStatus('idle');
            }, 3000);

            // Rate-limited auto-save version creation (every 5 min max)
            if (versionManager.canCreateAutoVersion()) {
                const currentValues = methods.getValues();
                versionManager.createVersion({
                    product_id: productId,
                    form_data: currentValues,
                    trigger_type: 'auto_save',
                }).catch(err => console.error('Failed to create auto-save version:', err));
            }
        }
        if (autoSave.isError) {
            setAutoSaveStatus('error');
            autoSaveTimerRef.current = setTimeout(() => {
                setAutoSaveStatus('idle');
            }, 5000);
        }

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoSave.isSuccess, autoSave.isError, autoSaveStatus]);

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
            // Lock: prevent auto-save from firing while manual save is in-flight
            manualSaveLockRef.current = true;
            autoSave.cancelAutoSave();
            manualSaveCooldownRef.current = Date.now();

            await actions.handleSave(data);

            // Save variations if the tab registered a save function
            let variationSaveOk = true;
            if (variationSaveRef.current) {
                try {
                    await variationSaveRef.current();
                } catch (varErr) {
                    variationSaveOk = false;
                    console.error('Variation save failed:', varErr);
                    toast.error("Erreur de sauvegarde des variations", {
                        description: varErr instanceof Error ? varErr.message : "Les variations n'ont pas pu être sauvegardées.",
                    });
                }
            }

            methods.reset(data, { keepDefaultValues: false });
            history.markAsSaved();
            setAutoSaveStatus('saved');

            if (variationSaveOk) {
                versionManager.createVersion({
                    product_id: productId,
                    form_data: data,
                    trigger_type: 'manual_save',
                }).catch(err => console.error('Failed to create version:', err));
            }
        } catch (e) {
            toast.error("Erreur de sauvegarde", {
                description: e instanceof Error ? e.message : "Une erreur est survenue. Veuillez réessayer.",
            });
        } finally {
            // Release lock after manual save completes (success or failure)
            manualSaveLockRef.current = false;
        }
    }, [actions, methods, history, autoSave, versionManager, productId]);

    // Keyboard save: triggers form validation then calls shared handler
    const handleKeyboardSave = useCallback(() => {
        if (actions.isSaving) return;
        methods.handleSubmit(handleManualSave)();
    }, [actions.isSaving, methods, handleManualSave]);

    useFormHistoryKeyboard({
        undo: history.undo,
        redo: history.redo,
        canUndo: history.canUndo,
        canRedo: history.canRedo,
        onSave: handleKeyboardSave,
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
        contentBuffer,
        dirtyFieldsData,
        remainingProposals,
        draftActions,
        refetchProduct,
        refetchContentBuffer,
        selectedStore,
        seoAnalysis: analysisData,
        runSeoAnalysis: runServerAnalysis,
        formHistory: history,
        autoSaveStatus,
    }), [
        productId, product, isLoading, methods, actions.isSaving, actions.handleSave,
        refetchProduct, refetchContentBuffer, selectedStore, analysisData, runServerAnalysis,
        contentBuffer, dirtyFieldsData, remainingProposals, draftActions, history, autoSaveStatus
    ]);

    return (
        <>
            {isLoading && (
                <div className="container max-w-7xl mx-auto py-8 space-y-8">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-md" />
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
                                autoSaveStatus={autoSaveStatus}
                                isDirty={isDirty}
                                dirtyFieldsContent={dirtyFieldsContent}
                                hasConflict={hasConflict}
                                isSaving={actions.isSaving}
                                history={history}
                                onSave={() => methods.handleSubmit(handleManualSave)()}
                                onReset={() => methods.reset()}
                                onResolveConflicts={() => setConflictDialogOpen(true)}
                            />

                            {/* Conflict Banner */}
                            {hasConflict && (
                                <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3">
                                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
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
