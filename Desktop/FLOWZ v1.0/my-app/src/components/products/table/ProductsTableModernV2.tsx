/**
 * Products Table Modern V2 — Vercel Pro Pattern
 * Clean row hovers, motionTokens, no left border highlight
 */

"use client";

import { motion, useReducedMotion } from 'framer-motion';
import { DataTable } from "@/components/ui/data-table";
import { Card } from "@/components/ui/card";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ProductsTableModernProps, defaultStatusConfig } from "./types";
import { createColumnsV2 } from "./columnsV2";
import { motionTokens } from '@/lib/design-system';

export const ProductsTableModernV2 = ({
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
  const prefersReducedMotion = useReducedMotion();
  const [isClient, setIsClient] = useState(false);
  const [sorting, setSorting] = useState<any[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const columns = useMemo(() => createColumnsV2({
    selectedProducts,
    products,
    onToggleSelect,
    onToggleSelectAll,
    wooCommerceStatusConfig,
    router,
  }), [selectedProducts, products, onToggleSelect, onToggleSelectAll, wooCommerceStatusConfig, router]);

  const getRowClassName = (product: { id: string }) => {
    if (generatingProductIds.includes(product.id)) {
      return "relative overflow-hidden opacity-60 animate-pulse";
    }
    return "group transition-colors hover:bg-muted/30 cursor-pointer";
  };

  const isRowGenerating = (product: { id: string }) => generatingProductIds.includes(product.id);

  if (!isClient) {
    return (
      <div className="rounded-xl border border-border/40 bg-card relative overflow-hidden">
        <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />
        <div className="relative z-10 p-12 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground">Chargement du tableau...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={prefersReducedMotion ? undefined : motionTokens.variants.slideUp}
      initial={prefersReducedMotion ? false : "hidden"}
      animate={prefersReducedMotion ? {} : "visible"}
      transition={motionTokens.transitions.default}
    >
      <div className="rounded-xl border border-border/40 bg-card relative overflow-hidden">
        <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground/[0.03] dark:via-transparent dark:to-transparent pointer-events-none rounded-xl" />
        <div className="relative z-10 overflow-x-auto">
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
        </div>
      </div>
    </motion.div>
  );
};
