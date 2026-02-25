"use client";

/**
 * EffectsMotionSection
 *
 * Controls for visual effects and motion tokens:
 *
 *   Radius  – base border-radius slider with live preview boxes
 *   Shadows – per-level (sm / md / lg / xl / glow) ShadowEditor inputs
 *   Glass   – enable toggle, backdrop-blur slider, bg-opacity slider
 *   Motion  – intensity preset select, duration sliders (fast / default / slow)
 *
 * Props:
 *   effects  – { radius, shadows, glass, motion }
 *   onChange – called with the full updated effects object on any change
 */

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SliderControl } from "@/components/theme-builder/controls/SliderControl";
import { ShadowEditor } from "@/components/theme-builder/controls/ShadowEditor";
import { BuilderSection } from "@/components/theme-builder/BuilderSection";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShadowLevels {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  glow: string;
}

export interface GlassConfig {
  enabled: boolean;
  blur: number;
  opacity: number;
}

export interface MotionConfig {
  intensity: "none" | "subtle" | "normal" | "playful";
  durationFast: number;
  durationDefault: number;
  durationSlow: number;
}

export interface EffectsConfig {
  radius: number;
  shadows: ShadowLevels;
  glass: GlassConfig;
  motion: MotionConfig;
}

export interface EffectsMotionSectionProps {
  effects: EffectsConfig;
  onChange: (effects: EffectsConfig) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SHADOW_LEVELS: { key: keyof ShadowLevels; label: string }[] = [
  { key: "sm",   label: "Small (sm)" },
  { key: "md",   label: "Medium (md)" },
  { key: "lg",   label: "Large (lg)" },
  { key: "xl",   label: "Extra Large (xl)" },
  { key: "glow", label: "Glow" },
];

const MOTION_INTENSITIES = [
  { value: "none",    label: "None — no motion" },
  { value: "subtle",  label: "Subtle — minimal transitions" },
  { value: "normal",  label: "Normal — balanced animations" },
  { value: "playful", label: "Playful — expressive spring physics" },
] as const;

/** Multipliers applied to base durations by intensity preset */
const INTENSITY_DURATION_HINT: Record<string, string> = {
  none:    "Animations disabled — duration values are ignored.",
  subtle:  "Very short transitions. Keep durations low (100–200 ms).",
  normal:  "Standard timing. Durations of 150–400 ms work well.",
  playful: "Spring physics. Longer durations (300–600 ms) feel natural.",
};

// ---------------------------------------------------------------------------
// Radius preview strip
// ---------------------------------------------------------------------------

interface RadiusPreviewProps {
  baseRadius: number;
}

function RadiusPreview({ baseRadius }: RadiusPreviewProps) {
  const levels = [
    { label: "input / btn",  multiplier: 1 },
    { label: "card",         multiplier: 1.5 },
    { label: "modal",        multiplier: 2 },
    { label: "full",         multiplier: 99 },
  ];

  return (
    <div className="flex flex-wrap gap-3 pt-1" aria-label="Radius preview">
      {levels.map(({ label, multiplier }) => {
        const r = Math.min(Math.round(baseRadius * multiplier), 9999);
        return (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <div
              className="w-14 h-10 bg-muted border border-border/50 transition-all duration-200"
              style={{ borderRadius: `${r}px` }}
              aria-hidden="true"
            />
            <span className="text-[9px] text-muted-foreground font-mono leading-none text-center">
              {label}
              <br />
              {r}px
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Glass toggle row
// ---------------------------------------------------------------------------

interface GlassToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

function GlassToggle({ enabled, onToggle }: GlassToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium text-foreground">
          Glass Morphism
        </Label>
        <p className="text-xs text-muted-foreground">
          Enable frosted-glass card surfaces
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full",
          "transition-colors duration-200 focus:outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary/50",
          enabled ? "bg-primary" : "bg-muted border border-border/60"
        )}
        aria-label="Toggle glass morphism"
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm",
            "transition-transform duration-200",
            enabled ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Glass preview
// ---------------------------------------------------------------------------

interface GlassPreviewProps {
  blur: number;
  opacity: number;
}

function GlassPreview({ blur, opacity }: GlassPreviewProps) {
  return (
    <div
      className="relative overflow-hidden rounded-xl h-20 flex items-center justify-center"
      aria-label="Glass effect preview"
      aria-hidden="true"
    >
      {/* Gradient backdrop to make the glass effect visible */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30" />
      {/* Glass card */}
      <div
        className="relative z-10 px-6 py-3 rounded-xl border border-white/20 text-foreground text-sm font-medium shadow-md"
        style={{
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`,
          backgroundColor: `rgba(255,255,255,${opacity})`,
        }}
      >
        Glass surface
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section group heading
// ---------------------------------------------------------------------------

function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
        {children}
      </span>
      <Separator className="flex-1" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EffectsMotionSection({
  effects,
  onChange,
  className,
}: EffectsMotionSectionProps) {
  // Partial updaters to keep call-sites clean
  const setRadius = (radius: number) => onChange({ ...effects, radius });

  const setShadow = (key: keyof ShadowLevels, value: string) =>
    onChange({ ...effects, shadows: { ...effects.shadows, [key]: value } });

  const setGlass = <K extends keyof GlassConfig>(key: K, value: GlassConfig[K]) =>
    onChange({ ...effects, glass: { ...effects.glass, [key]: value } });

  const setMotion = <K extends keyof MotionConfig>(key: K, value: MotionConfig[K]) =>
    onChange({ ...effects, motion: { ...effects.motion, [key]: value } });

  return (
    <BuilderSection
      title="Effects & Motion"
      description="Border radius, shadows, glass morphism, and animation timing."
      className={cn("", className)}
    >

      {/* ── Radius ───────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <GroupHeading>Border Radius</GroupHeading>
        <SliderControl
          label="Base radius"
          value={effects.radius}
          onChange={setRadius}
          min={0}
          max={24}
          unit="px"
        />
        <RadiusPreview baseRadius={effects.radius} />
      </div>

      <Separator />

      {/* ── Shadows ──────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <GroupHeading>Shadows</GroupHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SHADOW_LEVELS.map(({ key, label }) => (
            <ShadowEditor
              key={key}
              label={label}
              value={effects.shadows[key]}
              onChange={(v) => setShadow(key, v)}
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* ── Glass ────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <GroupHeading>Glass Morphism</GroupHeading>

        <GlassToggle
          enabled={effects.glass.enabled}
          onToggle={() => setGlass("enabled", !effects.glass.enabled)}
        />

        <div
          className={cn(
            "space-y-4 transition-opacity duration-200",
            effects.glass.enabled ? "opacity-100" : "opacity-40 pointer-events-none"
          )}
        >
          <SliderControl
            label="Backdrop blur"
            value={effects.glass.blur}
            onChange={(v) => setGlass("blur", v)}
            min={0}
            max={24}
            unit="px"
          />
          <SliderControl
            label="Background opacity"
            value={effects.glass.opacity}
            onChange={(v) => setGlass("opacity", v)}
            min={0}
            max={0.5}
            step={0.01}
          />
          <GlassPreview blur={effects.glass.blur} opacity={effects.glass.opacity} />
        </div>
      </div>

      <Separator />

      {/* ── Motion ───────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <GroupHeading>Motion</GroupHeading>

        {/* Intensity preset */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            Motion intensity
          </Label>
          <Select
            value={effects.motion.intensity}
            onValueChange={(v) =>
              setMotion("intensity", v as MotionConfig["intensity"])
            }
          >
            <SelectTrigger
              className={cn(
                "w-full h-9 rounded-lg text-sm",
                "bg-muted/40 border-border/60 focus:bg-card"
              )}
              aria-label="Motion intensity preset"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/60">
              {MOTION_INTENSITIES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-sm">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground leading-relaxed px-0.5">
            {INTENSITY_DURATION_HINT[effects.motion.intensity]}
          </p>
        </div>

        {/* Duration sliders */}
        <div
          className={cn(
            "space-y-4 transition-opacity duration-200",
            effects.motion.intensity === "none"
              ? "opacity-40 pointer-events-none"
              : "opacity-100"
          )}
        >
          <SliderControl
            label="Duration — Fast"
            value={effects.motion.durationFast}
            onChange={(v) => setMotion("durationFast", v)}
            min={50}
            max={500}
            step={10}
            unit="ms"
          />
          <SliderControl
            label="Duration — Default"
            value={effects.motion.durationDefault}
            onChange={(v) => setMotion("durationDefault", v)}
            min={100}
            max={800}
            step={10}
            unit="ms"
          />
          <SliderControl
            label="Duration — Slow"
            value={effects.motion.durationSlow}
            onChange={(v) => setMotion("durationSlow", v)}
            min={200}
            max={1200}
            step={10}
            unit="ms"
          />
        </div>
      </div>
    </BuilderSection>
  );
}
