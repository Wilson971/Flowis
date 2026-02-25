"use client";

/**
 * FontFamilyPicker
 *
 * Compact font-family selector built on shadcn/ui Select.
 * Each option is rendered in its own typeface so users can visually
 * preview the font before selecting it.
 *
 * Props:
 *   label    – human-readable field label
 *   value    – currently selected font name
 *   onChange – callback with the selected font name string
 */

import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Font catalogue
// ---------------------------------------------------------------------------

interface FontOption {
  /** Value stored / returned via onChange */
  value: string;
  /** Display name shown in the list */
  label: string;
  /** CSS font-family stack used for live previewing */
  stack: string;
  /** Sample sentence rendered in the font */
  preview: string;
}

const FONT_OPTIONS: FontOption[] = [
  {
    value: "Geist",
    label: "Geist",
    stack: "'Geist', 'Geist Sans', system-ui, sans-serif",
    preview: "The quick brown fox",
  },
  {
    value: "Inter",
    label: "Inter",
    stack: "'Inter', system-ui, sans-serif",
    preview: "The quick brown fox",
  },
  {
    value: "Plus Jakarta Sans",
    label: "Plus Jakarta Sans",
    stack: "'Plus Jakarta Sans', system-ui, sans-serif",
    preview: "The quick brown fox",
  },
  {
    value: "Geist Mono",
    label: "Geist Mono",
    stack: "'Geist Mono', 'Geist Mono', ui-monospace, monospace",
    preview: "const flowz = () => {}",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFontStack(value: string): string {
  return FONT_OPTIONS.find((f) => f.value === value)?.stack ?? value;
}

function getFontPreview(value: string): string {
  return FONT_OPTIONS.find((f) => f.value === value)?.preview ?? "The quick brown fox";
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FontFamilyPickerProps {
  label: string;
  value: string;
  onChange: (font: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FontFamilyPicker({
  label,
  value,
  onChange,
  className,
}: FontFamilyPickerProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Label row */}
      <Label className="text-sm font-medium text-foreground">
        {label}
      </Label>

      {/* Select */}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={cn(
            "w-full h-9 rounded-lg bg-muted/40 border-border/60",
            "focus:bg-card text-sm"
          )}
          aria-label={`Font family for ${label}`}
        >
          <SelectValue placeholder="Select a font…" />
        </SelectTrigger>

        <SelectContent className="rounded-xl border-border/60">
          {FONT_OPTIONS.map((font) => (
            <SelectItem
              key={font.value}
              value={font.value}
              className="py-2 cursor-pointer"
            >
              <div className="flex flex-col gap-0.5">
                {/* Font name in UI font */}
                <span className="text-sm font-medium text-foreground">
                  {font.label}
                </span>
                {/* Preview sentence rendered in the actual typeface */}
                <span
                  className="text-xs text-muted-foreground"
                  style={{ fontFamily: font.stack }}
                >
                  {font.preview}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Live preview of the selected font */}
      <div
        className={cn(
          "mt-1 px-3 py-2 rounded-lg bg-muted/30 border border-border/40",
          "text-sm text-foreground/80"
        )}
        style={{ fontFamily: getFontStack(value) }}
        aria-label={`Preview of ${value} font`}
      >
        {getFontPreview(value)}
      </div>
    </div>
  );
}
