"use client";

import { motion } from 'framer-motion';
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProductsTableModernProps, defaultStatusConfig } from "./types";
import { createColumns } from "./columns";

export const ProductsTableModern = ({
  products,
  selectedProducts,
  generatingProductIds = [],
  onToggleSelect,
  onToggleSelectAll,
  wooCommerceStatusConfig = defaultStatusConfig,
  onTableReady,
  columnVisibility = {},
  onColumnVisibilityChange,
}: ProductsTableModernProps) => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [sorting, setSorting] = useState<any[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const columns = createColumns({
    selectedProducts,
    products,
    onToggleSelect,
    onToggleSelectAll,
    wooCommerceStatusConfig,
    router,
  });

  const getRowClassName = (product: { id: string }) => {
    if (generatingProductIds.includes(product.id)) {
      return "relative overflow-hidden opacity-60 animate-pulse";
    }
    return "transition-all duration-300";
  };

  const isRowGenerating = (product: { id: string }) => generatingProductIds.includes(product.id);

  if (!isClient) {
    return (
      <Card className="border border-border">
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-text-muted">Chargement du tableau...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden border border-border">
        <DataTable
          columns={columns}
          data={products}
          enableColumnVisibility={true}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={onColumnVisibilityChange}
          enablePagination={false}
          sorting={sorting}
          onSortingChange={setSorting}
          getRowClassName={getRowClassName}
          isRowGenerating={isRowGenerating}
          onTableReady={onTableReady}
        />
      </Card>
    </motion.div>
  );
};
