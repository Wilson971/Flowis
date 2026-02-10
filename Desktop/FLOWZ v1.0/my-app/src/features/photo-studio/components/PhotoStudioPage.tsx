"use client";

/**
 * PhotoStudioPage
 *
 * Main client component for the Photo Studio page.
 * Provides a product browser with grid / list views, search, filters, pagination,
 * batch selection, and integration with SceneStudioDialog for single-product
 * studio editing plus batch panels for multi-product operations.
 */

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  X,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

// UI
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Design system
import { motionTokens } from "@/lib/design-system";

// Contexts & hooks
import { useSelectedStore } from "@/contexts/StoreContext";
import { useProducts } from "@/hooks/useProducts";
import { useSaveGeneratedImage } from "@/features/photo-studio/hooks/useSaveGeneratedImage";

// Studio context & dialog
import { StudioContextProvider } from "@/features/photo-studio/context/StudioContext";
import { SceneStudioDialog } from "@/features/photo-studio/components/SceneStudioDialog";
import type { StudioProduct } from "@/features/photo-studio/components/SceneStudioDialog";

// Toolbar & filters
import {
  StudioToolbar,
  type StudioViewMode,
} from "@/features/photo-studio/components/StudioToolbar";
import type {
  StudioStatusFilter,
  PlatformFilter,
  ImageCountFilter,
} from "@/features/photo-studio/components/StudioFilterBar";

// Pagination (reused from products)
import { ProductsPagination } from "@/components/products/ProductsPagination";

// Batch sheet
import { StudioBatchSheet } from "@/features/photo-studio/components/StudioBatchSheet";

// Progress overlay
import { StudioProgressOverlay } from "@/features/photo-studio/components/StudioProgressOverlay";

// Local views
import { PhotoStudioTable } from "@/features/photo-studio/components/PhotoStudioTable";
import { PhotoStudioCard } from "@/features/photo-studio/components/PhotoStudioCard";
import { getStudioStatus } from "@/features/photo-studio/components/PhotoStudioCard";

import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function productToStudioProduct(product: Product): StudioProduct {
  const rawImages =
    product.metadata?.images ?? [];

  return {
    id: product.id,
    name: product.title,
    images: rawImages.map((img) => ({
      id: String(img.id),
      src: img.src,
      alt: img.alt ?? product.title,
    })),
  };
}

function getImageCount(product: Product): number {
  return (
    product.working_content?.images?.length ??
    product.metadata?.images?.length ??
    (product.image_url ? 1 : 0)
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function PhotoStudioSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PhotoStudioPage() {
  const { selectedStore } = useSelectedStore();
  const {
    data: products = [],
    isLoading,
    isFetching,
  } = useProducts(selectedStore?.id);

  const saveGeneratedImage = useSaveGeneratedImage();

  // -----------------------------------------------------------------------
  // Local state
  // -----------------------------------------------------------------------
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<StudioViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StudioStatusFilter>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [imageCountFilter, setImageCountFilter] =
    useState<ImageCountFilter>("all");

  // Selection
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );

  // Batch
  const [batchJobId, setBatchJobId] = useState<string | null>(null);
  const [brandingBatchJobId, setBrandingBatchJobId] = useState<string | null>(
    null
  );
  const [batchSheetOpen, setBatchSheetOpen] = useState(false);

  // Studio dialog
  const [studioDialogOpen, setStudioDialogOpen] = useState(false);

  // -----------------------------------------------------------------------
  // Filtered products
  // -----------------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    let result = products;

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.platform_product_id?.toLowerCase().includes(q)
      );
    }

    // Studio status filter
    if (statusFilter !== "all") {
      result = result.filter((p) => getStudioStatus(p) === statusFilter);
    }

    // Platform filter
    if (platformFilter !== "all") {
      result = result.filter(
        (p) => p.platform?.toLowerCase() === platformFilter
      );
    }

    // Image count filter
    if (imageCountFilter !== "all") {
      result = result.filter((p) => {
        const count = getImageCount(p);
        switch (imageCountFilter) {
          case "no_image":
            return count === 0;
          case "1_5":
            return count >= 1 && count <= 5;
          case "6_plus":
            return count >= 6;
          default:
            return true;
        }
      });
    }

    return result;
  }, [products, search, statusFilter, platformFilter, imageCountFilter]);

  // -----------------------------------------------------------------------
  // Pagination
  // -----------------------------------------------------------------------
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / pageSize)
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, safeCurrentPage, pageSize]);

  // Reset page when search/filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, platformFilter, imageCountFilter]);

  // -----------------------------------------------------------------------
  // Filter reset
  // -----------------------------------------------------------------------
  const handleResetFilters = useCallback(() => {
    setStatusFilter("all");
    setPlatformFilter("all");
    setImageCountFilter("all");
  }, []);

  // -----------------------------------------------------------------------
  // Selection handlers
  // -----------------------------------------------------------------------
  const handleToggleSelect = useCallback(
    (productId: string) => {
      setSelectedProductIds((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) {
          next.delete(productId);
        } else {
          next.add(productId);
        }
        return next;
      });
    },
    []
  );

  const handleToggleSelectAll = useCallback(() => {
    setSelectedProductIds((prev) => {
      if (prev.size === paginatedProducts.length) {
        return new Set();
      }
      return new Set(paginatedProducts.map((p) => p.id));
    });
  }, [paginatedProducts]);

  const handleClearSelection = useCallback(() => {
    setSelectedProductIds(new Set());
  }, []);

  // -----------------------------------------------------------------------
  // Product interaction
  // -----------------------------------------------------------------------
  const handleProductClick = useCallback((productId: string) => {
    setSelectedProductId((prev) =>
      prev === productId ? null : productId
    );
  }, []);

  const handleProductDoubleClick = useCallback(
    (productId: string) => {
      setSelectedProductId(productId);
      setStudioDialogOpen(true);
    },
    []
  );

  // -----------------------------------------------------------------------
  // Studio save handler
  // -----------------------------------------------------------------------
  const handleSaveImage = useCallback(
    async (imageUrl: string, productId: string) => {
      try {
        await saveGeneratedImage.mutateAsync({
          imageBase64: imageUrl,
          productId,
        });
        toast.success("Image sauvegardee avec succes");
      } catch {
        toast.error("Erreur lors de la sauvegarde de l'image");
      }
    },
    [saveGeneratedImage]
  );

  // -----------------------------------------------------------------------
  // Studio product for dialog
  // -----------------------------------------------------------------------
  const studioProduct = useMemo<StudioProduct | null>(() => {
    if (!selectedProductId) return null;
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return null;
    return productToStudioProduct(product);
  }, [selectedProductId, products]);

  // -----------------------------------------------------------------------
  // Batch selected products
  // -----------------------------------------------------------------------
  const selectedProductsList = useMemo(
    () => products.filter((p) => selectedProductIds.has(p.id)),
    [products, selectedProductIds]
  );

  const hasSelection = selectedProductIds.size > 0;

  // =======================================================================
  // RENDER
  // =======================================================================

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* ----------------------------------------------------------------- */}
      {/* Header */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Photo Studio
            </h1>
            <p className="text-sm text-muted-foreground">
              Generez et gerez les visuels produits avec l'IA
            </p>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Toolbar + Filters */}
      {/* ----------------------------------------------------------------- */}
      <StudioToolbar
        search={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        productCount={filteredProducts.length}
        statusFilter={statusFilter}
        platformFilter={platformFilter}
        imageCountFilter={imageCountFilter}
        onStatusFilterChange={setStatusFilter}
        onPlatformFilterChange={setPlatformFilter}
        onImageCountFilterChange={setImageCountFilter}
        onResetFilters={handleResetFilters}
      />

      {/* ----------------------------------------------------------------- */}
      {/* Selection bar */}
      {/* ----------------------------------------------------------------- */}
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            variants={motionTokens.variants.slideDown}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={motionTokens.transitions.fast}
            className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5"
          >
            <Badge variant="default" size="sm">
              {selectedProductIds.size}
            </Badge>
            <span className="text-sm font-medium">
              produit{selectedProductIds.size > 1 ? "s" : ""}{" "}
              selectionne{selectedProductIds.size > 1 ? "s" : ""}
            </span>

            <div className="ml-auto flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setBatchSheetOpen(true)}
                className="gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Traitement par lot
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Deselectionner
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------------------- */}
      {/* Content */}
      {/* ----------------------------------------------------------------- */}
      {isLoading ? (
        <PhotoStudioSkeleton />
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 px-6 text-center">
          <div className="flex items-center justify-center h-14 w-14 rounded-full bg-muted mb-4">
            <ImageIcon className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">
            Aucun produit trouve
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {search
              ? "Essayez de modifier votre recherche ou de reinitialiser les filtres."
              : "Importez des produits depuis votre boutique pour commencer a utiliser le Photo Studio."}
          </p>
        </div>
      ) : (
        <>
          {/* Views */}
          {viewMode === "list" && (
            <PhotoStudioTable
              products={paginatedProducts}
              selectedProducts={selectedProductIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              selectedProductId={selectedProductId}
              onProductClick={handleProductClick}
              onProductDoubleClick={handleProductDoubleClick}
            />
          )}

          {viewMode === "grid" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <AnimatePresence mode="popLayout">
                {paginatedProducts.map((product) => (
                  <PhotoStudioCard
                    key={product.id}
                    product={product}
                    isSelected={selectedProductId === product.id}
                    isChecked={selectedProductIds.has(product.id)}
                    onToggleSelect={handleToggleSelect}
                    onProductClick={handleProductClick}
                    onProductDoubleClick={handleProductDoubleClick}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination */}
          <ProductsPagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredProducts.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Batch Sheet */}
      {/* ----------------------------------------------------------------- */}
      <StudioBatchSheet
        open={batchSheetOpen}
        onOpenChange={setBatchSheetOpen}
        selectedProducts={selectedProductsList.map((p) => ({
          id: p.id,
          title: p.title,
          imageCount: p.metadata?.images?.length ?? 0,
        }))}
        onBatchStarted={(jobId: string) => setBatchJobId(jobId)}
        onClearSelection={handleClearSelection}
      />

      {/* ----------------------------------------------------------------- */}
      {/* Progress overlay (floating bottom-right) */}
      {/* ----------------------------------------------------------------- */}
      <StudioProgressOverlay
        batchIds={[batchJobId, brandingBatchJobId].filter(Boolean) as string[]}
        onCloseBatch={(id) => {
          if (id === batchJobId) setBatchJobId(null);
          if (id === brandingBatchJobId) setBrandingBatchJobId(null);
        }}
      />

      {/* ----------------------------------------------------------------- */}
      {/* Scene Studio Dialog */}
      {/* ----------------------------------------------------------------- */}
      <StudioContextProvider>
        <SceneStudioDialog
          open={studioDialogOpen}
          onOpenChange={setStudioDialogOpen}
          product={studioProduct}
          onSaveImage={handleSaveImage}
        />
      </StudioContextProvider>
    </div>
  );
}
