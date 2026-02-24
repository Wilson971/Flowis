"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { STALE_TIMES } from "@/lib/query-config";
import { useSelectedStore } from "@/contexts/StoreContext";
import { useProducts } from "@/hooks/products/useProducts";
import { createClient } from "@/lib/supabase/client";
import { getStudioStatus } from "@/features/photo-studio/components/PhotoStudioCard";
import type { Product } from "@/types/product";
import type { StudioProduct } from "@/features/photo-studio/components/SceneStudioDialog";
import type { StudioViewMode } from "@/features/photo-studio/components/StudioToolbar";
import type {
  StudioStatusFilter,
  PlatformFilter,
  ImageCountFilter,
} from "@/features/photo-studio/components/StudioFilterBar";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function productToStudioProduct(product: Product): StudioProduct {
  const rawImages = product.metadata?.images ?? [];

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

export function getImageCount(product: Product): number {
  const wcCount = product.working_content?.images?.length ?? 0;
  const metaCount = product.metadata?.images?.length ?? 0;
  return Math.max(wcCount, metaCount) || (product.image_url ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePhotoStudioData() {
  const { selectedStore } = useSelectedStore();
  const {
    data: productsData,
    isLoading,
    isFetching,
  } = useProducts(selectedStore?.id);
  const products = productsData?.products ?? [];

  // Server-side exact counts via RPC (not limited by PRODUCTS_PAGE_SIZE)
  const { data: serverStats } = useQuery({
    queryKey: ["studio-stats", selectedStore?.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_studio_stats", {
        p_store_id: selectedStore!.id,
      });
      if (error) throw error;
      return data as { total: number; with_images: number; total_images: number; processed: number };
    },
    enabled: !!selectedStore?.id,
    staleTime: STALE_TIMES.DETAIL,
  });

  // -------------------------------------------------------------------------
  // Local state
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Computed stats
  // -------------------------------------------------------------------------
  const studioStats = useMemo(() => {
    // Use server-side exact counts when available (not limited by page size)
    if (serverStats) {
      return {
        total: serverStats.total,
        withImages: serverStats.with_images,
        totalImages: serverStats.total_images,
        processed: serverStats.processed,
      };
    }
    // Fallback to client-side counts while RPC loads
    const totalImages = products.reduce(
      (sum, p) => sum + (p.metadata?.images?.length ?? 0),
      0
    );
    return {
      total: products.length,
      withImages: products.filter((p) => getImageCount(p) > 0).length,
      totalImages,
      processed: products.filter((p) => getStudioStatus(p) === "done").length,
    };
  }, [products, serverStats]);

  // -------------------------------------------------------------------------
  // Filtered products
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------
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
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, platformFilter, imageCountFilter]);

  // -------------------------------------------------------------------------
  // Filter reset
  // -------------------------------------------------------------------------
  const handleResetFilters = useCallback(() => {
    setStatusFilter("all");
    setPlatformFilter("all");
    setImageCountFilter("all");
  }, []);

  // -------------------------------------------------------------------------
  // Selection handlers
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Product interaction
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Studio product for dialog
  // -------------------------------------------------------------------------
  const studioProduct = useMemo<StudioProduct | null>(() => {
    if (!selectedProductId) return null;
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return null;
    return productToStudioProduct(product);
  }, [selectedProductId, products]);

  // -------------------------------------------------------------------------
  // Batch selected products
  // -------------------------------------------------------------------------
  const selectedProductsList = useMemo(
    () => products.filter((p) => selectedProductIds.has(p.id)),
    [products, selectedProductIds]
  );

  return {
    // Store
    selectedStore,
    // Data
    products,
    isLoading,
    isFetching,
    // Search & view
    search,
    setSearch,
    viewMode,
    setViewMode,
    // Filters
    statusFilter,
    setStatusFilter,
    platformFilter,
    setPlatformFilter,
    imageCountFilter,
    setImageCountFilter,
    handleResetFilters,
    // Stats
    studioStats,
    // Filtered & paginated
    filteredProducts,
    paginatedProducts,
    // Pagination
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    safeCurrentPage,
    // Selection
    selectedProductIds,
    selectedProductId,
    handleToggleSelect,
    handleToggleSelectAll,
    handleClearSelection,
    handleProductClick,
    handleProductDoubleClick,
    // Batch
    batchJobId,
    setBatchJobId,
    brandingBatchJobId,
    setBrandingBatchJobId,
    // Studio dialog
    studioDialogOpen,
    setStudioDialogOpen,
    studioProduct,
    // Derived
    selectedProductsList,
  };
}
