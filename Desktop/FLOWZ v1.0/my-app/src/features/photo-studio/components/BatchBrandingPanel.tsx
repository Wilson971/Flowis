"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Palette,
  X,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Zap,
  Crown,
} from "lucide-react";
import { useCreateBatchJobs } from "@/features/photo-studio/hooks/useBatchStudioJobs";
import type { GenerationQuality } from "@/features/photo-studio/types/studio";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface BatchBrandingPanelProps {
  selectedProducts: Array<{
    id: string;
    title: string;
    imageCount: number;
  }>;
  onClose: () => void;
  onBatchStarted: (batchJobId: string) => void;
}

type QualityOption = {
  id: GenerationQuality;
  label: string;
  description: string;
  icon: React.ReactNode;
  resolution: string;
};

// ============================================================================
// CONSTANTS
// ============================================================================

const QUALITY_OPTIONS: QualityOption[] = [
  {
    id: "standard",
    label: "Standard",
    description: "Rapide, bonne qualite",
    icon: <ImageIcon className="h-4 w-4" />,
    resolution: "512px",
  },
  {
    id: "high",
    label: "Haute qualite",
    description: "Details precis, couleurs fideles",
    icon: <Zap className="h-4 w-4" />,
    resolution: "1024px",
  },
  {
    id: "ultra",
    label: "Ultra HD",
    description: "Maximum de detail et nettete",
    icon: <Crown className="h-4 w-4" />,
    resolution: "2048px",
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function BatchBrandingPanel({
  selectedProducts,
  onClose,
  onBatchStarted,
}: BatchBrandingPanelProps) {
  const [selectedQuality, setSelectedQuality] =
    useState<GenerationQuality>("standard");
  const [whiteBackground, setWhiteBackground] = useState(false);

  const createBatchJobs = useCreateBatchJobs();

  const totalImages = selectedProducts.reduce(
    (sum, p) => sum + p.imageCount,
    0
  );
  const estimatedCredits = selectedProducts.length;

  const canLaunch = selectedProducts.length > 0;

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------

  const handleLaunch = () => {
    if (!canLaunch) return;

    const presetSettings: Record<string, unknown> = {
      quality: selectedQuality,
      whiteBackground,
    };

    createBatchJobs.mutate(
      {
        productIds: selectedProducts.map((p) => p.id),
        action: "enhance",
        presetSettings,
      },
      {
        onSuccess: (result) => {
          onBatchStarted(result.batchId);
        },
      }
    );
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "border-t border-border bg-card shadow-xl",
          "px-6 py-4"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                Branding &amp; Amelioration
              </h3>
              <p className="text-xs text-muted-foreground">
                {selectedProducts.length} produit(s) &middot; {totalImages}{" "}
                image(s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              ~{estimatedCredits} credit(s)
            </Badge>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quality selection grid */}
        <div className="mb-4">
          <Label className="text-xs font-medium mb-2 block">
            Niveau de qualite
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {QUALITY_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedQuality(option.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all",
                  "hover:border-primary/50 hover:bg-muted/50",
                  selectedQuality === option.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-card"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md",
                    selectedQuality === option.id
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {option.icon}
                </div>
                <span className="text-xs font-medium">{option.label}</span>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">
                  {option.description}
                </span>
                <Badge variant="outline" size="sm">
                  {option.resolution}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* White background toggle */}
        <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white border border-border">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium">Fond blanc uniforme</p>
              <p className="text-[10px] text-muted-foreground">
                Remplacer l&apos;arriere-plan par un fond blanc e-commerce
              </p>
            </div>
          </div>
          <Switch
            checked={whiteBackground}
            onCheckedChange={setWhiteBackground}
          />
        </div>

        {/* Summary and launch */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {selectedQuality === "standard"
                ? "Standard"
                : selectedQuality === "high"
                  ? "Haute qualite"
                  : "Ultra HD"}
            </span>
            {whiteBackground && " + fond blanc"}
            {" - "}
            {selectedProducts.length} produit
            {selectedProducts.length > 1 ? "s" : ""}
          </div>

          <Button
            onClick={handleLaunch}
            disabled={!canLaunch || createBatchJobs.isPending}
            className="gap-2"
          >
            {createBatchJobs.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Lancement...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Lancer l&apos;amelioration ({selectedProducts.length})
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
