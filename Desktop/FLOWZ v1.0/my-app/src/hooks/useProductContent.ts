import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { ProductContentBuffer, ContentData } from '@/types/productContent';
import { mapWooCommerceToContentData, WooCommerceProductSource } from '@/lib/woocommerceMapper';
import { useAcceptField, useRejectField, useContentVersion } from '@/hooks/products/useApproval';

/**
 * Hook pour lire le contenu d'un produit
 */
export const useProductContent = (productId: string) => {
    return useQuery({
        queryKey: ["product-content", productId],
        queryFn: async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("products")
                .select(`
          id,
          store_snapshot_content,
          working_content,
          draft_generated_content,
          dirty_fields_content,
          store_content_updated_at,
          working_content_updated_at,
          platform,
          content_version
        `)
                .eq("id", productId)
                .single();

            if (error) throw error;

            // Validation & Mapping du contenu brut
            let storeSnapshot = data.store_snapshot_content as unknown as any;
            let workingContent = data.working_content as unknown as any;

            // Détecter si le contenu est au format brut WooCommerce
            const isRawWooCommerce = (
                data.platform === 'woocommerce' &&
                storeSnapshot &&
                'name' in storeSnapshot &&
                !('title' in storeSnapshot)
            );

            if (isRawWooCommerce) {
                try {
                    if (typeof mapWooCommerceToContentData === 'function') {
                        storeSnapshot = mapWooCommerceToContentData(storeSnapshot as WooCommerceProductSource);

                        if (workingContent && 'name' in workingContent && !('title' in workingContent)) {
                            workingContent = mapWooCommerceToContentData(workingContent as WooCommerceProductSource);
                        }
                    }
                } catch (err) {
                    console.error('Error mapping WooCommerce data:', err);
                }
            }

            return {
                id: data.id,
                store_snapshot_content: storeSnapshot as ContentData,
                working_content: workingContent as ContentData,
                draft_generated_content: data.draft_generated_content as unknown as ContentData | null,
                dirty_fields_content: (Array.isArray(data.dirty_fields_content)
                    ? data.dirty_fields_content.filter((i: any) => typeof i === "string")
                    : []) as string[],
                store_content_updated_at: data.store_content_updated_at as string,
                working_content_updated_at: data.working_content_updated_at as string,
                content_version: (data.content_version as number) ?? 1,
                platform: data.platform,
            } as ProductContentBuffer & { id: string; content_version: number; platform: string };
        },
        enabled: !!productId,
        refetchInterval: 30000,
        refetchOnWindowFocus: true,
        staleTime: 0,
    });
};

/**
 * Re-export hooks for backward compatibility or convenience
 */
export { useAcceptField as useAcceptDraft, useRejectField as useRejectDraft };
