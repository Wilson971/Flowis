"use client";

/**
 * PresetRadioCard
 *
 * Reusable Radio Card for scene presets with pronounced hover/selected states.
 * Shows a 4:3 thumbnail, preset name overlay, and active badge when selected.
 */

import React from "react";
import { motion } from "framer-motion";
import { Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/design-system";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PresetRadioCardProps {
  preset: {
    id: string;
    name: string;
    thumbnail?: string;
    description?: string;
  };
  isSelected: boolean;
  onSelect: (presetId: string) => void;
  isRecommended?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PresetRadioCard({
  preset,
  isSelected,
  onSelect,
  isRecommended,
}: PresetRadioCardProps) {
  return (
    <motion.button
      role="radio"
      aria-checked={isSelected}
      whileHover={motionTokens.variants.hoverScale}
      whileTap={motionTokens.variants.tap}
      onClick={() => onSelect(preset.id)}
      className={cn(
        "relative rounded-xl border-2 overflow-hidden text-left transition-all duration-200",
        "hover:border-primary/30 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected
          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
          : "border-transparent bg-card"
      )}
    >
      {/* Thumbnail */}
      <div className="aspect-[4/3] bg-muted/50 relative overflow-hidden">
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

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      </div>

      {/* Name overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 p-2">
        <p className="text-xs font-medium text-foreground truncate">
          {preset.name}
        </p>
      </div>

      {/* Active badge */}
      {isSelected && (
        <Badge
          variant="default"
          size="sm"
          className="absolute top-2 left-2 gap-1"
        >
          <CheckCircle2 className="h-3 w-3" />
          Actif
        </Badge>
      )}

      {/* Recommended indicator */}
      {isRecommended && !isSelected && (
        <Badge
          variant="secondary"
          size="sm"
          className="absolute top-2 left-2"
        >
          Recommande
        </Badge>
      )}
    </motion.button>
  );
}
