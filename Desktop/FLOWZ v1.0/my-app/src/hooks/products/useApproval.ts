/**
 * Hook centralisé pour le système d'approbation
 * Ported from legacy project
 *
 * Utilise l'edge function approve-content pour:
 * - Transaction atomique (update + audit log)
 * - Verrouillage optimiste via content_version
 * - Support granulaire (champ unique) et global (tous les champs)
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { getFieldLabel } from "@/lib/productHelpers";
import { createApprovalNotification } from "@/lib/notifications";

// ============================================
// Types
// ============================================

export type ApprovalAction = 'accept' | 'reject';

export interface ApprovalRequest {
    productId: string;
    field?: string;
    action: ApprovalAction;
    currentVersion?: number;
}

export interface ApprovalResponse {
    success: boolean;
    newVersion?: number;
    conflict?: boolean;
    error?: string;
    data?: {
        productId: string;
        draftRemaining: boolean;
        dirtyFields: string[];
        working_content?: any;
    };
}

export interface BulkApprovalItem {
    productId: string;
    action: ApprovalAction;
    fields?: string[];
    currentVersion?: number;
}

// ============================================
// Hook principal: useApproveContent
// ============================================

/**
 * Hook pour approuver ou rejeter du contenu généré
 */
export const useApproveContent = () => {
    const queryClient = useQueryClient();

    return useMutation<ApprovalResponse, Error, ApprovalRequest>({
        mutationFn: async ({ productId, field, action, currentVersion }) => {
            const supabase = createClient();

            // Si pas de version fournie, récupérer la version actuelle
            let version = currentVersion;
            if (version === undefined) {
                const { data: product } = await supabase
                    .from("products")
                    .select("content_version")
                    .eq("id", productId)
                    .single();
                version = product?.content_version ?? 1;
            }

            // Appeler l'edge function
            const { data, error } = await supabase.functions.invoke('approve-content', {
                body: {
                    productId,
                    field,
                    action,
                    currentVersion: version,
                },
            });

            if (error) {
                throw new Error(error.message || 'Failed to process approval');
            }

            const response = data as ApprovalResponse;

            if (!response.success) {
                if (response.conflict) {
                    throw new Error('CONFLICT:' + (response.error || 'Version conflict detected'));
                }
                throw new Error(response.error || 'Unknown error');
            }

            return response;
        },
        onSuccess: async (data, variables) => {
            const { productId, action, field } = variables;

            // Create notification for the approval action
            // Note: Running async without await to not block the UI
            createApprovalNotification({
                productId,
                productName: data.data?.working_content?.title || 'Produit',
                action,
                field,
            }).catch((err) => console.error('Failed to create approval notification:', err));

            // Invalider et refetch les queries
            await Promise.all([
                queryClient.refetchQueries({ queryKey: ["product-content", productId], exact: true }),
                queryClient.refetchQueries({ queryKey: ["product", productId], exact: true }),
                queryClient.invalidateQueries({ queryKey: ["product-stats"] }),
            ]);

            // Feedback utilisateur
            if (action === 'accept') {
                toast.success(field ? "Champ accepté" : "Modifications acceptées", {
                    description: field
                        ? `Le champ ${getFieldLabel(field)} a été accepté`
                        : "Tout le contenu généré a été accepté",
                });
            } else {
                toast.info(field ? "Champ rejeté" : "Modifications rejetées", {
                    description: field
                        ? `Le champ ${getFieldLabel(field)} a été rejeté`
                        : "Tout le contenu généré a été rejeté",
                });
            }
        },
        onError: (error) => {
            const errorMessage = error.message;

            if (errorMessage.startsWith('CONFLICT:')) {
                toast.error("Conflit détecté", {
                    description: "Le contenu a été modifié. Veuillez rafraîchir la page.",
                });
            } else {
                toast.error("Erreur", {
                    description: errorMessage,
                });
            }
        },
    });
};

// ============================================
// Hook: useAcceptField (alias simplifié)
// ============================================

export const useAcceptField = () => {
    const approveContent = useApproveContent();

    return {
        ...approveContent,
        mutate: (
            params: { productId: string; field?: string; currentVersion?: number },
            options?: { onSuccess?: (data: ApprovalResponse, variables: ApprovalRequest, context: unknown) => void; onError?: (error: Error, variables: ApprovalRequest, context: unknown) => void; }
        ) => {
            approveContent.mutate({
                ...params,
                action: 'accept',
            }, options);
        },
        mutateAsync: (
            params: { productId: string; field?: string; currentVersion?: number },
            options?: { onSuccess?: (data: ApprovalResponse, variables: ApprovalRequest, context: unknown) => void; onError?: (error: Error, variables: ApprovalRequest, context: unknown) => void; }
        ) => {
            return approveContent.mutateAsync({
                ...params,
                action: 'accept',
            }, options);
        },
    };
};

// ============================================
// Hook: useRejectField (alias simplifié)
// ============================================

export const useRejectField = () => {
    const approveContent = useApproveContent();

    return {
        ...approveContent,
        mutate: (
            params: { productId: string; field?: string; currentVersion?: number },
            options?: { onSuccess?: (data: ApprovalResponse, variables: ApprovalRequest, context: unknown) => void; onError?: (error: Error, variables: ApprovalRequest, context: unknown) => void; }
        ) => {
            approveContent.mutate({
                ...params,
                action: 'reject',
            }, options);
        },
        mutateAsync: (
            params: { productId: string; field?: string; currentVersion?: number },
            options?: { onSuccess?: (data: ApprovalResponse, variables: ApprovalRequest, context: unknown) => void; onError?: (error: Error, variables: ApprovalRequest, context: unknown) => void; }
        ) => {
            return approveContent.mutateAsync({
                ...params,
                action: 'reject',
            }, options);
        },
    };
};

// ============================================
// Hook: useContentVersion
// ============================================

export const useContentVersion = (productId: string) => {
    return useQueryClient().getQueryData<{ content_version: number }>(
        ["product", productId]
    )?.content_version ?? 1;
};
