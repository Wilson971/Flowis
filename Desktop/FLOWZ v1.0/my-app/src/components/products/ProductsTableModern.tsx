"use client";

import { motion } from 'framer-motion';
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Package,
  Edit,
  MoreVertical,
  ExternalLink,
  RefreshCw,
  Check,
  X,
  Sparkles,
  Globe,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Euro,
  AlertCircle,
  CloudUpload,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-table";
import { useSelectedStore } from "@/contexts/StoreContext";
import { useAcceptDraft, useRejectDraft } from "@/hooks/products/useProductContent";
import { usePushToStore } from "@/hooks/products";
import { useCancelSync } from "@/hooks/sync";
import { CancelSyncDialog } from "./CancelSyncDialog";
import { getGeneratedFieldsTooltip, hasRemainingDraftContent, isDraftAlreadyApplied } from "@/lib/productHelpers";
import { shouldSync } from "@/lib/syncHelpers";
import { useState, useEffect } from "react";
import { SerpEnrichmentSheet } from "./SerpEnrichmentSheet";
import { useRouter } from "next/navigation";
import { SeoScoreCircle } from "@/components/seo/SeoScoreCircle";
import { Card, CardContent } from "@/components/ui/card";

// Product type
export type Product = {
  id: string;
  title: string;
  platform: string;
  platform_product_id: string;
  image_url?: string;
  price?: number;
  regular_price?: number;
  sale_price?: number;
  stock?: number;
  imported_at: string;
  metadata?: any;
  draft_generated_content?: any;
  dirty_fields_content?: string[];
  last_synced_at?: string;
  sync_source?: "push" | "webhook" | "manual";
  sync_conflict_count?: number;
  editorial_lock?: Record<string, boolean>;
  ai_enhanced?: boolean;
  working_content?: any;
  studio_jobs?: {
    id: string;
    status: "pending" | "running" | "done" | "failed";
    created_at: string;
  }[];
  product_seo_analysis?: {
    overall_score: number;
    analyzed_at: string;
  };
  product_serp_analysis?: {
    id: string;
    keyword_position: number;
    status: string;
    analyzed_at: string;
  }[];
};

interface ProductsTableModernProps {
  products: Product[];
  selectedProducts: string[];
  generatingProductIds?: string[];
  onToggleSelect: (productId: string) => void;
  onToggleSelectAll: (selected: boolean) => void;
  wooCommerceStatusConfig?: Record<string, { label: string; variant: any }>;
  onTableReady?: (table: any) => void;
}

const defaultStatusConfig = {
  publish: { label: "Publié", variant: "success" as const },
  draft: { label: "Brouillon", variant: "warning" as const },
  pending: { label: "En attente", variant: "info" as const },
  private: { label: "Privé", variant: "neutral" as const },
};

// Modern Product Row Actions Component
const ProductRowActions = ({ product, wooCommerceStatusConfig }: { product: Product; wooCommerceStatusConfig: any }) => {
  const router = useRouter();
  const { selectedStore } = useSelectedStore();
  const { mutate: acceptDraft, isPending: isAccepting } = useAcceptDraft();
  const { mutate: rejectDraft, isPending: isRejecting } = useRejectDraft();
  const { mutate: pushToStore, isPending: isPushing } = usePushToStore();
  const { mutate: cancelSync, isPending: isCanceling } = useCancelSync();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showSerpSheet, setShowSerpSheet] = useState(false);

  const hasDraftContent = hasRemainingDraftContent(product.draft_generated_content) &&
    !isDraftAlreadyApplied(product.draft_generated_content, product.working_content);

  const generatedFieldsTooltip = getGeneratedFieldsTooltip(
    product.draft_generated_content,
    product.working_content
  );

  const getStoreProductUrl = () => {
    if (!selectedStore) return null;
    const metadata = product.metadata || {};
    const platform = product.platform;

    if (platform === 'shopify') {
      const handle = (product as any).handle || metadata.handle;
      if (!handle) return null;
      const shopUrl = selectedStore.platform_connections?.shop_url || '';
      const cleanUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
      return `https://${cleanUrl}/products/${handle}`;
    } else if (platform === 'woocommerce') {
      return metadata.permalink || null;
    }
    return null;
  };

  const storeProductUrl = getStoreProductUrl();

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2"
      >
        {hasDraftContent && (
          <TooltipProvider>
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-all duration-200 text-xs font-medium shadow-none outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      acceptDraft({ productId: product.id });
                    }}
                    disabled={isAccepting || isRejecting}
                  >
                    {isAccepting ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                        Accepter
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                {generatedFieldsTooltip && (
                  <TooltipContent>
                    <p className="text-xs font-medium">{generatedFieldsTooltip}</p>
                  </TooltipContent>
                )}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 transition-all duration-200 shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      rejectDraft({ productId: product.id });
                    }}
                    disabled={isAccepting || isRejecting}
                  >
                    {isRejecting ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-medium">Rejeter les suggestions</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}
        {!hasDraftContent && shouldSync(product) && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 bg-warning/10 text-warning border-warning/20 hover:bg-warning/20 transition-all duration-200 text-xs font-semibold shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              pushToStore({ product_ids: [product.id] });
            }}
            disabled={isPushing}
          >
            {isPushing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Sync
              </>
            )}
          </Button>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/app/products/${product.id}/edit`);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">Éditer le produit</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {storeProductUrl && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(storeProductUrl, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs font-medium">Voir en ligne</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 border-none shadow-xl bg-popover/95 backdrop-blur-sm">
            <DropdownMenuLabel className="text-xs font-semibold">Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/app/products/${product.id}/edit`)} className="text-xs font-medium">
              <Edit className="mr-2 h-3.5 w-3.5" />
              Éditer
            </DropdownMenuItem>
            {storeProductUrl && (
              <DropdownMenuItem onClick={() => window.open(storeProductUrl, '_blank')} className="text-xs font-medium">
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                Voir en ligne
              </DropdownMenuItem>
            )}
            {shouldSync(product) && !hasDraftContent && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive text-xs font-medium"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <X className="mr-2 h-3.5 w-3.5" />
                  Annuler les modifications
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
      <CancelSyncDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={() => {
          cancelSync({ product_ids: [product.id] });
          setShowCancelDialog(false);
        }}
        productCount={1}
        isLoading={isCanceling}
      />
      <SerpEnrichmentSheet
        open={showSerpSheet}
        onOpenChange={setShowSerpSheet}
        productId={product.id}
      />
    </>
  );
};

// Modern SEO Cell Component
const ProductSEOCell = ({ product }: { product: Product }) => {
  const router = useRouter();
  const displayScore = product.product_seo_analysis?.overall_score ?? 0;

  if (displayScore === 0) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground/40">
        <AlertCircle className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Non analysé</span>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="cursor-pointer flex items-center justify-center"
      onClick={() => router.push(`/app/products/${product.id}/edit#seo`)}
    >
      <SeoScoreCircle score={displayScore} />
    </motion.div>
  );
};

// Modern SERP Cell Component
const ProductSERPCell = ({ product }: { product: Product }) => {
  const [showSerpSheet, setShowSerpSheet] = useState(false);
  const serpAnalysis = product.product_serp_analysis?.[0];

  if (!serpAnalysis) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Badge
                variant="outline"
                className="cursor-pointer bg-info/10 text-info border-info/20 hover:bg-info/20 px-2 py-0.5 shadow-none"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSerpSheet(true);
                }}
              >
                <Globe className="h-3 w-3 mr-1" />
                SERP #{serpAnalysis.keyword_position || 'N/A'}
              </Badge>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Voir l'analyse SERP complète</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {showSerpSheet && (
        <SerpEnrichmentSheet
          productId={product.id}
          open={showSerpSheet}
          onOpenChange={setShowSerpSheet}
        />
      )}
    </>
  );
};

export const ProductsTableModern = ({
  products,
  selectedProducts,
  generatingProductIds = [],
  onToggleSelect,
  onToggleSelectAll,
  wooCommerceStatusConfig = defaultStatusConfig,
  onTableReady,
}: ProductsTableModernProps) => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const columns: ColumnDef<Product>[] = [
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
      cell: ({ row }) => {
        const product = row.original;
        if (!product.image_url) {
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
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="cursor-pointer"
                >
                  <div className="h-12 w-12 relative rounded-lg overflow-hidden border border-border bg-muted">
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="right" className="p-2 max-w-none">
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-64 h-64 object-contain rounded-lg"
                />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "title",
      header: () => <span className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest">Titre / ID / SKU</span>,
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
      header: () => <span className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest">Statut</span>,
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
      header: () => <div className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest text-right">Prix</div>,
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
      header: () => <span className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest">Stock</span>,
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
      header: () => (
        <div className="flex items-center gap-1.5">
          <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest">Ventes</span>
        </div>
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
      header: () => (
        <div className="flex items-center gap-1.5">
          <Euro className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest">CA</span>
        </div>
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
      header: () => <span className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-widest">SEO</span>,
      cell: ({ row }) => {
        const product = row.original;
        return <ProductSEOCell product={product} />;
      },
      enableSorting: false,
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

  const getRowClassName = (product: Product) => {
    if (generatingProductIds.includes(product.id)) {
      return "relative overflow-hidden opacity-60 animate-pulse";
    }
    return "transition-all duration-300";
  };

  const isRowGenerating = (product: Product) => generatingProductIds.includes(product.id);

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
          enableColumnVisibility={false}
          enablePagination={false}
          getRowClassName={getRowClassName}
          isRowGenerating={isRowGenerating}
          onTableReady={onTableReady}
        />
      </Card>
    </motion.div>
  );
};
