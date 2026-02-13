"use client";

/**
 * PhotoStudioPage
 *
 * Main client component for the Photo Studio page.
 * Harmonized with ProductsListContent patterns:
 * - ProductsPageHeader with breadcrumbs
 * - Stats cards with animated counters
 * - Card-wrapped toolbar & filters
 * - motion.div staggered entry animations
 * - Card-wrapped pagination
 * - Consistent empty / no-store states
 */

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  ImageIcon,
  Sparkles,
  Package,
  Images,
} from "lucide-react";
import { toast } from "sonner";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Shared Products UI components (harmonization)
import { ProductsPageHeader } from "@/components/products/ui";

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

// Batch panel (portal-based bottom panel, matches Products pattern)
import { StudioBatchPortal } from "@/features/photo-studio/components/StudioBatchPortal";

// Progress overlay
import { StudioProgressOverlay } from "@/features/photo-studio/components/StudioProgressOverlay";

// Local views
import { PhotoStudioTable } from "@/features/photo-studio/components/PhotoStudioTable";
import { PhotoStudioCard } from "@/features/photo-studio/components/PhotoStudioCard";
import { getStudioStatus } from "@/features/photo-studio/components/PhotoStudioCard";

import { cn } from "@/lib/utils";
import { useCounterAnimation } from "@/hooks/useCounterAnimation";
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
// Stats Card (matches ProductsStatsCards pattern)
// ---------------------------------------------------------------------------

type StudioStatCardProps = {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  isLoading?: boolean;
  badge?: { label: string; variant: "warning" | "info" | "success" };
  subText?: string;
  total?: number;
};

function StudioStatCard({
  title,
  value,
  icon: Icon,
  isLoading = false,
  badge,
  subText,
  total,
}: StudioStatCardProps) {
  const animatedValue = useCounterAnimation(value, { duration: 1200 });

  if (isLoading) {
    return (
      <Card className="h-full border border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              <div className="h-7 w-16 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="group h-full">
      <Card className="relative overflow-hidden bg-card text-card-foreground border border-border h-full card-elevated">
        <CardContent className="p-5 flex flex-col justify-center h-full">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:text-foreground transition-colors border border-border">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex flex-col w-full min-w-0">
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate mb-0.5">
                  Statistique
                </p>
                {badge && (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-md ml-2 shrink-0 border uppercase tracking-wider",
                      badge.variant === "warning" &&
                        "text-warning bg-warning/10 border-warning/20",
                      badge.variant === "info" &&
                        "text-info bg-info/10 border-info/20",
                      badge.variant === "success" &&
                        "text-success bg-success/10 border-success/20"
                    )}
                  >
                    {badge.label}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold tracking-tight text-foreground truncate mb-1">
                {title}
              </h3>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
                  {animatedValue}
                </span>
                {total !== undefined && (
                  <span className="text-sm text-muted-foreground font-medium">
                    / {total}
                  </span>
                )}
              </div>
              {subText && (
                <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-wide">
                  {subText}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function PhotoStudioSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex flex-col gap-2 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Toolbar skeleton */}
      <Card className="border border-border">
        <CardContent className="p-5">
          <Skeleton className="h-9 w-full max-w-sm" />
        </CardContent>
      </Card>
      {/* Grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
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
  // Studio dialog
  const [studioDialogOpen, setStudioDialogOpen] = useState(false);

  // -----------------------------------------------------------------------
  // Computed stats
  // -----------------------------------------------------------------------
  const studioStats = useMemo(() => {
    const total = products.length;
    const withImages = products.filter((p) => getImageCount(p) > 0).length;
    const processed = products.filter(
      (p) => getStudioStatus(p) === "done"
    ).length;
    return { total, withImages, processed };
  }, [products]);

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

  // =======================================================================
  // No store selected (matches Products pattern)
  // =======================================================================
  if (!selectedStore) {
    return (
      <Card className="border border-border">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Camera className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              Aucune boutique selectionnee
            </h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Selectionnez une boutique pour acceder au Photo Studio et optimiser vos visuels produits
            </p>
            <Button className="font-medium">Configurer une boutique</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // =======================================================================
  // Loading state (matches Products pattern)
  // =======================================================================
  if (isLoading) {
    return <PhotoStudioSkeleton />;
  }

  // =======================================================================
  // RENDER
  // =======================================================================

  return (
    <div className="space-y-6 pb-24">
      {/* ----------------------------------------------------------------- */}
      {/* Header with Breadcrumbs (matches Products) */}
      {/* ----------------------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ProductsPageHeader
          title="Photo Studio"
          description={
            selectedStore
              ? `Generez et gerez les visuels de ${selectedStore.name} avec l'IA`
              : "Selectionnez une boutique pour acceder au Photo Studio"
          }
          breadcrumbs={[
            { label: "Dashboard", href: "/app" },
            { label: "Photo Studio" },
          ]}
        />
      </motion.div>

      {/* ----------------------------------------------------------------- */}
      {/* Stats Cards (matches Products pattern) */}
      {/* ----------------------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StudioStatCard
            title="Total Produits"
            value={studioStats.total}
            icon={Package}
          />
          <StudioStatCard
            title="Avec images"
            value={studioStats.withImages}
            icon={Images}
            total={studioStats.total}
            badge={
              studioStats.total - studioStats.withImages > 0
                ? { label: "Sans visuels", variant: "warning" }
                : undefined
            }
            subText="produits avec visuels"
          />
          <StudioStatCard
            title="Traites par l'IA"
            value={studioStats.processed}
            icon={Sparkles}
            total={studioStats.total}
            badge={
              studioStats.processed === 0
                ? { label: "A traiter", variant: "info" }
                : studioStats.processed === studioStats.total
                  ? { label: "Complet", variant: "success" }
                  : undefined
            }
            subText="visuels optimises"
          />
        </div>
      </motion.div>

      {/* ----------------------------------------------------------------- */}
      {/* Toolbar + Filters (wrapped in Card, matches Products) */}
      {/* ----------------------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border border-border">
          <CardContent className="p-5">
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

            {/* Batch Panel Portal (matches Products BatchGenerationSheet pattern) */}
            <StudioBatchPortal
              selectedCount={selectedProductIds.size}
              selectedProducts={selectedProductsList.map((p) => ({
                id: p.id,
                title: p.title,
                imageCount: p.metadata?.images?.length ?? 0,
              }))}
              onBatchStarted={(jobId: string) => setBatchJobId(jobId)}
              onClose={handleClearSelection}
              onClearSelection={handleClearSelection}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* ----------------------------------------------------------------- */}
      {/* Content */}
      {/* ----------------------------------------------------------------- */}
      {filteredProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border border-border">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
                  className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
                >
                  <ImageIcon className="h-10 w-10 text-primary" />
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="text-xl font-bold mb-2 text-foreground"
                >
                  Aucun produit trouve
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="text-muted-foreground text-sm"
                >
                  {search || statusFilter !== "all"
                    ? "Essayez de modifier vos filtres de recherche"
                    : "Importez des produits depuis votre boutique pour commencer a utiliser le Photo Studio"}
                </motion.p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
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

          {/* Pagination (wrapped in Card, matches Products) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="border border-border">
              <CardContent className="p-0">
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
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

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
