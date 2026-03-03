"use client";

import { motion } from "framer-motion";
import { BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motionTokens, styles } from "@/lib/design-system";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface SeoAnalysisProgressCardProps {
  totalProducts: number;
  analyzedProducts: number;
  averageScore?: number;
  isLoading?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  if (score >= 60) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  return "bg-red-500/10 text-red-500 border-red-500/20";
}

export function SeoAnalysisProgressCard({
  totalProducts,
  analyzedProducts,
  averageScore,
  isLoading = false,
}: SeoAnalysisProgressCardProps) {
  const progress =
    totalProducts > 0
      ? Math.round((analyzedProducts / totalProducts) * 100)
      : 0;
  const isComplete = progress >= 100;

  return (
    <motion.div
      className={cn(styles.card.base, "p-6")}
      variants={motionTokens.variants.fadeIn}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary"
            )}
          >
            <BarChart3 className="h-4 w-4" />
          </div>
          <h3 className={cn(styles.text.h4)}>Analyse SEO</h3>
        </div>
        {averageScore !== undefined && !isLoading && (
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium rounded-full",
              getScoreColor(averageScore)
            )}
          >
            Score moyen : {averageScore}
          </Badge>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <div className="space-y-3">
          <Progress
            value={progress}
            className="h-2"
            indicatorClassName={cn(
              isComplete ? "bg-emerald-500" : "bg-primary"
            )}
          />
          <div className="flex items-center justify-between">
            <p className={cn(styles.text.bodyMuted, "text-sm")}>
              <span className="text-foreground font-medium">
                {analyzedProducts}
              </span>{" "}
              / {totalProducts} produits analysés
            </p>
            <span className={cn(styles.text.bodyMuted, "text-sm")}>
              {progress}%
            </span>
          </div>

          {/* CTA when not complete */}
          {!isComplete && totalProducts > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-1.5"
              asChild
            >
              <Link href="/app/products?action=seo-analysis">
                Analyser les produits restants
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
