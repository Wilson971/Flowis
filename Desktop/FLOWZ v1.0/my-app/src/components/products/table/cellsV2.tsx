/**
 * Product Table Cells V2 — Vercel Pro Pattern
 * Monochrome icons, dense typography, motionTokens
 */

"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Package,
  Globe,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SeoScoreCircle } from "@/components/seo/SeoScoreCircle";
import { SerpEnrichmentSheet } from "../SerpEnrichmentSheet";
import { useState } from "react";
import { Product } from "./types";

export const ProductSEOCellV2 = ({ product }: { product: Product }) => {
  const router = useRouter();
  const displayScore = product.seo_score ?? product.product_seo_analysis?.overall_score ?? null;

  if (displayScore === null || displayScore === 0) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground/40">
        <AlertCircle className="h-3.5 w-3.5" />
        <span className="text-[11px] font-medium">N/A</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => router.push(`/app/products/${product.id}/edit#seo`)}
      className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer"
      aria-label={`Score SEO : ${displayScore}/100`}
    >
      <SeoScoreCircle score={displayScore} size={28} />
    </button>
  );
};

export const ProductSERPCellV2 = ({ product }: { product: Product }) => {
  const [showSerpSheet, setShowSerpSheet] = useState(false);
  const serpAnalysis = product.product_serp_analysis?.[0];

  if (!serpAnalysis) {
    return <span className="text-[11px] text-muted-foreground/60">—</span>;
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="cursor-pointer h-5 rounded-full px-2 text-[10px] font-medium border-0 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowSerpSheet(true);
              }}
            >
              <Globe className="h-3 w-3 mr-1" />
              #{serpAnalysis.keyword_position || 'N/A'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Voir l&apos;analyse SERP</p>
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

export const ProductImageCellV2 = ({ product }: { product: Product }) => {
  if (!product.image_url) {
    return (
      <div className="h-10 w-10 rounded-lg border border-dashed border-border/40 bg-muted/40 flex items-center justify-center flex-shrink-0">
        <Package className="h-4 w-4 text-muted-foreground/40" />
      </div>
    );
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-10 w-10 relative rounded-lg overflow-hidden border border-border/40 bg-muted flex-shrink-0 cursor-pointer hover:border-border transition-colors">
            <img
              src={product.image_url}
              alt={product.title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
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
};
