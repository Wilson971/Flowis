"use client";

/**
 * PhotoStudioListCompact
 *
 * Compact horizontal list view for products in the Photo Studio page.
 * Each row: checkbox, thumbnail, title + image count, platform info, action buttons.
 */

import React from "react";
import { useRouter } from "next/navigation";
import { Camera, Pencil, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PhotoStudioListCompactProps {
  products: Product[];
  selectedProducts: Set<string>;
  onToggleSelect: (productId: string) => void;
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PhotoStudioListCompact({
  products,
  selectedProducts,
  onToggleSelect,
  selectedProductId,
  onProductClick,
  onProductDoubleClick,
}: PhotoStudioListCompactProps) {
  const router = useRouter();

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
        Aucun produit trouve.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
      {products.map((product) => {
        const src =
          product.image_url ?? product.metadata?.images?.[0]?.src;
        const imageCount = getImageCount(product);
        const isChecked = selectedProducts.has(product.id);
        const isActive = selectedProductId === product.id;

        return (
          <div
            key={product.id}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer",
              "hover:bg-muted/40",
              isActive && "bg-primary/5 ring-1 ring-inset ring-primary/20"
            )}
            onClick={() => onProductClick(product.id)}
            onDoubleClick={() => onProductDoubleClick(product.id)}
          >
            {/* Checkbox */}
            <div
              className="flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => onToggleSelect(product.id)}
                aria-label={`Selectionner ${product.title}`}
              />
            </div>

            {/* Thumbnail */}
            <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
              {src ? (
                <img
                  src={src}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Title + image count */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="text-sm font-medium truncate">
                {product.title}
              </span>
              <Badge
                variant="secondary"
                size="sm"
                className="flex-shrink-0"
              >
                <ImageIcon className="h-3 w-3 mr-0.5" />
                {imageCount}
              </Badge>
            </div>

            {/* Platform */}
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" size="sm">
                {product.platform}
              </Badge>
              {product.platform_product_id && (
                <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                  #{product.platform_product_id}
                </span>
              )}
            </div>

            {/* Actions */}
            <div
              className="flex items-center gap-1 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        onProductDoubleClick(product.id)
                      }
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
                      onClick={() =>
                        router.push(
                          `/app/products/${product.id}/edit`
                        )
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Modifier le produit</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        );
      })}
    </div>
  );
}
