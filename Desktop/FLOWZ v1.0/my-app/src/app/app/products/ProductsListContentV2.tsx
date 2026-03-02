/**
 * Products List Content V2 — Vercel Pro Pattern
 * Full redesign with motionTokens, dark overlays, Vercel Pro density
 */

"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { motionTokens } from '@/lib/design-system';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductsTableModernV2 } from '@/components/products/table/ProductsTableModernV2';
import { ProductsTableSkeleton } from '@/components/products/ProductsTableSkeleton';
import { useProducts, useProductStats, type ProductListFilters } from '@/hooks/products/useProducts';
import { useSelectedStore } from '@/contexts/StoreContext';
import { ProductsPageHeaderV2 } from '@/components/products/ui/ProductsPageHeaderV2';
import { ProductsStatsCardsV2 } from '@/components/products/ui/ProductsStatsCardsV2';
import { ProductsToolbarV2 } from '@/components/products/ui/ProductsToolbarV2';
import { BatchGenerationSheet } from '@/components/products/ui/BatchGenerationSheet';
import { BatchProgressPanel } from '@/components/products/BatchProgressPanel';
import { useBatchGeneration } from '@/hooks/products/useBatchGeneration';
import { useAcceptDraft, useRejectDraft } from '@/hooks/products/useProductContent';
import { ModularGenerationSettings } from '@/types/imageGeneration';
import { getRemainingProposals } from '@/lib/productHelpers';
import type { ContentData } from '@/types/productContent';
import { useTableFilters } from '@/hooks/products/useTableFilters';
import { ProductsSelectionBarV2 } from '@/components/products/ui/ProductsSelectionBarV2';
import { FilterPill } from '@/components/products/ui/FilterPillsV2';
import { ProductsPaginationV2 } from '@/components/products/ProductsPaginationV2';
import { ProductsFilter } from '@/components/products/ProductsFilter';
import { useDebounce } from '@/hooks/useDebounce';
import { usePendingSyncCount } from '@/hooks/sync';
import { usePushProductBatch } from '@/hooks/sync/usePushToStore';
import { useLocalStorage, STORAGE_KEYS } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';
import { VisibilityState } from '@tanstack/react-table';

export function ProductsListContentV2() {
    const { selectedStore } = useSelectedStore();
    const { data: stats } = useProductStats(selectedStore?.id);

    const { mutate: pushToStore, isPending: isPushing } = usePushProductBatch();
    const { data: pendingSyncCount } = usePendingSyncCount(selectedStore?.id);

    const params = useTableFilters();
    const {
        search, setSearch,
        page, setPage,
        pageSize, setPageSize,
        setFilter, setFilters, resetFilters,
    } = params;

    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [localSearch, setLocalSearch] = useState(search);
    const debouncedSearch = useDebounce(localSearch, 300);
    const isUserTypingRef = useRef(false);

    const statusFilter       = params.status           || 'all';
    const typeFilter         = params.type             || 'all';
    const categoryFilter     = params.category         || 'all';
    const aiStatusFilter     = params.ai_status        || 'all';
    const syncStatusFilter   = params.sync_status      || 'all';
    const stockFilter        = params.stock            || 'all';
    const priceRangeFilter   = params.price_range      || 'all';
    const priceMinFilter     = params.price_min        || '';
    const priceMaxFilter     = params.price_max        || '';
    const salesFilter        = params.sales            || 'all';
    const seoScoreFilter     = params.seo_score        || 'all';
    const missingContentFilter = params.missing_content || 'all';

    const serverFilters = useMemo<ProductListFilters>(() => ({
        search:          debouncedSearch || undefined,
        status:          statusFilter     !== 'all' ? statusFilter     : undefined,
        type:            typeFilter       !== 'all' ? typeFilter       : undefined,
        ai_status:       aiStatusFilter   !== 'all' ? aiStatusFilter   : undefined,
        sync_status:     syncStatusFilter !== 'all' ? syncStatusFilter : undefined,
        stock:           stockFilter      !== 'all' ? stockFilter      : undefined,
        price_range:     priceRangeFilter !== 'all' ? priceRangeFilter : undefined,
        price_min:       priceMinFilter   || undefined,
        price_max:       priceMaxFilter   || undefined,
        sales:           salesFilter      !== 'all' ? salesFilter      : undefined,
        seo_score:       seoScoreFilter   !== 'all' ? seoScoreFilter   : undefined,
        missing_content: missingContentFilter !== 'all' ? missingContentFilter : undefined,
        page,
        pageSize,
    }), [debouncedSearch, statusFilter, typeFilter, aiStatusFilter, syncStatusFilter, stockFilter, priceRangeFilter, priceMinFilter, priceMaxFilter, salesFilter, seoScoreFilter, missingContentFilter, page, pageSize]);

    const { data: productsData, isLoading } = useProducts(selectedStore?.id, serverFilters);
    const products = productsData?.products ?? [];
    const totalCount = productsData?.totalCount ?? 0;

    const {
        startGeneration, cancel: cancelGeneration,
        activeBatchId, isGenerating, lastEvent, progress: batchProgress,
    } = useBatchGeneration();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isBatchPanelOpen, setIsBatchPanelOpen] = useState(false);

    const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>(
        STORAGE_KEYS.PRODUCTS_COLUMN_VISIBILITY,
        { defaultValue: { sales: false, revenue: false, serp: false } }
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

    const queryClient = useQueryClient();
    const acceptDraft = useAcceptDraft();
    const rejectDraft = useRejectDraft();

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
        if (!selectedStore?.id) return;
        if (selectedProducts.length === 0) return;

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
            toast.success(`${successCount} produit(s) approuve(s)`, { id: toastId, duration: 4000 });
        } else if (successCount > 0) {
            toast.warning(`${successCount} approuve(s), ${failCount} echoue(s)`, { id: toastId, duration: 4000 });
        } else if (failCount > 0) {
            toast.error(`Echec de l'approbation (${failCount} erreur(s))`, { id: toastId, duration: 6000 });
        }
    }, [selectedProducts, acceptDraft, queryClient]);

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
            toast.success(`${successCount} brouillon(s) rejete(s)`, { id: toastId, duration: 4000 });
        } else if (successCount > 0) {
            toast.warning(`${successCount} rejete(s), ${failCount} echoue(s)`, { id: toastId, duration: 4000 });
        } else if (failCount > 0) {
            toast.error(`Echec du rejet (${failCount} erreur(s))`, { id: toastId, duration: 6000 });
        }
    }, [selectedProducts, rejectDraft, queryClient]);

    const syncToastId = 'batch-sync';
    const handlePushToStore = useCallback(() => {
        if (selectedProducts.length === 0) return;
        toast.loading(`Synchronisation de ${selectedProducts.length} produit(s)...`, { id: syncToastId, duration: Infinity });
        pushToStore({ product_ids: selectedProducts });
    }, [selectedProducts, pushToStore]);

    const sseProgressMessage = useMemo(() => {
        if (!isGenerating || !lastEvent) return undefined;
        const FIELD_LABELS: Record<string, string> = {
            title: 'titre', short_description: 'description courte',
            description: 'description complete', seo_title: 'titre SEO',
            meta_description: 'meta-description', sku: 'SKU', alt_text: 'alt text images',
        };
        switch (lastEvent.type) {
            case 'product_start':
                return `Produit ${lastEvent.index}/${lastEvent.total} : Demarrage...`;
            case 'field_start':
                return `Produit ${lastEvent.index}/${lastEvent.total} : Generation ${FIELD_LABELS[lastEvent.field || ''] || lastEvent.field}...`;
            case 'field_complete':
                return `Produit ${lastEvent.index}/${lastEvent.total} : ${FIELD_LABELS[lastEvent.field || ''] || lastEvent.field} termine`;
            case 'product_complete':
                return `Produit ${lastEvent.index}/${lastEvent.total} termine`;
            case 'product_error':
                return `Produit ${lastEvent.index}/${lastEvent.total} : Erreur`;
            default:
                return undefined;
        }
    }, [isGenerating, lastEvent]);

    // Scroll to top when page changes
    useEffect(() => {
        document.getElementById('main-content')?.scrollTo({ top: 0 });
    }, [page]);

    useEffect(() => {
        isUserTypingRef.current = false;
        setLocalSearch(search);
    }, [search]);

    useEffect(() => {
        if (selectedProducts.length === 0) {
            setIsBatchPanelOpen(false);
            cancelGeneration();
        }
    }, [selectedProducts.length, cancelGeneration]);

    useEffect(() => {
        if (isUserTypingRef.current && debouncedSearch !== search) {
            setSearch(debouncedSearch);
        }
    }, [debouncedSearch, search, setSearch]);

    const handleReset = () => {
        resetFilters();
        setLocalSearch('');
    };

    const activeFilters = useMemo<FilterPill[]>(() => {
        const filters: FilterPill[] = [];
        if (statusFilter !== 'all') filters.push({ id: 'status', label: 'Statut', value: statusFilter });
        if (typeFilter !== 'all') filters.push({ id: 'type', label: 'Type', value: typeFilter });
        if (categoryFilter !== 'all') filters.push({ id: 'category', label: 'Categorie', value: categoryFilter });
        if (aiStatusFilter !== 'all') {
            const aiLabels: Record<string, string> = { optimized: 'Optimise', not_optimized: 'Non optimise', has_draft: 'Brouillon genere' };
            filters.push({ id: 'ai_status', label: 'Statut IA', value: aiLabels[aiStatusFilter] || aiStatusFilter });
        }
        if (syncStatusFilter !== 'all') {
            const syncLabels: Record<string, string> = { synced: 'Synchronise', pending: 'En attente', never: 'Jamais synchronise' };
            filters.push({ id: 'sync_status', label: 'Synchronisation', value: syncLabels[syncStatusFilter] || syncStatusFilter });
        }
        if (stockFilter !== 'all') {
            const stockLabels: Record<string, string> = { in_stock: 'En stock', low_stock: 'Stock faible', out_of_stock: 'En rupture' };
            filters.push({ id: 'stock', label: 'Stock', value: stockLabels[stockFilter] || stockFilter });
        }
        if (priceRangeFilter !== 'all') {
            const priceLabels: Record<string, string> = {
                '0-25': '0-25 EUR', '25-50': '25-50 EUR', '50-100': '50-100 EUR',
                '100-500': '100-500 EUR', '500+': '500 EUR+',
                custom: `${priceMinFilter || '0'} EUR - ${priceMaxFilter || '∞'} EUR`,
            };
            filters.push({ id: 'price_range', label: 'Prix', value: priceLabels[priceRangeFilter] || priceRangeFilter });
        }
        if (salesFilter !== 'all') {
            const salesLabels: Record<string, string> = { no_sales: 'Aucune vente', '1-10': '1-10 ventes', '11-50': '11-50 ventes', '50+': '50+ ventes' };
            filters.push({ id: 'sales', label: 'Ventes', value: salesLabels[salesFilter] || salesFilter });
        }
        if (seoScoreFilter !== 'all') {
            const seoLabels: Record<string, string> = { excellent: 'Excellent (80+)', good: 'Bon (50-79)', low: 'Faible (<50)', none: 'Non analyse' };
            filters.push({ id: 'seo_score', label: 'SEO', value: seoLabels[seoScoreFilter] || seoScoreFilter });
        }
        if (missingContentFilter !== 'all') {
            const missingLabels: Record<string, string> = {
                no_short_description: 'Sans desc. courte', no_description: 'Sans desc. longue',
                no_seo_title: 'Sans meta titre', no_seo_description: 'Sans meta desc.', no_sku: 'Sans SKU',
            };
            filters.push({ id: 'missing_content', label: 'Contenu manquant', value: missingLabels[missingContentFilter] || missingContentFilter });
        }
        return filters;
    }, [statusFilter, typeFilter, categoryFilter, aiStatusFilter, syncStatusFilter, stockFilter, priceRangeFilter, priceMinFilter, priceMaxFilter, salesFilter, seoScoreFilter, missingContentFilter]);

    const handleRemoveFilter = useCallback((id: string) => {
        if (id === 'price_range') {
            // Remove all three price params atomically to avoid race conditions
            setFilters({ price_range: null, price_min: null, price_max: null });
        } else {
            setFilter(id, null);
        }
    }, [setFilter, setFilters]);

    const totalItems = totalCount;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    const toggleProduct = (id: string) => {
        setSelectedProducts((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
        );
    };

    const toggleAll = (selected: boolean) => {
        setSelectedProducts(selected ? products.map((p) => p.id) : []);
    };

    // No store selected — empty state Vercel Pro
    if (!selectedStore) {
        return (
            <div className="rounded-xl border border-border/40 bg-card relative overflow-hidden">
                <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />
                <div className="relative z-10 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 mx-auto mb-3">
                        <Package className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Aucune boutique selectionnee</p>
                    <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs mx-auto">
                        Selectionnez une boutique pour gerer vos produits et optimiser leur contenu
                    </p>
                    <Button size="sm" className="h-8 text-[11px] rounded-lg gap-1.5 font-medium mt-4">
                        Configurer une boutique
                    </Button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <ProductsTableSkeleton />
            </div>
        );
    }

    return (
        <motion.div
            variants={motionTokens.variants.staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4"
        >
            {/* Header with nav tabs */}
            <motion.div variants={motionTokens.variants.staggerItem}>
                <ProductsPageHeaderV2
                    title="Produits"
                    description={
                        selectedStore
                            ? `Gerez les produits de ${selectedStore.name}`
                            : 'Selectionnez une boutique pour gerer vos produits'
                    }
                    breadcrumbs={[
                        { label: 'Dashboard', href: '/app' },
                        { label: 'Produits' },
                    ]}
                />
            </motion.div>

            {/* KPI Stats */}
            <motion.div variants={motionTokens.variants.staggerItem}>
                <ProductsStatsCardsV2
                    totalProducts={stats?.total || 0}
                    unsyncedCount={stats?.needsSync || 0}
                    notOptimizedCount={stats?.notOptimized || 0}
                    optimizedCount={stats?.optimized || 0}
                    isLoading={isLoading}
                />
            </motion.div>

            {/* Toolbar */}
            <motion.div variants={motionTokens.variants.staggerItem}>
                <div className="rounded-xl border border-border/40 bg-card relative overflow-hidden">
                    <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />
                    <div className="relative z-10 px-4 py-2.5">
                        <ProductsToolbarV2
                            searchValue={localSearch}
                            onSearchChange={(value) => { isUserTypingRef.current = true; setLocalSearch(value); }}
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
                                    priceRangeFilter={priceRangeFilter}
                                    priceMinFilter={priceMinFilter}
                                    priceMaxFilter={priceMaxFilter}
                                    salesFilter={salesFilter}
                                    seoScoreFilter={seoScoreFilter}
                                    missingContentFilter={missingContentFilter}
                                    onStatusChange={(val) => setFilter('status', val)}
                                    onTypeChange={(val) => setFilter('type', val)}
                                    onCategoryChange={(val) => setFilter('category', val)}
                                    onAiStatusChange={(val) => setFilter('ai_status', val)}
                                    onSyncStatusChange={(val) => setFilter('sync_status', val)}
                                    onStockChange={(val) => setFilter('stock', val)}
                                    onPriceRangeChange={(val) => setFilter('price_range', val)}
                                    onPriceMinChange={(val) => setFilter('price_min', val || null)}
                                    onPriceMaxChange={(val) => setFilter('price_max', val || null)}
                                    onSalesChange={(val) => setFilter('sales', val)}
                                    onSeoScoreChange={(val) => setFilter('seo_score', val)}
                                    onMissingContentChange={(val) => setFilter('missing_content', val)}
                                    onReset={handleReset}
                                />
                            }
                        />

                        {/* Selection bar */}
                        <div className={cn(selectedProducts.length > 0 && "mt-2.5")}>
                            <ProductsSelectionBarV2
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
                            onCancelSync={() => { }}
                            pendingApprovalsCount={pendingApprovalsCount}
                            syncableProductsCount={selectedProducts.length}
                            isProcessingBulkAction={isPushing || acceptDraft.isPending || rejectDraft.isPending}
                            sseProgressMessage={sseProgressMessage}
                            modelName={generationSettings.model === 'gemini-2.5-flash-preview-05-20' ? 'Gemini 2.5 Flash' : 'Gemini 2.0 Flash'}
                            settings={generationSettings}
                            onSettingsChange={setGenerationSettings}
                            onCloseSettings={() => setIsSettingsOpen(false)}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Batch Progress Panel */}
            {activeBatchId && !isGenerating && (
                <BatchProgressPanel
                    jobId={activeBatchId}
                    onComplete={() => { }}
                />
            )}

            {/* Table or empty state */}
            {products.length === 0 ? (
                <motion.div variants={motionTokens.variants.staggerItem}>
                    <div className="rounded-xl border border-border/40 bg-card relative overflow-hidden">
                        <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />
                        <div className="relative z-10 py-10 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 ring-1 ring-border/50 mx-auto mb-3">
                                <Package className="h-5 w-5 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium text-foreground">Aucun produit trouve</p>
                            <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs mx-auto">
                                {(localSearch || search) || statusFilter !== 'all'
                                    ? 'Essayez de modifier vos filtres de recherche'
                                    : 'Commencez par importer vos produits depuis votre plateforme'}
                            </p>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <motion.div variants={motionTokens.variants.staggerItem} className="space-y-4">
                    <ProductsTableModernV2
                        products={products}
                        selectedProducts={selectedProducts}
                        onToggleSelect={toggleProduct}
                        onToggleSelectAll={toggleAll}
                        columnVisibility={columnVisibility}
                        onColumnVisibilityChange={setColumnVisibility}
                    />

                    {/* Pagination — sticky bottom */}
                    <div className="sticky bottom-0 z-20 rounded-xl border border-border/40 bg-card/95 backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />
                        <div className="relative z-10">
                            <ProductsPaginationV2
                                currentPage={page}
                                totalPages={totalPages}
                                pageSize={pageSize}
                                totalItems={totalItems}
                                onPageChange={setPage}
                                onPageSizeChange={setPageSize}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
