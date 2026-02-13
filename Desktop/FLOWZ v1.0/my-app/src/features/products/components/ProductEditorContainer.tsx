"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { FormProvider, useFormContext, useWatch } from "react-hook-form";
import { ArrowLeft, Save, Loader2, AlertCircle, ExternalLink, AlertTriangle, Check, ChevronDown, RefreshCw, CheckCircle2, Clock, Undo2, Redo2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { useRef } from "react";
import { useProduct } from "@/hooks/useProducts";
import { useConflictDetection } from "@/hooks/products";
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

const STATUS_OPTIONS = [
    { value: "publish", label: "Publié", dotClass: "bg-emerald-500", textClass: "text-emerald-700 dark:text-emerald-400" },
    { value: "draft", label: "Brouillon", dotClass: "bg-zinc-400", textClass: "text-muted-foreground" },
    { value: "pending", label: "En attente", dotClass: "bg-amber-500", textClass: "text-amber-700 dark:text-amber-400" },
    { value: "private", label: "Privé", dotClass: "bg-blue-500", textClass: "text-blue-700 dark:text-blue-400" },
] as const;

const StatusPill = () => {
    const { setValue, control } = useFormContext<ProductFormValues>();
    const status = useWatch({ control, name: "status" });
    const [open, setOpen] = React.useState(false);

    const current = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[1];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border transition-colors text-sm font-semibold cursor-pointer",
                        "border-border/50 bg-muted/30 hover:bg-muted/60"
                    )}
                >
                    <span className={cn("w-2 h-2 rounded-full shrink-0", current.dotClass)} />
                    <span className={current.textClass}>{current.label}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-44 p-1.5" sideOffset={8}>
                {STATUS_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                            setValue("status", opt.value, { shouldDirty: true });
                            setOpen(false);
                        }}
                        className={cn(
                            "flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm transition-colors cursor-pointer",
                            status === opt.value
                                ? "bg-muted font-semibold"
                                : "hover:bg-muted/50"
                        )}
                    >
                        <span className={cn("w-2 h-2 rounded-full shrink-0", opt.dotClass)} />
                        <span className="flex-1 text-left">{opt.label}</span>
                        {status === opt.value && <Check className="h-3.5 w-3.5 text-foreground" />}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    );
};

// --- Sync Pill (header) ---

const SYNC_STATUS_CONFIG = {
    synced: {
        label: "Synchronisé",
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
        label: "Conflit détecté",
        shortLabel: "Conflit",
        dotClass: "bg-red-500",
        pillBorder: "border-red-500/30 bg-red-500/5 hover:bg-red-500/10 animate-pulse",
        textClass: "text-red-700 dark:text-red-400",
        icon: AlertTriangle,
    },
} as const;

type SyncStatus = keyof typeof SYNC_STATUS_CONFIG;

const FIELD_LABELS: Record<string, string> = {
    title: "Titre",
    description: "Description",
    short_description: "Desc. courte",
    regular_price: "Prix",
    sale_price: "Prix promo",
    stock: "Stock",
    sku: "SKU",
    slug: "Slug",
    "seo.title": "Meta titre",
    meta_title: "Meta titre",
    "seo.description": "Meta desc.",
    meta_description: "Meta desc.",
    categories: "Catégories",
    tags: "Tags",
    status: "Statut",
    images: "Images",
};

function formatRelativeTime(dateStr: string | null | undefined): string {
    if (!dateStr) return "Jamais";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    if (diffHour < 24) return `il y a ${diffHour}h`;
    if (diffDay < 7) return `il y a ${diffDay}j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

interface SyncPillProps {
    productId: string;
    dirtyFields: string[];
    lastSyncedAt?: string | null;
    hasConflict: boolean;
    onResolveConflicts: () => void;
}

const SyncPill = ({ productId, dirtyFields, lastSyncedAt, hasConflict, onResolveConflicts }: SyncPillProps) => {
    const [showRevertDialog, setShowRevertDialog] = React.useState(false);
    const pushMutation = usePushSingleProduct();
    const revertMutation = useRevertToOriginal();

    const status: SyncStatus = hasConflict ? "conflict" : dirtyFields.length > 0 ? "pending" : "synced";
    const config = SYNC_STATUS_CONFIG[status];
    const isSyncing = pushMutation.isPending;
    const isReverting = revertMutation.isPending;

    const handleSync = () => {
        pushMutation.mutate(
            { product_ids: [productId] },
            {
                onSuccess: () => toast.success("Synchronisation lancée"),
                onError: (err: any) => toast.error(err?.message || "Erreur de sync"),
            }
        );
    };

    const handleRevert = () => {
        revertMutation.mutate(
            { productIds: [productId] },
            {
                onSuccess: () => { toast.success("Modifications annulées"); setShowRevertDialog(false); },
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
                                Dernière sync : {formatRelativeTime(lastSyncedAt)}
                            </p>
                        )}
                    </div>

                    {/* Dirty fields */}
                    {status === "pending" && dirtyFields.length > 0 && (
                        <div className="px-4 py-2.5 border-b border-border/10">
                            <p className="text-[10px] text-muted-foreground mb-1.5">Champs modifiés :</p>
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
                                Le produit a été modifié sur la boutique et localement.
                            </p>
                        </div>
                    )}

                    {/* Synced message */}
                    {status === "synced" && (
                        <div className="px-4 py-2.5 border-b border-border/10">
                            <p className="text-xs text-muted-foreground">
                                Le produit est à jour avec la boutique.
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="px-4 py-3 flex gap-2">
                        {status === "conflict" && onResolveConflicts ? (
                            <Button type="button" size="sm" variant="destructive" className="flex-1 h-7 text-xs" onClick={onResolveConflicts}>
                                <AlertTriangle className="w-3 h-3 mr-1.5" />
                                Résoudre
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
                            Le contenu sera remis à sa dernière version synchronisée. Toutes les modifications non synchronisées seront perdues.
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

interface ProductEditorContainerProps {
    productId: string;
}

// Force HMR update
export const ProductEditorContainer = ({ productId }: ProductEditorContainerProps) => {
    // 0. Store Context
    const { selectedStore } = useSelectedStore();

    // 1. Data fetching
    const { data: product, isLoading, error, refetch: refetchProduct } = useProduct(productId);

    // 2. Shared restoring ref (coordinates between undo/redo and form sync)
    const isRestoringRef = useRef<boolean>(false);

    // 2b. Form hook with Zod validation + restoring guard
    const methods = useProductForm({ product, isRestoringRef });

    // 3. Categories fetching (avant actions pour passer les catégories disponibles)
    const { data: categories = [], isLoading: isLoadingCategories } = useCategories(selectedStore?.id);

    // 4. Actions (save, etc.) - avec les catégories pour résoudre les IDs WooCommerce
    const actions = useProductActions({ productId, availableCategories: categories });

    // 4b. Conflict detection
    const { data: conflictData, refetch: refetchConflicts } = useConflictDetection(productId);
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
    const dirtyFieldsContent = contentBuffer?.dirty_fields_content || [];
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
    // Cooldown: prevent auto-save from firing shortly after a manual save
    // (to avoid overwriting dirty_fields_content that was just cleared by push-to-store)
    const manualSaveCooldownRef = useRef<number>(0);

    // Watch form changes for auto-save
    useEffect(() => {
        if (!product || isLoading) return;

        const subscription = methods.watch(() => {
            if (isRestoringRef.current) return;
            if (!methods.formState.isDirty) return;

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
    const isDirty = methods.formState.isDirty;
    const hasUnsavedChanges = isDirty || !history.isAtSavedState;

    // ------------------------------------------------------------------------
    // NAVIGATION GUARD: Prevent accidental data loss
    // ------------------------------------------------------------------------
    useNavigationGuard({
        isDirty: hasUnsavedChanges,
        enabled: true,
    });

    // ------------------------------------------------------------------------
    // KEYBOARD SHORTCUTS: Ctrl+Z/Y/S
    // ------------------------------------------------------------------------
    const handleKeyboardSave = useCallback(() => {
        if (actions.isSaving) return;
        methods.handleSubmit(async (data) => {
            try {
                autoSave.cancelAutoSave();
                manualSaveCooldownRef.current = Date.now();
                await actions.handleSave(data);
                methods.reset(data, { keepDefaultValues: false });
                history.markAsSaved();
                setAutoSaveStatus('saved');

                versionManager.createVersion({
                    product_id: productId,
                    form_data: data,
                    trigger_type: 'manual_save',
                }).catch(err => console.error('Failed to create version:', err));
            } catch (e) {
                toast.error("Erreur de sauvegarde", {
                    description: "Une erreur est survenue. Veuillez réessayer.",
                });
            }
        })();
    }, [actions, methods, history, autoSave, versionManager, productId]);

    useFormHistoryKeyboard({
        undo: history.undo,
        redo: history.redo,
        canUndo: history.canUndo,
        canRedo: history.canRedo,
        onSave: handleKeyboardSave,
        enabled: !isLoading && !!product,
    });

    // Submit handler
    const handleSubmit = async (data: ProductFormValues) => {
        try {
            // Cancel pending auto-save and set cooldown
            autoSave.cancelAutoSave();
            manualSaveCooldownRef.current = Date.now();

            await actions.handleSave(data);
            // Reset dirty state
            methods.reset(data, { keepDefaultValues: false });
            // Mark history as saved
            history.markAsSaved();
            setAutoSaveStatus('saved');

            // Create a manual_save version
            versionManager.createVersion({
                product_id: productId,
                form_data: data,
                trigger_type: 'manual_save',
            }).catch(err => console.error('Failed to create version:', err));
        } catch (e) {
            toast.error("Erreur de sauvegarde", {
                description: "Une erreur est survenue. Veuillez réessayer.",
            });
        }
    };

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
                            {/* Page Header - Refined for "Emerald Ledger" */}
                            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-4 sm:-mx-6 px-4 sm:px-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6 pb-4 pt-4 border-b border-border/20">
                                <div className="flex items-center gap-4">
                                    {/* Back Button Container - Style C */}
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
                                            {autoSaveStatus === 'saving' && (
                                                <Badge variant="outline" className="h-4 px-1.5 py-0 text-[9px] font-bold bg-muted text-muted-foreground border-border/20 uppercase tracking-widest shrink-0">
                                                    <Loader2 className="w-2.5 h-2.5 mr-1 animate-spin" />
                                                    Sauvegarde...
                                                </Badge>
                                            )}
                                            {autoSaveStatus === 'saved' && !isDirty && (
                                                <Badge variant="outline" className="h-4 px-1.5 py-0 text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 uppercase tracking-widest shrink-0">
                                                    <Check className="w-2.5 h-2.5 mr-1" />
                                                    Sauvegardé
                                                </Badge>
                                            )}
                                            {autoSaveStatus === 'error' && (
                                                <Badge variant="outline" className="h-4 px-1.5 py-0 text-[9px] font-bold bg-destructive/10 text-destructive border-destructive/20 uppercase tracking-widest shrink-0">
                                                    Erreur
                                                </Badge>
                                            )}
                                            {isDirty && autoSaveStatus !== 'saving' && (
                                                <Badge variant="outline" className="h-4 px-1.5 py-0 text-[9px] font-bold bg-warning/10 text-warning border-warning/20 uppercase tracking-widest shrink-0">
                                                    Non sauvegardé
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <h1 className="text-3xl font-extrabold tracking-tight text-foreground truncate">
                                                {methods.watch("title") || "Nouveau produit"}
                                            </h1>
                                            {(() => {
                                                // Récupérer l'URL du produit en ligne
                                                const metadata = product.metadata || {};
                                                const platform = product.platform;

                                                let productUrl: string | null = null;

                                                if (platform === 'shopify') {
                                                    const handle = (product as any).handle || metadata.handle;
                                                    const shopUrl = selectedStore?.platform_connections?.shop_url || '';
                                                    if (handle && shopUrl) {
                                                        const cleanUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
                                                        productUrl = `https://${cleanUrl}/products/${handle}`;
                                                    }
                                                } else if (platform === 'woocommerce') {
                                                    // Priorité: permalink stocké, sinon construction depuis shop_url + slug
                                                    productUrl = metadata.permalink || null;
                                                    if (!productUrl) {
                                                        const shopUrl = selectedStore?.platform_connections?.shop_url;
                                                        const slug = product.slug || metadata.slug;
                                                        if (shopUrl && slug) {
                                                            const baseUrl = shopUrl.replace(/\/$/, '');
                                                            productUrl = `${baseUrl}/product/${slug}/`;
                                                        }
                                                    }
                                                }

                                                if (!productUrl) return null;

                                                return (
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
                                                );
                                            })()}
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
                                        onResolveConflicts={() => setConflictDialogOpen(true)}
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
                                                <TooltipContent>Rétablir (Ctrl+Y)</TooltipContent>
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
                                        onClick={() => methods.reset()}
                                        disabled={!isDirty || actions.isSaving}
                                        className="h-10 px-6 font-bold text-xs uppercase tracking-widest border-border/50 hover:bg-muted/50 transition-all"
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        onClick={methods.handleSubmit(handleSubmit)}
                                        disabled={actions.isSaving}
                                        className="h-10 px-8 font-extrabold text-xs uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground min-w-[160px] shadow-[0_0_20px_-5px_var(--primary)] transition-all"
                                    >
                                        {actions.isSaving ? (
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
                                </div>
                            </div>

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
                            <form onSubmit={methods.handleSubmit(handleSubmit)} className="w-full">
                                <ProductEditorLayout
                                    sidebar={(
                                        <ProductSidebar
                                            productId={productId}
                                            availableCategories={categories}
                                            isLoadingCategories={isLoadingCategories}
                                            onVersionRestored={handleVersionRestored}
                                            isVariableProduct={methods.watch("product_type") === "variable"}
                                            variationsCount={product?.metadata?.variations_count ?? 0}
                                        />
                                    )}
                                >
                                    <ProductGeneralTab />
                                    <ProductMediaTab />
                                    {methods.watch("product_type") === "variable" && (
                                        <ProductVariationsTab
                                            productId={productId}
                                            storeId={selectedStore?.id}
                                            platformProductId={product?.platform_product_id}
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
