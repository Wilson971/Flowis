"use client";

/**
 * SliderControl
 *
 * Compact labeled slider using the shadcn/ui Slider primitive.
 * Displays the current numeric value with an optional unit suffix.
 *
 * Props:
 *   label    – human-readable field label
 *   value    – controlled numeric value
 *   onChange – callback with the new numeric value
 *   min      – slider minimum
 *   max      – slider maximum
 *   step     – optional increment (default 1)
 *   unit     – optional suffix appended to the value display (e.g. "px", "%", "rem")
 */

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SliderControl({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
  className,
}: SliderControlProps) {
  const handleValueChange = (values: number[]) => {
    if (values[0] !== undefined) {
      onChange(values[0]);
    }
  };

  // Format the displayed value — omit trailing zeros for decimal steps.
  const displayValue = React.useMemo(() => {
    const isDecimalStep = step > 0 && step < 1;
    const formatted = isDecimalStep ? value.toFixed(2) : String(value);
    return unit ? `${formatted}${unit}` : formatted;
  }, [value, step, unit]);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header row: label + live value */}
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium text-foreground">
          {label}
        </Label>
        <span
          className={cn(
            "text-xs font-mono tabular-nums text-muted-foreground",
            "bg-muted/50 rounded px-1.5 py-0.5 min-w-[3rem] text-center"
          )}
          aria-live="polite"
        >
          {displayValue}
        </span>
      </div>

      {/* Slider */}
      <Slider
        value={[value]}
        onValueChange={handleValueChange}
        min={min}
        max={max}
        step={step}
        className="w-full"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={displayValue}
      />

      {/* Range hints */}
      <div className="flex justify-between">
        <span className="text-[10px] text-muted-foreground/60 font-mono">
          {min}{unit}
        </span>
        <span className="text-[10px] text-muted-foreground/60 font-mono">
          {max}{unit}
        </span>
      </div>
    </div>
  );
}
