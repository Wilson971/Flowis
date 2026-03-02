"use client";

import { motion } from 'framer-motion';
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

// Modern SEO Cell Component
export const ProductSEOCell = ({ product }: { product: Product }) => {
  const router = useRouter();
  // Prefer persisted seo_score, fallback to legacy product_seo_analysis
  const displayScore = product.seo_score ?? product.product_seo_analysis?.overall_score ?? null;

  if (displayScore === null || displayScore === 0) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground/40">
        <AlertCircle className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">N/A</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => router.push(`/app/products/${product.id}/edit#seo`)}
      className="flex items-center justify-center w-11 h-11 rounded-lg hover:bg-muted/50 transition-colors duration-150 cursor-pointer"
      aria-label={`Score SEO : ${displayScore}/100`}
    >
      <SeoScoreCircle score={displayScore} size={28} />
    </button>
  );
};

// Modern SERP Cell Component
export const ProductSERPCell = ({ product }: { product: Product }) => {
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

// Image Cell Component
export const ProductImageCell = ({ product }: { product: Product }) => {
  if (!product.image_url) {
    return (
      <div className="h-10 w-10 rounded-lg border border-dashed border-border bg-muted flex items-center justify-center flex-shrink-0">
        <Package className="h-4 w-4 text-muted-foreground/50" />
      </div>
    );
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-10 w-10 relative rounded-lg overflow-hidden border border-border bg-muted flex-shrink-0 cursor-pointer hover:border-primary/40 transition-colors duration-150">
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
