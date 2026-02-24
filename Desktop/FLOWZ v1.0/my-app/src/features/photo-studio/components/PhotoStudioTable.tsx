"use client";

/**
 * PhotoStudioTable
 *
 * Data-table view for products in the Photo Studio page.
 * Uses the shared DataTable component (same as ProductsTableModern)
 * for identical row hover animations, header styles, and empty states.
 */

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  Camera,
  Pencil,
  ArrowUpDown,
  ImageIcon,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { DataTable } from "@/components/ui/data-table";
import { getStudioStatus, type StudioStatus } from "./PhotoStudioCard";
import type { Product } from "@/types/product";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PhotoStudioTableProps {
  products: Product[];
  selectedProducts: Set<string>;
  onToggleSelect: (productId: string) => void;
  onToggleSelectAll: () => void;
  selectedProductId: string | null;
  onProductClick: (productId: string) => void;
  onProductDoubleClick: (productId: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getImageCount(product: Product): number {
  return (
    product.working_content?.images?.length ??
    product.metadata?.images?.length ??
    (product.image_url ? 1 : 0)
  );
}

function getStatusConfig(product: Product) {
  const status = product.status ?? product.metadata?.status ?? "draft";

  switch (status) {
    case "publish":
      return { label: "Publié", variant: "success" as const };
    case "pending":
      return { label: "En attente", variant: "info" as const };
    case "draft":
    default:
      return { label: "Brouillon", variant: "warning" as const };
  }
}

function getStudioStatusBadge(status: StudioStatus) {
  switch (status) {
    case "running":
      return (
        <Badge variant="info" size="sm" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          En cours
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" size="sm" className="gap-1">
          <XCircle className="h-3 w-3" />
          Erreur
        </Badge>
      );
    case "done":
      return (
        <Badge variant="success" size="sm" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Traité
        </Badge>
      );
    default:
      return (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Non traité
        </span>
      );
  }
}

function getLastProcessedDate(product: Product): string | null {
  const jobs = (product as any).studio_jobs as
    | Array<{ updated_at?: string; created_at?: string }>
    | undefined;
  if (!jobs || jobs.length === 0) return null;

  const latest = jobs.reduce((max, j) => {
    const d = j.updated_at ?? j.created_at;
    if (!d) return max;
    return !max || d > max ? d : max;
  }, "" as string);

  if (!latest) return null;

  const date = new Date(latest);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

// ---------------------------------------------------------------------------
// Image cell (matches ProductImageCell pattern — tooltip zoom on hover)
// ---------------------------------------------------------------------------

function StudioImageCell({ product }: { product: Product }) {
  const src = product.image_url ?? product.metadata?.images?.[0]?.src;

  if (!src) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="h-12 w-12 rounded-lg border border-dashed border-border bg-muted flex items-center justify-center"
      >
        <Package className="h-6 w-6 text-muted-foreground" />
      </motion.div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileHover={{ scale: 1.1 }} className="cursor-pointer">
            <div className="h-12 w-12 relative rounded-lg overflow-hidden border border-border bg-muted">
              <img
                src={src}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="right" className="p-2 max-w-none">
          <img
            src={src}
            alt={product.title}
            className="w-64 h-64 object-contain rounded-lg"
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Column factory (matches ProductsTableModern header typography)
// ---------------------------------------------------------------------------

function createStudioColumns({
  selectedProducts,
  products,
  onToggleSelect,
  onToggleSelectAll,
  onProductDoubleClick,
  router,
}: {
  selectedProducts: Set<string>;
  products: Product[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onProductDoubleClick: (id: string) => void;
  router: ReturnType<typeof useRouter>;
}): ColumnDef<Product>[] {
  const allSelected =
    products.length > 0 && selectedProducts.size === products.length;

  return [
    // Checkbox
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={allSelected}
          onCheckedChange={() => onToggleSelectAll()}
          aria-label="Tout sélectionner"
          className="border rounded data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedProducts.has(row.original.id)}
          onCheckedChange={() => onToggleSelect(row.original.id)}
          aria-label={`Sélectionner ${row.original.title}`}
          className="border rounded data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },

    // Image (with tooltip zoom like Products)
    {
      accessorKey: "image_url",
      header: () => (
        <span className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest">
          Image
        </span>
      ),
      cell: ({ row }) => <StudioImageCell product={row.original} />,
      enableSorting: false,
    },

    // Title + platform + ID + SKU (matches Products title cell)
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-0 text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest hover:text-foreground hover:bg-transparent"
        >
          Produit
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original;
        const sku = product.metadata?.sku || "—";
        return (
          <div className="flex flex-col min-w-0 max-w-[250px] lg:max-w-md gap-0.5">
            <span className="text-sm font-semibold leading-snug text-left text-foreground line-clamp-2">
              {product.title}
            </span>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium font-mono">
              <span title="ID Produit">#{product.platform_product_id}</span>
              <span className="text-muted-foreground/30">|</span>
              <span title="SKU">SKU: {sku}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                {product.platform} • {new Date(product.imported_at).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>
        );
      },
    },

    // Status (matches Products status cell with dot indicator)
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-0 text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest hover:text-foreground hover:bg-transparent"
        >
          Statut
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const cfg = getStatusConfig(row.original);
        return (
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                cfg.variant === "success"
                  ? "bg-success"
                  : cfg.variant === "warning"
                    ? "bg-warning"
                    : "bg-info"
              }`}
            />
            <span className="text-sm text-muted-foreground font-medium">
              {cfg.label}
            </span>
          </div>
        );
      },
    },

    // Studio status
    {
      id: "studioStatus",
      header: () => (
        <span className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest">
          Studio
        </span>
      ),
      cell: ({ row }) => {
        const status = getStudioStatus(row.original);
        return getStudioStatusBadge(status);
      },
      enableSorting: false,
    },

    // Image count
    {
      id: "images",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-0 text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest hover:text-foreground hover:bg-transparent flex items-center gap-1.5"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          Images
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      accessorFn: (row) => getImageCount(row),
      cell: ({ row }) => {
        const count = getImageCount(row.original);
        if (count === 0)
          return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <Badge
            variant="outline"
            className="bg-muted text-muted-foreground border-border font-medium shadow-none px-2 py-0.5"
          >
            {count} image{count > 1 ? "s" : ""}
          </Badge>
        );
      },
    },

    // Last processed
    {
      id: "lastProcessed",
      header: () => (
        <span className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest">
          Dernier traitement
        </span>
      ),
      cell: ({ row }) => {
        const dateStr = getLastProcessedDate(row.original);
        return dateStr ? (
          <span className="text-xs text-muted-foreground">{dateStr}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
      enableSorting: false,
    },

    // Actions (matches Products actions pattern)
    {
      id: "actions",
      header: () => (
        <div className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest text-right px-2">
          Actions
        </div>
      ),
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-2 justify-end">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      onProductDoubleClick(product.id);
                    }}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-medium">Ouvrir le Studio</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/app/products/${product.id}/edit`);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-medium">Modifier le produit</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
      enableSorting: false,
    },
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PhotoStudioTable({
  products,
  selectedProducts,
  onToggleSelect,
  onToggleSelectAll,
  selectedProductId,
  onProductClick,
  onProductDoubleClick,
}: PhotoStudioTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () =>
      createStudioColumns({
        selectedProducts,
        products,
        onToggleSelect,
        onToggleSelectAll,
        onProductDoubleClick,
        router,
      }),
    [selectedProducts, products, onToggleSelect, onToggleSelectAll, onProductDoubleClick, router]
  );

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
          enableColumnVisibility={false}
          enablePagination={false}
          sorting={sorting}
          onSortingChange={setSorting}
        />
      </Card>
    </motion.div>
  );
}
