// @ts-nocheck
/**
 * Products List Page
 *
 * Main products management page with list, filtering, and batch operations
 */

import { useState, useMemo, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProductsTable } from '@/components/products/ProductsTable';
import { useProducts, useProductStats } from '@/hooks/useProducts';
import { useSelectedStore } from '@/contexts/StoreContext';
import {
  ProductsPageHeader,
  ProductsStatsCards,
  ProductsToolbar,
  //   ProductsSelectionBar, // Replaced by BatchGenerationSheet
} from '@/components/products/ui';
import { BatchGenerationSheet } from '@/components/products/ui/BatchGenerationSheet';
import { useBatchGeneration } from '@/hooks/products/useBatchGeneration';
import { useTableFilters } from '@/hooks/useTableFilters';
import { ProductsPagination } from '@/components/products/ProductsPagination';
import { ProductsFilter } from '@/components/products/ProductsFilter';

export const Route = createFileRoute('/app/products/')({
  component: ProductsListPage,
});

function ProductsListPage() {
  const { selectedStore } = useSelectedStore();

  const { data: products = [], isLoading } = useProducts(selectedStore?.id);
  const { data: stats } = useProductStats(selectedStore?.id);

  const {
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    setFilter,
    resetFilters,
  } = useTableFilters();

  const statusFilter = (filters as any)?.status || 'all';
  const typeFilter = (filters as any)?.type || 'all';
  const categoryFilter = (filters as any)?.category || 'all';

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  // Local state for search input to avoid input lag, syncs with URL via debounce/effect
  const [localSearch, setLocalSearch] = useState(search);

  // Batch Generation Integration
  const batchMutation = useBatchGeneration();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleGenerate = (types: string[], enableSerpAnalysis: boolean, forceRegenerate?: boolean) => {
    if (!selectedStore?.id) return;

    batchMutation.mutate({
      product_ids: selectedProducts,
      content_types: types.reduce((acc, t) => ({ ...acc, [t]: true }), {}),
      settings: {
        // Default settings for now, ideally retrieved from a hook/context
        provider: 'openai',
        model: 'gpt-4o',
        tone: 'professional',
        language: 'fr',
        global_config: true,
        word_limits: {},
        image_analysis: true,
        transform_mode: 'rewrite',
        respect_editorial_lock: true
      },
      store_id: selectedStore.id,
    });
  };

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Debounce search update to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        setSearch(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, search, setSearch]);


  // Filter products based on search and status
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search filter
      const searchLower = (localSearch || search).toLowerCase();
      const matchesSearch =
        product.title.toLowerCase().includes(searchLower) ||
        product.platform_product_id.toLowerCase().includes(searchLower);

      // Status filter
      const metadata = product.metadata || {};
      const status = metadata.status || 'draft';
      const matchesStatus = statusFilter === 'all' || status === statusFilter;

      // Type filter (Mocking logic, adjust based on real data structure)
      // const type = product.metadata?.type || 'simple';
      // const matchesType = typeFilter === 'all' || type === typeFilter;
      const matchesType = true; // Placeholder

      // Category filter (Placeholder)
      const matchesCategory = true;

      return matchesSearch && matchesStatus && matchesType && matchesCategory;
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
    console.log('[ProductsListPage] Toggling product', id);
    setSelectedProducts((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      console.log('[ProductsListPage] New selection', next);
      return next;
    });
  };

  const toggleAll = (selected: boolean) => {
    setSelectedProducts(selected ? paginatedProducts.map((p) => p.id) : []);
  };

  // No store selected
  if (!selectedStore) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Package className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-text-main">Aucune boutique sélectionnée</h3>
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
    <div className="max-w-[1400px] mx-auto space-y-8 pb-10">
      {/* Modern Header */}
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

      {/* Stats Cards with less margin and lighter borders */}
      <div className="mb-2">
        <ProductsStatsCards
          totalProducts={stats?.total || 0}
          unsyncedCount={stats?.needsSync || 0}
          notOptimizedCount={stats?.notOptimized || 0}
          optimizedCount={stats?.optimized || 0}
          isLoading={isLoading}
        />
      </div>

      {/* Selection Bar (Floating or independent) - COMMENTED OUT, replaced by BatchGenerationSheet */}
      {/* {selectedProducts.length > 0 && (
        <div className="mb-4">
          <ProductsSelectionBar
            selectedCount={selectedProducts.length}
            onDeselect={() => setSelectedProducts([])}
            onGenerate={() => console.log('Generate AI content for', selectedProducts)}
            onSync={() => console.log('Sync products', selectedProducts)}
          />
        </div>
      )} */}

      {/* Main Container with Integrated Toolbar and Table */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col">
        {/* Integrated Toolbar Area */}
        <div className="px-5 py-4 bg-white border-b border-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <ProductsToolbar
            searchValue={localSearch}
            onSearchChange={setLocalSearch}
            filterComponent={
              <ProductsFilter
                statusFilter={statusFilter}
                typeFilter={typeFilter}
                categoryFilter={categoryFilter}
                categories={[]} // Populate with real categories if available
                onStatusChange={(val) => setFilter('status', val)}
                onTypeChange={(val) => setFilter('type', val)}
                onCategoryChange={(val) => setFilter('category', val)}
                onReset={resetFilters}
              />
            }
          />
        </div>

        {/* Products Table */}
        <div className="bg-white overflow-hidden">
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                <div className="h-16 w-16 rounded-full bg-zinc-50 flex items-center justify-center mb-4 border border-zinc-50">
                  <Package className="h-8 w-8 text-zinc-300" />
                </div>
                <h3 className="text-lg font-semibold mb-1 text-zinc-900">Aucun produit trouvé</h3>
                <p className="text-zinc-500 text-sm">
                  {search || statusFilter !== 'all'
                    ? 'Essayez de modifier vos filtres de recherche'
                    : 'Commencez par importer vos produits depuis votre plateforme'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <ProductsTable
                products={paginatedProducts}
                selectedProducts={selectedProducts}
                onToggleSelect={toggleProduct}
                onToggleSelectAll={toggleAll}
              />
              <ProductsPagination
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </div>
      </div>

      {/* Batch Generation Sheet */}
      <BatchGenerationSheet
        selectedCount={selectedProducts.length}
        onGenerate={handleGenerate}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClose={() => setSelectedProducts([])}
        isGenerating={batchMutation.isPending}
        isAdvancedSettingsOpen={isSettingsOpen}
        onApproveAll={() => console.log('Approve all', selectedProducts)}
        onRejectAll={() => console.log('Reject all', selectedProducts)}
        onPushToStore={() => console.log('Push to store', selectedProducts)}
        onCancelSync={() => console.log('Cancel sync', selectedProducts)}
        // Add pendingApprovalsCount etc. based on stats if available
        pendingApprovalsCount={0}
        syncableProductsCount={0}
      />
    </div>
  );
}
