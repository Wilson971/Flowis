/**
 * useProductVersions Hooks
 *
 * Server-side version history for the product editor.
 * Mirrors the article_versions pattern from useArticleVersions.ts:
 * - Fetch versions for a product
 * - Create new versions (auto_save, manual_save, ai_approval, restore)
 * - Restore previous versions
 * - Rate-limited auto-save version creation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { ProductFormValues } from '@/features/products/schemas/product-schema';

// ============================================================================
// TYPES
// ============================================================================

export type ProductVersionTrigger = 'auto_save' | 'manual_save' | 'ai_approval' | 'restore';

export interface ProductVersion {
    id: string;
    product_id: string;
    tenant_id: string;
    version_number: number;
    form_data: ProductFormValues;
    title: string;
    field_count: number;
    trigger_type: ProductVersionTrigger;
    metadata: Record<string, unknown> | null;
    created_at: string;
}

export interface CreateProductVersionParams {
    product_id: string;
    form_data: ProductFormValues;
    trigger_type: ProductVersionTrigger;
    metadata?: Record<string, unknown>;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const productVersionsKeys = {
    all: ['product-versions'] as const,
    list: (productId: string) => [...productVersionsKeys.all, 'list', productId] as const,
    detail: (versionId: string) => [...productVersionsKeys.all, 'detail', versionId] as const,
};

// ============================================================================
// HELPERS
// ============================================================================

/** Count non-empty fields in form data for display */
function countNonEmptyFields(formData: ProductFormValues): number {
    let count = 0;
    const entries = Object.entries(formData);
    for (const [, value] of entries) {
        if (value === null || value === undefined || value === '') continue;
        if (Array.isArray(value) && value.length === 0) continue;
        count++;
    }
    return count;
}

// ============================================================================
// FETCH VERSIONS
// ============================================================================

interface UseProductVersionsOptions {
    productId: string;
    enabled?: boolean;
    limit?: number;
}

export function useProductVersions(options: UseProductVersionsOptions) {
    const { productId, enabled = true, limit = 50 } = options;
    const supabase = createClient();

    return useQuery({
        queryKey: productVersionsKeys.list(productId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('product_versions')
                .select('*')
                .eq('product_id', productId)
                .order('version_number', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return (data || []) as ProductVersion[];
        },
        enabled: enabled && !!productId,
        staleTime: 30_000,
    });
}

// ============================================================================
// FETCH SINGLE VERSION
// ============================================================================

export function useProductVersion(versionId: string, enabled = true) {
    const supabase = createClient();

    return useQuery({
        queryKey: productVersionsKeys.detail(versionId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('product_versions')
                .select('*')
                .eq('id', versionId)
                .single();

            if (error) throw error;
            return data as ProductVersion;
        },
        enabled: enabled && !!versionId,
    });
}

// ============================================================================
// CREATE VERSION
// ============================================================================

export function useCreateProductVersion() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (params: CreateProductVersionParams) => {
            // Get current user for tenant_id
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifie');

            // Get current max version number
            const { data: latestVersion } = await supabase
                .from('product_versions')
                .select('version_number')
                .eq('product_id', params.product_id)
                .order('version_number', { ascending: false })
                .limit(1)
                .single();

            const nextVersionNumber = (latestVersion?.version_number || 0) + 1;

            // Insert new version
            const { data, error } = await supabase
                .from('product_versions')
                .insert({
                    product_id: params.product_id,
                    tenant_id: user.id,
                    version_number: nextVersionNumber,
                    form_data: params.form_data as any,
                    title: params.form_data.title || '',
                    field_count: countNonEmptyFields(params.form_data),
                    trigger_type: params.trigger_type,
                    metadata: params.metadata || null,
                })
                .select()
                .single();

            if (error) throw error;
            return data as ProductVersion;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: productVersionsKeys.list(data.product_id),
            });

            // Only show toast for manual saves
            if (data.trigger_type === 'manual_save') {
                toast.success('Version sauvegardee', {
                    description: `Version ${data.version_number} creee.`,
                });
            }
        },
        onError: (error: Error) => {
            console.error('Error creating product version:', error);
        },
    });
}

// ============================================================================
// RESTORE VERSION
// ============================================================================

export function useRestoreProductVersion() {
    const queryClient = useQueryClient();
    const supabase = createClient();
    const createVersion = useCreateProductVersion();

    return useMutation({
        mutationFn: async ({
            versionId,
            productId,
        }: {
            versionId: string;
            productId: string;
        }) => {
            // Fetch the version to restore
            const { data: versionToRestore, error: fetchError } = await supabase
                .from('product_versions')
                .select('*')
                .eq('id', versionId)
                .single();

            if (fetchError || !versionToRestore) {
                throw new Error('Version introuvable');
            }

            // Create a new "restore" version to preserve history
            await createVersion.mutateAsync({
                product_id: productId,
                form_data: versionToRestore.form_data as ProductFormValues,
                trigger_type: 'restore',
                metadata: {
                    restored_from_version: versionToRestore.version_number,
                    restored_from_id: versionId,
                },
            });

            return {
                restoredVersion: versionToRestore as ProductVersion,
            };
        },
        onSuccess: ({ restoredVersion }) => {
            queryClient.invalidateQueries({ queryKey: productVersionsKeys.all });

            toast.success('Version restauree', {
                description: `Le produit a ete restaure a la version ${restoredVersion.version_number}.`,
            });
        },
        onError: (error: Error) => {
            console.error('Error restoring product version:', error);
            toast.error('Erreur', {
                description: error.message || 'Impossible de restaurer la version.',
            });
        },
    });
}

// ============================================================================
// VERSION MANAGER (composite hook for editor)
// ============================================================================

interface UseProductVersionManagerOptions {
    productId: string;
    enabled?: boolean;
    autoSaveInterval?: number; // ms between auto-save version creation (default: 5 min)
}

export function useProductVersionManager(options: UseProductVersionManagerOptions) {
    const { productId, enabled = true, autoSaveInterval = 5 * 60 * 1000 } = options;

    const versions = useProductVersions({ productId, enabled });
    const createVersion = useCreateProductVersion();
    const restoreVersion = useRestoreProductVersion();

    const latestVersion = versions.data?.[0];
    const versionCount = versions.data?.length || 0;

    /** Rate-limit auto-save version creation */
    const canCreateAutoVersion = (): boolean => {
        if (!latestVersion) return true;

        const lastCreated = new Date(latestVersion.created_at);
        const now = new Date();
        return now.getTime() - lastCreated.getTime() >= autoSaveInterval;
    };

    return {
        versions: versions.data || [],
        isLoading: versions.isLoading,
        latestVersion,
        versionCount,
        canCreateAutoVersion,
        createVersion: createVersion.mutateAsync,
        restoreVersion: restoreVersion.mutateAsync,
        isCreating: createVersion.isPending,
        isRestoring: restoreVersion.isPending,
        refetch: versions.refetch,
    };
}
