"use client";

/**
 * StudioBatchPortal
 *
 * Portal wrapper for StudioBatchPanel.
 * Matches the BatchGenerationSheet pattern from Products:
 * - Renders the panel via createPortal(document.body)
 * - Manages localStorage-persisted state (selected action, collapsed)
 * - Handles batch job creation via useCreateBatchJobs
 * - Manages progress messages during launch
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useLocalStorage, STORAGE_KEYS } from "@/hooks/useLocalStorage";
import { StudioBatchPanel } from "./StudioBatchPanel";
import { useCreateBatchJobs } from "@/features/photo-studio/hooks/useBatchStudioJobs";
import type { BatchAction } from "@/features/photo-studio/types/studio";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StudioBatchPortalProps {
  selectedCount: number;
  selectedProducts: Array<{
    id: string;
    title: string;
    imageCount: number;
  }>;
  onBatchStarted: (batchJobId: string) => void;
  onClose?: () => void;
  onClearSelection?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOADING_MESSAGES: Record<string, string> = {
  remove_bg: "Detourage en cours...",
  replace_bg: "Remplacement du fond...",
  enhance: "Amelioration qualite...",
  generate_angles: "Generation des angles...",
  generate_scene: "Creation de la scene...",
};

const DEFAULT_ANGLES = ["front", "left", "right", "top"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StudioBatchPortal({
  selectedCount,
  selectedProducts,
  onBatchStarted,
  onClose,
  onClearSelection,
}: StudioBatchPortalProps) {
  const createBatchJobs = useCreateBatchJobs();

  // Persisted state
  const [selectedAction, setSelectedAction] = useLocalStorage<BatchAction | null>(
    STORAGE_KEYS.STUDIO_BATCH_SELECTED_ACTION,
    { defaultValue: null }
  );

  const [isCollapsed, setIsCollapsed] = useLocalStorage<boolean>(
    STORAGE_KEYS.STUDIO_BATCH_COLLAPSED,
    { defaultValue: false }
  );

  // Local state
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [progressMessage, setProgressMessage] = useState("Preparation...");

  // Progress messages during launch
  useEffect(() => {
    if (!createBatchJobs.isPending) {
      setProgressMessage("Preparation...");
      return;
    }

    if (selectedAction && LOADING_MESSAGES[selectedAction]) {
      setProgressMessage(LOADING_MESSAGES[selectedAction]);
    } else {
      setProgressMessage("Traitement en cours...");
    }
  }, [createBatchJobs.isPending, selectedAction]);

  // Handle action change - reset preset if action doesn't need one
  const handleActionChange = useCallback(
    (action: BatchAction) => {
      setSelectedAction(action);
      // Reset preset for actions that don't need it
      const needsPreset = action === "replace_bg" || action === "generate_scene";
      if (!needsPreset) {
        setSelectedPresetId("");
      }
    },
    [setSelectedAction]
  );

  // Handle launch
  const handleLaunch = useCallback(() => {
    if (!selectedAction || selectedProducts.length === 0) return;

    const presetSettings: Record<string, unknown> = {};

    if (selectedAction === "generate_angles") {
      presetSettings.angles = DEFAULT_ANGLES;
    }

    const needsPreset =
      selectedAction === "replace_bg" || selectedAction === "generate_scene";
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
          // Optionally clear selection after launch
          onClearSelection?.();
        },
      }
    );
  }, [
    selectedAction,
    selectedPresetId,
    selectedProducts,
    createBatchJobs,
    onBatchStarted,
    onClearSelection,
  ]);

  // Handle close - deselect all products
  const handleClose = useCallback(() => {
    onClose?.();
    onClearSelection?.();
  }, [onClose, onClearSelection]);

  // SSR guard
  if (typeof window === "undefined") return null;

  return createPortal(
    <StudioBatchPanel
      selectedCount={selectedCount}
      selectedAction={selectedAction}
      selectedPresetId={selectedPresetId}
      isCollapsed={isCollapsed}
      isLaunching={createBatchJobs.isPending}
      progressMessage={progressMessage}
      onActionChange={handleActionChange}
      onPresetChange={setSelectedPresetId}
      onCollapseChange={setIsCollapsed}
      onLaunch={handleLaunch}
      onClose={handleClose}
    />,
    document.body
  );
}
