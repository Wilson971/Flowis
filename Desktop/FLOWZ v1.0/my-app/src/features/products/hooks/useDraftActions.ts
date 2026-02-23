import { useState, useCallback } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { toast } from 'sonner';
import { ProductFormValues } from '../schemas/product-schema';
import { useAcceptDraft, useRejectDraft } from "@/hooks/products/useProductContent";
import { useBatchGenerationMutation } from "@/hooks/products/useProducts";
import { BatchGenerationSettings } from "@/types/product";
import type { ContentData } from "@/types/productContent";

// ============================================================================
// TYPES
// ============================================================================

interface UseDraftActionsParams {
    productId: string | undefined;
    storeId: string | undefined;
    setValue: UseFormSetValue<ProductFormValues>;
    userModifiedFieldsRef?: React.MutableRefObject<Set<string>>;
    /** Called after a field is accepted and loaded into the form (for version creation) */
    onFieldAccepted?: () => void;
}

export interface UseDraftActionsReturn {
    handleAcceptField: (field: string, editedValue?: string) => Promise<void>;
    handleRejectField: (field: string) => Promise<void>;
    handleRegenerateField: (field: string) => Promise<void>;
    previewField: string | null;
    setPreviewField: (field: string | null) => void;
    isAccepting: boolean;
    isRejecting: boolean;
    isRegenerating: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_GENERATION_SETTINGS: BatchGenerationSettings = {
    provider: "gemini",
    model: "gemini-1.5-pro", // Updated model name if needed
    tone: "professional",
    language: "fr",
    global_config: true,
    word_limits: {
        title: 10,
        short_description: 30,
        description: 150,
        seo_title: 60,
        meta_description: 160,
    },
    structure_options: {
        h2_titles: false,
        benefits_list: false,
        benefits_count: 3,
        specs_table: false,
        cta: false,
    },
    image_analysis: false,
    transform_mode: "optimize",
    respect_editorial_lock: true,
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * useDraftActions
 * 
 * Hook pour gérer les actions sur les propositions IA :
 * - Accepter un champ (mise à jour du formulaire)
 * - Rejeter un champ
 * - Régénérer un champ
 */
export const useDraftActions = ({
    productId,
    storeId,
    setValue,
    userModifiedFieldsRef,
    onFieldAccepted,
}: UseDraftActionsParams): UseDraftActionsReturn => {
    const [previewField, setPreviewField] = useState<string | null>(null);

    // Mutations
    const { mutate: acceptDraft, isPending: isAccepting } = useAcceptDraft();
    const { mutate: rejectDraft, isPending: isRejecting } = useRejectDraft();
    const batchGeneration = useBatchGenerationMutation();

    // -------------------------------------------------------------------------
    // ACCEPTER un champ
    // -------------------------------------------------------------------------
    const handleAcceptField = useCallback(async (field: string, editedValue?: string) => {
        if (!productId) return;

        const useEdited = editedValue !== undefined;

        acceptDraft(
            { productId, field },
            {
                onSuccess: (response: any) => {
                    // L'edge function retourne maintenant working_content dans data
                    const wc = (response?.data?.working_content as Partial<ContentData>) || {};

                    if (!useEdited && (!wc || Object.keys(wc).length === 0)) {


                        return;
                    }

                    // Mapper le champ accepté vers le champ du formulaire
                    // Si editedValue fourni, on l'utilise avec shouldDirty: true pour déclencher l'auto-save
                    const fieldMappings: Record<string, () => void> = {
                        title: () => {
                            setValue("title", useEdited ? editedValue : (wc.title || ""), { shouldDirty: useEdited });
                            userModifiedFieldsRef?.current.delete("title");
                        },
                        description: () => {
                            setValue("description", useEdited ? editedValue : (wc.description || ""), { shouldDirty: useEdited });
                            userModifiedFieldsRef?.current.delete("description");
                        },
                        short_description: () => {
                            setValue("short_description", useEdited ? editedValue : (wc.short_description || ""), { shouldDirty: useEdited });
                            userModifiedFieldsRef?.current.delete("short_description");
                        },
                        sku: () => {
                            setValue("sku", useEdited ? editedValue : (wc.sku || ""), { shouldDirty: useEdited });
                            userModifiedFieldsRef?.current.delete("sku");
                        },
                        "seo.title": () => {
                            setValue("meta_title", useEdited ? editedValue : (wc.seo?.title || ""), { shouldDirty: useEdited });
                            userModifiedFieldsRef?.current.delete("meta_title");
                        },
                        "seo.description": () => {
                            setValue("meta_description", useEdited ? editedValue : (wc.seo?.description || ""), { shouldDirty: useEdited });
                            userModifiedFieldsRef?.current.delete("meta_description");
                        },
                    };

                    const updateField = fieldMappings[field];
                    if (updateField) {
                        updateField();


                        // Create an ai_approval version after field acceptance
                        onFieldAccepted?.();
                    }

                    setPreviewField(null);
                },
                onError: (error: any) => {
                    console.error("Erreur lors de l'acceptation du champ", error);
                    toast.error("Erreur", {
                        description: "Impossible d'accepter la proposition",
                    });
                },
            }
        );
    }, [productId, setValue, acceptDraft, userModifiedFieldsRef, onFieldAccepted]);

    // -------------------------------------------------------------------------
    // REJETER un champ
    // -------------------------------------------------------------------------
    const handleRejectField = useCallback(async (field: string) => {
        if (!productId) return;

        rejectDraft(
            { productId, field },
            {
                onSuccess: () => {


                    setPreviewField(null);
                },
                onError: (error: any) => {
                    console.error("Erreur lors du rejet du champ", error);
                    toast.error("Erreur", {
                        description: "Impossible de rejeter la proposition",
                    });
                },
            }
        );
    }, [productId, rejectDraft]);

    // -------------------------------------------------------------------------
    // RÉGÉNÉRER un champ
    // -------------------------------------------------------------------------
    const handleRegenerateField = useCallback(async (field: string) => {
        if (!productId || !storeId) return;

        // Mapper le champ vers le format attendu par l'API
        const content_types = {
            title: field === "title",
            short_description: field === "short_description",
            description: field === "description",
            seo_title: field === "seo.title",
            meta_description: field === "seo.description",
            sku: field === "sku",
            alt_text: field === "alt_text",
        };

        batchGeneration.mutate(
            {
                product_ids: [productId],
                content_types,
                settings: DEFAULT_GENERATION_SETTINGS,
                store_id: storeId,
            },
            {
                onSuccess: () => {
                    toast.success("Régénération lancée", {
                        description: `Le champ ${field} est en cours de régénération...`,
                    });
                },
                onError: () => {
                    toast.error("Erreur", {
                        description: "Impossible de relancer la génération",
                    });
                },
            }
        );
    }, [productId, storeId, batchGeneration]);

    return {
        handleAcceptField,
        handleRejectField,
        handleRegenerateField,
        previewField,
        setPreviewField,
        isAccepting,
        isRejecting,
        isRegenerating: batchGeneration.isPending,
    };
};
