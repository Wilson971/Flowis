"use client";

/**
 * ShadowEditor
 *
 * Compact CSS box-shadow editor.
 * Displays a free-text input for the full CSS shadow value and a live
 * preview box so the designer can immediately see the result.
 *
 * Props:
 *   label    – human-readable field label
 *   value    – current CSS box-shadow string (e.g. "0 4px 12px rgba(0,0,0,.15)")
 *   onChange – callback with the updated shadow string
 */

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShadowEditorProps {
  label: string;
  value: string;
  onChange: (shadow: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Quick-access presets
// ---------------------------------------------------------------------------

interface ShadowPreset {
  name: string;
  value: string;
}

const PRESETS: ShadowPreset[] = [
  { name: "None",  value: "none" },
  { name: "XS",   value: "0 1px 2px 0 rgba(0,0,0,0.05)" },
  { name: "SM",   value: "0 1px 3px 0 rgba(0,0,0,0.10), 0 1px 2px -1px rgba(0,0,0,0.10)" },
  { name: "MD",   value: "0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.10)" },
  { name: "LG",   value: "0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.10)" },
  { name: "XL",   value: "0 20px 25px -5px rgba(0,0,0,0.10), 0 8px 10px -6px rgba(0,0,0,0.10)" },
  { name: "Glow", value: "0 0 16px 2px rgba(99,102,241,0.30)" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ShadowEditor({
  label,
  value,
  onChange,
  className,
}: ShadowEditorProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <Label className="text-sm font-medium text-foreground">
        {label}
      </Label>

      {/* Text input */}
      <Input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder="0 4px 12px rgba(0,0,0,0.15)"
        className={cn(
          "w-full h-9 rounded-lg text-xs font-mono",
          "bg-muted/40 border-border/60 focus:bg-card"
        )}
        spellCheck={false}
        aria-label={`Box-shadow CSS value for ${label}`}
      />

      {/* Quick-access presets */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Shadow presets">
        {PRESETS.map((preset) => {
          const isActive = value === preset.value;
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => onChange(preset.value)}
              className={cn(
                "px-2 py-0.5 text-[10px] font-medium rounded border transition-colors duration-150",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground"
              )}
              aria-pressed={isActive}
            >
              {preset.name}
            </button>
          );
        })}
      </div>

      {/* Live preview */}
      <div
        className="flex items-center justify-center rounded-xl bg-card border border-border/40 p-4"
        aria-label="Shadow preview"
      >
        <div
          className="w-24 h-14 rounded-xl bg-muted/60 border border-border/30 transition-shadow duration-300"
          style={{ boxShadow: value === "none" ? "none" : value }}
          aria-hidden="true"
        />
      </div>

      {/* CSS output hint */}
      {value && value !== "none" && (
        <p className="text-[10px] text-muted-foreground/60 font-mono break-all leading-relaxed px-0.5">
          box-shadow: {value};
        </p>
      )}
    </div>
  );
}
