/**
 * Product Table Columns V2 — Vercel Pro Pattern
 * Dense headers, monochrome, border-0 badges
 */

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ShoppingCart,
  Euro,
  TrendingUp,
  CloudUpload,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  PenLine,
  Globe,
  Ban,
} from "lucide-react";
import { Product } from "./types";
import { ProductSEOCellV2, ProductSERPCellV2, ProductImageCellV2 } from "./cellsV2";
import { ProductRowActionsV2 } from "./ProductRowActionsV2";
import { useRouter } from "next/navigation";

interface CreateColumnsV2Options {
  selectedProducts: string[];
  products: Product[];
  onToggleSelect: (productId: string) => void;
  onToggleSelectAll: (selected: boolean) => void;
  wooCommerceStatusConfig: Record<string, { label: string; variant: any }>;
  router: ReturnType<typeof useRouter>;
}

const ColumnHeader = ({ label, column, icon: Icon }: { label: string; column?: any; icon?: any }) => {
  if (!column) {
    return (
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/40" />}
        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">{label}</span>
      </div>
    );
  }
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="h-8 px-0 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider hover:text-foreground hover:bg-transparent gap-1.5"
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
      <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
    </Button>
  );
};

export function createColumnsV2({
  selectedProducts,
  products,
  onToggleSelect,
  onToggleSelectAll,
  wooCommerceStatusConfig,
  router,
}: CreateColumnsV2Options): ColumnDef<Product>[] {
  return [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={selectedProducts.length === products.length && products.length > 0}
          onCheckedChange={(value) => onToggleSelectAll(!!value)}
          aria-label="Selectionner tout"
          className="border rounded data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedProducts.includes(row.original.id)}
          onCheckedChange={() => onToggleSelect(row.original.id)}
          aria-label={`Selectionner ${row.original.title}`}
          className="border rounded data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "image_url",
      header: () => <ColumnHeader label="Image" />,
      cell: ({ row }) => <ProductImageCellV2 product={row.original} />,
      enableSorting: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => <ColumnHeader label="Titre / ID / SKU" column={column} />,
      cell: ({ row }) => {
        const product = row.original;
        const sku = product.metadata?.sku || "—";
        return (
          <div className="flex flex-col min-w-0 max-w-[250px] lg:max-w-md gap-0.5">
            <button
              onClick={() => router.push(`/app/products/${product.id}/edit`)}
              className="text-[13px] font-medium text-foreground text-left hover:text-foreground/80 transition-colors line-clamp-2 leading-snug"
            >
              {product.title}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground/70" title="ID Produit">
                #{product.platform_product_id}
              </span>
              <span className="text-muted-foreground/30">|</span>
              <span className="text-[10px] font-mono text-muted-foreground/70" title="SKU">
                SKU: {sku}
              </span>
            </div>
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              {product.platform} · {new Date(product.imported_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <ColumnHeader label="Statut" column={column} />,
      cell: ({ row }) => {
        const product = row.original;
        const metadata = product.metadata || {};
        const status = metadata.status || 'draft';
        const config = wooCommerceStatusConfig[status] || { label: status, variant: "neutral" };

        const statusIcon: Record<string, React.ReactNode> = {
          success: <CheckCircle2 className="h-3 w-3" />,
          warning: <Clock className="h-3 w-3" />,
          info:    <Globe className="h-3 w-3" />,
          neutral: <PenLine className="h-3 w-3" />,
          error:   <Ban className="h-3 w-3" />,
        };

        return (
          <span className={cn(
            "h-5 rounded-full px-2 text-[10px] font-medium border-0 inline-flex items-center gap-1",
            config.variant === "success" && "bg-success/10 text-success",
            config.variant === "warning" && "bg-warning/10 text-warning",
            config.variant === "info"    && "bg-primary/10 text-primary",
            config.variant === "neutral" && "bg-muted/60 text-muted-foreground",
            config.variant === "error"   && "bg-destructive/10 text-destructive",
          )}>
            {statusIcon[config.variant] ?? statusIcon.neutral}
            {config.label}
          </span>
        );
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <div className="flex justify-end pr-2">
          <ColumnHeader label="Prix" column={column} />
        </div>
      ),
      cell: ({ row }) => {
        const product = row.original;
        const isVariable = product.product_type === 'variable' || product.metadata?.type === 'variable';

        if (isVariable) {
          const metaPrice = product.metadata?.price;
          const displayPrice = metaPrice ? Number(metaPrice) : null;
          return (
            <div className="text-[13px] font-medium w-[100px] text-right">
              {displayPrice ? (
                <span className="text-foreground">A partir de {displayPrice.toFixed(2)} €</span>
              ) : (
                <span className="text-muted-foreground/60">N/A</span>
              )}
            </div>
          );
        }

        const regularPrice = product.regular_price ?? product.price;
        const salePrice = product.sale_price;
        const onSale = salePrice && Number(salePrice) > 0 && Number(salePrice) < Number(regularPrice);

        return (
          <div className="text-[13px] font-medium w-[100px] text-right">
            {onSale ? (
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[11px] text-muted-foreground/60 line-through font-normal">
                  {regularPrice ? `${Number(regularPrice).toFixed(2)} €` : ""}
                </span>
                <span className="h-5 rounded-full px-2 text-xs font-medium border-0 bg-destructive/10 text-destructive">
                  {Number(salePrice).toFixed(2)} €
                </span>
              </div>
            ) : (
              <span className="text-foreground">{regularPrice ? `${Number(regularPrice).toFixed(2)} €` : "N/A"}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "stock",
      header: ({ column }) => <ColumnHeader label="Stock" column={column} />,
      cell: ({ row }) => {
        const product = row.original;
        const manageStock = product.manage_stock ?? product.metadata?.manage_stock ?? false;
        const stockStatus = product.stock_status ?? product.metadata?.stock_status ?? "instock";
        const stockQty = product.stock;

        const inStock = manageStock
          ? (stockQty !== null && stockQty !== undefined && stockQty > 0)
          : stockStatus !== "outofstock";

        const label = manageStock && inStock
          ? `${stockQty} en stock`
          : inStock
            ? "En stock"
            : "Rupture";

        return (
          <span className={cn(
            "h-5 rounded-full px-2 text-[10px] font-medium border-0 inline-flex items-center",
            inStock
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          )}>
            {label}
          </span>
        );
      },
    },
    {
      id: "sales",
      header: ({ column }) => <ColumnHeader label="Ventes" column={column} icon={ShoppingCart} />,
      accessorFn: (row) => Number(row.metadata?.total_sales) || 0,
      cell: ({ row }) => {
        const sales = Number(row.original.metadata?.total_sales) || 0;
        if (sales === 0) return <span className="text-[11px] text-muted-foreground/60">—</span>;
        return (
          <span className="h-5 rounded-full px-2 text-xs font-medium border-0 bg-success/10 text-success inline-flex items-center">
            {sales} vente{sales > 1 ? 's' : ''}
          </span>
        );
      },
    },
    {
      id: "revenue",
      header: ({ column }) => <ColumnHeader label="CA" column={column} icon={Euro} />,
      accessorFn: (row) => row.working_content?.commercial_stats?.revenue ?? 0,
      cell: ({ row }) => {
        const revenue = row.original.working_content?.commercial_stats?.revenue;
        if (revenue === undefined || revenue === null || revenue === 0) {
          return <span className="text-[11px] text-muted-foreground/60">—</span>;
        }
        return (
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-medium text-success">
              {revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </span>
          </div>
        );
      },
    },
    {
      id: "seo",
      header: ({ column }) => <ColumnHeader label="SEO" column={column} />,
      accessorFn: (row) => row.seo_score ?? row.product_seo_analysis?.overall_score ?? 0,
      cell: ({ row }) => <ProductSEOCellV2 product={row.original} />,
    },
    {
      id: "serp",
      header: () => <ColumnHeader label="SERP" />,
      cell: ({ row }) => <ProductSERPCellV2 product={row.original} />,
      enableSorting: false,
    },
    {
      id: "sync",
      header: () => <ColumnHeader label="Sync" icon={CloudUpload} />,
      cell: ({ row }) => {
        const product = row.original;
        const dirtyCount = product.dirty_fields_content?.length || 0;
        const hasSynced = !!product.last_synced_at;

        if (dirtyCount > 0) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="h-5 rounded-full px-2 text-xs font-medium border-0 bg-warning/10 text-warning inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {dirtyCount}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{dirtyCount} champ{dirtyCount > 1 ? "s" : ""} modifie{dirtyCount > 1 ? "s" : ""}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        if (hasSynced) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="h-5 rounded-full px-2 text-xs font-medium border-0 bg-success/10 text-success inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    OK
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Synchronise</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return <span className="text-[11px] text-muted-foreground/60">—</span>;
      },
      enableSorting: false,
    },
    {
      id: "actions",
      header: () => (
        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider text-right block px-2">
          Actions
        </span>
      ),
      cell: ({ row }) => (
        <ProductRowActionsV2 product={row.original} wooCommerceStatusConfig={wooCommerceStatusConfig} />
      ),
      enableSorting: false,
    },
  ];
}
