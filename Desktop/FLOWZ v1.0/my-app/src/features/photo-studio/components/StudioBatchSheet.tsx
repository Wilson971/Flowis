"use client";

/**
 * StudioBatchSheet
 *
 * Right-side Sheet drawer for batch operations.
 * Replaces the floating bottom batch panels with a unified Sheet
 * containing tabs for Photo Editing and Branding, action Radio Cards,
 * preset selector, and launch button.
 */

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  Eraser,
  Image as ImageIcon,
  Wand2,
  RotateCw,
  Palette,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useCreateBatchJobs } from "@/features/photo-studio/hooks/useBatchStudioJobs";
import { getAllPresets } from "@/features/photo-studio/constants/scenePresets";
import type { BatchAction } from "@/features/photo-studio/types/studio";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StudioBatchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Array<{
    id: string;
    title: string;
    imageCount: number;
  }>;
  onBatchStarted: (batchJobId: string) => void;
  onClearSelection: () => void;
}

type BatchActionConfig = {
  id: BatchAction;
  label: string;
  description: string;
  icon: React.ReactNode;
  needsPreset?: boolean;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BATCH_ACTIONS: BatchActionConfig[] = [
  {
    id: "remove_bg",
    label: "Supprimer fond",
    description: "Detourage automatique sur fond transparent",
    icon: <Eraser className="h-5 w-5" />,
  },
  {
    id: "replace_bg",
    label: "Remplacer fond",
    description: "Nouveau decor via presets de scene",
    icon: <ImageIcon className="h-5 w-5" />,
    needsPreset: true,
  },
  {
    id: "enhance",
    label: "Ameliorer qualite",
    description: "Upscale et correction couleur IA",
    icon: <Wand2 className="h-5 w-5" />,
  },
  {
    id: "generate_angles",
    label: "Generer angles",
    description: "Vues multiples (face, cote, dessus)",
    icon: <RotateCw className="h-5 w-5" />,
  },
  {
    id: "generate_scene",
    label: "Scene produit",
    description: "Mise en scene IA avec preset",
    icon: <Palette className="h-5 w-5" />,
    needsPreset: true,
  },
];

const DEFAULT_ANGLES = ["front", "left", "right", "top"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StudioBatchSheet({
  open,
  onOpenChange,
  selectedProducts,
  onBatchStarted,
  onClearSelection,
}: StudioBatchSheetProps) {
  const [selectedAction, setSelectedAction] = useState<BatchAction | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");

  const createBatchJobs = useCreateBatchJobs();

  const allPresets = useMemo(() => getAllPresets(), []);

  const activeAction = BATCH_ACTIONS.find((a) => a.id === selectedAction);
  const needsPreset = activeAction?.needsPreset ?? false;

  const totalImages = selectedProducts.reduce(
    (sum, p) => sum + p.imageCount,
    0
  );

  const canLaunch = useMemo(() => {
    if (!selectedAction) return false;
    if (selectedProducts.length === 0) return false;
    if (needsPreset && !selectedPresetId) return false;
    return true;
  }, [selectedAction, selectedProducts.length, needsPreset, selectedPresetId]);

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
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:max-w-[420px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Camera className="h-4 w-4 text-primary" />
            </div>
            Photo Studio Batch
          </SheetTitle>
          <SheetDescription>
            {selectedProducts.length} produit{selectedProducts.length > 1 ? "s" : ""} selectionne{selectedProducts.length > 1 ? "s" : ""} &middot;{" "}
            {totalImages} image{totalImages > 1 ? "s" : ""}
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        <Tabs defaultValue="photo" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="photo" className="gap-1.5">
              <Camera className="h-3.5 w-3.5" />
              Edition Photo
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              Branding
            </TabsTrigger>
          </TabsList>

          {/* Photo Tab */}
          <TabsContent value="photo" className="flex-1 mt-4">
            <ScrollArea className="h-full pr-1">
              <div className="space-y-6">
                {/* Action selection */}
                <div>
                  <Label className="text-xs font-medium mb-3 block">
                    Action IA
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    {BATCH_ACTIONS.map((action) => (
                      <motion.button
                        key={action.id}
                        whileHover={motionTokens.variants.hoverScale}
                        whileTap={motionTokens.variants.tap}
                        onClick={() => {
                          setSelectedAction(action.id);
                          if (!action.needsPreset) {
                            setSelectedPresetId("");
                          }
                        }}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200",
                          "hover:border-primary/30",
                          selectedAction === action.id
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-transparent bg-muted/50"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0",
                            selectedAction === action.id
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {action.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {action.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                        {selectedAction === action.id && (
                          <CheckCircle2 className="h-4 w-4 text-primary ml-auto flex-shrink-0" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Preset selection */}
                {needsPreset && selectedAction && (
                  <motion.div
                    variants={motionTokens.variants.slideUp}
                    initial="hidden"
                    animate="visible"
                  >
                    <Label className="text-xs font-medium mb-3 block">
                      Preset de scene
                    </Label>

                    {/* Preset grid (first 6) */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {allPresets.slice(0, 6).map((preset) => (
                        <motion.button
                          key={preset.id}
                          whileHover={motionTokens.variants.hoverScale}
                          whileTap={motionTokens.variants.tap}
                          onClick={() => setSelectedPresetId(preset.id)}
                          className={cn(
                            "relative rounded-xl border-2 overflow-hidden transition-all duration-200",
                            "hover:border-primary/30",
                            selectedPresetId === preset.id
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-transparent"
                          )}
                        >
                          <div className="aspect-[4/3] bg-muted/50">
                            {preset.thumbnail ? (
                              <img
                                src={preset.thumbnail}
                                alt={preset.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="p-1.5 bg-gradient-to-t from-background/80 to-transparent absolute inset-x-0 bottom-0">
                            <p className="text-xs font-medium truncate text-foreground">
                              {preset.name}
                            </p>
                          </div>
                          {selectedPresetId === preset.id && (
                            <Badge
                              variant="default"
                              size="sm"
                              className="absolute top-1.5 left-1.5"
                            >
                              Actif
                            </Badge>
                          )}
                        </motion.button>
                      ))}
                    </div>

                    {/* Full dropdown for remaining */}
                    {allPresets.length > 6 && (
                      <Select
                        value={selectedPresetId}
                        onValueChange={setSelectedPresetId}
                      >
                        <SelectTrigger className="h-9 text-xs">
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
                  </motion.div>
                )}

                {/* Angles info */}
                {selectedAction === "generate_angles" && (
                  <motion.div
                    variants={motionTokens.variants.slideUp}
                    initial="hidden"
                    animate="visible"
                    className="rounded-xl border border-border bg-muted/30 p-4"
                  >
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
                    <p className="text-xs text-muted-foreground mt-2">
                      {DEFAULT_ANGLES.length} angles par produit &middot;{" "}
                      {DEFAULT_ANGLES.length * selectedProducts.length} images au
                      total
                    </p>
                  </motion.div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Branding Tab (placeholder for now) */}
          <TabsContent value="branding" className="flex-1 mt-4">
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <Palette className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">Branding</p>
              <p className="text-xs text-muted-foreground max-w-[250px]">
                Appliquez votre identite visuelle sur les photos produits.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <Separator className="my-4" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              ~{selectedProducts.length} credit{selectedProducts.length > 1 ? "s" : ""}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {activeAction
                ? activeAction.description
                : "Selectionnez une action"}
            </span>
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
                Lancer
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
