/**
 * Product Row Actions V2 — Vercel Pro Pattern
 * Monochrome, dense, reveal on hover
 */

"use client";

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
import { usePushProductBatch } from "@/hooks/products";
import { useCancelSync } from "@/hooks/sync";
import { CancelSyncDialog } from "../CancelSyncDialog";
import { getGeneratedFieldsTooltip, hasRemainingDraftContent, isDraftAlreadyApplied } from "@/lib/productHelpers";
import { shouldSync } from "@/lib/syncHelpers";
import { useState } from "react";
import { SerpEnrichmentSheet } from "../SerpEnrichmentSheet";
import { useRouter } from "next/navigation";
import { Product } from "./types";

export const ProductRowActionsV2 = ({ product, wooCommerceStatusConfig }: { product: Product; wooCommerceStatusConfig: any }) => {
  const router = useRouter();
  const { selectedStore } = useSelectedStore();
  const { mutate: acceptDraft, isPending: isAccepting } = useAcceptDraft();
  const { mutate: rejectDraft, isPending: isRejecting } = useRejectDraft();
  const { mutate: pushToStore, isPending: isPushing } = usePushProductBatch();
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
      <div className="flex items-center justify-end gap-1">
        {/* Draft actions — visible only when relevant */}
        {hasDraftContent && (
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-[11px] font-medium rounded-lg border-border/60 hover:bg-muted/50 transition-colors shadow-none"
                    onClick={(e) => { e.stopPropagation(); acceptDraft({ productId: product.id }); }}
                    disabled={isAccepting || isRejecting}
                  >
                    {isAccepting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1 text-success" />Accepter</>}
                  </Button>
                </TooltipTrigger>
                {generatedFieldsTooltip && (
                  <TooltipContent><p className="text-xs">{generatedFieldsTooltip}</p></TooltipContent>
                )}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={(e) => { e.stopPropagation(); rejectDraft({ productId: product.id }); }}
                    disabled={isAccepting || isRejecting}
                  >
                    {isRejecting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">Rejeter</p></TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}

        {/* Sync action — reveal on hover */}
        {!hasDraftContent && shouldSync(product) && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors opacity-0 group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); pushToStore({ product_ids: [product.id] }); }}
                  disabled={isPushing}
                >
                  {isPushing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">Synchroniser</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Edit — always visible */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors"
                onClick={(e) => { e.stopPropagation(); router.push(`/app/products/${product.id}/edit`); }}
              >
                <Edit className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">Editer</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Overflow menu — reveal on hover */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Actions
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/app/products/${product.id}/edit`)} className="text-[13px]">
              <Edit className="mr-2 h-3.5 w-3.5" />
              Editer
            </DropdownMenuItem>
            {storeProductUrl && (
              <DropdownMenuItem onClick={() => window.open(storeProductUrl, '_blank')} className="text-[13px]">
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                Voir en ligne
              </DropdownMenuItem>
            )}
            {hasDraftContent && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => acceptDraft({ productId: product.id })}
                  className="text-[13px]"
                >
                  <Check className="mr-2 h-3.5 w-3.5 text-success" />
                  Accepter le brouillon
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => rejectDraft({ productId: product.id })}
                  className="text-xs text-destructive focus:text-destructive"
                >
                  <X className="mr-2 h-3.5 w-3.5" />
                  Rejeter le brouillon
                </DropdownMenuItem>
              </>
            )}
            {shouldSync(product) && !hasDraftContent && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => pushToStore({ product_ids: [product.id] })}
                  className="text-[13px]"
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Synchroniser
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive text-xs"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <X className="mr-2 h-3.5 w-3.5" />
                  Annuler les modifications
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
