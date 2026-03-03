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
import { usePushProductBatch } from "@/hooks/products";
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
  const { mutate: pushToStore, isPending: isPushing } = usePushProductBatch();
  const { mutate: cancelSync, isPending: isCanceling } = useCancelSync();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showSerpSheet, setShowSerpSheet] = useState(false);

  const hasDraftContent = hasRemainingDraftContent(product.draft_generated_content) &&
    !isDraftAlreadyApplied(product.draft_generated_content, product.working_content);

  const generatedFieldsTooltip = getGeneratedFieldsTooltip(
    product.draft_generated_content,
    product.working_content,
    product.generation_manifest
  );

  const getStoreProductUrl = () => {
    if (!selectedStore) return null;
    const metadata = product.metadata || {};
    const platform = product.platform;

    if (platform === 'shopify') {
      const handle = product.handle || metadata.handle;
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
        className="flex items-center justify-end gap-1"
      >
        {/* Context action — visible uniquement si pertinente */}
        {hasDraftContent && (
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-[11px] font-medium rounded-lg border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:border-emerald-500/50 active:scale-[0.97] transition-all duration-150 shadow-none"
                    onClick={(e) => { e.stopPropagation(); acceptDraft({ productId: product.id }); }}
                    disabled={isAccepting || isRejecting}
                  >
                    {isAccepting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" />Accepter</>}
                  </Button>
                </TooltipTrigger>
                {generatedFieldsTooltip && (
                  <TooltipContent className="px-3 py-2.5 max-w-64">
                    <p className="text-[11px] font-medium text-neutral-400 mb-1.5">Champs analysés</p>
                    <div className="flex flex-col gap-1">
                      {generatedFieldsTooltip.split('\n').filter(l => l.startsWith('✨') || l.startsWith('✓')).map((line, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-neutral-200">
                          <span className="shrink-0">{line.startsWith('✨') ? '✨' : '✓'}</span>
                          <span>{line.replace(/^(✨|✓)\s*/, '')}</span>
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 transition-colors duration-150"
                    onClick={(e) => { e.stopPropagation(); rejectDraft({ productId: product.id }); }}
                    disabled={isAccepting || isRejecting}
                  >
                    {isRejecting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">Rejeter</p></TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}
        {!hasDraftContent && shouldSync(product) && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-warning hover:bg-warning/10 transition-colors duration-150 opacity-0 group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); pushToStore({ product_ids: [product.id] }); }}
                  disabled={isPushing}
                >
                  {isPushing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">Synchroniser</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Edit — toujours visible */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors duration-150"
                onClick={(e) => { e.stopPropagation(); router.push(`/app/products/${product.id}/edit`); }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">Éditer</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Menu overflow — reste de toutes les actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 opacity-0 group-hover:opacity-100"
            >
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
            {hasDraftContent && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => { acceptDraft({ productId: product.id }); }}
                  className="text-xs font-medium text-primary"
                >
                  <Check className="mr-2 h-3.5 w-3.5" />
                  Accepter le brouillon
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => { rejectDraft({ productId: product.id }); }}
                  className="text-xs font-medium text-destructive"
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
                  onClick={() => { pushToStore({ product_ids: [product.id] }); }}
                  className="text-xs font-medium"
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Synchroniser
                </DropdownMenuItem>
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
