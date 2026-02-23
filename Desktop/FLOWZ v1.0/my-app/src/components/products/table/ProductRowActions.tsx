"use client";

import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
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
  Edit,
  MoreVertical,
  ExternalLink,
  RefreshCw,
  Check,
  X,
} from "lucide-react";
import { useSelectedStore } from "@/contexts/StoreContext";
import { useAcceptDraft, useRejectDraft } from "@/hooks/products/useProductContent";
import { usePushToStore } from "@/hooks/products";
import { useCancelSync } from "@/hooks/sync";
import { CancelSyncDialog } from "../CancelSyncDialog";
import { getGeneratedFieldsTooltip, hasRemainingDraftContent, isDraftAlreadyApplied } from "@/lib/productHelpers";
import { shouldSync } from "@/lib/syncHelpers";
import { useState } from "react";
import { SerpEnrichmentSheet } from "../SerpEnrichmentSheet";
import { useRouter } from "next/navigation";
import { Product } from "./types";

export const ProductRowActions = ({ product, wooCommerceStatusConfig }: { product: Product; wooCommerceStatusConfig: any }) => {
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
