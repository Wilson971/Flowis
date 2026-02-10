"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  X,
  Sparkles,
  Eraser,
  Image as ImageIcon,
  Wand2,
  RotateCw,
  Palette,
  Loader2,
} from "lucide-react";
import { useCreateBatchJobs } from "@/features/photo-studio/hooks/useBatchStudioJobs";
import { getAllPresets } from "@/features/photo-studio/constants/scenePresets";
import type { BatchAction } from "@/features/photo-studio/types/studio";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface StudioBatchPanelProps {
  selectedProducts: Array<{
    id: string;
    title: string;
    imageCount: number;
  }>;
  onClose: () => void;
  onBatchStarted: (batchJobId: string) => void;
}

type BatchActionConfig = {
  id: BatchAction;
  label: string;
  description: string;
  icon: React.ReactNode;
  needsPreset?: boolean;
};

// ============================================================================
// CONSTANTS
// ============================================================================

const BATCH_ACTIONS: BatchActionConfig[] = [
  {
    id: "remove_bg",
    label: "Supprimer arriere-plan",
    description: "Detourage automatique sur fond transparent",
    icon: <Eraser className="h-4 w-4" />,
  },
  {
    id: "replace_bg",
    label: "Remplacer arriere-plan",
    description: "Nouveau decor via presets de scene",
    icon: <ImageIcon className="h-4 w-4" />,
    needsPreset: true,
  },
  {
    id: "enhance",
    label: "Ameliorer qualite",
    description: "Upscale et correction couleur IA",
    icon: <Wand2 className="h-4 w-4" />,
  },
  {
    id: "generate_angles",
    label: "Generer des angles",
    description: "Vues multiples (face, cote, dessus)",
    icon: <RotateCw className="h-4 w-4" />,
  },
  {
    id: "generate_scene",
    label: "Generer scene produit",
    description: "Mise en scene IA avec preset",
    icon: <Palette className="h-4 w-4" />,
    needsPreset: true,
  },
];

const DEFAULT_ANGLES = ["front", "left", "right", "top"];

// ============================================================================
// COMPONENT
// ============================================================================

export function StudioBatchPanel({
  selectedProducts,
  onClose,
  onBatchStarted,
}: StudioBatchPanelProps) {
  const [selectedAction, setSelectedAction] = useState<BatchAction | null>(
    null
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");

  const createBatchJobs = useCreateBatchJobs();

  const allPresets = useMemo(() => getAllPresets(), []);
  const compactPresets = useMemo(() => allPresets.slice(0, 4), [allPresets]);

  const activeAction = BATCH_ACTIONS.find((a) => a.id === selectedAction);
  const needsPreset = activeAction?.needsPreset ?? false;

  const totalImages = (selectedProducts ?? []).reduce(
    (sum, p) => sum + p.imageCount,
    0
  );
  const estimatedCredits = (selectedProducts ?? []).length;

  const canLaunch = useMemo(() => {
    if (!selectedAction) return false;
    if (selectedProducts.length === 0) return false;
    if (needsPreset && !selectedPresetId) return false;
    return true;
  }, [selectedAction, selectedProducts.length, needsPreset, selectedPresetId]);

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------

  const handleLaunch = () => {
    if (!selectedAction || !canLaunch) return;

    const presetSettings: Record<string, unknown> = {};

    if (selectedAction === "generate_angles") {
      presetSettings.angles = DEFAULT_ANGLES;
    }

    if (needsPreset && selectedPresetId) {
      presetSettings.scenePresetId = selectedPresetId;
    }

    createBatchJobs.mutate(
      {
        productIds: selectedProducts.map((p) => p.id),
        action: selectedAction,
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
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                Photo Studio - Traitement par lot
              </h3>
              <p className="text-xs text-muted-foreground">
                {selectedProducts.length} produit(s) selectionne(s) &middot;{" "}
                {totalImages} image(s) &middot;{" "}
                <span className="text-muted-foreground">
                  1 credit/image
                </span>
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

        {/* Action grid */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {BATCH_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                setSelectedAction(action.id);
                if (!action.needsPreset) {
                  setSelectedPresetId("");
                }
              }}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all",
                "hover:border-primary/50 hover:bg-muted/50",
                selectedAction === action.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md",
                  selectedAction === action.id
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {action.icon}
              </div>
              <span className="text-[11px] font-medium text-center leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Preset selection (for replace_bg / generate_scene) */}
        <AnimatePresence mode="wait">
          {needsPreset && selectedAction && (
            <motion.div
              key="preset-section"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mb-4">
                <Label className="text-xs font-medium mb-2 block">
                  Preset de scene
                </Label>

                {/* Compact grid (first 4 presets) */}
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {compactPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={cn(
                        "relative rounded-lg border overflow-hidden transition-all",
                        "hover:border-primary/50",
                        selectedPresetId === preset.id
                          ? "border-primary ring-1 ring-primary/20"
                          : "border-border"
                      )}
                    >
                      <div className="aspect-square bg-muted/50 flex items-center justify-center">
                        {preset.thumbnail ? (
                          <img
                            src={preset.thumbnail}
                            alt={preset.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="p-1.5">
                        <p className="text-[10px] font-medium truncate">
                          {preset.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Full preset selector dropdown */}
                {allPresets.length > 4 && (
                  <Select
                    value={selectedPresetId}
                    onValueChange={setSelectedPresetId}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Ou choisir un autre preset..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allPresets.map((preset) => (
                        <SelectItem
                          key={preset.id}
                          value={preset.id}
                          className="text-xs"
                        >
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Angle info (for generate_angles) */}
        <AnimatePresence mode="wait">
          {selectedAction === "generate_angles" && (
            <motion.div
              key="angles-section"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3">
                <Label className="text-xs font-medium mb-2 block">
                  Angles generes
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_ANGLES.map((angle) => (
                    <Badge key={angle} variant="secondary">
                      {angle}
                    </Badge>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {DEFAULT_ANGLES.length} angles par produit &middot;{" "}
                  {DEFAULT_ANGLES.length * selectedProducts.length} images au
                  total
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Launch button */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {activeAction
              ? activeAction.description
              : "Selectionnez une action ci-dessus"}
          </p>

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
                Lancer le batch ({selectedProducts.length} produit
                {selectedProducts.length > 1 ? "s" : ""})
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
