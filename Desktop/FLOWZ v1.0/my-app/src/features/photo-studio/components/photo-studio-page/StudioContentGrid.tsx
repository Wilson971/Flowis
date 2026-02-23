"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ProductsPagination } from "@/components/products/ProductsPagination";
import { PhotoStudioTable } from "@/features/photo-studio/components/PhotoStudioTable";
import { PhotoStudioCard } from "@/features/photo-studio/components/PhotoStudioCard";
import type { StudioViewMode } from "@/features/photo-studio/components/StudioToolbar";
import type { StudioStatusFilter } from "@/features/photo-studio/components/StudioFilterBar";
import type { Product } from "@/types/product";

type StudioContentGridProps = {
  filteredProducts: Product[];
  paginatedProducts: Product[];
  viewMode: StudioViewMode;
  search: string;
  statusFilter: StudioStatusFilter;
  selectedProductIds: Set<string>;
  selectedProductId: string | null;
  onToggleSelect: (productId: string) => void;
  onToggleSelectAll: () => void;
  onProductClick: (productId: string) => void;
  onProductDoubleClick: (productId: string) => void;
  // Pagination
  safeCurrentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export function StudioContentGrid({
  filteredProducts,
  paginatedProducts,
  viewMode,
  search,
  statusFilter,
  selectedProductIds,
  selectedProductId,
  onToggleSelect,
  onToggleSelectAll,
  onProductClick,
  onProductDoubleClick,
  safeCurrentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: StudioContentGridProps) {
  if (filteredProducts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-2 border-dashed border-border bg-muted/10">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center justify-center max-w-md mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
                className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-8 ring-primary/5"
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
    );
  }

  return (
    <div className="space-y-4">
      {/* Views */}
      {viewMode === "list" && (
        <PhotoStudioTable
          products={paginatedProducts}
          selectedProducts={selectedProductIds}
          onToggleSelect={onToggleSelect}
          onToggleSelectAll={onToggleSelectAll}
          selectedProductId={selectedProductId}
          onProductClick={onProductClick}
          onProductDoubleClick={onProductDoubleClick}
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
                onToggleSelect={onToggleSelect}
                onProductClick={onProductClick}
                onProductDoubleClick={onProductDoubleClick}
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
              onPageChange={onPageChange}
              onPageSizeChange={(size) => {
                onPageSizeChange(size);
              }}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
