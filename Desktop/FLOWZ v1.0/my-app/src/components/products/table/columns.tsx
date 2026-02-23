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
} from "lucide-react";
import { Product } from "./types";
import { ProductSEOCell, ProductSERPCell, ProductImageCell } from "./cells";
import { ProductRowActions } from "./ProductRowActions";
import { useRouter } from "next/navigation";

interface CreateColumnsOptions {
  selectedProducts: string[];
  products: Product[];
  onToggleSelect: (productId: string) => void;
  onToggleSelectAll: (selected: boolean) => void;
  wooCommerceStatusConfig: Record<string, { label: string; variant: any }>;
  router: ReturnType<typeof useRouter>;
}

export function createColumns({
  selectedProducts,
  products,
  onToggleSelect,
  onToggleSelectAll,
  wooCommerceStatusConfig,
  router,
}: CreateColumnsOptions): ColumnDef<Product>[] {
  return [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={selectedProducts.length === products.length && products.length > 0}
          onCheckedChange={(value) => {
            onToggleSelectAll(!!value);
          }}
          aria-label="Sélectionner tout"
          className="border rounded data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      ),
      cell: ({ row }) => {
        const isSelected = selectedProducts.includes(row.original.id);
        return (
          <Checkbox
            checked={isSelected}
            onCheckedChange={(value) => {
              onToggleSelect(row.original.id);
            }}
            aria-label={`Sélectionner ${row.original.title}`}
            className="border rounded data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "image_url",
      header: () => <span className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest">Image</span>,
      cell: ({ row }) => <ProductImageCell product={row.original} />,
      enableSorting: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-0 text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest hover:text-foreground hover:bg-transparent"
        >
          Titre / ID / SKU
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original;
        const sku = product.metadata?.sku || "—";
        return (
          <div className="flex flex-col min-w-0 max-w-[250px] lg:max-w-md gap-0.5">
            <button
              onClick={() => router.push(`/app/products/${product.id}/edit`)}
              className="text-sm font-semibold leading-snug text-left hover:text-primary transition-colors line-clamp-2 text-foreground"
            >
              {product.title}
            </button>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium font-mono">
              <span title="ID Produit">#{product.platform_product_id}</span>
              <span className="text-muted-foreground/30">|</span>
              <span title="SKU">SKU: {sku}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                {product.platform} • {new Date(product.imported_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        );
      },
    },
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
        const product = row.original;
        const metadata = product.metadata || {};
        const status = metadata.status || 'draft';
        const config = wooCommerceStatusConfig[status] || { label: status, variant: "neutral" };

        return (
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              config.variant === "success" && "bg-success",
              config.variant === "warning" && "bg-warning",
              config.variant === "info" && "bg-info",
              config.variant === "neutral" && "bg-muted-foreground/30"
            )} />
            <span className="text-sm text-muted-foreground font-medium">
              {config.label}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <div className="flex justify-end pr-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-0 text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest hover:text-foreground hover:bg-transparent justify-end"
          >
            Prix
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const product = row.original;
        const regularPrice = product.regular_price ?? product.price;
        const salePrice = product.sale_price;
        const onSale = salePrice && Number(salePrice) > 0 && Number(salePrice) < Number(regularPrice);

        return (
          <div className="text-sm font-semibold w-[100px] text-right">
            {onSale ? (
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[11px] text-muted-foreground line-through font-normal">
                  {regularPrice ? `${Number(regularPrice).toFixed(2)} €` : ""}
                </span>
                <Badge className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-bold px-2">
                  {Number(salePrice).toFixed(2)} €
                </Badge>
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-0 text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest hover:text-foreground hover:bg-transparent"
        >
          Stock
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original;
        const inStock = product.stock && product.stock > 0;
        return (
          <Badge
            variant="outline"
            className={cn(
              "px-2 py-0.5 text-[10px] font-medium border shadow-none",
              inStock
                ? "bg-muted text-muted-foreground border-border"
                : "bg-destructive/10 text-destructive border-destructive/20"
            )}
          >
            {inStock ? `${product.stock} en stock` : "Rupture"}
          </Badge>
        );
      },
    },
    {
      id: "sales",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-0 text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest hover:text-foreground hover:bg-transparent flex items-center gap-1.5"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Ventes
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      accessorFn: (row) => row.working_content?.commercial_stats?.total_sales || 0,
      cell: ({ row }) => {
        const product = row.original;
        const sales = product.working_content?.commercial_stats?.total_sales;
        if (sales === undefined || sales === 0) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground border-border font-medium shadow-none px-2 py-0.5">
            {sales} vente{sales > 1 ? 's' : ''}
          </Badge>
        );
      },
    },
    {
      id: "revenue",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-0 text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest hover:text-foreground hover:bg-transparent flex items-center gap-1.5"
        >
          <Euro className="h-3.5 w-3.5" />
          CA
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      accessorFn: (row) => row.working_content?.commercial_stats?.revenue || 0,
      cell: ({ row }) => {
        const product = row.original;
        const revenue = product.working_content?.commercial_stats?.revenue;
        if (revenue === undefined || revenue === 0) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
            <span className="font-bold text-success text-sm">
              {revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </span>
          </div>
        );
      },
    },
    {
      id: "seo",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-0 text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest hover:text-foreground hover:bg-transparent flex items-center gap-1.5"
        >
          SEO
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      accessorFn: (row) => row.seo_score ?? row.product_seo_analysis?.overall_score ?? 0,
      cell: ({ row }) => {
        const product = row.original;
        return <ProductSEOCell product={product} />;
      },
    },
    {
      id: "serp",
      header: () => <span className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest">SERP</span>,
      cell: ({ row }) => {
        const product = row.original;
        return <ProductSERPCell product={product} />;
      },
      enableSorting: false,
    },
    {
      id: "sync",
      header: () => (
        <div className="flex items-center gap-1.5">
          <CloudUpload className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest">Sync</span>
        </div>
      ),
      cell: ({ row }) => {
        const product = row.original;
        const dirtyCount = product.dirty_fields_content?.length || 0;
        const hasSynced = !!product.last_synced_at;

        if (dirtyCount > 0) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-medium bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1 px-1.5"
                  >
                    <Clock className="h-3 w-3" />
                    {dirtyCount}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{dirtyCount} champ{dirtyCount > 1 ? "s" : ""} modifié{dirtyCount > 1 ? "s" : ""}</p>
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
                  <Badge
                    variant="outline"
                    className="text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 px-1.5"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    OK
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Synchronisé</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return <span className="text-xs text-muted-foreground">—</span>;
      },
      enableSorting: false,
    },
    {
      id: "actions",
      header: () => <div className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest text-right px-2">Actions</div>,
      cell: ({ row }) => (
        <ProductRowActions product={row.original} wooCommerceStatusConfig={wooCommerceStatusConfig} />
      ),
      enableSorting: false,
    },
  ];
}
