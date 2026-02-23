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

import React, { useCallback } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Package,
  Images,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Shared Products UI components (harmonization)
import { ProductsPageHeader } from "@/components/products/ui";

// Studio context & dialog
import { StudioContextProvider } from "@/features/photo-studio/context/StudioContext";
import { SceneStudioDialog } from "@/features/photo-studio/components/SceneStudioDialog";

// Toolbar & filters
import { StudioToolbar } from "@/features/photo-studio/components/StudioToolbar";

// Batch panel (portal-based bottom panel, matches Products pattern)
import { StudioBatchPortal } from "@/features/photo-studio/components/StudioBatchPortal";

// Progress overlay
import { StudioProgressOverlay } from "@/features/photo-studio/components/StudioProgressOverlay";

// Save hook
import { useSaveGeneratedImage } from "@/features/photo-studio/hooks/useSaveGeneratedImage";

// Local sub-components & hook
import { StudioStatCard } from "./StudioStatCard";
import { StudioContentGrid } from "./StudioContentGrid";
import { usePhotoStudioData } from "./usePhotoStudioData";

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
        <CardContent className="p-6">
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
  const data = usePhotoStudioData();
  const saveGeneratedImage = useSaveGeneratedImage();

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

  // =======================================================================
  // No store selected (matches Products pattern)
  // =======================================================================
  if (!data.selectedStore) {
    return (
      <Card className="border-2 border-dashed border-border bg-muted/10">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-8 ring-primary/5">
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
  if (data.isLoading) {
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
            data.selectedStore
              ? `Generez et gerez les visuels de ${data.selectedStore.name} avec l'IA`
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
            value={data.studioStats.total}
            icon={Package}
          />
          <StudioStatCard
            title="Avec images"
            value={data.studioStats.withImages}
            icon={Images}
            total={data.studioStats.total}
            badge={
              data.studioStats.total - data.studioStats.withImages > 0
                ? { label: "Sans visuels", variant: "warning" }
                : undefined
            }
            subText="produits avec visuels"
          />
          <StudioStatCard
            title="Traites par l'IA"
            value={data.studioStats.processed}
            icon={Sparkles}
            total={data.studioStats.total}
            badge={
              data.studioStats.processed === 0
                ? { label: "A traiter", variant: "info" }
                : data.studioStats.processed === data.studioStats.total
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
          <CardContent className="p-6">
            <StudioToolbar
              search={data.search}
              onSearchChange={data.setSearch}
              viewMode={data.viewMode}
              onViewModeChange={data.setViewMode}
              productCount={data.filteredProducts.length}
              statusFilter={data.statusFilter}
              platformFilter={data.platformFilter}
              imageCountFilter={data.imageCountFilter}
              onStatusFilterChange={data.setStatusFilter}
              onPlatformFilterChange={data.setPlatformFilter}
              onImageCountFilterChange={data.setImageCountFilter}
              onResetFilters={data.handleResetFilters}
            />

            {/* Batch Panel Portal (matches Products BatchGenerationSheet pattern) */}
            <StudioBatchPortal
              selectedCount={data.selectedProductIds.size}
              selectedProducts={data.selectedProductsList.map((p) => ({
                id: p.id,
                title: p.title,
                imageCount: p.metadata?.images?.length ?? 0,
              }))}
              onBatchStarted={(jobId: string) => data.setBatchJobId(jobId)}
              onClose={data.handleClearSelection}
              onClearSelection={data.handleClearSelection}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* ----------------------------------------------------------------- */}
      {/* Content */}
      {/* ----------------------------------------------------------------- */}
      <StudioContentGrid
        filteredProducts={data.filteredProducts}
        paginatedProducts={data.paginatedProducts}
        viewMode={data.viewMode}
        search={data.search}
        statusFilter={data.statusFilter}
        selectedProductIds={data.selectedProductIds}
        selectedProductId={data.selectedProductId}
        onToggleSelect={data.handleToggleSelect}
        onToggleSelectAll={data.handleToggleSelectAll}
        onProductClick={data.handleProductClick}
        onProductDoubleClick={data.handleProductDoubleClick}
        safeCurrentPage={data.safeCurrentPage}
        totalPages={data.totalPages}
        pageSize={data.pageSize}
        onPageChange={data.setCurrentPage}
        onPageSizeChange={(size) => {
          data.setPageSize(size);
          data.setCurrentPage(1);
        }}
      />

      {/* ----------------------------------------------------------------- */}
      {/* Progress overlay (floating bottom-right) */}
      {/* ----------------------------------------------------------------- */}
      <StudioProgressOverlay
        batchIds={[data.batchJobId, data.brandingBatchJobId].filter(Boolean) as string[]}
        onCloseBatch={(id) => {
          if (id === data.batchJobId) data.setBatchJobId(null);
          if (id === data.brandingBatchJobId) data.setBrandingBatchJobId(null);
        }}
      />

      {/* ----------------------------------------------------------------- */}
      {/* Scene Studio Dialog */}
      {/* ----------------------------------------------------------------- */}
      <StudioContextProvider>
        <SceneStudioDialog
          open={data.studioDialogOpen}
          onOpenChange={data.setStudioDialogOpen}
          product={data.studioProduct}
          onSaveImage={handleSaveImage}
        />
      </StudioContextProvider>
    </div>
  );
}
