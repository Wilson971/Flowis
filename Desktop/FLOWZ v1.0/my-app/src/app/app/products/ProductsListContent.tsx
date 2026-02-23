"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProductsTableModern } from '@/components/products/ProductsTableModern';
import { ProductsTableSkeleton } from '@/components/products/ProductsTableSkeleton';
import { useProducts, useProductStats } from '@/hooks/products/useProducts';
import { useSelectedStore } from '@/contexts/StoreContext';
import {
    ProductsPageHeader,
    ProductsStatsCards,
    ProductsToolbar,
} from '@/components/products/ui';
import { BatchGenerationSheet } from '@/components/products/ui/BatchGenerationSheet';
import { BatchProgressPanel } from '@/components/products/BatchProgressPanel';
import { useBatchGeneration } from '@/hooks/products/useBatchGeneration';
import { useAcceptDraft, useRejectDraft } from '@/hooks/products/useProductContent';
import { ModularGenerationSettings } from '@/types/imageGeneration';
import { getRemainingProposals } from '@/lib/productHelpers';
import type { ContentData } from '@/types/productContent';
import { useTableFilters } from '@/hooks/products/useTableFilters';
import { ProductsSelectionBar } from '@/components/products/ui/ProductsSelectionBar';
import { FilterPill } from '@/components/products/ui/FilterPills';
import { ProductsPagination } from '@/components/products/ProductsPagination';
import { ProductsFilter } from '@/components/products/ProductsFilter';
import { useDebounce } from '@/hooks/useDebounce';
import { usePendingSyncCount } from '@/hooks/sync';
import { usePushProductBatch } from '@/hooks/sync/usePushToStore';
import { useLocalStorage, STORAGE_KEYS } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';
import { VisibilityState } from '@tanstack/react-table';

export function ProductsListContent() {
    const { selectedStore } = useSelectedStore();

    const { data: products = [], isLoading } = useProducts(selectedStore?.id);
    const { data: stats } = useProductStats(selectedStore?.id);

    // Direct push to store (non-blocking)
    const { mutate: pushToStore, isPending: isPushing } = usePushProductBatch();
    const { data: pendingSyncCount } = usePendingSyncCount(selectedStore?.id);

    const params = useTableFilters();
    const {
        search,
        setSearch,
        page,
        setPage,
        pageSize,
        setPageSize,
        setFilter,
        resetFilters,
    } = params;

    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

    // Local state for search input to avoid input lag, syncs with URL via debounce
    const [localSearch, setLocalSearch] = useState(search);
    const debouncedSearch = useDebounce(localSearch, 300);

    // Batch Generation Integration
    const {
        startGeneration,
        cancel: cancelGeneration,
        activeBatchId,
        isGenerating,
        lastEvent,
        progress: batchProgress,
    } = useBatchGeneration();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isBatchPanelOpen, setIsBatchPanelOpen] = useState(false);

    // Column Visibility with LocalStorage Persistence
    const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>(
        STORAGE_KEYS.PRODUCTS_COLUMN_VISIBILITY,
        { defaultValue: {} }
    );

    const [generationSettings, setGenerationSettings] = useState<ModularGenerationSettings>({
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        tone: 'professional',
        language: 'fr',
        word_limits: {},
        image_analysis: true,
        transform_mode: 'rewrite',
        sku_format: {
            pattern: 'product_name_based',
            separator: '-',
            max_length: 12,
            prefix: ''
        },
        structure_options: {
            h2_titles: true,
            benefits_list: true,
            benefits_count: 5,
            specs_table: false,
            cta: true
        }
    });

    // Approval hooks
    const queryClient = useQueryClient();
    const acceptDraft = useAcceptDraft();
    const rejectDraft = useRejectDraft();

    // Count selected products with pending AI drafts for bulk actions
    const pendingApprovalsCount = useMemo(() => {
        return products.filter((p) => {
            if (!selectedProducts.includes(p.id)) return false;
            const draft = p.draft_generated_content as ContentData | null;
            const working = p.working_content as ContentData;
            if (!draft) return false;
            return getRemainingProposals(draft, working).length > 0;
        }).length;
    }, [products, selectedProducts]);

    const handleGenerate = useCallback(async (types: string[], _enableSerpAnalysis: boolean, _forceRegenerate?: boolean) => {



        if (!selectedStore?.id) {
            console.error('[handleGenerate] No store selected, aborting');
            return;
        }

        if (selectedProducts.length === 0) {
            console.error('[handleGenerate] No products selected, aborting');
            return;
        }

        const payload = {
            product_ids: selectedProducts,
            content_types: types.reduce((acc, t) => ({ ...acc, [t]: true }), {}),
            settings: generationSettings,
            store_id: selectedStore.id,
        };



        try {
            await startGeneration(payload);
        } catch (error) {
            console.error('[handleGenerate] startGeneration threw:', error);
        }
    }, [selectedStore?.id, selectedProducts, generationSettings, startGeneration]);

    // Bulk approve all selected products (single toast + single cache invalidation)
    const handleApproveAll = useCallback(async () => {
        if (selectedProducts.length === 0) return;
        const toastId = toast.loading(`Approbation de ${selectedProducts.length} produit(s)...`);
        let successCount = 0;
        let failCount = 0;
        for (const productId of selectedProducts) {
            try {
                await acceptDraft.mutateAsync({ productId, silent: true });
                successCount++;
            } catch {
                failCount++;
            }
        }
        queryClient.invalidateQueries({ queryKey: ['products'] });
        if (successCount > 0 && failCount === 0) {
            toast.success(`${successCount} produit(s) approuvé(s)`, { id: toastId, duration: 4000 });
        } else if (successCount > 0) {
            toast.warning(`${successCount} approuvé(s), ${failCount} échoué(s)`, { id: toastId, duration: 4000 });
        } else if (failCount > 0) {
            toast.error(`Échec de l'approbation (${failCount} erreur(s))`, { id: toastId, duration: 6000 });
        }
    }, [selectedProducts, acceptDraft, queryClient]);

    // Bulk reject all selected products (single toast + single cache invalidation)
    const handleRejectAll = useCallback(async () => {
        if (selectedProducts.length === 0) return;
        const toastId = toast.loading(`Rejet de ${selectedProducts.length} brouillon(s)...`);
        let successCount = 0;
        let failCount = 0;
        for (const productId of selectedProducts) {
            try {
                await rejectDraft.mutateAsync({ productId, silent: true });
                successCount++;
            } catch {
                failCount++;
            }
        }
        queryClient.invalidateQueries({ queryKey: ['products'] });
        if (successCount > 0 && failCount === 0) {
            toast.success(`${successCount} brouillon(s) rejeté(s)`, { id: toastId, duration: 4000 });
        } else if (successCount > 0) {
            toast.warning(`${successCount} rejeté(s), ${failCount} échoué(s)`, { id: toastId, duration: 4000 });
        } else if (failCount > 0) {
            toast.error(`Échec du rejet (${failCount} erreur(s))`, { id: toastId, duration: 6000 });
        }
    }, [selectedProducts, rejectDraft, queryClient]);

    // Push to store — non-blocking direct call (user can keep working)
    const syncToastId = 'batch-sync';
    const handlePushToStore = useCallback(() => {
        if (selectedProducts.length === 0) return;
        toast.loading(`Synchronisation de ${selectedProducts.length} produit(s)...`, { id: syncToastId, duration: Infinity });
        pushToStore({ product_ids: selectedProducts });
    }, [selectedProducts, pushToStore]);

    // Build SSE progress message for the Sheet
    const sseProgressMessage = useMemo(() => {
        if (!isGenerating || !lastEvent) return undefined;

        const FIELD_LABELS: Record<string, string> = {
            title: 'titre',
            short_description: 'description courte',
            description: 'description complète',
            seo_title: 'titre SEO',
            meta_description: 'méta-description',
            sku: 'SKU',
            alt_text: 'alt text images',
        };

        switch (lastEvent.type) {
            case 'product_start':
                return `Produit ${lastEvent.index}/${lastEvent.total} : Démarrage...`;
            case 'field_start':
                return `Produit ${lastEvent.index}/${lastEvent.total} : Génération ${FIELD_LABELS[lastEvent.field || ''] || lastEvent.field}...`;
            case 'field_complete':
                return `Produit ${lastEvent.index}/${lastEvent.total} : ${FIELD_LABELS[lastEvent.field || ''] || lastEvent.field} terminé`;
            case 'product_complete':
                return `Produit ${lastEvent.index}/${lastEvent.total} terminé`;
            case 'product_error':
                return `Produit ${lastEvent.index}/${lastEvent.total} : Erreur`;
            default:
                return undefined;
        }
    }, [isGenerating, lastEvent]);

    useEffect(() => {
        setLocalSearch(search);
    }, [search]);

    // Close batch panel if selected products become 0
    useEffect(() => {
        if (selectedProducts.length === 0) {
            setIsBatchPanelOpen(false);
            cancelGeneration();
        }
    }, [selectedProducts.length, cancelGeneration]);

    // Sync debounced search to URL
    useEffect(() => {
        if (debouncedSearch !== search) {
            setSearch(debouncedSearch);
        }
    }, [debouncedSearch, search, setSearch]);

    const statusFilter = params.status || 'all';
    const typeFilter = params.type || 'all';
    const categoryFilter = params.category || 'all';
    const aiStatusFilter = params.ai_status || 'all';
    const syncStatusFilter = params.sync_status || 'all';
    const stockFilter = params.stock || 'all';

    const handleReset = () => {
        resetFilters();
        setLocalSearch('');
    };

    // Calculate active filters to display as pills
    const activeFilters = useMemo<FilterPill[]>(() => {
        const filters: FilterPill[] = [];
        if (statusFilter !== 'all') filters.push({ id: 'status', label: 'Statut', value: statusFilter });
        if (typeFilter !== 'all') filters.push({ id: 'type', label: 'Type', value: typeFilter });
        if (categoryFilter !== 'all') filters.push({ id: 'category', label: 'Catégorie', value: categoryFilter });
        if (aiStatusFilter !== 'all') {
            const aiLabels: Record<string, string> = { optimized: 'Optimisé', not_optimized: 'Non optimisé', has_draft: 'Brouillon généré' };
            filters.push({ id: 'ai_status', label: 'Statut IA', value: aiLabels[aiStatusFilter] || aiStatusFilter });
        }
        if (syncStatusFilter !== 'all') {
            const syncLabels: Record<string, string> = { synced: 'Synchronisé', pending: 'En attente', never: 'Jamais synchronisé' };
            filters.push({ id: 'sync_status', label: 'Synchronisation', value: syncLabels[syncStatusFilter] || syncStatusFilter });
        }
        if (stockFilter !== 'all') {
            const stockLabels: Record<string, string> = { in_stock: 'En stock', low_stock: 'Stock faible', out_of_stock: 'En rupture' };
            filters.push({ id: 'stock', label: 'Stock', value: stockLabels[stockFilter] || stockFilter });
        }
        return filters;
    }, [statusFilter, typeFilter, categoryFilter, aiStatusFilter, syncStatusFilter, stockFilter]);

    // Handle single filter removal
    const handleRemoveFilter = useCallback((id: string) => {
        setFilter(id as any, 'all');
    }, [setFilter]);

    // Filter products based on search and status
    const filteredProducts = useMemo(() => {
        const s = (localSearch || search).toLowerCase();

        return products.filter((product) => {
            // Search filter
            if (s) {
                const matchesTitle = product.title.toLowerCase().includes(s);
                const matchesId = product.platform_product_id.toLowerCase().includes(s);
                if (!matchesTitle && !matchesId) return false;
            }

            // Status filter
            if (statusFilter !== 'all') {
                const status = product.metadata?.status || 'draft';
                if (status !== statusFilter) return false;
            }

            // Type filter
            if (typeFilter !== 'all') {
                const type = (product.metadata as any)?.type || 'simple';
                if (type !== typeFilter) return false;
            }

            // AI Status filter
            if (aiStatusFilter !== 'all') {
                switch (aiStatusFilter) {
                    case 'optimized':
                        if (!product.ai_enhanced) return false;
                        break;
                    case 'not_optimized':
                        if (product.ai_enhanced) return false;
                        break;
                    case 'has_draft':
                        if (!product.draft_generated_content) return false;
                        break;
                }
            }

            // Sync Status filter
            if (syncStatusFilter !== 'all') {
                const hasDirtyFields = product.dirty_fields_content && product.dirty_fields_content.length > 0;
                const hasBeenSynced = product.last_synced_at !== null && product.last_synced_at !== undefined;

                switch (syncStatusFilter) {
                    case 'synced':
                        // Synchronisé = a été sync + pas de modifs en attente
                        if (!hasBeenSynced || hasDirtyFields) return false;
                        break;
                    case 'pending':
                        // Modif. en attente = a des dirty_fields
                        if (!hasDirtyFields) return false;
                        break;
                    case 'never':
                        // Jamais synchronisé = last_synced_at null
                        if (hasBeenSynced) return false;
                        break;
                }
            }

            // Stock filter
            if (stockFilter !== 'all') {
                const stock = product.stock ?? 0;

                switch (stockFilter) {
                    case 'in_stock':
                        if (stock <= 0) return false;
                        break;
                    case 'low_stock':
                        // Stock faible = entre 1 et 10
                        if (stock <= 0 || stock > 10) return false;
                        break;
                    case 'out_of_stock':
                        if (stock > 0) return false;
                        break;
                }
            }

            return true;
        });
    }, [products, localSearch, search, statusFilter, typeFilter, aiStatusFilter, syncStatusFilter, stockFilter]);

    // Pagination logic
    const totalItems = filteredProducts.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedProducts = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredProducts.slice(start, start + pageSize);
    }, [filteredProducts, page, pageSize]);

    const toggleProduct = (id: string) => {
        setSelectedProducts((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
        );
    };

    const toggleAll = (selected: boolean) => {
        setSelectedProducts(selected ? paginatedProducts.map((p) => p.id) : []);
    };

    // No store selected
    if (!selectedStore) {
        return (
            <Card className="border border-border">
                <CardContent className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                            <Package className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-foreground">Aucune boutique sélectionnée</h3>
                        <p className="text-muted-foreground mb-6 text-sm">
                            Sélectionnez une boutique pour gérer vos produits et optimiser leur contenu
                        </p>
                        <Button className="font-medium">Configurer une boutique</Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                {/* Modern Header - Skeleton representation or minimal view could go here, but keeping simple for now */}
                <div>
                    <ProductsTableSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Modern Header with Animation */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <ProductsPageHeader
                    title="Produits"
                    description={
                        selectedStore
                            ? `Gérez les produits de ${selectedStore.name}`
                            : 'Sélectionnez une boutique pour gérer vos produits'
                    }
                    breadcrumbs={[
                        { label: 'Dashboard', href: '/app' },
                        { label: 'Produits' },
                    ]}
                />
            </motion.div>

            {/* Modern Stats Cards with Animation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <ProductsStatsCards
                    totalProducts={stats?.total || 0}
                    unsyncedCount={stats?.needsSync || 0}
                    notOptimizedCount={stats?.notOptimized || 0}
                    optimizedCount={stats?.optimized || 0}
                    isLoading={isLoading}
                />
            </motion.div>

            {/* Modern Toolbar with Animation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <Card className="border border-border/50 bg-card/95 backdrop-blur-lg relative overflow-hidden group hover:border-border transition-all duration-500">
                    {/* Glass reflection */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
                    {/* Subtle gradient accent */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/[0.02] via-transparent to-violet-500/[0.02] pointer-events-none" />

                    <CardContent className="p-6 relative z-10">
                        <ProductsToolbar
                            searchValue={localSearch}
                            onSearchChange={(value) => setLocalSearch(value)}
                            activeFilters={activeFilters}
                            onRemoveFilter={handleRemoveFilter}
                            onClearAllFilters={handleReset}
                            columnVisibility={columnVisibility}
                            onColumnVisibilityChange={setColumnVisibility}
                            filterComponent={
                                <ProductsFilter
                                    statusFilter={statusFilter}
                                    typeFilter={typeFilter}
                                    categoryFilter={categoryFilter}
                                    categories={[]}
                                    aiStatusFilter={aiStatusFilter}
                                    syncStatusFilter={syncStatusFilter}
                                    stockFilter={stockFilter}
                                    onStatusChange={(val) => setFilter('status', val)}
                                    onTypeChange={(val) => setFilter('type', val)}
                                    onCategoryChange={(val) => setFilter('category', val)}
                                    onAiStatusChange={(val) => setFilter('ai_status', val)}
                                    onSyncStatusChange={(val) => setFilter('sync_status', val)}
                                    onStockChange={(val) => setFilter('stock', val)}
                                    onReset={handleReset}
                                />
                            }
                        />

                        {/* Floating Bulk Actions Bar */}
                        <div className="mt-4">
                            <ProductsSelectionBar
                                isHidden={isBatchPanelOpen}
                                selectedCount={selectedProducts.length}
                                onDeselect={() => setSelectedProducts([])}
                                onGenerate={() => setIsBatchPanelOpen(true)}
                                onSync={handlePushToStore}
                                isGenerating={isGenerating}
                                pendingApprovalsCount={pendingApprovalsCount}
                                syncableProductsCount={selectedProducts.length}
                                onApproveAll={handleApproveAll}
                                onRejectAll={handleRejectAll}
                                onCancelSync={() => { }}
                                isProcessingBulkAction={isPushing || acceptDraft.isPending || rejectDraft.isPending}
                            />
                        </div>

                        <BatchGenerationSheet
                            isOpen={isBatchPanelOpen}
                            selectedCount={selectedProducts.length}
                            onGenerate={handleGenerate}
                            onOpenSettings={() => setIsSettingsOpen(true)}
                            onClose={() => setIsBatchPanelOpen(false)}
                            isGenerating={isGenerating}
                            isAdvancedSettingsOpen={isSettingsOpen}
                            onApproveAll={handleApproveAll}
                            onRejectAll={handleRejectAll}
                            onPushToStore={handlePushToStore}
                            onCancelSync={() => { /* Cancel sync not needed — push is immediate */ }}
                            pendingApprovalsCount={pendingApprovalsCount}
                            syncableProductsCount={selectedProducts.length}
                            isProcessingBulkAction={isPushing || acceptDraft.isPending || rejectDraft.isPending}
                            sseProgressMessage={sseProgressMessage}
                            modelName={generationSettings.model === 'gemini-2.5-flash-preview-05-20' ? 'Gemini 2.5 Flash' : 'Gemini 2.0 Flash'}
                            settings={generationSettings}
                            onSettingsChange={setGenerationSettings}
                            onCloseSettings={() => setIsSettingsOpen(false)}
                        />
                    </CardContent>
                </Card>
            </motion.div>

            {/* Batch Progress Panel */}
            {activeBatchId && !isGenerating && (
                <BatchProgressPanel
                    jobId={activeBatchId}
                    onComplete={() => {
                        // Refresh products after batch completes
                    }}
                />
            )}

            {/* Products Table with Animation */}
            {filteredProducts.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                >
                    <Card className="border border-border/50 bg-card/90 backdrop-blur-xl relative overflow-hidden">
                        {/* Glass effect for empty state */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-violet-500/[0.02] pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-transparent pointer-events-none" />

                        <CardContent className="p-12 text-center relative z-10">
                            <div className="flex flex-col items-center justify-center max-md mx-auto">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
                                    className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
                                >
                                    <Package className="h-10 w-10 text-primary" />
                                </motion.div>
                                <motion.h3
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.3 }}
                                    className="text-xl font-bold mb-2 text-foreground"
                                >
                                    Aucun produit trouvé
                                </motion.h3>
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.4 }}
                                    className="text-muted-foreground text-sm"
                                >
                                    {(localSearch || search) || statusFilter !== 'all'
                                        ? 'Essayez de modifier vos filtres de recherche'
                                        : 'Commencez par importer vos produits depuis votre plateforme'}
                                </motion.p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <div className="space-y-4">
                    <ProductsTableModern
                        products={paginatedProducts}
                        selectedProducts={selectedProducts}
                        onToggleSelect={toggleProduct}
                        onToggleSelectAll={toggleAll}
                        columnVisibility={columnVisibility}
                        onColumnVisibilityChange={setColumnVisibility}
                    />

                    {/* Pagination with Animation */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                    >
                        <Card className="border border-border/50 bg-card/95 backdrop-blur-sm relative overflow-hidden group hover:border-border transition-all duration-300">
                            {/* Subtle gradient */}
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.01] via-transparent to-blue-500/[0.01] pointer-events-none" />

                            <CardContent className="p-0 relative z-10">
                                <ProductsPagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    pageSize={pageSize}
                                    totalItems={totalItems}
                                    onPageChange={setPage}
                                    onPageSizeChange={setPageSize}
                                />
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
