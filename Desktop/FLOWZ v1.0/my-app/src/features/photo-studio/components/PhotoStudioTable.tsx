"use client";

/**
 * PhotoStudioTable
 *
 * TanStack React Table (data-dense) view for products in the Photo Studio page.
 * Columns: checkbox, thumbnail, title+platform, SKU, status, studio status,
 * image count, last processed, action buttons.
 * Matches ProductsTableModern layout patterns.
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import {
  Camera,
  Pencil,
  ArrowUpDown,
  ImageIcon,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
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

type StatusConfig = {
  label: string;
  className: string;
};

function getStatusConfig(product: Product): StatusConfig {
  const status =
    product.status ?? product.metadata?.status ?? "draft";

  switch (status) {
    case "publish":
      return {
        label: "Publie",
        className: "bg-success/10 text-success border-success/20",
      };
    case "pending":
      return {
        label: "En attente",
        className: "bg-info/10 text-info border-info/20",
      };
    case "draft":
    default:
      return {
        label: "Brouillon",
        className: "bg-warning/10 text-warning border-warning/20",
      };
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
          Traite
        </Badge>
      );
    default:
      return (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Non traite
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

  if (diffMins < 1) return "A l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
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
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const allSelected =
    products.length > 0 && selectedProducts.size === products.length;

  // -------------------------------------------------------------------------
  // Columns
  // -------------------------------------------------------------------------

  const columns = useMemo<ColumnDef<Product, unknown>[]>(
    () => [
      // Checkbox
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={allSelected}
            onCheckedChange={() => onToggleSelectAll()}
            aria-label="Tout selectionner"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedProducts.has(row.original.id)}
            onCheckedChange={() => onToggleSelect(row.original.id)}
            aria-label={`Selectionner ${row.original.title}`}
          />
        ),
        size: 40,
        enableSorting: false,
      },

      // Thumbnail
      {
        id: "image",
        header: "",
        cell: ({ row }) => {
          const product = row.original;
          const src =
            product.image_url ??
            product.metadata?.images?.[0]?.src;
          return (
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {src ? (
                <img
                  src={src}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-5 h-5" />
                </div>
              )}
            </div>
          );
        },
        size: 64,
        enableSorting: false,
      },

      // Title + platform + date
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Produit
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-medium text-sm truncate">
                {product.title}
              </span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" size="sm">
                  {product.platform}
                </Badge>
                {product.platform_product_id && (
                  <span className="truncate max-w-[120px]">
                    #{product.platform_product_id}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },

      // SKU
      {
        id: "sku",
        header: () => (
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/50">
            SKU
          </span>
        ),
        cell: ({ row }) => {
          const sku = row.original.metadata?.sku;
          return sku ? (
            <span className="font-mono text-xs text-muted-foreground">
              {sku}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/40">—</span>
          );
        },
        size: 120,
        enableSorting: false,
      },

      // Product status
      {
        id: "status",
        header: () => (
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/50">
            Statut
          </span>
        ),
        cell: ({ row }) => {
          const cfg = getStatusConfig(row.original);
          return (
            <Badge variant="outline" size="sm" className={cfg.className}>
              {cfg.label}
            </Badge>
          );
        },
        size: 100,
        enableSorting: false,
      },

      // Studio status
      {
        id: "studioStatus",
        header: () => (
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/50">
            Studio
          </span>
        ),
        cell: ({ row }) => {
          const status = getStudioStatus(row.original);
          return getStudioStatusBadge(status);
        },
        size: 120,
        enableSorting: false,
      },

      // Image count
      {
        id: "images",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/50">
              Images
            </span>
            <ArrowUpDown className="ml-1.5 h-3 w-3" />
          </Button>
        ),
        accessorFn: (row) => getImageCount(row),
        cell: ({ row }) => {
          const count = getImageCount(row.original);
          return (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ImageIcon className="h-3.5 w-3.5" />
              <span>{count}</span>
            </div>
          );
        },
        size: 80,
      },

      // Last processed
      {
        id: "lastProcessed",
        header: () => (
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/50">
            Dernier traitement
          </span>
        ),
        cell: ({ row }) => {
          const dateStr = getLastProcessedDate(row.original);
          return dateStr ? (
            <span className="text-xs text-muted-foreground">
              {dateStr}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/40">—</span>
          );
        },
        size: 140,
        enableSorting: false,
      },

      // Actions
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex items-center gap-1 justify-end">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onProductDoubleClick(product.id);
                      }}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ouvrir le Studio</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/app/products/${product.id}/edit`
                        );
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Modifier le produit</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        },
        size: 100,
        enableSorting: false,
      },
    ],
    [
      allSelected,
      selectedProducts,
      onToggleSelect,
      onToggleSelectAll,
      onProductDoubleClick,
      router,
    ]
  );

  // -------------------------------------------------------------------------
  // Table instance
  // -------------------------------------------------------------------------

  const table = useReactTable({
    data: products,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <motion.div
      variants={motionTokens.variants.slideUp}
      initial="hidden"
      animate="visible"
    >
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-10 px-3 text-left"
                    style={{
                      width:
                        header.getSize() !== 150
                          ? header.getSize()
                          : undefined,
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  Aucun produit trouve.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-t border-border transition-colors cursor-pointer",
                    "hover:bg-muted/40",
                    selectedProductId === row.original.id &&
                      "bg-primary/5 ring-1 ring-inset ring-primary/20"
                  )}
                  onClick={() => onProductClick(row.original.id)}
                  onDoubleClick={() =>
                    onProductDoubleClick(row.original.id)
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2.5">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </motion.div>
  );
}
