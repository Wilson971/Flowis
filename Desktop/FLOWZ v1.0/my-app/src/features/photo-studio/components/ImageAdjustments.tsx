"use client";

/**
 * ImageAdjustments — CSS Filter Sliders
 *
 * Real-time image adjustments using CSS filters (zero performance cost).
 * Sliders: Brightness, Contrast, Saturation, Warmth.
 * Returns a CSS filter string to apply on the image element.
 */

import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Sun, Contrast, Droplets, Thermometer, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export type ImageAdjustmentValues = {
  brightness: number;   // 50-150, default 100
  contrast: number;     // 50-150, default 100
  saturation: number;   // 0-200, default 100
  warmth: number;       // 0-100, default 0
};

export const DEFAULT_ADJUSTMENTS: ImageAdjustmentValues = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
};

/**
 * Converts adjustment values to a CSS filter string.
 */
export function adjustmentsToFilter(adj: ImageAdjustmentValues): string {
  const parts: string[] = [];
  if (adj.brightness !== 100) parts.push(`brightness(${adj.brightness / 100})`);
  if (adj.contrast !== 100) parts.push(`contrast(${adj.contrast / 100})`);
  if (adj.saturation !== 100) parts.push(`saturate(${adj.saturation / 100})`);
  if (adj.warmth > 0) {
    // Warmth via sepia + hue-rotate combination
    const sepiaAmount = adj.warmth / 200; // 0 - 0.5
    const hueRotate = -(adj.warmth / 100) * 10; // subtle hue shift
    parts.push(`sepia(${sepiaAmount})`);
    parts.push(`hue-rotate(${hueRotate}deg)`);
  }
  return parts.length > 0 ? parts.join(' ') : 'none';
}

type SliderRow = {
  key: keyof ImageAdjustmentValues;
  label: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: string;
};

const SLIDERS: SliderRow[] = [
  { key: 'brightness', label: 'Luminosite', icon: <Sun className="w-3.5 h-3.5" />, min: 50, max: 150, step: 1, defaultValue: 100, unit: '%' },
  { key: 'contrast', label: 'Contraste', icon: <Contrast className="w-3.5 h-3.5" />, min: 50, max: 150, step: 1, defaultValue: 100, unit: '%' },
  { key: 'saturation', label: 'Saturation', icon: <Droplets className="w-3.5 h-3.5" />, min: 0, max: 200, step: 1, defaultValue: 100, unit: '%' },
  { key: 'warmth', label: 'Chaleur', icon: <Thermometer className="w-3.5 h-3.5" />, min: 0, max: 100, step: 1, defaultValue: 0, unit: '' },
];

type ImageAdjustmentsProps = {
  values: ImageAdjustmentValues;
  onChange: (values: ImageAdjustmentValues) => void;
  onApply: () => void;
  onReset: () => void;
  className?: string;
};

export const ImageAdjustments = ({
  values,
  onChange,
  onApply,
  onReset,
  className,
}: ImageAdjustmentsProps) => {
  const handleChange = useCallback(
    (key: keyof ImageAdjustmentValues, val: number) => {
      onChange({ ...values, [key]: val });
    },
    [values, onChange]
  );

  const isModified = Object.keys(DEFAULT_ADJUSTMENTS).some(
    (k) => values[k as keyof ImageAdjustmentValues] !== DEFAULT_ADJUSTMENTS[k as keyof ImageAdjustmentValues]
  );

  return (
    <div className={cn("flex flex-col gap-3 p-3 bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-xl", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ajustements</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={!isModified}
          className="h-6 px-2 text-[10px] gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </Button>
      </div>

      <div className="space-y-3">
        {SLIDERS.map((slider) => (
          <div key={slider.key} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {slider.icon}
                <span>{slider.label}</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground tabular-nums w-10 text-right">
                {values[slider.key]}{slider.unit}
              </span>
            </div>
            <Slider
              value={[values[slider.key]]}
              onValueChange={([v]) => handleChange(slider.key, v)}
              min={slider.min}
              max={slider.max}
              step={slider.step}
              className="w-full"
              aria-label={slider.label}
            />
          </div>
        ))}
      </div>

      <Button
        onClick={onApply}
        disabled={!isModified}
        size="sm"
        className="w-full gap-1.5 text-xs"
      >
        <Check className="w-3.5 h-3.5" />
        Appliquer
      </Button>
    </div>
  );
};

export default ImageAdjustments;
