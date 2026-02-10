"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProductsTableModern } from '@/components/products/ProductsTableModern';
import { useProducts, useProductStats } from '@/hooks/useProducts';
import { useSelectedStore } from '@/contexts/StoreContext';
import {
    ProductsPageHeader,
    ProductsStatsCards,
    ProductsToolbar,
} from '@/components/products/ui';
import { BatchGenerationSheet } from '@/components/products/ui/BatchGenerationSheet';
import { BatchGenerationSettings } from '@/components/products/ui/BatchGenerationSettings';
import { BatchProgressPanel } from '@/components/products/BatchProgressPanel';
import { useBatchGeneration } from '@/hooks/products/useBatchGeneration';
import { useAcceptDraft, useRejectDraft } from '@/hooks/products/useProductContent';
import { ModularGenerationSettings } from '@/types/imageGeneration';
import { useTableFilters } from '@/hooks/useTableFilters';
import { ProductsPagination } from '@/components/products/ProductsPagination';
import { ProductsFilter } from '@/components/products/ProductsFilter';
import { useDebounce } from '@/hooks/useDebounce';
import { useUnifiedSync, usePendingSyncCount } from '@/hooks/sync';
import { toast } from 'sonner';

export function ProductsListContent() {
    const { selectedStore } = useSelectedStore();

    const { data: products = [], isLoading } = useProducts(selectedStore?.id);
    const { data: stats } = useProductStats(selectedStore?.id);

    // Queue-based sync V2
    const { queueSync, isQueuing } = useUnifiedSync();
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
    const acceptDraft = useAcceptDraft();
    const rejectDraft = useRejectDraft();

    const handleGenerate = useCallback(async (types: string[], _enableSerpAnalysis: boolean, _forceRegenerate?: boolean) => {
        console.log('[handleGenerate] Called with:', { types, selectedProducts, storeId: selectedStore?.id });

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
        console.log('[handleGenerate] Starting generation with payload:', payload);

        try {
            await startGeneration(payload);
        } catch (error) {
            console.error('[handleGenerate] startGeneration threw:', error);
        }
    }, [selectedStore?.id, selectedProducts, generationSettings, startGeneration]);

    // Bulk approve all selected products
    const handleApproveAll = useCallback(async () => {
        if (selectedProducts.length === 0) return;
        let successCount = 0;
        for (const productId of selectedProducts) {
            try {
                await acceptDraft.mutateAsync({ productId });
                successCount++;
            } catch {
                // Continue with remaining products
            }
        }
        if (successCount > 0) {
            toast.success(`${successCount} produit(s) approuvé(s)`);
        }
    }, [selectedProducts, acceptDraft]);

    // Bulk reject all selected products
    const handleRejectAll = useCallback(async () => {
        if (selectedProducts.length === 0) return;
        let successCount = 0;
        for (const productId of selectedProducts) {
            try {
                await rejectDraft.mutateAsync({ productId });
                successCount++;
            } catch {
                // Continue with remaining products
            }
        }
        if (successCount > 0) {
            toast.success(`${successCount} brouillon(s) rejeté(s)`);
        }
    }, [selectedProducts, rejectDraft]);

    // Handle sync to store using queue-based V2 system
    const handlePushToStore = async () => {
        if (selectedProducts.length === 0) return;

        try {
            await queueSync({
                productIds: selectedProducts,
                priority: 3,
            });
        } catch (error) {
            console.error('[ProductsListContent] Sync error:', error);
        }
    };

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

    // Sync debounced search to URL
    useEffect(() => {
        if (debouncedSearch !== search) {
            setSearch(debouncedSearch);
        }
    }, [debouncedSearch, search, setSearch]);

    const statusFilter = params.status || 'all';
    const typeFilter = params.type || 'all';
    const categoryFilter = params.category || 'all';

    const handleReset = () => {
        setFilter('status', null);
        setFilter('type', null);
        setFilter('category', null);
        setFilter('search', null);
        setLocalSearch('');
    };

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

            return true;
        });
    }, [products, localSearch, search, statusFilter, typeFilter]);

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
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-text-muted">Chargement des produits...</p>
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
                <Card className="border border-border">
                    <CardContent className="p-5">
                        <ProductsToolbar
                            searchValue={localSearch}
                            onSearchChange={(value) => setLocalSearch(value)}
                            filterComponent={
                                <ProductsFilter
                                    statusFilter={statusFilter}
                                    typeFilter={typeFilter}
                                    categoryFilter={categoryFilter}
                                    categories={[]}
                                    onStatusChange={(val) => setFilter('status', val)}
                                    onTypeChange={(val) => setFilter('type', val)}
                                    onCategoryChange={(val) => setFilter('category', val)}
                                    onReset={handleReset}
                                />
                            }
                        />

                        <BatchGenerationSheet
                            selectedCount={selectedProducts.length}
                            onGenerate={handleGenerate}
                            onOpenSettings={() => setIsSettingsOpen(true)}
                            onClose={() => {
                                setSelectedProducts([]);
                                cancelGeneration();
                            }}
                            isGenerating={isGenerating}
                            isAdvancedSettingsOpen={isSettingsOpen}
                            onApproveAll={handleApproveAll}
                            onRejectAll={handleRejectAll}
                            onPushToStore={handlePushToStore}
                            onCancelSync={() => cancelGeneration()}
                            pendingApprovalsCount={0}
                            syncableProductsCount={selectedProducts.length}
                            isProcessingBulkAction={isQueuing || acceptDraft.isPending || rejectDraft.isPending}
                            sseProgressMessage={sseProgressMessage}
                        />

                        <BatchGenerationSettings
                            open={isSettingsOpen}
                            onOpenChange={setIsSettingsOpen}
                            settings={generationSettings}
                            onSettingsChange={setGenerationSettings}
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
                    <Card className="border border-border">
                        <CardContent className="p-12 text-center">
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
                    />

                    {/* Pagination with Animation */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                    >
                        <Card className="border border-border">
                            <CardContent className="p-0">
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
