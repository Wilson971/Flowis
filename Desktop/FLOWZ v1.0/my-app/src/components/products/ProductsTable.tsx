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
import { Package, Edit, MoreVertical, ExternalLink, RefreshCw, Check, X, Sparkles, Camera, Globe, AlertTriangle, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-table";
import { useDirtyFields } from "@/hooks/useDirtyFields";
import { useStudioJobs } from "@/hooks/useStudioJobs";
import { useSelectedStore } from "@/contexts/StoreContext";
import { useAcceptDraft, useRejectDraft, useProductContent } from "@/hooks/useProductContent";
import { usePushToStore } from "@/hooks/usePushToStore";
import { useCancelSync } from "@/hooks/useCancelSync";
import { CancelSyncDialog } from "./CancelSyncDialog";
import { getFieldLabel, getGeneratedFieldsTooltip, hasRemainingDraftContent, isDraftAlreadyApplied } from "@/lib/productHelpers";
import { shouldSync } from "@/lib/syncHelpers";
import { useRef, useState, useEffect } from "react";
import { useProductListRealtime } from "@/hooks/products/useProductListRealtime";
import { SerpEnrichmentSheet } from "./SerpEnrichmentSheet";
import { useSerpAnalysisByProduct } from "@/hooks/useSerpAnalysis";
import { useProductSerpStatus } from "@/hooks/useProductSerpStatus";
import { useProductSeoStatus } from "@/hooks/useProductSeoStatus";
import { TrendingUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SeoScoreCircle } from "@/components/seo/SeoScoreCircle";
import { useSEOAnalysis, SEOBadge } from "@/features/seo-analysis";
import { useMemo } from "react";

// Use local type definition or import if possible. Using local for safety as reference did.
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

interface ProductsTableProps {
  products: Product[];
  selectedProducts: string[];
  generatingProductIds?: string[];
  onToggleSelect: (productId: string) => void;
  onToggleSelectAll: (selected: boolean) => void;
  // Make optional or provide default
  wooCommerceStatusConfig?: Record<string, { label: string; variant: any }>;
  onTableReady?: (table: any) => void;
}

const defaultStatusConfig = {
  publish: { label: "Publié", variant: "success" as const },
  draft: { label: "Brouillon", variant: "warning" as const },
  pending: { label: "En attente", variant: "info" as const },
  private: { label: "Privé", variant: "neutral" as const },
};

const ProductRowActions = ({ product, wooCommerceStatusConfig }: { product: Product; wooCommerceStatusConfig: any }) => {
  const router = useRouter();
  const { selectedStore } = useSelectedStore();
  const { mutate: acceptDraft, isPending: isAccepting } = useAcceptDraft();
  const { mutate: rejectDraft, isPending: isRejecting } = useRejectDraft();
  const { mutate: pushToStore, isPending: isPushing } = usePushToStore();
  const { mutate: cancelSync, isPending: isCanceling } = useCancelSync();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showSerpSheet, setShowSerpSheet] = useState(false);

  const currentProduct = product;
  const studioJobs = product.studio_jobs || [];

  const hasDraftContent = hasRemainingDraftContent(product.draft_generated_content) &&
    !isDraftAlreadyApplied(product.draft_generated_content, product.working_content);

  const dirtyFieldsData = {
    hasDraftContent,
  };

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
      <div className="flex items-center gap-1.5 grayscale hover:grayscale-0 transition-all">
        {dirtyFieldsData?.hasDraftContent && (
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100 transition-colors text-[11px] font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      acceptDraft({ productId: product.id });
                    }}
                    disabled={isAccepting || isRejecting}
                  >
                    {isAccepting ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Accepter
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                {generatedFieldsTooltip && (
                  <TooltipContent>
                    <p className="text-[10px] font-medium">{generatedFieldsTooltip}</p>
                  </TooltipContent>
                )}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      rejectDraft({ productId: product.id });
                    }}
                    disabled={isAccepting || isRejecting}
                  >
                    {isRejecting ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-[10px] font-medium">Rejeter les suggestions</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}
        {!dirtyFieldsData?.hasDraftContent && shouldSync(currentProduct) && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100 transition-colors text-[11px] font-bold"
            onClick={(e) => {
              e.stopPropagation();
              pushToStore({ product_ids: [product.id] });
            }}
            disabled={isPushing}
          >
            {isPushing ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Sync
              </>
            )}
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-zinc-400 hover:text-zinc-900"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/app/products/${product.id}/edit`);
          }}
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
        {storeProductUrl && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-zinc-400 hover:text-zinc-900"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(storeProductUrl, '_blank');
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-[10px] font-medium">Voir en ligne</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-zinc-900">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 border-none shadow-xl bg-white/90 backdrop-blur-sm">
            <DropdownMenuItem onClick={() => router.push(`/app/products/${product.id}/edit`)} className="text-xs font-medium cursor-pointer">
              <Edit className="mr-2 h-3.5 w-3.5" />
              Éditer
            </DropdownMenuItem>
            {storeProductUrl && (
              <DropdownMenuItem onClick={() => window.open(storeProductUrl, '_blank')} className="text-xs font-medium cursor-pointer">
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                Voir en ligne
              </DropdownMenuItem>
            )}
            {shouldSync(currentProduct) && !dirtyFieldsData?.hasDraftContent && (
              <>
                <DropdownMenuSeparator className="bg-zinc-100" />
                <DropdownMenuItem
                  className="text-destructive text-xs font-medium cursor-pointer"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <X className="mr-2 h-3.5 w-3.5" />
                  Annuler modifs
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
const ProductSEOCell = ({ product }: { product: Product }) => {
  const router = useRouter();
  const displayScore = product.product_seo_analysis?.overall_score ?? 0;

  if (displayScore === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div
      className="cursor-pointer hover:scale-105 transition-transform duration-200 flex items-center justify-center"
      onClick={() => router.push(`/app/products/${product.id}/edit`)}
    >
      <SeoScoreCircle
        score={displayScore}
      // size="sm"
      // showLabel={false}
      // variant="premium"
      />
    </div>
  );
};

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
            <Badge
              variant="outline"
              className="cursor-pointer bg-sky-50 text-sky-700 border-sky-100 hover:bg-sky-100 px-2 py-0.5"
              onClick={(e) => {
                e.stopPropagation();
                setShowSerpSheet(true);
              }}
            >
              <Globe className="h-3 w-3 mr-1" />
              SERP
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Données SERP disponibles (Position: {serpAnalysis.keyword_position || 'N/A'})</p>
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

export const ProductsTable = ({
  products,
  selectedProducts,
  generatingProductIds = [],
  onToggleSelect,
  onToggleSelectAll,
  wooCommerceStatusConfig = defaultStatusConfig,
  onTableReady,
}: ProductsTableProps) => {
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
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "image_url",
      header: () => <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">Image</span>,
      cell: ({ row }) => {
        const product = row.original;
        if (!product.image_url) {
          return (
            <div className="h-10 w-10 rounded-md border border-border bg-zinc-50 flex items-center justify-center">
              <Package className="h-5 w-5 text-zinc-400" />
            </div>
          );
        }
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-pointer">
                  <div className="h-10 w-10 relative rounded-md overflow-hidden border border-border bg-zinc-50">
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
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
      header: () => <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">Titre / ID / SKU</span>,
      cell: ({ row }) => {
        const product = row.original;
        const sku = product.metadata?.sku || "—";
        return (
          <div className="flex flex-col min-w-0 max-w-[250px]">
            <button
              onClick={() => router.push(`/app/products/${product.id}/edit`)}
              className="text-[13px] font-medium leading-normal text-left hover:text-primary transition-colors line-clamp-1 text-zinc-900"
            >
              {product.title}
            </button>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500 font-medium font-mono">
              <span title="ID Produit">#{product.platform_product_id}</span>
              <span className="text-zinc-300">|</span>
              <span title="SKU">SKU: {sku}</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5 uppercase tracking-tight truncate">
              {product.platform} • {new Date(product.imported_at).toLocaleDateString('fr-FR')}
            </div>
          </div>
        );
      },
    }, {
      accessorKey: "status",
      header: () => <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">Statut</span>,
      cell: ({ row }) => {
        const product = row.original;
        const metadata = product.metadata || {};
        const status = metadata.status || 'draft';
        const config = wooCommerceStatusConfig[status] || { label: status, variant: "neutral" };

        let badgeClass = "bg-zinc-100 text-zinc-700 border-zinc-200"; // default neutral
        if (config.variant === "success") badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
        if (config.variant === "warning") badgeClass = "bg-amber-50 text-amber-700 border-amber-100";
        if (config.variant === "info") badgeClass = "bg-blue-50 text-blue-700 border-blue-100";

        return (
          <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] font-medium border", badgeClass)}>
            {config.label}
          </Badge>
        );
      },
    }, {
      accessorKey: "price",
      header: () => <div className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider text-right">Prix</div>,
      cell: ({ row }) => {
        const product = row.original;
        const regularPrice = product.regular_price ?? product.price;
        const salePrice = product.sale_price;
        const onSale = salePrice && Number(salePrice) > 0 && Number(salePrice) < Number(regularPrice);

        return (
          <div className="text-sm font-medium w-[80px] text-right">
            {onSale ? (
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[10px] text-muted-foreground line-through">
                  {regularPrice ? `${Number(regularPrice).toFixed(2)} €` : ""}
                </span>
                <span className="text-sm font-bold text-red-600">
                  {Number(salePrice).toFixed(2)} €
                </span>
              </div>
            ) : (
              regularPrice ? `${Number(regularPrice).toFixed(2)} €` : "N/A"
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "stock",
      header: () => <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">Stock</span>,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <Badge
            variant="outline"
            className={cn(
              "px-2 py-0.5 text-[10px] font-medium border",
              product.stock && product.stock > 0
                ? "bg-zinc-50 text-zinc-600 border-zinc-200"
                : "bg-red-50 text-red-600 border-red-100"
            )}
          >
            {product.stock && product.stock > 0 ? `${product.stock} en stock` : "Rupture"}
          </Badge>
        );
      },
    },
    {
      id: "sales",
      header: () => <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">Ventes</span>,
      accessorFn: (row) => row.working_content?.commercial_stats?.total_sales || 0,
      cell: ({ row }) => {
        const product = row.original;
        const sales = product.working_content?.commercial_stats?.total_sales;
        if (sales === undefined || sales === 0) return <span className="text-xs text-muted-foreground">—</span>;
        return <span className="font-medium">{sales}</span>;
      },
    },
    {
      id: "revenue",
      header: () => <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">CA</span>,
      accessorFn: (row) => row.working_content?.commercial_stats?.revenue || 0,
      cell: ({ row }) => {
        const product = row.original;
        const revenue = product.working_content?.commercial_stats?.revenue;
        if (revenue === undefined || revenue === 0) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <span className="font-medium text-emerald-600">
            {revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          </span>
        );
      },
    },
    {
      id: "sync",
      header: () => <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">Sync</span>,
      cell: ({ row }) => {
        const product = row.original as any;
        const syncSource = product.sync_source;
        const lastSyncedAt = product.last_synced_at;
        const conflictCount = product.sync_conflict_count || 0;
        return (
          <div className="flex flex-col gap-1">
            {syncSource && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={cn(
                        "whitespace-nowrap font-medium text-[10px] px-2 py-0.5 border",
                        syncSource === "webhook" ? "bg-blue-50 text-blue-700 border-blue-100" :
                          syncSource === "push" ? "bg-zinc-50 text-zinc-700 border-zinc-200" :
                            "bg-zinc-50 text-zinc-600 border-zinc-100"
                      )}
                    >
                      {syncSource === "webhook" ? "Webhook" : syncSource === "push" ? "Push" : syncSource}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      Dernière sync: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString('fr-FR') : "Jamais"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {!syncSource && !lastSyncedAt && (
              <Badge variant="outline" className="bg-zinc-50 text-zinc-400 border-zinc-100 hover:bg-zinc-100 px-2 py-0.5">
                Non sync
              </Badge>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      id: "seo",
      header: () => <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">SEO</span>,
      cell: ({ row }) => {
        const product = row.original;
        return <ProductSEOCell product={product} />;
      },
      enableSorting: false,
    },
    {
      id: "serp",
      header: () => <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">SERP</span>,
      cell: ({ row }) => {
        const product = row.original;
        return <ProductSERPCell product={product} />;
      },
      enableSorting: false,
    },
    {
      id: "actions",
      header: () => <div className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider text-right px-2">Actions</div>,
      cell: ({ row }) => (
        <ProductRowActions product={row.original} wooCommerceStatusConfig={wooCommerceStatusConfig} />
      ),
      enableSorting: false,
    },
  ];

  const getRowClassName = (product: Product) => {
    if (generatingProductIds.includes(product.id)) {
      return "relative overflow-hidden opacity-70";
    }
    return "";
  };

  const isRowGenerating = (product: Product) => generatingProductIds.includes(product.id);

  if (!isClient) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={products}
      enableColumnVisibility={false}
      enablePagination={false}
      getRowClassName={getRowClassName}
      isRowGenerating={isRowGenerating}
      onTableReady={onTableReady}
    />
  );
};
