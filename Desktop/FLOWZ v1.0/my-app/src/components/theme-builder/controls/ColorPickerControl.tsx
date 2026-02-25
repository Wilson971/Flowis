"use client";

/**
 * ColorPickerControl
 *
 * Compact color picker combining a native <input type="color"> with a hex
 * text input and an optional generated color-scale strip.
 *
 * Props:
 *   label      – human-readable field label
 *   value      – current hex color string (e.g. "#6366f1")
 *   onChange   – called with the new hex string whenever the color changes
 *   showScale  – when true, renders an 11-stop generated color scale below
 */

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { generateColorScale } from "@/components/theme-builder/utils/color-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ColorPickerControlProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  showScale?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Ensure the string starts with "#" and is at most 7 chars (#rrggbb).
 * Returns null if the value isn't a valid 6-digit hex.
 */
function normalizeHex(raw: string): string | null {
  const trimmed = raw.trim().replace(/^#+/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(trimmed)) return null;
  return `#${trimmed.toLowerCase()}`;
}

// ---------------------------------------------------------------------------
// Scale strip sub-component
// ---------------------------------------------------------------------------

const SCALE_KEYS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"] as const;

interface ScaleStripProps {
  baseHex: string;
}

function ScaleStrip({ baseHex }: ScaleStripProps) {
  const scale = React.useMemo(() => {
    try {
      return generateColorScale(baseHex);
    } catch {
      return null;
    }
  }, [baseHex]);

  if (!scale) return null;

  return (
    <div className="mt-3 space-y-1">
      <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
        Generated Scale
      </span>
      <div className="flex gap-1">
        {SCALE_KEYS.map((key) => (
          <div
            key={key}
            className="flex-1 flex flex-col items-center gap-0.5 group"
          >
            <div
              className="w-full h-6 rounded-sm border border-border/40 transition-transform duration-150 group-hover:scale-110"
              style={{ backgroundColor: scale[key] }}
              title={`${key}: ${scale[key]}`}
            />
            <span className="text-[9px] text-muted-foreground leading-none hidden sm:block">
              {key}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ColorPickerControl({
  label,
  value,
  onChange,
  showScale = false,
  className,
}: ColorPickerControlProps) {
  // Local text-input state allows typing partial hex values without firing
  // onChange on every keystroke.
  const [inputText, setInputText] = React.useState(value);

  // Keep local text in sync when the parent changes the value externally.
  React.useEffect(() => {
    setInputText(value);
  }, [value]);

  // Called by the native color picker (always valid hex).
  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setInputText(hex);
    onChange(hex);
  };

  // Called while the user types in the hex text input.
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputText(raw);

    const normalized = normalizeHex(raw);
    if (normalized) {
      onChange(normalized);
    }
  };

  // On blur, clamp / reset the text to the last valid value.
  const handleTextBlur = () => {
    const normalized = normalizeHex(inputText);
    if (!normalized) {
      setInputText(value); // revert to last known good value
    } else {
      setInputText(normalized);
    }
  };

  // Determine if the current value is valid for the scale preview.
  const isValidHex = normalizeHex(value) !== null;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Row: label — swatch — color picker — hex input */}
      <div className="flex items-center gap-3">
        {/* Label */}
        <Label className="flex-1 text-sm font-medium text-foreground min-w-0 truncate">
          {label}
        </Label>

        {/* Preview swatch */}
        <div
          className="w-5 h-5 rounded-full border border-border flex-shrink-0 shadow-sm"
          style={{ backgroundColor: isValidHex ? value : "transparent" }}
          aria-hidden="true"
        />

        {/* Native color picker */}
        <div className="relative flex-shrink-0">
          <input
            type="color"
            value={isValidHex ? value : "#000000"}
            onChange={handleColorPickerChange}
            className={cn(
              "w-8 h-8 rounded-lg border border-border cursor-pointer p-0.5",
              "bg-card appearance-none overflow-hidden",
              "focus:outline-none focus:ring-2 focus:ring-primary/50"
            )}
            aria-label={`Color picker for ${label}`}
          />
        </div>

        {/* Hex text input */}
        <Input
          type="text"
          value={inputText}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          maxLength={7}
          placeholder="#000000"
          className={cn(
            "w-24 h-8 text-xs font-mono rounded-lg",
            "bg-muted/40 border-border/60",
            "focus:bg-card"
          )}
          aria-label={`Hex value for ${label}`}
          spellCheck={false}
        />
      </div>

      {/* Optional color scale */}
      {showScale && isValidHex && <ScaleStrip baseHex={value} />}
    </div>
  );
}
