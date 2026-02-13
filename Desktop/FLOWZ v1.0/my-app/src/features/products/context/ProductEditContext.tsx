"use client";

import { createContext, useContext, ReactNode } from "react";
import { UseFormReturn } from "react-hook-form";
import { Product } from "@/types/product";
import { ProductFormValues } from "../schemas/product-schema";
import { SeoAnalysisData } from "@/types/seo";
import { ProductContentBuffer, ContentStatus } from "@/types/productContent";

// ============================================================================
// TYPES
// ============================================================================

export type ContentBufferData = ProductContentBuffer;

export interface DirtyFieldsData {
    dirtyFieldsContent?: string[];
    contentStatus?: ContentStatus;
    hasConflict?: boolean;
}

export interface DraftActions {
    handleAcceptField: (field: string, editedValue?: string) => Promise<void>;
    handleRejectField: (field: string) => Promise<void>;
    handleRegenerateField: (field: string) => Promise<void>;
    isAccepting: boolean;
    isRejecting: boolean;
    isRegenerating: boolean;
    previewField: string | null;
    setPreviewField: (field: string | null) => void;
}

export interface ProductSaveHook {
    save: (data: ProductFormValues, options?: { metadata?: any }) => Promise<void>;
    isPending: boolean;
    isSaving: boolean;
}

export interface PushToStoreHook {
    mutate: (params: { product_ids: string[] }, options?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => void;
    isPending: boolean;
}

export interface ProductEditContextType {
    // Identifiant
    productId: string;

    // Données produit
    product: Product | undefined | null;
    isLoading: boolean;

    // Formulaire
    form: UseFormReturn<ProductFormValues>;
    savedSnapshot: ProductFormValues | null;
    setSavedSnapshot?: (snapshot: ProductFormValues | null) => void;

    // Triple-buffer content
    contentBuffer: ContentBufferData | undefined;

    // Dirty fields tracking
    dirtyFieldsData?: DirtyFieldsData;

    // SEO Analysis
    seoAnalysis?: SeoAnalysisData;
    runSeoAnalysis?: () => Promise<void>;

    // AI Proposals
    remainingProposals: string[];
    draftActions: DraftActions;

    // Save & Sync
    isSaving: boolean;
    handleSave: (data: ProductFormValues) => Promise<void>;
    productSave?: ProductSaveHook;
    pushToStore?: PushToStoreHook;

    // Refetch functions
    refetchProduct?: () => Promise<any>;
    refetchContentBuffer?: () => Promise<any>;

    // Helpers
    isFieldModified?: (fieldName: string) => boolean;
    resetModifiedFields?: () => void;

    // Store context
    selectedStore?: any;

    // Undo/Redo form history
    formHistory?: {
        undo: () => void;
        redo: () => void;
        canUndo: boolean;
        canRedo: boolean;
        historyIndex: number;
        historyLength: number;
        captureSnapshot: (label?: string) => void;
        markAsSaved: () => void;
        isAtSavedState: boolean;
    };

    // Auto-save status
    autoSaveStatus?: 'idle' | 'saving' | 'saved' | 'error';
}

// ============================================================================
// CONTEXT
// ============================================================================

export const ProductEditContext = createContext<ProductEditContextType | undefined>(undefined);

// ============================================================================
// HOOK
// ============================================================================

export const useProductEditContext = () => {
    const context = useContext(ProductEditContext);
    if (!context) {
        throw new Error("useProductEditContext must be used within a ProductEditProvider");
    }
    return context;
};

// ============================================================================
// PROVIDER
// ============================================================================

interface ProductEditProviderProps {
    children: ReactNode;
    value: ProductEditContextType;
}

export const ProductEditProvider = ({ children, value }: ProductEditProviderProps) => {
    return (
        <ProductEditContext.Provider value={value}>
            {children}
        </ProductEditContext.Provider>
    );
};

// ============================================================================
// DEFAULT VALUES (for initial render)
// ============================================================================

export const defaultDraftActions: DraftActions = {
    handleAcceptField: async () => { },
    handleRejectField: async () => { },
    handleRegenerateField: async () => { },
    isAccepting: false,
    isRejecting: false,
    isRegenerating: false,
    previewField: null,
    setPreviewField: () => { },
};
