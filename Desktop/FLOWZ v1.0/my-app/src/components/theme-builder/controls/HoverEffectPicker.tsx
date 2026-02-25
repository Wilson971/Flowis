"use client";

/**
 * HoverEffectPicker
 *
 * A row of interactive preview tiles, each demonstrating a named hover
 * effect on mouse-over.  The selected effect is highlighted with a
 * primary-colored border.
 *
 * Props:
 *   label    – human-readable field label
 *   value    – key of the currently selected effect
 *   onChange – callback with the selected effect key
 *   effects  – map of effect name → effect descriptor
 *              { translateY?: number (px), scale?: number, boxShadow?: string }
 */

import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HoverEffectDescriptor {
  translateY?: number;
  scale?: number;
  boxShadow?: string;
}

export interface HoverEffectPickerProps {
  label: string;
  value: string;
  onChange: (effect: string) => void;
  effects: Record<string, HoverEffectDescriptor>;
  className?: string;
}

// ---------------------------------------------------------------------------
// Effect tile
// ---------------------------------------------------------------------------

interface EffectTileProps {
  name: string;
  descriptor: HoverEffectDescriptor;
  isSelected: boolean;
  onSelect: () => void;
}

function EffectTile({ name, descriptor, isSelected, onSelect }: EffectTileProps) {
  const [hovered, setHovered] = React.useState(false);

  // Build inline transition style applied to the inner demo box.
  const demoStyle: React.CSSProperties = {
    transition: "transform 200ms ease, box-shadow 200ms ease",
    ...(hovered
      ? {
          transform: [
            descriptor.translateY !== undefined
              ? `translateY(${descriptor.translateY}px)`
              : "",
            descriptor.scale !== undefined
              ? `scale(${descriptor.scale})`
              : "",
          ]
            .filter(Boolean)
            .join(" ") || "none",
          boxShadow: descriptor.boxShadow ?? undefined,
        }
      : {
          transform: "none",
          boxShadow: "none",
        }),
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-pressed={isSelected}
      aria-label={`Select ${name} hover effect`}
      className={cn(
        "flex flex-col items-center gap-1.5 p-2 rounded-xl border cursor-pointer",
        "transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        "min-w-[72px] select-none",
        isSelected
          ? "border-primary bg-primary/8"
          : "border-border/50 bg-muted/30 hover:bg-muted/60 hover:border-border"
      )}
    >
      {/* Demo box — animates on hover to show the effect */}
      <div className="w-10 h-10 flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-lg bg-card border border-border/60"
          style={demoStyle}
          aria-hidden="true"
        />
      </div>

      {/* Effect name */}
      <span
        className={cn(
          "text-[10px] font-medium leading-none text-center",
          isSelected ? "text-primary" : "text-muted-foreground"
        )}
      >
        {name}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HoverEffectPicker({
  label,
  value,
  onChange,
  effects,
  className,
}: HoverEffectPickerProps) {
  const effectEntries = Object.entries(effects);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label row */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">
          {label}
        </Label>
        {value && (
          <span className="text-xs text-muted-foreground">
            Selected:{" "}
            <span className="font-medium text-foreground">{value}</span>
          </span>
        )}
      </div>

      {/* Tile row */}
      {effectEntries.length === 0 ? (
        <p className="text-xs text-muted-foreground italic px-1">
          No effects defined.
        </p>
      ) : (
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label={label}
        >
          {effectEntries.map(([name, descriptor]) => (
            <EffectTile
              key={name}
              name={name}
              descriptor={descriptor}
              isSelected={value === name}
              onSelect={() => onChange(name)}
            />
          ))}
        </div>
      )}

      {/* Descriptor details for selected effect */}
      {value && effects[value] && (
        <div className="flex flex-wrap gap-2 mt-1">
          {effects[value].translateY !== undefined && (
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5">
              translateY: {effects[value].translateY}px
            </span>
          )}
          {effects[value].scale !== undefined && (
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5">
              scale: {effects[value].scale}
            </span>
          )}
          {effects[value].boxShadow && (
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5 max-w-full truncate">
              shadow: {effects[value].boxShadow}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
