/**
 * useProductCategories - Hook pour gérer les catégories de produits
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-config';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface Category {
    id: string;
    store_id: string;
    external_id: string;
    name: string;
    slug: string;
    parent_id: string | null;
    parent_external_id: string | null;
    description: string | null;
    image_url: string | null;
    product_count: number;
    display: string;
    menu_order: number;
    platform: string;
    created_at: string;
    updated_at: string;
}

export interface CategoryTree extends Category {
    children: CategoryTree[];
    level: number;
    path: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Build category tree from flat list
 */
function buildCategoryTree(categories: Category[]): CategoryTree[] {
    const map = new Map<string, CategoryTree>();
    const roots: CategoryTree[] = [];

    // First pass: create nodes
    categories.forEach(cat => {
        map.set(cat.id, {
            ...cat,
            children: [],
            level: 0,
            path: cat.name,
        });
    });

    // Second pass: build tree
    categories.forEach(cat => {
        const node = map.get(cat.id)!;

        if (cat.parent_id && map.has(cat.parent_id)) {
            const parent = map.get(cat.parent_id)!;
            node.level = parent.level + 1;
            node.path = `${parent.path} > ${cat.name}`;
            parent.children.push(node);
        } else {
            roots.push(node);
        }
    });

    // Sort by menu_order
    const sortByOrder = (a: CategoryTree, b: CategoryTree) => a.menu_order - b.menu_order;

    const sortRecursive = (nodes: CategoryTree[]) => {
        nodes.sort(sortByOrder);
        nodes.forEach(node => sortRecursive(node.children));
    };

    sortRecursive(roots);
    return roots;
}

/**
 * Flatten tree to list with indentation
 */
function flattenTree(tree: CategoryTree[], result: CategoryTree[] = []): CategoryTree[] {
    tree.forEach(node => {
        result.push(node);
        if (node.children.length > 0) {
            flattenTree(node.children, result);
        }
    });
    return result;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook pour récupérer toutes les catégories d'une boutique
 */
export function useCategories(storeId?: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['categories', storeId],
        queryFn: async () => {
            if (!storeId) return [];

            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('store_id', storeId)
                .order('menu_order', { ascending: true });

            if (error) throw error;
            return (data || []) as Category[];
        },
        enabled: !!storeId,
        staleTime: STALE_TIMES.STATIC,
    });
}

/**
 * Hook pour récupérer les catégories sous forme d'arbre
 */
export function useCategoryTree(storeId?: string) {
    const categoriesQuery = useCategories(storeId);

    const tree = categoriesQuery.data ? buildCategoryTree(categoriesQuery.data) : [];
    const flatList = flattenTree(tree);

    return {
        ...categoriesQuery,
        tree,
        flatList,
        totalCount: categoriesQuery.data?.length || 0,
    };
}

/**
 * Hook pour récupérer une catégorie par ID
 */
export function useCategory(categoryId?: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['category', categoryId],
        queryFn: async () => {
            if (!categoryId) return null;

            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('id', categoryId)
                .single();

            if (error) throw error;
            return data as Category;
        },
        enabled: !!categoryId,
    });
}

/**
 * Hook pour récupérer les statistiques de catégories
 */
export function useCategoryStats(storeId?: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['category-stats', storeId],
        queryFn: async () => {
            if (!storeId) return null;

            const { data, error, count } = await supabase
                .from('categories')
                .select('id, product_count', { count: 'exact' })
                .eq('store_id', storeId);

            if (error) throw error;

            const totalProducts = (data || []).reduce((sum, cat) => sum + (cat.product_count || 0), 0);

            return {
                total: count || 0,
                totalProducts,
                empty: (data || []).filter(cat => !cat.product_count || cat.product_count === 0).length,
            };
        },
        enabled: !!storeId,
    });
}

/**
 * Hook pour les catégories d'un produit spécifique
 */
export function useProductCategories(productId?: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['product-categories', productId],
        queryFn: async () => {
            if (!productId) return [];

            // Récupérer le produit avec son working_content
            const { data: product, error } = await supabase
                .from('products')
                .select('working_content, store_id')
                .eq('id', productId)
                .single();

            if (error) throw error;

            const workingContent = product?.working_content as { categories?: Array<{ id?: string; name: string }> } | null;
            const storeId = product?.store_id;

            if (!workingContent?.categories || !storeId) return [];

            // Récupérer les catégories complètes
            const categoryNames = workingContent.categories.map(c => c.name);

            const { data: categories } = await supabase
                .from('categories')
                .select('*')
                .eq('store_id', storeId)
                .in('name', categoryNames);

            return (categories || []) as Category[];
        },
        enabled: !!productId,
    });
}

/**
 * Hook pour mettre à jour les catégories d'un produit
 */
export function useUpdateProductCategories() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({
            productId,
            categoryIds,
        }: {
            productId: string;
            categoryIds: string[];
        }) => {
            // Récupérer les catégories par leurs IDs
            const { data: categories } = await supabase
                .from('categories')
                .select('id, name, slug')
                .in('id', categoryIds);

            // Récupérer le working_content actuel
            const { data: product } = await supabase
                .from('products')
                .select('working_content')
                .eq('id', productId)
                .single();

            const currentWorking = (product?.working_content || {}) as Record<string, unknown>;

            // Mettre à jour avec les nouvelles catégories
            const updatedWorking = {
                ...currentWorking,
                categories: (categories || []).map(c => ({
                    id: c.id,
                    name: c.name,
                    slug: c.slug,
                })),
            };

            const { error } = await supabase
                .from('products')
                .update({
                    working_content: updatedWorking,
                    working_content_updated_at: new Date().toISOString(),
                })
                .eq('id', productId);

            if (error) throw error;

            return { productId, categories };
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product-content', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['product-categories', variables.productId] });
            toast.success('Catégories mises à jour');
        },
        onError: (error: Error) => {
            toast.error('Erreur', { description: error.message });
        },
    });
}

/**
 * Hook pour synchroniser les catégories depuis la boutique
 */
export function useSyncCategories() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ storeId }: { storeId: string }) => {
            const { data, error } = await supabase.functions.invoke('sync-categories', {
                body: { store_id: storeId },
            });

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['categories', variables.storeId] });
            queryClient.invalidateQueries({ queryKey: ['category-stats', variables.storeId] });
            toast.success('Catégories synchronisées');
        },
        onError: (error: Error) => {
            toast.error('Erreur de synchronisation', { description: error.message });
        },
    });
}
