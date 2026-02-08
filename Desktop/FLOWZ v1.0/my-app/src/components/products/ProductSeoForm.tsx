/**
 * Product SEO Form Component
 *
 * Form for editing product SEO content with score tracking
 * Simplified version without TipTap editor (using textarea for now)
 */

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from "framer-motion";

// ============================================================================
// TYPES
// ============================================================================

interface SeoScoreProps {
  score: number;
}

interface ProductSeoFormProps {
  initialTitle?: string;
  initialShortDescription?: string;
  initialDetailedDescription?: string;
  onTitleChange?: (value: string) => void;
  onShortDescriptionChange?: (value: string) => void;
  onDetailedDescriptionChange?: (value: string) => void;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

export const calculateScore = (text: string, idealLength: number): number => {
  if (!text) return 0;
  const length = text.length;
  // Perfect range: ideal +/- 15%
  if (length >= idealLength * 0.85 && length <= idealLength * 1.15) return 100;
  // Good range: ideal +/- 30%
  if (length >= idealLength * 0.7 && length <= idealLength * 1.3) return 70;
  // Acceptable range: ideal +/- 50%
  if (length >= idealLength * 0.5 && length <= idealLength * 1.5) return 40;
  return 20;
};

export const SeoScoreBar = ({ score }: SeoScoreProps) => {
  const getScoreColor = (s: number) => {
    if (s >= 90) return 'bg-success shadow-[0_0_10px_color-mix(in srgb,var(--success),transparent_60%)]';
    if (s >= 60) return 'bg-info shadow-[0_0_10px_color-mix(in srgb,var(--info),transparent_60%)]';
    if (s >= 30) return 'bg-warning shadow-[0_0_10px_color-mix(in srgb,var(--warning),transparent_60%)]';
    return 'bg-destructive shadow-[0_0_10px_color-mix(in srgb,var(--destructive),transparent_60%)]';
  };

  return (
    <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden relative border border-border/10">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={cn('h-full transition-all duration-500 rounded-full', getScoreColor(score))}
      />
    </div>
  );
};

export const ScoreBadge = ({ score, label }: { score: number; label?: string }) => {
  let text = 'MANQUANT';
  let colorClass = "bg-muted text-muted-foreground";

  if (score >= 90) {
    text = 'EXCELLENT';
    colorClass = "bg-success/10 text-success border-success/20";
  } else if (score >= 60) {
    text = 'BON';
    colorClass = "bg-info/10 text-info border-info/20";
  } else if (score >= 30) {
    text = 'MOYEN';
    colorClass = "bg-warning/10 text-warning border-warning/20";
  } else if (score > 0) {
    text = 'FAIBLE';
    colorClass = "bg-destructive/10 text-destructive border-destructive/20";
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "ml-2 text-[9px] font-bold uppercase tracking-[0.15em] px-1.5 py-0 h-4 border",
        colorClass
      )}
    >
      {text} {score > 0 && `${Math.round(score)}%`}
    </Badge>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProductSeoForm({
  initialTitle = '',
  initialShortDescription = '',
  initialDetailedDescription = '',
  onTitleChange,
  onShortDescriptionChange,
  onDetailedDescriptionChange,
}: ProductSeoFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [shortDesc, setShortDesc] = useState(initialShortDescription);
  const [detailedDesc, setDetailedDesc] = useState(initialDetailedDescription);

  // Update parent when values change
  useEffect(() => {
    onTitleChange?.(title);
  }, [title, onTitleChange]);

  useEffect(() => {
    onShortDescriptionChange?.(shortDesc);
  }, [shortDesc, onShortDescriptionChange]);

  useEffect(() => {
    onDetailedDescriptionChange?.(detailedDesc);
  }, [detailedDesc, onDetailedDescriptionChange]);

  // Score calculation based on length
  const titleScore = calculateScore(title, 60); // Title ideal 60 chars
  const shortDescScore = calculateScore(shortDesc, 160); // Short desc ideal 160
  // Remove HTML tags for detailed description scoring
  const detailedDescText = detailedDesc.replace(/<[^>]*>/g, '');
  const detailedDescScore = calculateScore(detailedDescText, 500); // Detailed ideal 500

  return (
    <Card className="w-full shadow-xl border-border/60">
      <CardHeader className="border-b border-border/40 bg-muted/20 pb-6">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold text-foreground">
              Détails du produit
            </CardTitle>
            <CardDescription className="mt-1">
              Gérez les informations produit et surveillez les scores de qualité.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-10">
        {/* Product Title Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="product-title" className="text-sm font-semibold text-foreground">
                Titre du produit <span className="text-destructive">*</span>
              </Label>
              <ScoreBadge score={titleScore} />
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {title.length} caractères
            </span>
          </div>

          <div className="relative">
            <Input
              id="product-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entrez le titre du produit"
              className="py-6 text-base shadow-sm focus-visible:ring-primary"
            />
          </div>

          <SeoScoreBar score={titleScore} />
        </div>

        {/* Short Description Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold text-foreground">
                Description courte
              </Label>
              <ScoreBadge score={shortDescScore} />
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {shortDesc.length} caractères
            </span>
          </div>

          <div className="min-h-[150px]">
            <Textarea
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="Saisissez une description courte..."
              className="min-h-[120px] text-base"
            />
          </div>

          <SeoScoreBar score={shortDescScore} />
        </div>

        {/* Detailed Description Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold text-foreground">
                Description détaillée
              </Label>
              <ScoreBadge score={detailedDescScore} />
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {detailedDescText.length} caractères
            </span>
          </div>

          <div className="min-h-[300px]">
            <Textarea
              value={detailedDesc}
              onChange={(e) => setDetailedDesc(e.target.value)}
              placeholder="Saisissez la description détaillée..."
              className="min-h-[300px] text-base"
            />
          </div>

          <SeoScoreBar score={detailedDescScore} />
        </div>
      </CardContent>
    </Card>
  );
}
