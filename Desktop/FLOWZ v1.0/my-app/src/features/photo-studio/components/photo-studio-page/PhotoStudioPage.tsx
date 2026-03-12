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

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Package,
  Images,
  ImageIcon,
  Sparkles,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Shared Products UI components (harmonization)
import { ProductsPageHeader } from "@/components/products/ui";

// Studio context & dialog
import { StudioContextProvider } from "@/features/photo-studio/context/StudioContext";
import { SceneStudioDialog } from "@/features/photo-studio/components/SceneStudioDialog";

// Toolbar & filters
import { StudioToolbar } from "@/features/photo-studio/components/StudioToolbar";

// Batch panel (portal-based bottom panel, matches Products pattern)
import { StudioBatchPortal } from "@/features/photo-studio/components/StudioBatchPortal";

// Floating batch widget
import { useBatchFloating } from "@/components/batch";

// Save hook
import { useSaveGeneratedImage } from "@/features/photo-studio/hooks/useSaveGeneratedImage";

// Viewer components
import { GalleryView, CompareOverlay, LightTable } from "@/features/photo-studio/components/viewer";
import type { ViewMode } from "@/features/photo-studio/components/viewer";

// Editor
import { EditorHub } from "@/features/photo-studio/components/editor/EditorHub";

// Validation
import { BulkActions } from "@/features/photo-studio/components/validation/BulkActions";

// Monitoring
import { StudioAnalyticsDashboard } from "@/features/photo-studio/monitoring/components/StudioAnalyticsDashboard";
import { useStudioQuota } from "@/features/photo-studio/monitoring/hooks/useStudioQuota";

// Images hook
import { useStudioImages } from "@/features/photo-studio/hooks/useStudioImages";
import type { StudioImage } from "@/features/photo-studio/hooks/useStudioImages";

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
          <Card key={i} className="border border-border/50 bg-card/95 backdrop-blur-sm">
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
      <Card className="border border-border/50 bg-card/95 backdrop-blur-lg">
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
  const { addBatch, removeBatch } = useBatchFloating();

  // --- Results tab state ---
  const [activeTab, setActiveTab] = useState<"produits" | "resultats">("produits");
  const [resultsViewMode, setResultsViewMode] = useState<ViewMode>("gallery");
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  // --- EditorHub state ---
  const [editorProduct, setEditorProduct] = useState<{
    id: string;
    title: string;
    images: string[];
  } | null>(null);

  // --- Studio images for results tab ---
  const {
    images: studioImages,
    isLoading: imagesLoading,
    updateStatus,
  } = useStudioImages();

  // --- Quota ---
  const { isNearLimit, isQuotaExceeded } = useStudioQuota();

  // Show quota toast once
  useEffect(() => {
    if (isNearLimit && !isQuotaExceeded) {
      toast.warning("Vous approchez de votre limite de generations mensuelles.", {
        id: "quota-near-limit",
      });
    }
  }, [isNearLimit, isQuotaExceeded]);

  // Map StudioImage[] to LightTable format
  const lightTableImages = useMemo(
    () =>
      studioImages.map((img) => ({
        id: img.id,
        url: img.storage_url,
        productId: img.product_id,
        productName: img.product_id,
        action: img.action,
        createdAt: img.created_at,
      })),
    [studioImages]
  );

  // Compare overlay: use first two selected images
  const compareImages = useMemo(() => {
    const selected = studioImages.filter((img) => selectedImageIds.has(img.id));
    return selected.length >= 2 ? selected.slice(0, 2) : null;
  }, [studioImages, selectedImageIds]);

  // Register batch IDs in the floating widget store
  useEffect(() => {
    if (data.batchJobId) addBatch(data.batchJobId, "studio");
  }, [data.batchJobId, addBatch]);

  useEffect(() => {
    if (data.brandingBatchJobId) addBatch(data.brandingBatchJobId, "studio");
  }, [data.brandingBatchJobId, addBatch]);

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
  // EditorHub: open on double-click
  // -----------------------------------------------------------------------
  const handleOpenEditor = useCallback(
    (productId: string) => {
      const product = data.products.find((p) => p.id === productId);
      if (!product) return;
      const images =
        product.metadata?.images?.map((img: { src: string }) => img.src) ?? [];
      if (product.image_url && images.length === 0) images.push(product.image_url);
      setEditorProduct({ id: product.id, title: product.title, images });
    },
    [data.products]
  );

  // -----------------------------------------------------------------------
  // Bulk actions handlers
  // -----------------------------------------------------------------------
  const handleBulkAction = useCallback(
    (action: "approve" | "publish" | "reject") => {
      const ids = Array.from(selectedImageIds);
      if (ids.length === 0) return;
      updateStatus(
        { imageIds: ids, action: action === "reject" ? "reject" : action },
        {
          onSuccess: () => {
            toast.success(
              action === "approve"
                ? `${ids.length} image(s) approuvee(s)`
                : action === "publish"
                  ? `${ids.length} image(s) publiee(s)`
                  : `${ids.length} image(s) rejetee(s)`
            );
            setSelectedImageIds(new Set());
          },
          onError: () => toast.error("Erreur lors de la mise a jour"),
        }
      );
    },
    [selectedImageIds, updateStatus]
  );

  const handleBulkDownload = useCallback(async () => {
    const selected = studioImages.filter((img) => selectedImageIds.has(img.id));
    if (selected.length === 0) return;

    // Single image: direct download
    if (selected.length === 1) {
      const a = document.createElement("a");
      a.href = selected[0].storage_url;
      a.download = `studio-${selected[0].id}.png`;
      a.click();
      return;
    }

    // Multiple: use JSZip if available, else download individually
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      const fetches = await Promise.allSettled(
        selected.map(async (img) => {
          const res = await fetch(img.storage_url);
          const blob = await res.blob();
          return { name: `studio-${img.id}.png`, blob };
        })
      );

      for (const result of fetches) {
        if (result.status === "fulfilled") {
          zip.file(result.value.name, result.value.blob);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `studio-images-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: download individually
      for (const img of selected) {
        const a = document.createElement("a");
        a.href = img.storage_url;
        a.download = `studio-${img.id}.png`;
        a.click();
      }
    }
  }, [studioImages, selectedImageIds]);

  // =======================================================================
  // No store selected (matches Products pattern)
  // =======================================================================
  if (!data.selectedStore) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            title="Images galerie"
            value={data.studioStats.totalImages}
            icon={ImageIcon}
            subText="photos au total"
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
      {/* Quota warning */}
      {/* ----------------------------------------------------------------- */}
      {isQuotaExceeded && (
        <Alert variant="destructive" className="border-destructive/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Quota de generations mensuel atteint. Les generations par lot sont desactivees.
          </AlertDescription>
        </Alert>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Analytics (collapsible) */}
      {/* ----------------------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
          <Card className="border border-border/50 bg-card/95 backdrop-blur-lg">
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full p-4 text-left">
                <span className="text-sm font-medium text-foreground">
                  Analytiques Studio
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    analyticsOpen && "rotate-180"
                  )}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="p-6 pt-0">
                <StudioAnalyticsDashboard />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </motion.div>

      {/* ----------------------------------------------------------------- */}
      {/* Toolbar + Filters (wrapped in Card, matches Products) */}
      {/* ----------------------------------------------------------------- */}
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
              resultsViewMode={resultsViewMode}
              onResultsViewModeChange={setResultsViewMode}
              showResultsViewSwitcher={activeTab === "resultats"}
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
      {/* Tabs: Produits / Resultats */}
      {/* ----------------------------------------------------------------- */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "produits" | "resultats")}
      >
        <TabsList className="bg-muted/50">
          <TabsTrigger value="produits">Produits</TabsTrigger>
          <TabsTrigger value="resultats">Resultats</TabsTrigger>
        </TabsList>

        {/* --- Produits tab --- */}
        <TabsContent value="produits" className="mt-4">
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
            onProductDoubleClick={handleOpenEditor}
            safeCurrentPage={data.safeCurrentPage}
            totalPages={data.totalPages}
            pageSize={data.pageSize}
            onPageChange={data.setCurrentPage}
            onPageSizeChange={(size) => {
              data.setPageSize(size);
              data.setCurrentPage(1);
            }}
          />
        </TabsContent>

        {/* --- Resultats tab --- */}
        <TabsContent value="resultats" className="mt-4">
          <AnimatePresence mode="wait">
            {resultsViewMode === "gallery" && (
              <motion.div
                key="gallery"
                variants={motionTokens.variants.fadeIn}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <GalleryView
                  images={studioImages}
                  isLoading={imagesLoading}
                  selectedIds={selectedImageIds}
                  onSelectionChange={setSelectedImageIds}
                  onImageClick={(img) => {
                    const product = data.products.find(
                      (p) => p.id === img.product_id
                    );
                    if (product) {
                      handleOpenEditor(product.id);
                    }
                  }}
                />
              </motion.div>
            )}

            {resultsViewMode === "compare" && (
              <motion.div
                key="compare"
                variants={motionTokens.variants.fadeIn}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {compareImages ? (
                  <CompareOverlay
                    originalUrl={compareImages[0].storage_url}
                    generatedUrl={compareImages[1].storage_url}
                    className="aspect-video max-h-[600px]"
                  />
                ) : (
                  <Card className="border border-border/50 bg-card/90">
                    <CardContent className="p-12 text-center">
                      <p className="text-sm text-muted-foreground">
                        Selectionnez 2 images dans la vue Galerie pour les comparer.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {resultsViewMode === "lighttable" && (
              <motion.div
                key="lighttable"
                variants={motionTokens.variants.fadeIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="h-[600px] rounded-xl overflow-hidden border border-border"
              >
                <LightTable
                  images={lightTableImages}
                  isLoading={imagesLoading}
                  onImageAction={(ids, action) => {
                    updateStatus({ imageIds: ids, action });
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* ----------------------------------------------------------------- */}
      {/* Bulk Actions (floating, visible when images selected) */}
      {/* ----------------------------------------------------------------- */}
      <BulkActions
        selectedCount={selectedImageIds.size}
        selectedIds={Array.from(selectedImageIds)}
        onAction={handleBulkAction}
        onDownload={handleBulkDownload}
        onClear={() => setSelectedImageIds(new Set())}
      />

      {/* Progress is now handled by the global BatchFloatingWidget */}

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

      {/* ----------------------------------------------------------------- */}
      {/* EditorHub Dialog */}
      {/* ----------------------------------------------------------------- */}
      {editorProduct && (
        <EditorHub
          open={!!editorProduct}
          onOpenChange={(open) => {
            if (!open) setEditorProduct(null);
          }}
          product={editorProduct}
        />
      )}
    </div>
  );
}
