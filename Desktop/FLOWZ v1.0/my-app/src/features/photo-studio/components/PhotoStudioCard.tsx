"use client";

/**
 * PhotoStudioCard
 *
 * Card view for a single product in the Photo Studio grid.
 * Shows an aspect-square image with checkbox overlay, status badges, title, and actions.
 */

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, Pencil, ImageIcon, Loader2, CheckCircle2, XCircle } from "lucide-react";
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
import { motionTokens } from "@/lib/design-system";
import type { Product } from "@/types/product";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PhotoStudioCardProps {
  product: Product;
  isSelected: boolean;
  isChecked: boolean;
  onToggleSelect: (productId: string) => void;
  onProductClick: (productId: string) => void;
  onProductDoubleClick: (productId: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getImageCount(product: Product): number {
  const wcCount = product.working_content?.images?.length ?? 0;
  const metaCount = product.metadata?.images?.length ?? 0;
  return Math.max(wcCount, metaCount) || (product.image_url ? 1 : 0);
}

export type StudioStatus = "running" | "failed" | "done" | "none";

/** Derive the studio processing status from a product's studio_jobs */
export function getStudioStatus(product: Product): StudioStatus {
  const jobs = (product as any).studio_jobs as
    | Array<{ status: string }>
    | undefined;
  if (!jobs || jobs.length === 0) return "none";

  if (jobs.some((j) => j.status === "running" || j.status === "pending"))
    return "running";
  if (jobs.some((j) => j.status === "failed")) return "failed";
  if (jobs.every((j) => j.status === "done")) return "done";

  return "none";
}

const STATUS_BADGE_CONFIG: Record<
  Exclude<StudioStatus, "none">,
  { label: string; variant: "info" | "destructive" | "success"; icon: React.ReactNode }
> = {
  running: {
    label: "En cours",
    variant: "info",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  failed: {
    label: "Erreur",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
  done: {
    label: "Traite",
    variant: "success",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PhotoStudioCard({
  product,
  isSelected,
  isChecked,
  onToggleSelect,
  onProductClick,
  onProductDoubleClick,
}: PhotoStudioCardProps) {
  const router = useRouter();

  const src =
    product.image_url ?? product.metadata?.images?.[0]?.src;
  const imageCount = getImageCount(product);
  const studioStatus = useMemo(() => getStudioStatus(product), [product]);

  return (
    <motion.div
      variants={motionTokens.variants.fadeInScale}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={motionTokens.transitions.fast}
      className={cn(
        "group relative rounded-xl border border-border bg-card overflow-hidden transition-all duration-300",
        "hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 hover:scale-[1.01]",
        isSelected && "ring-2 ring-primary border-primary"
      )}
      onClick={() => onProductClick(product.id)}
      onDoubleClick={() => onProductDoubleClick(product.id)}
    >
      {/* ----------------------------------------------------------------- */}
      {/* Image area */}
      {/* ----------------------------------------------------------------- */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {src ? (
          <img
            src={src}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/30">
            <ImageIcon className="w-10 h-10 opacity-50" />
          </div>
        )}

        {/* Checkbox overlay - top left */}
        <div
          className={cn(
            "absolute top-2.5 left-2.5 transition-all duration-200 z-10",
            isChecked
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isChecked}
            onCheckedChange={() => onToggleSelect(product.id)}
            className="h-5 w-5 border-2 border-background/80 bg-background/50 backdrop-blur-md shadow-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
            aria-label={`Selectionner ${product.title}`}
          />
        </div>

        {/* Badges - top right */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          {/* Studio status badge */}
          {studioStatus !== "none" && (
            <Badge
              variant={STATUS_BADGE_CONFIG[studioStatus].variant}
              size="sm"
              className={cn(
                "gap-1 backdrop-blur-md shadow-sm",
                studioStatus === "running" && "bg-info/90 text-info-foreground border-info/20",
                studioStatus === "failed" && "bg-destructive/90 text-destructive-foreground border-destructive/20",
                studioStatus === "done" && "bg-emerald-500/90 hover:bg-emerald-500/90 text-white border-emerald-500/20"
              )}
            >
              {STATUS_BADGE_CONFIG[studioStatus].icon}
              {STATUS_BADGE_CONFIG[studioStatus].label}
            </Badge>
          )}

          {/* Image count badge */}
          <Badge
            variant="secondary"
            size="sm"
            className="bg-background/80 backdrop-blur-md text-foreground border-border/50 shadow-sm"
          >
            <ImageIcon className="h-3 w-3 mr-1 opacity-70" />
            {imageCount}
          </Badge>
        </div>

        {/* Action overlay - bottom */}
        <div className="absolute inset-x-0 bottom-0 p-3 pt-12 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-t from-black/70 via-black/30 to-transparent translate-y-2 group-hover:translate-y-0">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-background/90 hover:bg-background text-foreground shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    onProductDoubleClick(product.id);
                  }}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Ouvrir le Studio</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-background/90 hover:bg-background text-foreground shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/app/products/${product.id}/edit`);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Modifier le produit</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Info area */}
      {/* ----------------------------------------------------------------- */}
      <div className="p-3 space-y-1.5">
        <h3
          className="text-sm font-medium leading-tight truncate hover:underline cursor-pointer"
          title={product.title}
        >
          {product.title}
        </h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" size="sm">
            {product.platform}
          </Badge>
          {product.platform_product_id && (
            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
              #{product.platform_product_id}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
