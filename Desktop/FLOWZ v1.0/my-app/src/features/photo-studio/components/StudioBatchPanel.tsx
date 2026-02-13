"use client";

/**
 * StudioBatchPanel
 *
 * Fixed-bottom panel for Photo Studio batch operations.
 * Matches the BatchGenerationPanel pattern from Products:
 * - Glassmorphism card at bottom of screen
 * - Collapsible header with title + selected count
 * - Action chips grid (Photo Studio actions)
 * - Preset selector for actions that need it
 * - Angles info for generate_angles
 * - Footer with credit estimation + launch button
 * - Portal-rendered via StudioBatchPortal
 */

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  ChevronDown,
  X,
  Sparkles,
  Eraser,
  Image as ImageIcon,
  Wand2,
  RotateCw,
  Palette,
  Loader2,
  CheckCircle2,
  Settings,
  Zap,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";
import { getAllPresets } from "@/features/photo-studio/constants/scenePresets";
import type { BatchAction } from "@/features/photo-studio/types/studio";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BatchActionConfig = {
  id: BatchAction;
  label: string;
  description: string;
  icon: React.ElementType;
  needsPreset?: boolean;
};

export interface StudioBatchPanelProps {
  selectedCount: number;
  selectedAction: BatchAction | null;
  selectedPresetId: string;
  isCollapsed: boolean;
  isLaunching: boolean;
  progressMessage: string;

  onActionChange: (action: BatchAction) => void;
  onPresetChange: (presetId: string) => void;
  onCollapseChange: (collapsed: boolean) => void;
  onLaunch: () => void;
  onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BATCH_ACTIONS: BatchActionConfig[] = [
  {
    id: "remove_bg",
    label: "Supprimer fond",
    description: "Detourage automatique",
    icon: Eraser,
  },
  {
    id: "replace_bg",
    label: "Remplacer fond",
    description: "Nouveau decor IA",
    icon: ImageIcon,
    needsPreset: true,
  },
  {
    id: "enhance",
    label: "Ameliorer",
    description: "Upscale & couleur",
    icon: Wand2,
  },
  {
    id: "generate_angles",
    label: "Angles",
    description: "Vues multiples",
    icon: RotateCw,
  },
  {
    id: "generate_scene",
    label: "Scene produit",
    description: "Mise en scene IA",
    icon: Palette,
    needsPreset: true,
  },
];

const DEFAULT_ANGLES = ["front", "left", "right", "top"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StudioBatchPanel({
  selectedCount,
  selectedAction,
  selectedPresetId,
  isCollapsed,
  isLaunching,
  progressMessage,
  onActionChange,
  onPresetChange,
  onCollapseChange,
  onLaunch,
  onClose,
}: StudioBatchPanelProps) {
  const allPresets = useMemo(() => getAllPresets(), []);

  const activeAction = BATCH_ACTIONS.find((a) => a.id === selectedAction);
  const needsPreset = activeAction?.needsPreset ?? false;
  const canLaunch =
    selectedCount > 0 &&
    !!selectedAction &&
    (!needsPreset || !!selectedPresetId);

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{
            duration: 0.24,
            ease: motionTokens.easings.smooth,
          }}
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            width: "100%",
            maxWidth: "820px",
            margin: "0 auto",
            zIndex: 9999,
            paddingBottom: "max(16px, env(safe-area-inset-bottom))",
          }}
          className="pointer-events-none"
        >
          <div className="pointer-events-auto px-3">
            <div className="rounded-xl border border-border/50 bg-card/90 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
              {/* Multi-layer glassmorphism effects */}
              {/* Glass reflection */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none" />
              {/* Primary accent glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/3 pointer-events-none" />
              {/* Border light effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, black 0%, transparent 50%)' }} />

              <div className="relative z-10">
                {/* ── Header ── */}
                <div
                  className={cn(
                    "flex items-center justify-between px-4 pt-4",
                    !isCollapsed && "pb-3"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Camera className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold leading-tight text-foreground">
                        Photo Studio IA
                      </h3>
                      <p className="text-xs text-muted-foreground leading-tight">
                        {`${selectedCount} produit${selectedCount > 1 ? "s" : ""} selectionne${selectedCount > 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Collapsed: inline launch button */}
                    {isCollapsed && (
                      <LaunchButton
                        canLaunch={canLaunch}
                        isLaunching={isLaunching}
                        progressMessage={progressMessage}
                        selectedCount={selectedCount}
                        onLaunch={onLaunch}
                      />
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onCollapseChange(!isCollapsed)}
                      className="h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0"
                    >
                      <motion.div
                        animate={{ rotate: isCollapsed ? 180 : 0 }}
                        transition={motionTokens.transitions.fast}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </motion.div>
                    </Button>

                    {onClose && !isLaunching && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                        title="Deselectionner tous les produits"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* ── Expandable Content ── */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      {/* Divider */}
                      <div className="mx-4 border-t border-border" />

                      <div className="px-4 pt-4 pb-4 space-y-4">
                        {/* Question heading */}
                        <p className="text-sm font-medium text-foreground">
                          Quelle action IA appliquer ?
                        </p>

                        {/* ── Action Chips Grid ── */}
                        <div className="flex flex-wrap gap-2.5">
                          {BATCH_ACTIONS.map((action) => {
                            const isSelected = selectedAction === action.id;
                            const Icon = action.icon;

                            return (
                              <motion.button
                                key={action.id}
                                type="button"
                                onClick={() =>
                                  !isLaunching && onActionChange(action.id)
                                }
                                disabled={isLaunching}
                                whileTap={motionTokens.variants.tap}
                                className={cn(
                                  "relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all duration-200",
                                  "cursor-pointer select-none overflow-hidden",
                                  "disabled:opacity-50 disabled:cursor-not-allowed",
                                  isSelected
                                    ? "bg-primary/5 border-primary/40 shadow-sm backdrop-blur-sm"
                                    : "bg-card/80 border-border hover:border-primary/25 hover:bg-primary/[0.02] backdrop-blur-sm"
                                )}
                              >
                                {/* Glass shine on selected */}
                                {isSelected && (
                                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                                )}

                                {/* Icon container */}
                                <div
                                  className={cn(
                                    "relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200",
                                    isSelected
                                      ? "bg-primary/15 backdrop-blur-sm"
                                      : "bg-muted/80"
                                  )}
                                >
                                  <Icon
                                    className={cn(
                                      "h-4 w-4 transition-colors duration-200 relative z-10",
                                      isSelected
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                    )}
                                  />
                                </div>

                                {/* Label */}
                                <span
                                  className={cn(
                                    "text-xs font-medium whitespace-nowrap transition-colors duration-200",
                                    isSelected
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {action.label}
                                </span>

                                {/* Active dot indicator */}
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={motionTokens.transitions.spring}
                                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card"
                                  />
                                )}
                              </motion.button>
                            );
                          })}
                        </div>

                        {/* ── Preset selector (for replace_bg / generate_scene) ── */}
                        <AnimatePresence>
                          {needsPreset && selectedAction && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={motionTokens.transitions.default}
                              className="overflow-hidden"
                            >
                              <div className="p-3 rounded-xl bg-muted/30 border border-border">
                                <Label className="text-xs font-medium mb-2.5 block">
                                  Preset de scene
                                </Label>
                                <div className="grid grid-cols-4 gap-2 mb-2">
                                  {allPresets.slice(0, 4).map((preset) => (
                                    <button
                                      key={preset.id}
                                      onClick={() =>
                                        onPresetChange(preset.id)
                                      }
                                      className={cn(
                                        "relative rounded-xl border-2 overflow-hidden transition-all duration-200",
                                        "hover:border-primary/30",
                                        selectedPresetId === preset.id
                                          ? "border-primary ring-2 ring-primary/20"
                                          : "border-transparent"
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
                                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div className="p-1 bg-gradient-to-t from-background/80 to-transparent absolute inset-x-0 bottom-0">
                                        <p className="text-[10px] font-medium truncate text-foreground">
                                          {preset.name}
                                        </p>
                                      </div>
                                      {selectedPresetId === preset.id && (
                                        <div className="absolute top-1 left-1">
                                          <CheckCircle2 className="h-3.5 w-3.5 text-primary drop-shadow-sm" />
                                        </div>
                                      )}
                                    </button>
                                  ))}
                                </div>
                                {allPresets.length > 4 && (
                                  <Select
                                    value={selectedPresetId}
                                    onValueChange={onPresetChange}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Ou choisir un autre preset..." />
                                    </SelectTrigger>
                                    <SelectContent className="z-[10001]">
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

                        {/* ── Angles info (for generate_angles) ── */}
                        <AnimatePresence>
                          {selectedAction === "generate_angles" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={motionTokens.transitions.default}
                              className="overflow-hidden"
                            >
                              <div className="p-3 rounded-xl bg-muted/30 border border-border">
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
                                  {DEFAULT_ANGLES.length} angles par produit
                                  &middot;{" "}
                                  {DEFAULT_ANGLES.length * selectedCount} images
                                  au total
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* ── No action selected warning ── */}
                        {!selectedAction && selectedCount > 0 && (
                          <div className="p-2.5 rounded-xl bg-warning/10 border border-warning/20">
                            <p className="text-xs text-warning font-medium">
                              Selectionnez une action IA ci-dessus
                            </p>
                          </div>
                        )}

                        {/* ── Footer: Credit info + Launch ── */}
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          {/* Credit indicator */}
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                            <span className="text-xs text-muted-foreground">
                              Estimation:{" "}
                              <span className="font-medium text-foreground">
                                ~{selectedCount} credit
                                {selectedCount > 1 ? "s" : ""}
                              </span>
                            </span>
                          </div>

                          {/* Launch CTA */}
                          <LaunchButton
                            canLaunch={canLaunch}
                            isLaunching={isLaunching}
                            progressMessage={progressMessage}
                            selectedCount={selectedCount}
                            onLaunch={onLaunch}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Collapsed: minimal bottom padding */}
                {isCollapsed && <div className="pb-4" />}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Launch Button (reused in header collapsed + footer expanded)
// ---------------------------------------------------------------------------

function LaunchButton({
  canLaunch,
  isLaunching,
  progressMessage,
  selectedCount,
  onLaunch,
}: {
  canLaunch: boolean;
  isLaunching: boolean;
  progressMessage: string;
  selectedCount: number;
  onLaunch: () => void;
}) {
  return (
    <Button
      size="sm"
      disabled={!canLaunch || isLaunching}
      onClick={onLaunch}
      className={cn(
        "gap-2.5 px-5 h-9 font-bold text-xs rounded-xl relative overflow-hidden",
        "bg-primary text-primary-foreground",
        "shadow-sm shadow-primary/20",
        "hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25",
        "active:scale-[0.98]",
        "transition-all duration-200",
        "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-sm",
        isLaunching && "animate-pulse"
      )}
    >
      {isLaunching ? (
        <>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Zap className="h-3.5 w-3.5" />
          </motion.div>
          <span className="inline-block min-w-[80px] text-left">
            <AnimatePresence mode="wait">
              <motion.span
                key={progressMessage}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="block truncate"
              >
                {progressMessage}
              </motion.span>
            </AnimatePresence>
          </span>
        </>
      ) : (
        <>
          <Sparkles className="h-3.5 w-3.5" />
          <span>
            Lancer ({selectedCount})
          </span>
        </>
      )}
    </Button>
  );
}
