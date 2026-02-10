"use client";

/**
 * PresetGrid
 *
 * Grid of scene preset Radio Cards for selection in the Photo Studio.
 * Uses PresetRadioCard for consistent hover/selected states.
 */

import React, { useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllPresets } from "@/features/photo-studio/constants/scenePresets";
import { PresetRadioCard } from "./PresetRadioCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PresetGridProps = {
  selectedPresetId: string | null;
  onSelectPreset: (presetId: string) => void;
  recommendedPresetIds?: string[];
  onOpenModal?: () => void;
  maxVisiblePresets?: number;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PresetGrid = ({
  selectedPresetId,
  onSelectPreset,
  recommendedPresetIds = [],
  onOpenModal,
  maxVisiblePresets = 4,
}: PresetGridProps) => {
  const allPresets = useMemo(() => getAllPresets(), []);

  const sortedPresets = useMemo(() => {
    return [...allPresets].sort((a, b) => {
      if (a.id === selectedPresetId) return -1;
      if (b.id === selectedPresetId) return 1;
      const aRec = recommendedPresetIds.includes(a.id) ? 0 : 1;
      const bRec = recommendedPresetIds.includes(b.id) ? 0 : 1;
      return aRec - bRec;
    });
  }, [allPresets, selectedPresetId, recommendedPresetIds]);

  const visiblePresets = sortedPresets.slice(0, maxVisiblePresets);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Mises en scene
        </span>
        {onOpenModal && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={onOpenModal}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {visiblePresets.map((preset) => (
          <PresetRadioCard
            key={preset.id}
            preset={{
              id: preset.id,
              name: preset.name,
              thumbnail:
                (preset as any).thumbnailUrl ??
                preset.thumbnail ??
                undefined,
              description: preset.description,
            }}
            isSelected={selectedPresetId === preset.id}
            onSelect={onSelectPreset}
            isRecommended={recommendedPresetIds.includes(preset.id)}
          />
        ))}
      </div>
    </div>
  );
};
